'use strict';

var gulp = require('gulp');
var multipipe = require('multipipe');
var concat = require('gulp-concat');
var traceur = require('gulp-traceur');
var ngAnnotate = require('gulp-ng-annotate');
var wrap = require('gulp-wrap');
var jshint = require('gulp-jshint');
var path = require('path');

/**
 * - read all the source files
 * - concat in one file
 * - transform ES6 syntax
 * - add AngularJS annotations
 * - write to modulePath/index.js
 */
module.exports = function(context) {
	var modulePath = context.modulePath;

	// process.stdout.write('\u001B[2J\u001B[0;0f');

	var pipe = multipipe(
		gulp.src([
			path.join(modulePath, '/src/module.js'),
			path.join(modulePath, '/src/views.js'),
			path.join(modulePath, '/src/**/*.js')
		]),

		jshint(),
		jshint.reporter('jshint-stylish'),
		jshint.reporter('fail'),
		concat('index.js'),
		traceur(traceurOptions),
		ngAnnotate(ngAnnotateOptions),
		wrap(wrapOptions)
	);

	// delay the output stream pipeline to give a chance for event handlers to bind
	setTimeout(function() {
		pipe.pipe(gulp.dest(modulePath));
	});

	return pipe;
};

var traceurOptions = {
	sourceMaps: false,
	modules: 'commonjs'
};

var ngAnnotateOptions = {
	add: true,
	single_quotes: true
};

var wrapOptions = '(function() {\n<%= contents %>\nif(typeof $module !== undefined) {module.exports = $module;} })();';