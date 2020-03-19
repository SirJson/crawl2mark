#!/bin/bash
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$(cd -P "$(dirname "$SOURCE")" >/dev/null 2>&1 && pwd)"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR="$(cd -P "$(dirname "$SOURCE")" >/dev/null 2>&1 && pwd)"
ORIGIN="$PWD"

cd "$DIR" || exit 1

if [[ ! -d "$DIR/node_modules" ]]; then
  npm install
fi

URL=$1
echo "Converting $URL to markdown..."
TEMPDIR=$(mktemp -d)
mkdir -p "$DIR/render"
mkdir -p "$DIR/output"
echo "Render page..."
OUTHTML=$(ts-node "$DIR/src/app.ts" "$URL")
if [[ $? -gt 0 ]]; then
  echo "Browser error!"
  exit 1
fi
echo "Improve html output..."
# TODO: Figure out if we need this
npx prettier --write "$OUTHTML" 2>/dev/null
DOCNAME=$(basename "$OUTHTML")
DOCNAME="${DOCNAME%.*}.md"
echo "Generating $DOCNAME..."
pandoc -r html-native_divs-native_spans -t gfm+pipe_tables+fenced_code_blocks+gfm_auto_identifiers+backtick_code_blocks+autolink_bare_uris+space_in_atx_header+intraword_underscores+strikeout+emoji+shortcut_reference_links+lists_without_preceding_blankline --wrap=none --strip-comments --atx-headers -s "$OUTHTML" -o "$ORIGIN/$DOCNAME"

cd "$ORIGIN" || exit 1
