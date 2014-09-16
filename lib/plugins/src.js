'use strict';

/**
 * - read all the source files
 * - concat in one file
 * - transform ES6 syntax
 * - add AngularJS annotations
 * - write to modulePath/index.js
 */

module.exports = (function() {
	var gulp, multipipe, concat, traceur, ngAnnotate, wrap, jshint, template, path, logger, _initialized;

	function init() {
		if (_initialized) return;

		gulp = require('gulp');
		multipipe = require('multipipe');
		concat = require('gulp-concat');
		traceur = require('gulp-traceur');
		ngAnnotate = require('gulp-ng-annotate');
		wrap = require('gulp-wrap');
		template = require('gulp-template');
		jshint = require('gulp-jshint');
		path = require('path');
		logger = require('../utils/log');

		_initialized = true;
	}

	function run(context, options, next) {
		init();

		var modulePath = context.modulePath;

		var pipe = multipipe(
			gulp.src([
				path.join(modulePath, '/src/module.js'),
				path.join(modulePath, '/src/**/*.js')
			]),
			jshint(),
			jshint.reporter('jshint-stylish'),
			jshint.reporter('fail'),
			concat('index.js'),
			traceur(traceurOptions),
			ngAnnotate(ngAnnotateOptions),
			wrap(wrapOptions),
			template(context)
		);

		pipe.on('error', next);
		pipe.on('end', next);
		pipe.on('finish', next);

		pipe.pipe(gulp.dest(modulePath));
	}

	return {
		name: 'src',
		watcher: 'src/**/*.js',
		run: run
	};
})();

var traceurOptions = {
	sourceMaps: false,
	modules: 'commonjs'
};

var ngAnnotateOptions = {
	add: true,
	single_quotes: true
};

var wrapOptions = '(function() {\n<%= contents %>\nif(typeof $module !== \'undefined\') {module.exports = $module;} })();';