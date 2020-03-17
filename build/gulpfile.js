"use strict";
var _a = require("gulp"), src = _a.src, dest = _a.dest, watch = _a.watch;
var sass = require("gulp-sass");
var path = require("path");
sass.compiler = require("sass");
function css() {
    return src("styles/site.scss")
        .pipe(sass({
        includePaths: [
            path.join(__dirname, "styles"),
            path.join(__dirname, "node_modules"),
        ],
    }).on("error", sass.logError))
        .pipe(dest("render"));
}
function watchCSS() {
    return watch(["styles/*.scss"], css);
}
exports.css = css;
exports.watch = watchCSS;
exports.default = css;
