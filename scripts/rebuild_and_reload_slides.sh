#!/bin/bash
htmldoc=$(basename "$1" .md).html
make -q "$htmldoc" && exit 0
echo "Rebuilding slides $htmldoc"
make "$htmldoc"

platform=$(uname)
if [[ $platform == 'Linux' ]]; then
    # Reload all windows currently displaying our slides
    title=$(grep title "$htmldoc" | head -n1 | sed 's/.*<title>\([^<]\+\)<.*/\1/')
    echo "Reloading chrome instances with this title: $title"
    for window in $(wmctrl -l | grep -oP '(?<=)(0x\w+)(?=.*'"$title"')'); do
        # Unfortunately, Chrome windows reject key events when in the background. We switch focus to the
        # Chrome window and back to the old focused window.
        xdotool windowfocus $window key F5 windowfocus $(xdotool getactivewindow)
    done
elif [[ $platform == 'Darwin' ]]; then
    # Reload frontmost Safari page (ideally the lecture slides)
    osascript -e 'tell application "Safari"' \
              -e 'set docUrl to URL of document 1' \
              -e 'set URL of document 1 to docUrl' \
              -e 'end tell'
else
    echo "Unknown platform: $platform"
fi
