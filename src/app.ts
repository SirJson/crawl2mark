import { ConsoleMessage } from "puppeteer";
import puppeteer from "puppeteer";
import fs from "fs";
import mustache from "mustache";
import { URL } from "url";
import * as ansi from "./ansi";

if (process.argv.length <= 1) {
    console.error("Not enough arguments. Please use the runner script!");
    process.exit(1);
}

let FILENAME = "unknown.html";
let URI: URL;

mustache.escape = function (text: string) {
    return text;
};

const template = fs.readFileSync("html/template.html", "utf8");
const style = fs.readFileSync("html/site.css", "utf8");

function onConsoleMesssge(msg: ConsoleMessage, ...args: any[]) {
    try {
        let packet = JSON.parse(msg.text());
        if ("marker" in packet) {
            if (packet["marker"] == "asdf1234") {
                const title: string = packet["data"]["title"];
                let output = mustache.render(template, {
                    title: title,
                    content: packet["data"]["content"],
                });
                const whitespaces: RegExp = /\s/gm;
                const badchars: RegExp = /\:|\,|\?|\&|\'|\=|\|/gm;
                FILENAME = title
                    .replace(badchars, "")
                    .replace(whitespaces, "-");
                if (!fs.existsSync("render")) {
                    fs.mkdirSync("render");
                }

                fs.writeFileSync(`render/${FILENAME}.html`, output);
                fs.writeFileSync(`render/style.css`, style);
            }
        }
    } catch { }
}

async function main() {
    const lib_readability = fs.readFileSync("js/Readability.js", "utf8");
    const executer = fs.readFileSync("js/autoexec.js", "utf8");
    const browser = await puppeteer.launch();

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
    await page.evaluateOnNewDocument(lib_readability);
    await page.goto(URI.href, {
        waitUntil: "load",
    });
    await page.evaluate(executer);
    await browser.close();
}

try {
    URI = new URL(process.argv[process.argv.length - 1]);
    console.info(`Converting ${URI.href} to markdown`);
    main()
        .then(() => {
            console.log(`render/${FILENAME}.html`);
        })
        .catch(e => {
            console.error("Error", e);
            process.exit(1);
        });

}
catch (error) {
    console.error(ansi.BgWhite,ansi.Bright,ansi.FgRed,`[!!] crawl2mark failed. Did you forget to set the target url?`,ansi.Reset)
    console.error(error);
    process.exit(1);
}
