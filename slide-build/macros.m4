divert(-1)dnl cf https://stackoverflow.com/questions/13842575/gnu-m4-strip-empty-lines
changequote(`{{',`}}')

define({{COL}},    {{<div style="float:left; width:$1%; margin-bottom:10px;">}})
define({{COLEND}}, {{</div>}})

define({{DIV}},    {{<div class="$1">}})
define({{DIVEND}}, {{</div>}})

define({{VSPACE}}, {{<div style="clear:both; height:$1;"></div>}})
define({{HSPACE}}, {{<span style="display:inline-block; width:$1;"></span>}})

define({{FRAG}},  {{<div class="fragment" style="display: inline-block;"> {{$*}} </div>}})

define({{AUDIO}}, {{<audio data-autoplay src="$1"></audio>}})

define({{VIDEO}}, {{ifelse( $#, 3,
                <figure><video src="$1" controls $2></video><figcaption>{{$3}}</figcaption></figure>,
                <video src="$1" controls $2></video> )}} )

define({{IMG}}, {{ifelse( $#, 3,
              <figure><img src="$1" $2 /><figcaption>{{$3}}</figcaption></figure>,
              <figure><img src="$1" $2 /></figure> )}} )

define({{SVG}}, {{<figure> include($1) <figcaption> {{$2}} </figcaption></figure> }})

define({{DEMO}}, {{ifelse( $#, 2,
               <iframe src="$1?plugin" scrolling="no" $2></iframe>,
               <iframe src="$1?plugin" class="stretch"></iframe> )}} )

define({{BUBBLE}}, {{<div class="bubble"> $1 </div>}})

define({{HINT}}, {{<div class="comment fragment" style="left: $2px; top: $3px;"> $1 </div>}})

define({{HINTRIGHT}}, {{<div style="display: inline-block; position: relative; left: 0px; top: 0px;"><div class="comment-right fragment" style="position:absolute; left: 0px; bottom: 0px;"> $* </div></div>}})
define({{HINTLEFT}}, {{<div style="display: inline-block; position: relative; left: 0px; top: 0px;"><div class="comment-left fragment" style="position:absolute; right: 0px; bottom: 0px;"> $* </div></div>}})

define({{HINTRIGHTNF}}, {{<div style="display: inline-block; position: relative; left: 0px; top: 0px;"><div class="comment-right" style="position:absolute; left: 0px; bottom: 0px;"> $* </div></div>}})
define({{HINTLEFTNF}}, {{<div style="display: inline-block; position: relative; left: 0px; top: 0px;"><div class="comment-left" style="position:absolute; right: 0px; bottom: 0px;"> $* </div></div>}})

define({{BIGHINT}}, {{<div class="comment-big fragment"> $* </div>}})
define({{BIGHINTNF}}, {{<div class="comment-big"> $* </div>}})

define({{NOTE}}, {{<div class="notes"> $* </div>}})

define({{FOOTER}}, {{<footer> $* </footer>}})

define({{CORRECT}}, {{ifelse( $#, 3,
                            <div class="answer right" style="width:$3"> {{$1}} <div class="tooltip"> {{$2}} </div> </div>,
                            {{ifelse( $#, 2, 
                                    <div class="answer right"> {{$1}} <div class="tooltip"> {{$2}} </div> </div>,
                                    <div class="answer right"> {{$1}} </div> )}}) }})

define({{INCORRECT}}, {{ifelse( $#, 3,
                            <div class="answer wrong" style="width:$3"> {{$1}} <div class="tooltip"> {{$2}} </div> </div>,
                            {{ifelse( $#, 2, 
                                    <div class="answer wrong"> {{$1}} <div class="tooltip"> {{$2}} </div> </div>,
                                    <div class="answer wrong"> {{$1}} </div> )}}) }})

define({{ARROW}}, {{⇒}})

define({{BB}}, {{<span class="boldblue"> $* </span>}})

define({{CODE}}, {{<pre><code class="$1" data-trim data-noescape>}})
define({{CODEEND}}, {{</code></pre>}})

dnl define !!(foo) for highlighting -> can be turned into filter 1:1
dnl but m4 cannot handle "!!" as name without complicated calling-conventions.

define({{MARK}}, {{<div class="highlight" style="display:inline-block;">{{$*}}</div>}})

define({{CHECK}}, {{<span style="color:green; font-weight:bold"> ✓ </span>}})
define({{NOCHECK}},   {{<span style="color:red; font-weight:bold"> ✗ </span>}})
divert(0)dnl
