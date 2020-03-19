$html = ts-node ./src/app.ts $args[0]
$name = $html -replace '.html', '' -replace 'render/', ''
echo "Generating $name..."
pandoc -r html-native_divs-native_spans -t gfm+pipe_tables+fenced_code_blocks+gfm_auto_identifiers+backtick_code_blocks+autolink_bare_uris+space_in_atx_header+intraword_underscores+strikeout+emoji+shortcut_reference_links+lists_without_preceding_blankline --wrap=none --strip-comments --atx-headers -s "$html" -o "$PWD/${name}.md"