'use strict';

var gulp = require('gulp');
var templateCache = require('gulp-templatecache');
var multipipe = require('multipipe');
var path = require('path');
var logger = require('../helpers/log');

/**
 * - read all HTML from /views folder
 * - transform into JS and build the templateCache
 * - write it to /src/views.js
 */

module.exports = function(context) {
	var modulePath = context.modulePath,
		moduleName = context.moduleName,
		basePath = path.join(modulePath, 'views');

	var pipe = multipipe(
		gulp.src(path.join(basePath, '/**/*.html')),

		templateCache({
			output: 'views.js',
			strip: basePath,
			moduleName: moduleName,
			minify: htmlMinifyOptions
		})
	);

	// delay the output stream pipeline to give a chance for event handlers to bind
	setTimeout(function() {
		var dest = path.join(modulePath, '/src');
		logger.debug('views: writing to', dest);
		pipe.pipe(gulp.dest(dest));
	});

	return pipe;
};

var htmlMinifyOptions = {
	collapseBooleanAttributes: true,
	collapseWhitespace: true
};