/**
 * A plugin which enables rendering of math equations inside
 * of reveal.js slides. Essentially a thin wrapper for MathJax.
 *
 * @author Hakim El Hattab
 */
var RevealMath = window.RevealMath || (function(){

	var options = Reveal.getConfig().math || {};
	var mathjax = options.mathjax || 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js';
    var config = options.config || 'TeX-AMS_SVG-full';
	var url = mathjax + '?config=' + config;

	var defaultOptions = {
		messageStyle: 'none',
        extensions: ["TeX/AMSmath.js"],
		tex2jax: {
			inlineMath: [ [ '$', '$' ], [ '\\(', '\\)' ] ],
			skipTags: [ 'script', 'noscript', 'style', 'textarea', 'pre' ]
		},
		skipStartupTypeset: true,
        AssistiveMML: { disabled: true },
        menuSettings: { zoom: "Double-Click" },
        styles: { ".reveal section .MJXc-display": { margin: "0.5em 0em 1em 0em" },
                  ".reveal section .MathJax_SVG_Display": { margin: "0.5em 0em 1em 0em" } },
        "fast-preview": { disabled: true },
        "CommonHTML": { matchFontHeight: false },
        "HTML-CSS":   { matchFontHeight: false },
        "SVG":        { matchFontHeight: false, scale: "90", useFontCache: true, useGlobalCache: false }
	};

	function defaults( options, defaultOptions ) {

		for ( var i in defaultOptions ) {
			if ( !options.hasOwnProperty( i ) ) {
				options[i] = defaultOptions[i];
			}
		}

	}

	function loadScript( url, callback ) {

		var head = document.querySelector( 'head' );
		var script = document.createElement( 'script' );
		script.type = 'text/javascript';
		script.src = url;

		// Wrapper for callback to make sure it only fires once
		var finish = function() {
			if( typeof callback === 'function' ) {
				callback.call();
				callback = null;
			}
		}

		script.onload = finish;

		// IE
		script.onreadystatechange = function() {
			if ( this.readyState === 'loaded' ) {
				finish();
			}
		}

		// Normal browsers
		head.appendChild( script );

	}

	return {
		init: function() { 
            return new Promise( function(resolve) {

                var printMode = ( /print-pdf/gi ).test( window.location.search );

                defaults( options, defaultOptions );
                defaults( options.tex2jax, defaultOptions.tex2jax );
                options.mathjax = options.config = null;

                loadScript( url, function() {

                    MathJax.Hub.Config( options );

                    // Typeset followed by an immediate reveal.js layout since
                    // the typesetting process could affect slide height
                    MathJax.Hub.Queue( [ 'Typeset', MathJax.Hub ] );
                    MathJax.Hub.Queue( Reveal.layout );
                    MathJax.Hub.Queue( [ 'log', console, "mathjax typeset done" ]); // just for debugging

                    // in print mode, resolve promise after typesetting is done
                    if (printMode) MathJax.Hub.Queue( resolve );
                } );

                // if not in print mode, resolve promise immediately
                if (!printMode) resolve();
            });
        }
    }

})();

Reveal.registerPlugin( 'math', RevealMath );
