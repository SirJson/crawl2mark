#!/bin/bash

if [[ ! -d "node_modules" ]]; then
    yarn
fi

URL=$1
echo "Converting $URL to markdown..."
TEMPDIR=$(mktemp -d)
CSD=$(dirname "$(readlink -f "$0")")
mkdir -p "$CSD/render"
mkdir -p "$CSD/output"
echo "Render page..."
OUTHTML=$(ts-node "$CSD/src/app.ts" "$URL")
if [[ $? -gt 0 ]]; then
    echo "Browser error!"
    exit 1
fi
echo "Improve html output..."
yarn prettier --write "$OUTHTML" 2>/dev/null
DOCNAME=$(basename "$OUTHTML")
DOCNAME="${DOCNAME%.*}.md"
echo "Generating $DOCNAME..."
pandoc -r html-native_divs-native_spans -t gfm+pipe_tables+fenced_code_blocks+gfm_auto_identifiers+backtick_code_blocks+autolink_bare_uris+space_in_atx_header+intraword_underscores+strikeout+emoji+shortcut_reference_links+angle_brackets_escapable+lists_without_preceding_blankline --wrap=none --strip-comments --atx-headers -s "$OUTHTML" -o "$CSD/output/$DOCNAME"
