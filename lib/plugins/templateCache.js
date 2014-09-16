'use strict';

/**
 * - read all HTML from /views folder
 * - transform into JS and build the templateCache
 * - write it to /src/views.js
 */

module.exports = (function() {
	var gulp, templateCache, multipipe, path, logger, htmlMinifyOptions, _initialized;

	function init() {
		if (_initialized) return;

		gulp = require('gulp');
		templateCache = require('gulp-templatecache');
		multipipe = require('multipipe');
		path = require('path');
		logger = require('../utils/log');

		htmlMinifyOptions = {
			collapseBooleanAttributes: true,
			collapseWhitespace: true
		};

		_initialized = true;
	}

	function run(context, options, next) {
		init();

		var modulePath = context.modulePath,
			moduleName = context.moduleName,
			basePath = path.join(modulePath, 'views'),
			outputPath = path.join(modulePath, '/src');

		var pipe = multipipe(
			gulp.src(path.join(basePath, '/**/*.html')),
			templateCache({
				output: 'views.js',
				strip: basePath,
				moduleName: moduleName,
				minify: htmlMinifyOptions
			})
		);

		pipe.on('error', next);
		pipe.on('end', next);
		pipe.on('finish', next);

		pipe.pipe(gulp.dest(outputPath));
	};

	return {
		name: 'templateCache',
		watcher: '/**/*.html',
		init: init,
		run: run
	};
})();