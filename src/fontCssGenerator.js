const testFolder = './fonts/';
const fs = require('fs');

let fontFiles = [];
fs.readdir(testFolder, (err, fontFiles) => {
    let outputCss = '';
    let url = '';
    let font = '';
    let options = '';
    fontFiles.forEach((fontFile) => {
        url = `"./fonts/${fontFile}"`;
        font = fontFile.split('.')[0]
        outputCss = outputCss +  `@font-face {font-family: ${font}; src: url(${url}); } \n`;
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

