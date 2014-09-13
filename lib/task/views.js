var gulp = require('gulp');
var templateCache = require('gulp-templatecache');
var multipipe = require('multipipe');
var path = require('path');

/**
 * - read all HTML from /views folder
 * - transform into JS and build the templateCach
 * - write it to /src/views.js
 */

module.exports = function(context) {
	var modulePath = context.modulePath,
		moduleName = context.moduleName,
		basePath = path.join(modulePath, 'views');

	return multipipe(
		gulp.src(path.join(basePath, '/**/*.html')),

		templateCache({
			output: 'views.js',
			strip: basePath,
			moduleName: moduleName,
			minify: htmlMinifyOptions
		}),
		gulp.dest(path.join(modulePath, '/src'))
	);
};

var htmlMinifyOptions = {
	collapseBooleanAttributes: true,
	collapseWhitespace: true
};