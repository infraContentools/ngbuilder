'use strict';

var path = require('path');

function Module(path) {
	this.modulePath = path;
	this.readSettings();
}

Module.prototype.getPluginOptions = function(pluginName) {
	return this.pluginOptions[pluginName] || {};
};

Module.prototype.readSettings = function() {
	var manifest = path.join(this.modulePath, 'module.json'),
		moduleOptions = require(manifest);

	this.moduleName = moduleOptions.name;
	this.pluginOptions = moduleOptions.plugins || {};
	this.plugins = Object.keys(this.pluginOptions);
};

module.exports = Module;