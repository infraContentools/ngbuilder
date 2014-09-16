'use strict';

var fs = require('graceful-fs'),
	path = require('path');

function Module(context) {
	this.context = context;
	this.path = context.modulePath;

	this.fetchModuleInfo();
}

Module.prototype.fetchModuleInfo = function() {
	var manifest = path.join(this.path, 'module.json');
	this.manifest = require(manifest);

	// if (!fs.existsSync(manifest)) {
	// return this.manifest = new Error('Module does not have a manifest file!\nExpected: ' + manifest);
	// }

};

Module.prototype.getPluginOptions = function(plugin) {
	return (this.manifest.plugins || {})[plugin] || {};
};

module.exports = Module;