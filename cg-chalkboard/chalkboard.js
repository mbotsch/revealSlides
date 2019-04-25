/*****************************************************************
 *  Original version by Asvin Goel, goel@telematique.eu (based on v 0.6)
 *  Modified version by Mario Botsch, Bielefeld University
 *  Further contributions by Martin Heistermann, Bern University
 * 
 *  A plugin for reveal.js adding a chalkboard.
 * 
 *  License: MIT license (see LICENSE.md)
 ******************************************************************/

/* Chrome bug: for scrolling chalkboard on Chrome, disable threaded scrolling in chrome://flags
 */

var RevealChalkboard = (function(){

    var DEBUG = false;

    /************************************************************************
     ** Tools
     ************************************************************************/

    function scriptPath()
    {
        // obtain plugin path from the script element
        var src;
        if (document.currentScript) {
            src = document.currentScript.src;
        } else {
            var sel = document.querySelector('script[src$="/chalkboard.js"]')
            if (sel) {
                src = sel.src;
            }
        }

        var path = typeof src === undefined ? src
            : src.slice(0, src.lastIndexOf("/") + 1);
        return path;
    }


	function injectStyleSheet( value ) {
		var tag = document.createElement( 'style' );
		tag.type = 'text/css';
		if( tag.styleSheet ) {
			tag.styleSheet.cssText = value;
		}
		else {
			tag.appendChild( document.createTextNode( value ) );
		}
		document.getElementsByTagName( 'head' )[0].appendChild( tag );
	}


    /************************************************************************
     ** Configuration options
     ************************************************************************/

    var path = scriptPath();

    // default values or user configuration?
    var config     = Reveal.getConfig().chalkboard || {};
    var colors     = config.colors || [ "black", "red", "green", "blue", "yellow", "cyan", "magenta" ];
    var background = config.background || "white";

    // handle CSS zoom (Chrome), CSS scale (others), and highDPI/retina scale
    // (has to be updated later on, i.e., after reveal layout)
    var reveal      = document.querySelector( '.reveal' );
    var slides      = document.querySelector( '.reveal .slides' );
    var slideZoom   = slides.style.zoom || 1;
    var slideScale  = Reveal.getScale();
    var slideRect   = slides.getBoundingClientRect();
    var slideScroll = 0;
    var canvasScale = window.devicePixelRatio || 1;


    // canvas for dynamic cursor generation
    var cursorCanvas = document.createElement( 'canvas' );
    cursorCanvas.id     = "CursorCanvas";
    cursorCanvas.width  = 20;
    cursorCanvas.height = 20;

    // different cursors used by chalkboard
    var eraserCursor = 'url("' + path + 'sponge.png") 25 20, auto';
    var eraserRadius = 15;
    var laserCursor;
    var penCursor;
    var penColor  = "red";
    var color = [ "red", "black" ]; // old color handling

    // auto-hide cursor
    var cursorInactiveTimeout;
    var hideCursorTime = 1000; // 1 sec


    // store which tools are active
    var boardMode = false;
    var ToolType = { NONE: 0, PEN: 1, ERASER: 2, LASER: 3 };
    var tool = ToolType.NONE;
    var mode = 0; // 0: draw on slides, 1: draw on whiteboard




    /************************************************************************
     ** Setup GUI
     ************************************************************************/

    // create button on the left side
    function createButton(left, bottom, icon)
    {
        var b = document.createElement( 'div' );
        b.classList.add("chalkboard");
        b.style.position = "absolute";
        b.style.zIndex   = 40;
        b.style.left     = left + "px";
        b.style.bottom   = bottom + "px";  
        b.style.top      = "auto";
        b.style.right    = "auto";
        b.style.fontSize = "16px";
        b.style.padding  = "3px";
        b.style.borderRadius = "3px";
        b.style.color    = "lightgrey";
        b.style.background = background;
        if (icon)
        {
            b.classList.add("fas");
            b.classList.add(icon);
        }
        reveal.appendChild(b);
        return b;
    }

    var buttonBoard      = createButton(8, 8, "fa-edit");
    buttonBoard.onclick  = function(){ toggleChalkboard(); }

    var buttonPen        = createButton(8, 40, "fa-pen");
    buttonPen.onclick    = function(){ 
        if (pktimer)    clearTimeout(pktimer);
        if (!pk.isOpen) selectTool(ToolType.PEN); 
    }

    var buttonEraser     = createButton(8, 72, "fa-eraser");
    buttonEraser.onclick = function(){ selectTool(ToolType.ERASER); }

    //var buttonLaser      = createButton(8, 104, "fa-magic");
    //buttonLaser.onclick  = function(){ selectTool(ToolType.LASER); }


    // add color picker to long-tap of buttonPen
    var pkdiv = createButton(40, 40);
    pkdiv.setAttribute("class", "color-picker");
    var pkoptions = { template: "<div class=\"chalkboard\" data-col=\"{color}\" style=\"background-color: {color}\"></div>" };
    var pk = new Piklor(pkdiv, colors, pkoptions);
    pk.colorChosen(function (col) { penColor = col; tool=ToolType.NONE; selectTool(ToolType.PEN); updateCursor(); });
    var pktimer;
    buttonPen.onmousedown = function(){ pktimer = setTimeout(function(){pk.open();}, 500); }


    // create canvases
    var drawingCanvas = [ {id: "notescanvas" }, {id: "chalkboard" } ];
    setupDrawingCanvas(0);
    setupDrawingCanvas(1);
    injectStyleSheet(".reveal .chalkboardContainer { overflow: hidden auto; -webkit-overflow-scrolling: touch; }");

    var mouseX = 0;
    var mouseY = 0;
    var xLast = null;
    var yLast = null;

    var slideIndices =  { h:0, v:0 };
    var activeStroke = null;


    // generate one of the two canvases
    function setupDrawingCanvas( id )
    {
        // size of slides
        var width  = Reveal.getConfig().width;
        var height = Reveal.getConfig().height;

        // div wrapper
        var container = document.createElement( 'div' );
        container.setAttribute( 'data-prevent-swipe', '' );
        container.style.transition = "none";
        container.style.margin     = "0";
        container.style.padding    = "0";
        container.style.border     = "none";
        container.style.position   = "absolute";
        container.style.top        = "0px";
        container.style.left       = "0px";
        container.style.width      = "100%";
        container.style.height     = "100%";
        container.style.maxHeight  = "100%";
        
        // create canvas
        var canvas = document.createElement( 'canvas' );
        canvas.setAttribute( 'data-prevent-swipe', '' );
        canvas.style.background = id==0 ? "rgba(0,0,0,0)" : background;
        canvas.style.border     = "1px solid transparent";
        canvas.style.boxSizing  = "border-box";
        canvas.style.position   = "relative";
        canvas.style.width      = "100%";
        canvas.style.height     = height + "px";
        canvas.width            = width  * canvasScale;
        canvas.height           = height * canvasScale;

        // setup highDPI scaling & draw style
        var ctx = canvas.getContext("2d");
        ctx.scale(canvasScale, canvasScale);
        ctx.lineCap   = 'round';
        ctx.lineWidth = 2;

        // store relevant information
        drawingCanvas[id].canvas    = canvas;
        drawingCanvas[id].container = container;
        drawingCanvas[id].context   = ctx;
        drawingCanvas[id].width     = width;
        drawingCanvas[id].height    = height;

        // prevent context menu and double-click
        canvas.oncontextmenu = function() { return false; }
        canvas.ondblclick = function(evt) { 
            evt.preventDefault(); 
            evt.stopPropagation();
            return false; 
        }


        if ( id == "0" )
        {
            canvas.id = 'drawOnSlides';
            container.style.zIndex = "34";
            container.style.pointerEvents = "none";
        }
        else
        {
            canvas.id = 'drawOnBoard';
            container.style.zIndex = "36";
            container.style.visibility = "hidden";
            container.classList.add("chalkboardContainer");
        }


        // add div to reveal.slides
        slides.appendChild( container );
        container.appendChild( canvas );
    }


    function chalkboardHeight() 
    { 
        // minimum height: one Reveal page
        var height = 1;

        // find maximum y-coordinate of slide's curves
        if (hasSlideData(slideIndices, 1))
        {
            var slideData = getSlideData(slideIndices, 1);
            for (var i=0; i<slideData.events.length; i++)
            {
                var event = slideData.events[i];
                if (event.type == "draw")
                {
                    for (var j=1; j<event.coords.length; j+=2)
                    {
                        var y = event.coords[j];
                        if (y > height) height = y;
                    }
                }
            }
        }
        
        height = Math.round(height);
        if (DEBUG) console.log("slide height: " + height);

        return height;
    }


    function adjustChalkboardHeight() 
    { 
        // compute new page height
        var pageHeight = Reveal.getConfig().height;
        var height = Math.round(chalkboardHeight() + pageHeight/2);
        if (height < pageHeight) height = pageHeight;
        if (DEBUG) console.log("set slide height to " + height);

        // set canvas properties
        var canvas = drawingCanvas[1].canvas;
        canvas.style.height = height + "px";
        canvas.height = height * canvasScale;

        // update context
        var ctx = canvas.getContext("2d");
        ctx.scale(canvasScale, canvasScale);
        ctx.lineCap   = 'round';
        ctx.lineWidth = 2;

        // remember to restore previous drawings with playbackEvents(1)!
    }



    /*****************************************************************
     ** Storage
     ******************************************************************/
    var storage = [
        { width: drawingCanvas[0].width,
          height: drawingCanvas[0].height,
          data: []},
        { width: drawingCanvas[1].width,
          height: drawingCanvas[1].height,
          data: []}
    ];


    /**
     * Load data.
     */
    function loadData( filename )
    {
        return new Promise( function(resolve) {

            // determine scribble filename
            var url = location.pathname;
            var basename = (url.split('\\').pop().split('/').pop().split('.'))[0];
            var filename = basename + '.json';

            console.log("chalkboard load " + filename);
            var req = new XMLHttpRequest();

            req.onload = function()
            {
                if (req.readyState === 4) 
                {
                    storage = JSON.parse(req.responseText);
                    if ( drawingCanvas[0].width != storage[0].width || drawingCanvas[0].height != storage[0].height )
                    {
                        alert("Chalkboard: Loaded data does not match width/height of presentation");
                    }
                    console.log("chalkboard loaded");
                }
                else
                {
                    console.warn('Failed to get file ' + filename);
                }
                resolve();
            }

            req.onerror = function()
            {
                console.warn('Failed to get file ' + filename);
                resolve();
            }

            req.open('GET', filename, true);
            req.send();
        });
    }


    /**
     * Download data.
     */
    function downloadData()
    {
        var a = document.createElement('a');
        a.classList.add("chalkboard"); // otherwise a.click() is prevented/cancelled by global listener
        document.body.appendChild(a);
        try {
            // function to adjust precision of numbers when converting to JSON
            function twoDigits(key, val) {
                if (val != undefined)
                    return val.toFixed ? Number(val.toFixed(2)) : val;
            }
            var blob = new Blob( [ JSON.stringify( storage, twoDigits ) ], { type: "application/json"} );

            // setup link and filename for downloaded scribbles
            var url = location.pathname;
            var basename = (url.split('\\').pop().split('/').pop().split('.'))[0];
            var filename = basename + ".json";
            a.download = filename;
            a.href = window.URL.createObjectURL( blob );

        } catch( error ) {
            a.innerHTML += " (" + error + ")";
            console.error("chalkboard download error: " + error);
        }
        a.click();
        document.body.removeChild(a);

        needSave = false;
    }


    /**
     * Returns data object for the slide with the given indices.
     */
    function getSlideData( indices, id )
    {
        if ( id == undefined ) id = mode;
        if (!indices) indices = slideIndices;
        for (var i = 0; i < storage[id].data.length; i++)
        {
            if (storage[id].data[i].slide.h === indices.h &&
                storage[id].data[i].slide.v === indices.v &&
                storage[id].data[i].slide.f === indices.f )
            {
                return storage[id].data[i];
            }
        }

        // no data found -> add it
        storage[id].data.push( { slide: indices, events: [] } );
        return storage[id].data[storage[id].data.length-1];
    }


    // do we have slide data?
    function hasSlideData( indices, id )
    {
        if ( id == undefined ) id = mode;
        if (!indices) indices = slideIndices;
        for (var i = 0; i < storage[id].data.length; i++)
        {
            if (storage[id].data[i].slide.h === indices.h &&
                storage[id].data[i].slide.v === indices.v &&
                storage[id].data[i].slide.f === indices.f )
            {
                return storage[id].data[i].events.length > 0;
            }
        }
        return false;
    }



    /*****************************************************************
     ** Intercept page leave when data is not saved
     ******************************************************************/
    var needSave = false;
    window.onbeforeunload = function(e)
    {
        if (needSave) return "blabla";
    }



    /*****************************************************************
     ** Print
     ******************************************************************/
    var printMode = ( /print-pdf/gi ).test( window.location.search );

    function createPrintout( )
    {
        console.log("chalkboard create printout");

        var nextSlide = [];
        var width   = Reveal.getConfig().width;
        var height  = Reveal.getConfig().height;

        // collect next-slides for all slides with board stuff
        for (var i = 0; i < storage[1].data.length; i++)
        {
            var h = storage[1].data[i].slide.h;
            var v = storage[1].data[i].slide.v;
            var f = storage[1].data[i].slide.f;
            var slide = f ? Reveal.getSlide(h,v,f) : Reveal.getSlide(h,v);
            nextSlide.push( slide.nextSibling );
        }

        // go through board storage, paint image, insert slide
        for (var i = 0; i < storage[1].data.length; i++)
        {
            var h = storage[1].data[i].slide.h;
            var v = storage[1].data[i].slide.v;
            var f = storage[1].data[i].slide.f;
            var slide = f ? Reveal.getSlide(h,v,f) : Reveal.getSlide(h,v);

            var slideData = getSlideData( storage[1].data[i].slide, 1 );

            var parent = Reveal.getSlide( storage[1].data[i].slide.h, storage[1].data[i].slide.v ).parentElement;

            var imgCanvas = document.createElement('canvas');
            imgCanvas.width  = width;
            imgCanvas.height = height;

            var imgCtx = imgCanvas.getContext("2d");
            imgCtx.fillStyle = "white";
            penColor = "black";
            imgCtx.rect(0,0,imgCanvas.width,imgCanvas.height);
            imgCtx.fill();

            for (var j = 0; j < slideData.events.length; j++)
            {
                switch ( slideData.events[j].type )
                {
                    case "draw":
                        if (slideData.events[j].curve)
                        {
                            for (var k = 1; k < slideData.events[j].curve.length; k++)
                                draw( imgCtx,
                                      slideData.events[j].curve[k-1].x,
                                      slideData.events[j].curve[k-1].y,
                                      slideData.events[j].curve[k].x,
                                      slideData.events[j].curve[k].y);
                        }
                        else if (slideData.events[j].coords)
                        {
                            imgCtx.strokeStyle = slideData.events[j].color;
                            for (var k=0; k<slideData.events[j].coords.length-3; k+=2)
                                draw( imgCtx,
                                      slideData.events[j].coords[k  ],
                                      slideData.events[j].coords[k+1],
                                      slideData.events[j].coords[k+2],
                                      slideData.events[j].coords[k+3]);
                        }
                        break;

                    case "erase":
                        if (slideData.events[j].curve)
                        {
                            for (var k = 0; k < slideData.events[j].curve.length; k++)
                                erase( imgCtx,
                                       slideData.events[j].curve[k].x,
                                       slideData.events[j].curve[k].y );
                        }
                        else if (slideData.events[j].coords)
                        {
                            for (var k=0; k<slideData.events[j].coords.length-1; k+=2)
                                erase( imgCtx,
                                       slideData.events[j].coords[k],
                                       slideData.events[j].coords[k+1]);
                        }
                        break;

                    default:
                        break;
                }
            }

            if ( slideData.events.length )
            {
                var newSlide = document.createElement( 'section' );
                newSlide.classList.add( 'present' );
                newSlide.innerHTML = '<h1 style="visibility:hidden">Drawing</h1>';
                newSlide.setAttribute("data-background-size", '100% 100%' );
                newSlide.setAttribute("data-background-repeat", 'norepeat' );
                newSlide.setAttribute("data-background", 'url("' + imgCanvas.toDataURL("image/png") +'")' );
                if ( nextSlide[i] != null ) {
                    parent.insertBefore( newSlide, nextSlide[i] );
                }
                else {
                    parent.append( newSlide );
                }
            }
        }
    }



    /*****************************************************************
     ** Drawings
     ******************************************************************/

    function draw(context, fromX, fromY, toX, toY)
    {
        context.beginPath();
        context.moveTo(fromX, fromY);
        context.lineTo(toX, toY);
        context.stroke();
    }

    function erase(context,x,y)
    {
        context.save();
        context.beginPath();
        context.arc(x, y, eraserRadius, 0, 2 * Math.PI, false);
        context.clip();
        context.clearRect(x-eraserRadius, y-eraserRadius, eraserRadius*2, eraserRadius*2);
        context.restore();
    }



    /**
     * Opens an overlay for the chalkboard.
     */
    function showChalkboard()
    {
        xLast        = null;
        yLast        = null;
        activeStroke = null;
        mode         = 1;
        boardMode    = true;

        drawingCanvas[1].container.style.visibility = "visible";
        drawingCanvas[1].container.style.pointerEvents = "auto";
    }


    /**
     * Closes open chalkboard.
     */
    function closeChalkboard()
    {
        xLast        = null;
        yLast        = null;
        activeStroke = null;
        mode         = 0;
        boardMode    = false;

        drawingCanvas[1].container.style.visibility = "hidden";
        drawingCanvas[1].container.style.pointerEvents = "none";
    }


    /*
     * Toggle chalkboard visibility
     */
    function toggleChalkboard()
    {
        if ( boardMode )
        {
            closeChalkboard();
        }
        else
        {
            showChalkboard();
        }
        updateGUI();
    };




    /**
     * Clear current canvas.
     */
    function clearCanvas( id )
    {
        drawingCanvas[id].context.clearRect(0,0,drawingCanvas[id].width,drawingCanvas[id].height);
    }


    /*****************************************************************
     ** record and play-back events
     ******************************************************************/

    function recordEvent( event )
    {
        var slideData = getSlideData();
        slideData.events.push(event);
        needSave = true;
    }


    function playbackEvents( id )
    {
        clearCanvas( id );

        if (hasSlideData( slideIndices, id))
        {
            var slideData = getSlideData( slideIndices, id );
            var index = 0;
            while ( index < slideData.events.length )
            {
                playEvent( id, slideData.events[index] );
                index++;
            }
        }
    };



    function playEvent( id, event )
    {
        switch ( event.type )
        {
            case "draw":
                drawCurve( id, event);
                break;
            case "erase":
                eraseCurve( id, event );
                break;
        }
    };


    function drawCurve( id, event )
    {
        var ctx = drawingCanvas[id].context;

        // old syntax
        if (event.curve)
        {
            ctx.strokeStyle = color[mode];

            // explicitly draw starting point (for one-point curves)
            draw(ctx, event.curve[0].x, event.curve[0].y,
                      event.curve[0].x, event.curve[0].y);

            for (var i=1; i < event.curve.length; i++)
                draw(ctx, event.curve[i-1].x, event.curve[i-1].y,
                          event.curve[i  ].x, event.curve[i  ].y);
        }
        // new syntax
        else if (event.coords)
        {
            ctx.strokeStyle = event.color;

            // explicitly draw starting point (for one-point curves)
            draw(ctx, event.coords[0], event.coords[1],
                      event.coords[0], event.coords[1]);

            for (var i=0; i<event.coords.length-3; i+=2)
                draw(ctx, event.coords[i  ], event.coords[i+1],
                          event.coords[i+2], event.coords[i+3]);
        }
    };


    function eraseCurve( id, event )
    {
        var ctx = drawingCanvas[id].context;

        // old syntax
        if (event.curve)
        {
            for (var i=0; i<event.curve.length; i++)
                erase(ctx, event.curve[i].x, event.curve[i].y);
        }
        // new syntax
        else if (event.coords)
        {
            for (var i=0; i<event.coords.length-1; i+=2)
                erase(ctx, event.coords[i], event.coords[i+1]);
        }

    };


    /*****************************************************************
     ** User interface
     ******************************************************************/

    function startStroke(evt)
    {
        evt.preventDefault();
        evt.stopPropagation();

        // cancel auto-hide
        clearTimeout( cursorInactiveTimeout );

        // update scale, zoom, and bounding rectangle
        slideZoom  = slides.style.zoom || 1;

        // convert pointer/touch position to local coordiantes
        var mouseX = evt.offsetX;
        var mouseY = evt.offsetY;

        // compensate for CSS-zoom
        mouseX = mouseX / slideZoom;
        mouseY = mouseY / slideZoom;

        if (mouseY < drawingCanvas[mode].canvas.height && mouseX < drawingCanvas[mode].canvas.width)
        {
            var ctx = drawingCanvas[mode].context;

            // remember position
            xLast  = mouseX;
            yLast  = mouseY;

            // erase mode
            if ((tool==ToolType.ERASER) || (evt.buttons > 1))
            {
                activeStroke = { type:  "erase", 
                                 coords: [mouseX, mouseY] };
                slides.style.cursor = eraserCursor;
                erase(ctx,mouseX,mouseY);
            }
            // draw mode
            else
            {
                // set cursor
                slides.style.cursor = penCursor;
                // set color
                ctx.strokeStyle = penColor;
                // setup event
                activeStroke = { type:  "draw", 
                                 color: penColor, 
                                 coords: [mouseX, mouseY] };
                // draw start point
                draw(ctx, mouseX, mouseY, mouseX, mouseY);
            }
        }
    };



    function continueStroke( evt )
    {
        if (activeStroke)
        {
            evt.preventDefault();
            evt.stopPropagation();

            // convert touch position to mouse position
            //var mouseX = (evt.clientX - slideRect.left) / slideScale;
            //var mouseY = (evt.clientY - slideRect.top ) / slideScale;
            var mouseX = evt.offsetX;
            var mouseY = evt.offsetY;

            // compensate for CSS-zoom
            mouseX = mouseX / slideZoom;
            mouseY = mouseY / slideZoom;

            // only do something if mouse position changed and we are within bounds
            if ((mouseX!=xLast || mouseY!=yLast) &&
                (mouseY < drawingCanvas[mode].canvas.height) && 
                (mouseX < drawingCanvas[mode].canvas.width))
            {
                var ctx = drawingCanvas[mode].context;

                activeStroke.coords.push(mouseX);
                activeStroke.coords.push(mouseY);

                if ( activeStroke.type == "erase" )
                {
                    erase(ctx, mouseX, mouseY);
                }
                else
                {
                    draw(ctx, xLast, yLast, mouseX, mouseY);
                }

                // remember mouse position
                xLast = mouseX;
                yLast = mouseY;
            }
        }
    };


    function stopStroke(evt)
    {
        if (activeStroke)
        {
            evt.preventDefault();
            evt.stopPropagation();

            recordEvent( activeStroke );
            activeStroke = null;

            if (mode==1) 
            {
                adjustChalkboardHeight();
                playbackEvents(1);
            }
        }

        // reset cursor
        showCursor();
    };


    // setup callbacks
    if (window.PointerEvent)
    {
        slides.addEventListener( 'pointerdown', function(evt) {

            if (DEBUG)
            {
                console.log("pointerdown: " + evt.pointerType + ", " + evt.button + ", " + evt.buttons);
            }

            // no tool selected -> return
            if (!tool) return;

            switch(evt.pointerType)
            {
                case "pen":
                case "mouse":
                    switch(tool)
                    {
                        case ToolType.PEN:
                        case ToolType.ERASER:
                            startStroke(evt);
                            break;

                        //case ToolType.LASER:
                            //slides.style.cursor = laserCursor;
                            //break;
                    }
                    break;

                case "touch":
                    showCursor();
                    break;
            }
        }, true );


        slides.addEventListener( 'pointermove', function(evt) {

            if (DEBUG)
            {
                console.log("pointermove: " + evt.pointerType + ", " + evt.button + ", " + evt.buttons + ", " + evt.pressure);
            }

            // no tool selected -> return
		    if (!tool) return;

            // no mouse button pressed -> show laser, active auto-hide, return
            if (!evt.buttons)
            {
                showCursor();
                return;
            }

            // mouse button pressed
            switch(evt.pointerType)
            {
                case "pen":
                case "mouse":
                    switch(tool)
                    {
                        case ToolType.PEN:
                        case ToolType.ERASER:
                            // try to exploit coalesced events
                            events = [evt];
                            if (evt.getCoalescedEvents) 
                            {
                                events = evt.getCoalescedEvents() || events;
                                if (DEBUG) console.log( events.length + " coalesced move events");
                            }
                            for (let e of events) 
                                if (e.buttons > 0) 
                                    continueStroke(e);
                            break;

                        //case ToolType.LASER:
                            //break;
                    }
                    break;

                case "touch":
                    showCursor();
                    evt.preventDefault();
                    evt.stopPropagation();
                    break;
            }
        }, {passive: false});


        slides.addEventListener( 'pointerup', function(evt) {
            
            if (DEBUG)
            {
                console.log("pointerup: " + evt.pointerType + ", " + evt.button + ", " + evt.buttons);
            }

            // no tool selected -> return
		    if (!tool) return;

            switch(evt.pointerType)
            {
                case "pen":
                case "mouse":
                    switch(tool)
                    {
                        case ToolType.PEN:
                        case ToolType.ERASER:
                            stopStroke(evt);
                            break;

                        //case ToolType.LASER:
                            //slides.style.cursor = 'none';
                            //break;
                    }
                    break;

                case "touch":
                    showCursor();
                    break;
            }
        });
    }

    // no pointer events
    else
    {
        slides.addEventListener( 'mousedown', function(evt) {
            switch(tool)
            {
                case ToolType.PEN:
                case ToolType.ERASER:
                    startStroke(evt);
                    break;

                //case ToolType.LASER:
                    //slides.style.cursor = laserCursor;
                    //break;
            }
        });


        slides.addEventListener( 'mousemove', function(evt) {
            if (tool && !evt.buttons) { showCursor(); return; }
            switch(tool)
            {
                case ToolType.PEN:
                case ToolType.ERASER:
                    continueStroke(evt);
                    break;

                //case ToolType.LASER:
                    //break;
            }
        });


        slides.addEventListener( 'mouseup', function(evt) {
            switch(tool)
            {
                case ToolType.PEN:
                case ToolType.ERASER:
                    stopStroke(evt);
                    break;

                //case ToolType.LASER:
                    //slides.style.cursor = 'none';
                    //break;
            }
        });


        slides.addEventListener( 'touchstart', function(evt) {
            if ((tool==ToolType.PEN) || (tool==ToolType.ERASER))
            {
                // iPad pencil -> draw
                for (let t of evt.targetTouches) 
                {
                    if (t.touchType == "stylus")
                    {
                        slideScale  = Reveal.getScale();
                        slideRect   = slides.getBoundingClientRect();
                        slideScroll = drawingCanvas[mode].container.scrollTop;
                        evt.offsetX = (t.clientX - slideRect.left) / slideScale;
                        evt.offsetY = (t.clientY - slideRect.top ) / slideScale + slideScroll;
                        startStroke(evt);
                        return;
                    }
                }
            }

            // finger touch -> laser
            if (tool) showCursor();
        }, true );


        slides.addEventListener( 'touchmove', function(evt) {
            if ((tool==ToolType.PEN) || (tool==ToolType.ERASER))
            {
                // iPad pencil -> draw
                for (let t of evt.changedTouches) 
                {
                    if (t.touchType == "stylus")
                    {
                        evt.offsetX = (t.clientX - slideRect.left) / slideScale;
                        evt.offsetY = (t.clientY - slideRect.top) / slideScale + slideScroll;
                        continueStroke(evt);
                        return;
                    }
                }
            }

            // finger touch -> laser
            if (tool) showCursor();
        }, { passive: false });



        slides.addEventListener( 'touchend', function(evt) {
            if ((tool==ToolType.PEN) || (tool==ToolType.ERASER))
            {
                // iPad pencil -> draw
                for (let t of evt.changedTouches) 
                {
                    if (t.touchType == "stylus")
                    {
                        stopStroke(evt);
                        return;
                    }
                }
            }
        });

    } // no pointer events


    window.addEventListener( "contextmenu", function(evt) {
        if (tool)
        {
            evt.preventDefault();
            evt.stopPropagation();
            return false;
        }
    }, true );


    window.addEventListener( "click", function(evt) {
        // if in chalkboard mode, prevent accidential mouse clicks (e.g. on menu icon)
        // only allow clicks for the four chalkboard's buttons
        if (tool && !evt.target.classList.contains("chalkboard"))
        {
            evt.preventDefault();
            evt.stopPropagation();
            return false;
        }
    }, true );


    window.addEventListener( "resize", function() {
        playbackEvents( 0 );
        playbackEvents( 1 );
    } );



    Reveal.addEventListener( 'ready', function() {
        if ( !printMode ) 
        {
            slideIndices = Reveal.getIndices();
            adjustChalkboardHeight();
            playbackEvents( 0 );
            playbackEvents( 1 );
        }
    });


    Reveal.addEventListener( 'slidechanged', function( evt ) {
        if ( !printMode ) {
            slideIndices = Reveal.getIndices();
            closeChalkboard();
            adjustChalkboardHeight();
            playbackEvents( 0 );
            playbackEvents( 1 );
        }
    });


    Reveal.addEventListener( 'fragmentshown', function( evt ) {
        if ( !printMode ) {
            slideIndices = Reveal.getIndices();
            closeChalkboard();
            adjustChalkboardHeight();
            playbackEvents( 0 );
            playbackEvents( 1 );
        }
    });


    Reveal.addEventListener( 'fragmenthidden', function( evt ) {
        if ( !printMode ) {
            slideIndices = Reveal.getIndices();
            closeChalkboard();
            adjustChalkboardHeight();
            playbackEvents( 0 );
            playbackEvents( 1 );
        }
    });



    // select active tool (pen, eraser, laser pointer)
    function selectTool(newTool)
    {
        tool = (tool==newTool ? ToolType.NONE : newTool);
        updateGUI();
    }


    // set laser and pen cursor
    function updateCursor()
    {
        // convert penColor to rgb
        var elem = document.body.appendChild(document.createElement('fictum'));
        elem.style.color = penColor;
        var color = getComputedStyle(elem).color;
        var rgb = color.substring(color.indexOf('(')+1, color.lastIndexOf(')')).split(/,\s*/);
        document.body.removeChild(elem);

        // setup pen color with alpha=255 and alpha=0
        var col1 = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",255)";
        var col2 = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",128)";
        var col3 = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",0)";

        var ctx  = cursorCanvas.getContext("2d");

        // render pen cursor
        var grdPen   = ctx.createRadialGradient(10, 10, 1, 10, 10, 3);
        grdPen.addColorStop(0, col1);
        grdPen.addColorStop(1, col3);
        ctx.clearRect(0, 0, 20, 20); 
        ctx.fillStyle = grdPen;
        ctx.fillRect(0, 0, 20, 20);
        penCursor = "url(" + cursorCanvas.toDataURL() + ") 10 10, auto";

        // render laser cursor
        var grdLaser = ctx.createRadialGradient(10, 10, 1, 10, 10, 10);
        grdLaser.addColorStop(0, col2);
        grdLaser.addColorStop(1, col3);
        ctx.clearRect(0, 0, 20, 20); 
        ctx.fillStyle = grdLaser;
        ctx.fillRect(0, 0, 20, 20);
        laserCursor = "url(" + cursorCanvas.toDataURL() + ") 10 10, auto";

        // reset cursor
        slides.style.cursor = tool ? 'none' : '';
    }


    // check whether slide has blackboard scribbles, and then highlight icon
    function updateGUI()
    {
        if (printMode) return;


        // reset icon states
        buttonPen.style.color    = "lightgrey";
        //buttonLaser.style.color  = "lightgrey";
        buttonEraser.style.color = "lightgrey";
        buttonBoard.style.color  = "lightgrey";


        // set board button
        if (boardMode)
            buttonBoard.style.color  = "#2a9ddf";
        else if (hasSlideData(Reveal.getIndices(), 1))
            buttonBoard.style.color = "red";


        // highlight active tool icon
        switch (tool)
        {
            case ToolType.PEN:
                buttonPen.style.color = "#2a9ddf";
                break;

            case ToolType.ERASER:
                buttonEraser.style.color = "#2a9ddf";
                break;

            //case ToolType.LASER:
                //buttonLaser.style.color = "#2a9ddf";
                //break;
        }


        // canvas setup
        if (tool)
        {
            drawingCanvas[mode].canvas.style.border        = "1px solid " + penColor;
            drawingCanvas[mode].canvas.style.pointerEvents = "auto";
        }
        else
        {
            drawingCanvas[mode].canvas.style.borderColor   = "transparent";
            drawingCanvas[mode].canvas.style.pointerEvents = "none";
        }


        // update cursor
        updateCursor();
    }


    // add callbacks for adjusting GUI
    Reveal.addEventListener( 'slidechanged',   updateGUI );
    Reveal.addEventListener( 'fragmentshown',  updateGUI );
    Reveal.addEventListener( 'fragmenthidden', updateGUI );


	function showCursor() 
    {
        switch (tool)
        {
            case ToolType.PEN:
            case ToolType.LASER:
                slides.style.cursor = laserCursor;
                break;

            case ToolType.ERASER:
                slides.style.cursor = eraserCursor;
                break;
        }
        clearTimeout( cursorInactiveTimeout );
        cursorInactiveTimeout = setTimeout( hideCursor, hideCursorTime );
	}

	function hideCursor() 
    {
        slides.style.cursor = 'none';
	}


    function clearSlide()
    {
        var ok = confirm("Delete notes and board on this slide?");
        if ( ok )
        {
            activeStroke = null;
            closeChalkboard();

            clearCanvas( 0 );
            clearCanvas( 1 );

            mode = 1;
            var slideData = getSlideData();
            slideData.events = [];

            mode = 0;
            var slideData = getSlideData();
            slideData.events = [];
        }
    };


    function pdfExport()
    {
        if (confirm("Leave/reload presentation to export PDF?"))
        {
            window.open("?print-pdf","_self")
        }
    }


    function drawUndo()
    {
        if (hasSlideData( slideIndices, mode ))
        {
            var slideData = getSlideData( slideIndices, mode );
            slideData.events.pop();
            playbackEvents( mode );
        }
    }


    // setup keyboard shortcuts
    Reveal.addKeyBinding( { keyCode: 46, key: 'Delete', 
        description: 'Reset Chalkboard' }, 
        clearSlide );

    Reveal.addKeyBinding( { keyCode: 67, key: 'C', 
        description: 'Toggle Notes' }, 
        function(){ selectTool(ToolType.PEN); } );

    Reveal.addKeyBinding( { keyCode: 68, key: 'D',
        description: 'Download Notes' },
        downloadData );

    Reveal.addKeyBinding( { keyCode: 69, key: 'E',
        description: 'Toggle Eraser' },
        function(){ selectTool(ToolType.ERASER); });

    Reveal.addKeyBinding( { keyCode: 76, key: 'L', 
        description: 'Toggle Laser Pointer' }, 
        function(){ selectTool(ToolType.LASER); });

    Reveal.addKeyBinding( { keyCode: 84, key: 'T', 
        description: 'Toggle Chalkboard' }, 
        toggleChalkboard );

    Reveal.addKeyBinding( { keyCode: 90, key: 'Z', 
        description: 'Chalkboard Undo' }, 
        drawUndo );

    Reveal.addKeyBinding( { keyCode: 80, key: 'P', 
        description: 'Trigger Print/PDF-Export' }, 
        pdfExport );

    this.drawUndo          = drawUndo;
    this.toggleChalkboard  = toggleChalkboard;
    this.clearSlide        = clearSlide;
    this.download          = downloadData;


	return {
		init: function() { 

            // print some infos
            console.log("HighDPI scaling:  " + canvasScale);
            console.log("Pointer events:   " + !!(window.PointerEvent));
            console.log("Coalesced events: " + !!(window.PointerEvent && (new PointerEvent("pointermove")).getCoalescedEvents));

            return new Promise( function(resolve) {
                
                if (printMode)
                {
                    // load scribbles, create chalkboard slides, resolve promise
                    loadData().then(createPrintout).then(resolve);
                }
                else
                {
                    // load scribbles, resolve promise
                    loadData().then(resolve);
                }
            });
        }
    }

})();

Reveal.registerPlugin( 'chalkboard', RevealChalkboard );
