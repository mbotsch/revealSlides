#!/bin/bash

if [ $# -lt 2 ] ; then
    echo
    echo "Usage: convert-macros.sh  input.md  output.md"
    echo
    exit
fi

MACRO=${0/.sh/.m4}
INPUT=$1
OUTPUT=$2


cat $INPUT \
    | sed -e 's/\[\[/\{\{/g; s/\]\]/\}\}/g' \
    | m4 $MACRO - \
    > $OUTPUT

