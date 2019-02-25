
changequote(`{{',`}}')
changecom()

define({{AUDIO}}, {{ ![]($1){ .data-autoplay } }})

define({{VIDEO}}, {{ifelse( $#, 3, ![{{$3}}]($1){ $2 }, ![]($1){ $2 } )}} )
define({{IMG}},   {{ifelse( $#, 3, ![{{$3}}]($1){ $2 }, ![]($1){ $2 } )}} )
define({{SVG}},   {{ifelse( $#, 3, ![{{$3}}]($1){ #svg $2 }, ![]($1){ #svg $2 } )}} )
define({{DEMO}},  {{ifelse( $#, 2, ![]($1){ $2 }, ![]($1){ .stretch } )}} )

define({{FOOTER}}, {{[ $* ]{.footer} }})

