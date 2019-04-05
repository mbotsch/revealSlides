/**
 * A plugin which enables rendering of math equations inside
 * of reveal.js slides. Essentially a thin wrapper for MathJax.
 *
 * @author Hakim El Hattab
 */

/* Fixes the following issues:
 *
 * #1924: Thanks to the new reset.css, CommonHTML can be used when we 
 *        disable MathJax' matchFontHeight. CommonHTML should be the
 *        prefered solution, since it is the default MathJax renderer
 *        since MathJax version 2.7.
 *
 * #2105: Problem is caused by dynamically adjusting font height and by 
 *        re-typesetting upon slide-change. Both can now be disabled.
 *
 * #1383: This problem is caused by re-typesetting math content on 
 *        slide change in overview mode, which is disabled now.
 * 
 * #1726: Disabling AssistiveMML removes duplicated math in notes.
 *
 * #2256: If in printPDF mode, we can now enforce that math typesetting 
 *        finishes during the init() function using Promises, such that
 *        the element/fragment copying for separate PDF fragments
 *        now works without problems.
 *
 * Remaining problems:
 *
 * #xxxx: Have to load MathJax in notes.js?
 */

var RevealMath = window.RevealMath || (function(){

	var options = Reveal.getConfig().math || {};
	var mathjax = options.mathjax || 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/MathJax.js';
	var config = options.config || 'TeX-AMS_CHTML-full'; // use CommonHTML as default
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
        "CommonHTML": { matchFontHeight: false },
        "HTML-CSS":   { matchFontHeight: false }
	};

	function defaults( options, defaultOptions ) {

		for ( var i in defaultOptions ) {
			if ( !options.hasOwnProperty( i ) ) {
				options[i] = defaultOptions[i];
			}
		}

	}

	return {
		init: function() {
            return new Promise( function(resolve) {

                var printMode = ( /print-pdf/gi ).test( window.location.search );

                var head = document.querySelector( 'head' );
                var script = document.createElement( 'script' );
                script.type = 'text/javascript';
                script.src = url;

                script.onload = function() 
                {
                    // configure MathJax
                    defaults( options, defaultOptions );
                    defaults( options.tex2jax, defaultOptions.tex2jax );
                    options.mathjax = options.config = null;
                    MathJax.Hub.Config( options );

                    // Typeset followed by an immediate reveal.js layout since
                    // the typesetting process could affect slide height
                    MathJax.Hub.Queue( [ 'Typeset', MathJax.Hub ] );
                    MathJax.Hub.Queue( Reveal.layout );
                    MathJax.Hub.Queue( [ 'log', console, "mathjax typeset done" ]);

                    // in print mode, resolve promise after typesetting is done
                    if (printMode) MathJax.Hub.Queue( resolve );
                };

                // load script
		        head.appendChild( script );

                // resolve promise
                if (!printMode) resolve();
            });
		},

        getMathJax: function() { return mathjax; },
        getConfig: function() { return config; },
        getURL: function() { return url; }
	}

})();

Reveal.registerPlugin( 'math', RevealMath );
