"use strict";

var RevealFooter = (function(){

    /* this function is called inbetween just before Reveal's setupPDF.
     * We setup the minimum height of slide elements to Reveal's page height.
     */
    function fixFooters()
    {
        var height = Reveal.getConfig().height;

        // process all slides...
		Reveal.getSlides().forEach( function( slide ) {

            // set min-height to page height
            slide.style.minHeight = height + "px";


            // pandoc puts footers into a <p> element, which
            // makes positioning w.r.t. slide bottom difficult.
            // hence we remove these p-elements and put the
            // footers as children of the slide element
            var footers = slide.getElementsByClassName('footer');
            for (var i=0; i<footers.length; i++)
            {
                var footer = footers[i];
                var parent = footer.parentElement;
                if (parent.nodeName == "P")
                {
                    slide.appendChild(footer);
                    parent.parentElement.removeChild(parent);
                }
            }
        });
    }


	return {
		init: function() { 
            return new Promise( function(resolve) {
                Reveal.addEventListener( 'ready', fixFooters );
                resolve();
            });
        }
    }

})();

Reveal.registerPlugin( 'footer', RevealFooter );

