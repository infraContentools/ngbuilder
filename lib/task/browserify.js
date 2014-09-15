'use strict';

var gulp = require('gulp');
var multipipe = require('multipipe');
var browserify = require('gulp-browserify');
var sourceMap = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var path = require('path');
var logger = require('../helpers/log');

var gulpSrcOptions = {
	read: false
};

module.exports = function(context) {
	// process.stdout.write('\u001B[2J\u001B[0;0f');

	var modulePath = context.modulePath,
		moduleName = context.moduleName,
		publicPath = context.publicPath,
		includePaths = context.includePaths;

	if (typeof includePaths === 'string') {
		includePaths = [includePaths];
	}

	var browserifyOptions = {
		insertGlobals: false,
		debug: false,
		paths: includePaths,
		detectGlobals: false,
		fullPaths: false,
		builtins: ''
	};

	var pipe = multipipe(
		gulp.src(path.join(modulePath, 'index.js'), gulpSrcOptions),
		browserify(browserifyOptions),
		sourceMap.init(),
		concat(moduleName + '.js'),
		uglify()
	);

	// delay the output stream pipeline to give a chance for event handlers to bind
	setTimeout(function() {
		logger.debug('browserify: writing to', publicPath);

		var output = multipipe(
			sourceMap.write('.'),
			gulp.dest(publicPath)
		);

		pipe.pipe(output);
	});

	return pipe;
};