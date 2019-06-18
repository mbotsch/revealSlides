"use strict";


var RevealOversize = (function(){

    var pageWidth  = Reveal.getConfig().width;
    var pageHeight = Reveal.getConfig().height;


    function slideChanged(evt)
    {
        var scale       = Reveal.getScale();
        var indices     = Reveal.getIndices();
        var slide       = Reveal.getCurrentSlide();
        var rect        = slide.getBoundingClientRect();
        var slideWidth  = Math.round( rect.width  / scale  );
        var slideHeight = Math.round( rect.height / scale );

        slide.style.border = "none";
        if (slideWidth > pageWidth)
        {
            slide.style.borderRight = "3px dashed red";
            slide.style.borderLeft  = "3px dashed red";
            console.log("width of slide " + indices.h + " is " + slideWidth);
        }
        if (slideHeight > pageHeight)
        {
            slide.style.borderTop    = "3px dashed red";
            slide.style.borderBottom = "3px dashed red";
            console.log("height of slide " + indices.h + " is " + slideHeight);
        }
    }


    Reveal.addEventListener( 'ready',          slideChanged );
    Reveal.addEventListener( 'slidechanged',   slideChanged );
    Reveal.addEventListener( 'fragmentshown',  slideChanged );
    Reveal.addEventListener( 'fragmenthidden', slideChanged );

    return this;
})();

