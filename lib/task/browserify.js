var gulp = require('gulp');
var multipipe = require('multipipe');
var browserify = require('gulp-browserify');
var sourceMap = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var path = require('path');

var gulpSrcOptions = {
	read: false
};

module.exports = function(context) {
	var modulePath = context.modulePath,
		moduleName = context.moduleName,
		publicPath = context.publicPath,
		sourcePath = context.includePath,

		browserifyOptions = {
			insertGlobals: false,
			debug: false,
			paths: sourcePath,
			detectGlobals: false,
			fullPaths: false,
			builtins: ''
		};

	return multipipe(
		gulp.src(path.join(modulePath, 'index.js'), gulpSrcOptions),
		browserify(browserifyOptions),
		sourceMap.init(),
		concat(moduleName + '.js'),
		uglify(),
		sourceMap.write('.'),
		gulp.dest(publicPath)
	);
};