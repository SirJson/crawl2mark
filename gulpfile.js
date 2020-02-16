"use strict";

const { src, dest, watch } = require("gulp");
const sass = require("gulp-sass");
const path = require("path");

sass.compiler = require("sass");

function css() {
    return src("styles/site.scss")
        .pipe(
            sass({
                includePaths: [
                    path.join(__dirname, "styles"),
                    path.join(__dirname, "node_modules"),
                ],
            }).on("error", sass.logError),
        )
        .pipe(dest("render"));
}

function watchCSS() {
    return watch(["styles/*.scss"], css);
}

exports.css = css;
exports.watch = watchCSS;
exports.default = css;
