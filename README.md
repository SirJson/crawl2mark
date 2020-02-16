# crawl2mark

This is a hacked together solution for fetching a webpage and create a readable markdown file from it.

Basically what this group of scripts are doing is:

- First compile a markdown friendly CSS from SCSS

- Navigate to the desired target via Chrome and Puppeteer.

- Inject [Readability.js]() into it and execute some init code. It will transform the DOM into something Firefox would do in "reader mode".

- Wait for a console event that will be a tagged JSON object with the results of Readability.js

- Render the content with a mustache template into a temporary folder

- Run the tool "prettier" after all HTML is written

- The last step is calling pandoc with all desired extensions

Not a elegant solution but it works.

The biggest downside is that I don't know if you could even package this random collection of scripts into something that can just run without installing developer tools. If you know a way how to do something like this let me know

## Usage

You don't want to use this, but if you really _really_ want: Just install yarn, nodejs, pandoc, typescript and gulp-cli.

After installing all dependencies run this shell script to start converting a page

```sh
./crawl2mark.sh https://example.com
```

and enjoy your gitlab flavoured markdown document :)
