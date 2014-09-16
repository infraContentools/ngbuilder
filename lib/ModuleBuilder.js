'use strict';

var gulp = require('gulp'),
	logger = require('./utils/log'),
	copy = require('./utils/copy'),
	async = require('async'),
	colors = require('chalk'),
	path = require('path'),
	fs = require('graceful-fs'),
	EventEmitter = require('events').EventEmitter,
	pluginsByName = {};

function ModuleBuilder(module) {
	this.plugins = [];
	this.module = module;
	this.context = module.context;
}

ModuleBuilder.prototype.build = function() {
	this.readModuleSettings();

	var emitter = new EventEmitter(),
		context = this.context,
		queue = [];

	Object.keys(context.plugins).forEach(function(pluginName) {
		queue.push(function(next) {
			if (pluginName in pluginsByName === false) {
				return next(new Error('Plugin ' + pluginName + ' is not available'));
			}

			var plugin = pluginsByName[pluginName],
				pluginOptions = context.plugins[pluginName];

			logger.debug('Running plugin', colors.green(pluginName), 'on', colors.cyan(context.moduleName));

			plugin.run(context, pluginOptions, next);
		});
	});

	async.series(queue, function(error) {
		if (error) {
			logger.debug('Module ' + colors.cyan(context.moduleName) + ' failed to build: ' + colors.red(error.message));
			emitter.emit('error', error);
		} else {
			logger.info('Module ', colors.cyan(context.moduleName), ' updated');
			emitter.emit('end');
		}
	});

	return emitter;
};

ModuleBuilder.prototype.readModuleSettings = function() {
	var context = this.context;

	var filePath = path.join(context.modulePath, 'module.json');

	if (!fs.existsSync(filePath)) {
		throw new Error('Missing manifest file not found: ' + filePath);
	}

	var moduleOptions = require(filePath);

	context.plugins = moduleOptions.plugins || {};
	context.moduleName = moduleOptions.name;
};

(function() {
	var requireDir = require('require-dir'),
		plugins = requireDir('./plugins');

	Object.keys(plugins).forEach(function(plugin) {
		plugin = plugins[plugin];
		pluginsByName[plugin.name] = plugin;
	});
})();

module.exports = ModuleBuilder;