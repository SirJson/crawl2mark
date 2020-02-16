var article = new Readability(document).parse();
var package = {
    marker: "asdf1234",
    data: article,
};

console.info(JSON.stringify(package));
