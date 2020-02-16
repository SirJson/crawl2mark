import { ConsoleMessage } from "puppeteer";
import puppeteer from "puppeteer";
import fs from "fs";
import mustache from "mustache";

const URL = process.argv[process.argv.length - 1];
let FILENAME = "unknown.html";

mustache.escape = function(text: string) {
    return text;
};

const template = fs.readFileSync("html/template.html", "utf8");

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
                const badchars: RegExp = /\:|\,|\?|\&|\=/gm;
                FILENAME = title
                    .replace(badchars, "")
                    .replace(whitespaces, "-");
                if (!fs.existsSync("render")) {
                    fs.mkdirSync("render");
                }

                fs.writeFileSync(`render/${FILENAME}.html`, output);
            }
        }
    } catch {}
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
    await page.evaluateOnNewDocument(lib_readability);
    await page.goto(URL, {
        waitUntil: "networkidle2",
    });
    await page.evaluate(executer);
    await browser.close();
}

main()
    .then(() => {
        console.log(`render/${FILENAME}.html`);
    })
    .catch(e => {
        console.error("Error", e);
        process.exit(1);
    });
