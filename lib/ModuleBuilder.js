'use strict';

var gulp = require('gulp');
var logger = require('./helpers/log');
var async = require('async');
var bindStreamEvents = require('./helpers/bindStreamEvents');
var colors = require('chalk');
var path = require('path');
var EventEmitter = require('events').EventEmitter;

/**
 * @class ModuleBuilder
 */
function ModuleBuilder() {
	/**
	 * Build steps
	 * source path => task name
	 */
	this.buildSteps = [];
}

module.exports = ModuleBuilder;

/**
 * Watch for changes and call the build methods when something is saved
 */
ModuleBuilder.prototype.watch = function watch() {
	if (!this.buildSteps.length) {
		logger.error('No build steps registered for this builder');
		return;
	}

	var emitter = new EventEmitter(),
		context = this.context;

	function logChange(whatChanged) {
		var filename = whatChanged.path.replace(context.modulePath, '');
		logger.info(['File ', colors.green(filename), ' of ', colors.cyan(context.moduleName), ' was ', whatChanged.type].join(''));
	}

	function buildDone(error) {
		if (error) {
			logger.error('Build error', error);
		} else {
			logger.info('Module ' + colors.cyan(context.moduleName) + ' was updated');
		}

		emitter.emit('change', error || null);
	}

	this.buildSteps.forEach(function(step) {
		gulp.watch(path.join(context.modulePath, step.path)).on('change', function(whatChanged) {
			logChange(whatChanged);
			var stream = step.task(context);
			bindStreamEvents(stream, buildDone);
		});
	});

	return emitter;
};

ModuleBuilder.prototype.build = function build() {
	if (!this.buildSteps.length) {
		logger.error('No build steps registered for this builder');
		return;
	}

	var emitter = new EventEmitter(),
		context = this.context,

		steps = this.buildSteps.map(function(step) {
			var stream = step.task(context);
			return bindStreamEvents(stream);
		});

	async.series(
		steps,
		function done(error) {
			if (error) {
				logger.error(error);
			} else {
				logger.info('Rebuilt app module ' + context.moduleName);
			}

			emitter.emit('change', error || null);
		});

	return emitter;
};