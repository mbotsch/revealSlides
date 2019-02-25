#!/bin/bash
# Modifies an SVG to prevent markdown from inserting <br/> tags and to avoid style class name conflicts.
# Also injects a width parameter if specified
sanitized_filename=$(basename $1 .svg | tr -d '`~!@#$%^&*()<>[]{}()/|+=' | tr '\- ' '_' | tr -s "_")
tmpfile=$(mktemp)
(
echo "<!-- $1 -->"
sed -E -e 's/<\?xml[^>]*>[ \t]*//; s/<!--[^>]*-->//'                                                                   `# Get rid of xml tag, add HTML comment indicating which SVG file was included` \
    -e "/<style.*>/,/<\/style>/s/\.st([0-9]*)/.${sanitized_filename}_st\1/g"                                           `# Modify the names of all css style classes with the name ".st "` \
    -e ':loop' -e "s/(class=\"|class=\"[^\"]*[[:space:]])st([0-9]*)/\1${sanitized_filename}_st\2/" -e 't loop'         `# Replace all instances of 'st#' with 'name_st#' inside class="..."` \
    -e "/<style.*>/,/<\/style>/s/\.cls-([0-9]*)/.${sanitized_filename}_st\1/g"                                         `# Modify the names of all css style classes with the name ".cls- "` \
    -e ':clsloop' -e "s/(class=\"|class=\"[^\"]*[[:space:]])cls-([0-9]*)/\1${sanitized_filename}_st\2/" -e 't clsloop' `# Replace all instances of 'st#' with 'name_st#' inside class="..."` \
    $1 | sed -e '/^[[:space:]]*$/d' -e 's/[[:space:]]*$//'                                                      # Delete empty lines and remove trailing whitespace.
) > $tmpfile
if [[ $# -eq 2 ]]; then
    platform=$(uname)
    if [[ $platform == 'Linux' ]]; then
        # Linux sed can't deal with a space between -i and suffix
        sed -i'bak'  "s/<svg/<svg $2/" $tmpfile    # Inject attribute string (e.g. width) if specified.
    else
        # Mac sed needs a space between -i and suffix
        sed -i 'bak'  "s/<svg/<svg $2/" $tmpfile    # Inject attribute string (e.g. width) if specified.
    fi
fi
echo -n $tmpfile
output_filename=$(echo $1|sed 's/\.svg$/_sanitized.svg/')
mv $tmpfile $output_filename
