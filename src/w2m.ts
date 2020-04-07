#!/usr/bin/env ts-node

import puppeteer from "puppeteer";
import fs from "fs";
import mustache from "mustache";
import path from "path";
import chalk from "chalk";
import os from "os";
import https from "https";
import { URL } from "url";
import { RenderEvent } from "./renderEvent";
import { ChildProcess, spawn } from "child_process";
import { ConsoleMessage } from "puppeteer";

const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="style.css" type="text/css" />
        <title>{{title}}</title>
    </head>
    <body>
        <h1>{{mdtitle}}</h1>
        {{content}}
    </body>
</html>
`;
const cssTemplate = `/*! normalize.css v8.0.1 | MIT License | github.com/necolas/normalize.css */html{line-height:1.15;-webkit-text-size-adjust:100%}body{margin:0}main{display:block}h1{font-size:2em;margin:.67em 0}hr{box-sizing:content-box;height:0;overflow:visible}pre{font-family:monospace,monospace;font-size:1em}a{background-color:transparent}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,samp{font-family:monospace,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}img{border-style:none}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,input{overflow:visible}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button}[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner,button::-moz-focus-inner{border-style:none;padding:0}[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring,button:-moz-focusring{outline:1px dotted ButtonText}fieldset{padding:.35em .75em .625em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}progress{vertical-align:baseline}textarea{overflow:auto}[type=checkbox],[type=radio]{box-sizing:border-box;padding:0}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}details{display:block}summary{display:list-item}template{display:none}[hidden]{display:none}html{font-size:62.5%;font-family:Inter,"Source Sans Pro","Helvetica Neue",Calibri,Roboto,Arial,sans-serif}body{font-size:1.8rem;line-height:1.618;max-width:60em!important;margin:auto;color:#34495e;background-color:#fff;padding:13px}@media (max-width:684px){body{font-size:1.53rem}}@media (max-width:382px){body{font-size:1.35rem}}h1,h2,h3,h4,h5,h6{line-height:1.1;font-weight:700;overflow-wrap:break-word;word-wrap:break-word;-ms-word-break:break-all;word-break:break-word;-ms-hyphens:auto;-moz-hyphens:auto;-webkit-hyphens:auto;hyphens:auto}h1{font-size:2.35em}h2{font-size:2em}h3{font-size:1.75em}h4{font-size:1.5em}h5{font-size:1.25em}h6{font-size:1em}small,sub,sup{font-size:75%}hr{border-color:#4a69bd}a{text-decoration:none;color:#4a69bd}a:hover{color:#b71540;border-bottom:2px solid #34495e}ul{padding-left:1.4em}li{margin-bottom:.4em}blockquote{font-style:italic;margin-left:1.5em;padding-left:1em;border-left:3px solid #4a69bd}img{max-width:100%;height:auto!important}pre{background-color:#f8f8f8;display:block;padding:1em;overflow-x:auto}code{font-size:.9em;padding:0 .5em;background-color:#f8f8f8;white-space:pre-wrap}pre>code{padding:0;background-color:transparent;white-space:pre}table{text-align:justify;width:100%;border-collapse:collapse}td,th{padding:.5em;border-bottom:1px solid #f8f8f8}.button,button,input[type=button],input[type=reset],input[type=submit]{display:inline-block;padding:5px 10px;text-align:center;text-decoration:none;white-space:nowrap;background-color:#4a69bd;color:#fff;border-radius:1px;border:1px solid #4a69bd;cursor:pointer;box-sizing:border-box}.button[disabled],button[disabled],input[type=button][disabled],input[type=reset][disabled],input[type=submit][disabled]{cursor:default;opacity:.5}.button:focus,.button:hover,button:focus,button:hover,input[type=button]:focus,input[type=button]:hover,input[type=reset]:focus,input[type=reset]:hover,input[type=submit]:focus,input[type=submit]:hover{background-color:#b71540;border-color:#b71540;color:#fff;outline:0}input,textarea{border:1px solid #34495e}input[type],select,textarea{color:#34495e;padding:6px 10px;margin-bottom:10px;background-color:#f8f8f8;border:1px solid #f8f8f8;border-radius:4px;box-shadow:none;box-sizing:border-box}input:focus{border:1px solid #4a69bd}input[type]:focus,select:focus,textarea:focus{border:1px solid #4a69bd;outline:0}input[type=checkbox]:focus{outline:1px dotted #4a69bd}fieldset,label,legend{display:block;margin-bottom:.5rem;font-weight:600}`;
const payload = `var article = new Readability(document).parse(), package = { marker: "asdf1234", data: article }; console.log("C2MBEGIN;" + JSON.stringify(package));`;

const renderState = new RenderEvent();
const payloadTag = "C2MBEGIN;";
let pageTitle = "Unknown";
let targetPath: string = '';

mustache.escape = function (text: string) {
    return text;
};

function patchConsole() {
    if (console.log) {
        const old = console.log;
        console.log = function log(...args: any | null) {
            Array.prototype.unshift.call(args, `[${chalk.magenta("LOG")}] `);
            old.apply(this, args);
        };
    }
    if (console.debug) {
        const old = console.debug;
        console.debug = function log(...args: any | null) {
            Array.prototype.unshift.call(args, `[${chalk.cyan("DBG")}] `);
            old.apply(this, args);
        };
    }
    if (console.info) {
        const old = console.info;
        console.info = function info(...args: any | null) {
            Array.prototype.unshift.call(args, `[${chalk.blue("INF")}] `);
            old.apply(this, args);
        };
    }
    if (console.warn) {
        const old = console.warn;
        console.warn = function warn(...args: any | null) {
            Array.prototype.unshift.call(args, `[${chalk.yellow("WRN")}] `);
            old.apply(this, args);
        };
    }
    if (console.error) {
        const old = console.error;
        console.error = function error(...args: any | null) {
            Array.prototype.unshift.call(args, `[${chalk.red("ERR")}] `);
            old.apply(this, args);
        };
    }
}

function onConsoleMesssge(msg: ConsoleMessage, ...args: any[]) {
    try {
        if (msg.text().startsWith(payloadTag)) {
            let packet = JSON.parse(msg.text().replace(payloadTag, ''));
            if ("marker" in packet) {
                if (packet["marker"] == "asdf1234") {
                    let output = mustache.render(htmlTemplate, {
                        title: pageTitle,
                        mdtitle: pageTitle,
                        content: packet["data"]["content"],
                    });
                    const whitespaces: RegExp = /\s/gm;
                    const badchars: RegExp = /\:|\,|\?|\&|\'|\=|\||\"|\\|\//gm;
                    const filename = pageTitle
                        .replace(badchars, "")
                        .replace(whitespaces, "-");
                    if (!fs.existsSync("render")) {
                        fs.mkdirSync("render");
                    }
                    const workdir = os.tmpdir();
                    const targetHTML = path.join(workdir, `${filename}.html`);
                    const targetCSS = path.join(workdir, `style.css`);

                    fs.writeFileSync(targetHTML, output);
                    fs.writeFileSync(targetCSS, cssTemplate);
                    renderHTML(path.resolve(targetHTML));
                }
            }
        }
        else {
            console.log(`<WEBCON> ${msg.text()}`);
        }
    } catch (ex) {
        console.error("Error in RPC", ex);
        process.exit(1);
    }
}

function renderHTML(pathname: string) {
    const mddoc = path.basename(pathname.replace(path.extname(pathname), ".md"));
    const mdpath = path.join(path.resolve(targetPath), mddoc);
    console.info(`Generating markdown file to '${mdpath}' from source '${pathname}'`);
    const pandoc: ChildProcess = spawn('pandoc', ['-r', 'html-native_divs-native_spans', '-t', 'gfm+pipe_tables+fenced_code_blocks+gfm_auto_identifiers+backtick_code_blocks+autolink_bare_uris+space_in_atx_header+intraword_underscores+strikeout+emoji+shortcut_reference_links+lists_without_preceding_blankline', '--wrap=none', '--strip-comments', '--atx-headers', '--quiet', '-s', pathname, '-o', mdpath]);
    if (!pandoc) {
        console.error("Failed to launch pandoc!");
        process.exit(1);
    }
    pandoc.stdout?.on('data', (msg: Buffer) => console.log(`pandoc: ${msg.toString('utf8')}`));
    pandoc.stderr?.on('data', (msg: Buffer) => renderState.emit("error", `pandoc execute failed: ${msg.toString('utf8')}`));
    pandoc.on('close', (code) => renderState.emit("finish"));
    pandoc.on('exit', (code) => renderState.emit("finish"));
    pandoc.on('error', (error: Error) => renderState.emit("error", `pandoc execute failed: ${error}`));

}
function waitToRender(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        renderState.on('finish', () => resolve());
        renderState.on('error', (e: string) => reject(e));
    });
}

