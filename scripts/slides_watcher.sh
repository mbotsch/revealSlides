#!/bin/bash

mydir=$(dirname $(readlink "$0"))

if [[ $# -eq 1 ]]; then
    args="$1"
else
    args=*.md
fi
fswatch $args | xargs -I{} "${mydir}/rebuild_and_reload_slides.sh" {}
