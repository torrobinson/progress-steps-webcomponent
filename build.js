// Requires
var fs = require('fs');
var UglifyJS = require('uglify-js');
var UglifyCSS = require('uglifycss');

// Vars
var scriptFileName = 'progress-steps';
var dir = __dirname;
var sourceFolder = dir + '/src/';
var distFolder = dir + '/dist/';

// JS Minification
var code = fs.readFileSync(sourceFolder + scriptFileName + '.js', 'utf8');
var uglifiedCode = UglifyJS.minify(code, {
	mangle: {
		toplevel: true,
	},
	nameCache: {},
}).code;

// CSS Minification
var css = fs.readFileSync(sourceFolder + scriptFileName + '.css', 'utf8');
var uglifiedCss = UglifyCSS.processString(css, {
});


// Create dist folder if not exists
if (!fs.existsSync(distFolder)) {
	fs.mkdirSync(distFolder);
}

// Create the javascript
fs.writeFile(
	distFolder + scriptFileName + '.min.js',
	uglifiedCode,
	function (err) {
		if (err) {
			console.log(err);
		} else {
			console.log('Minified javascript saved');
		}
	}
);

// Create the CSS
fs.writeFile(
	distFolder + scriptFileName + '.min.css',
	uglifiedCss,
	function (err) {
		if (err) {
			console.log(err);
		} else {
			console.log('Minified css saved');
		}
	}
);