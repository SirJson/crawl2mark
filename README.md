# crawl2mark

This is a hacked together solution for fetching a webpage and creating a readable markdown file from it.

Basically what those scripts are doing is:

- First compile a markdown friendly CSS file from SCSS (Shoutout to [sakura.css](https://github.com/oxalorg/sakura))

- Navigate to the desired target via Headless Chrome and [Puppeteer](https://github.com/puppeteer/puppeteer).

- Inject [Readability.js](https://github.com/mozilla/readability) into it and execute some more js code. It will transform the DOM into something Firefox would do in "reader mode".

- Wait for a console event that contains a tagged JSON object with the results of Readability.js

- Use a mustache template and the received content to render a HTML file into a temporary folder

- Run the tool "prettier" after all HTML is written

- The last step is calling pandoc with all desired extensions

Not a elegant solution but it works.

The biggest downside is that I don't know if you could even package this random collection of scripts into something that can just run without installing a bunch of developer dependencies. 

If you know a way how to do something like this let me know

## Usage

You don't want to use this, but if you really _really_ want: Just install yarn, nodejs, pandoc, typescript and gulp-cli.

After installing all dependencies run this shell script to start converting a page

```sh
./crawl2mark.sh https://example.com
```

and enjoy your Github flavoured Markdown :)
