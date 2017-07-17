const testFolder = './fonts/';
const fs = require('fs');

const Format = {
    woff2 : 'woff2',
    woff : 'woff',
    ttf : 'truetype',
    ttc : 'truetype',
    otf : 'opentype',
};

fs.readdir(testFolder, (err, fontFiles) => {
    let outputCss = '';
    let url = '';
    let font = '';
    let options = '';
    fontFiles.forEach((fontFile) => {
        url = `"./fonts/${fontFile}"`;
        [font, extension] = fontFile.split('.');
        extension = extension.toLowerCase();
        outputCss = outputCss +  `@font-face {font-family: ${font}; src: url(${url}) format('${Format[extension]}'); } \n`;
        options += `{value:'${font}', label:'${font}'},\n`
    });

    fs.writeFile("./fonts.css", outputCss, function(err) {
        if(err) {
            return console.log(err);
        }
    });

    options = `module.exports = function(props) {return [${options}];};`;
    fs.writeFile("./fontOptions.jsx", options, function(err) {
        if(err) {
            return console.log(err);
        }
    });
})

