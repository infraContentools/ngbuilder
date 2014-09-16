'use strict';

/**
 * - read all SASS sources from /scss folder
 * - transform into a minified .css file
 * - write it to /module.css
 */

module.exports = (function() {
	var gulp, sass, concat, multipipe, path, logger, _initialized;

	function init() {
		if (_initialized) return;

		gulp = require('gulp');
		sass = require('gulp-sass');
		concat = require('gulp-concat');
		multipipe = require('multipipe');
		path = require('path');
		logger = require('../utils/log');

		_initialized = true;
	}

	function run(context, options, next) {
		init();

		var modulePath = context.modulePath,
			moduleName = context.moduleName;

		var pipe = multipipe(
			gulp.src(path.join(modulePath, 'scss/**/*.scss')),
			sass(sassOptions),
			concat('module.css')
		);

		var includePaths = context.sassPaths || [];

		if (typeof includePaths === 'string') {
			includePaths = [includePaths];
		}

		includePaths.push(path.join(modulePath, 'scss'));

		var sassOptions = {
			outputStyle: 'compressed',
			errLogToConsole: true,
			includePaths: includePaths
		};

		pipe.on('error', next);
		pipe.on('end', next);
		pipe.on('finish', next);

		pipe.pipe(gulp.dest(modulePath));
	}

	return {
		name: 'sass',
		watcher: 'scss/**/*.scss',
		run: run
	};
})();