async function webToMarkdown(url: URL) {
    console.info(`Loading readability.js`);
    const libReadability = fs.readFileSync(path.resolve(__dirname,"readability.js"), "utf8");
    console.info(`Starting puppeteer `);
    const browser = await puppeteer.launch();
    console.info(`Puppeteer setup...`);
    const page = await browser.newPage();
    await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        isMobile: false,
    });
    page.on("console", onConsoleMesssge);
    page.setDefaultTimeout(0);
    page.setDefaultNavigationTimeout(0);
    await page.evaluateOnNewDocument(libReadability);
    console.info(`Connecting to ${url.href}`);
    await page.goto(url.href, {
        waitUntil: "load",
    });
    pageTitle = await page.title();
    console.info(`Execute payload...`);
    await page.evaluate(payload);
    await waitToRender();
}

try {
    patchConsole();
    if (process.argv.length <= 2) {
        console.error("Not enough arguments. Please use the runner script!");
        process.exit(1);
    }
    targetPath = process.argv[process.argv.length - 1];
    console.info(`Writing to ${targetPath}`);
    const url = new URL(process.argv[process.argv.length - 2]);
    webToMarkdown(url)
        .then(() => {
            console.info(`Successfully converted ${url.href} to markdown!`);
            process.exit(0);
        })
        .catch(e => {
            console.error("Error", e);
            process.exit(1);
        });

}
catch (error) {
    console.error("Converter failed. Did you forget to set the target url?");
    console.error(error);
    process.exit(1);
}
