/* jshint node:true */
'use strict';

var livereload = require('gulp-livereload');
var livereloadServer;

var CoreBuilder = require('./lib/CoreModuleBuilder');
var AppBuilder = require('./lib/AppModuleBuilder');

var paths = {},
	libraries = [],
	applications = [];

function setPaths(_paths) {
	copy(paths, _paths);
}

function copy(dest, src) {
	Object.keys(src).forEach(function(key) {
		dest[key] = src[key];
	});
}

function watchCoreModulesTask() {
	libraries.forEach(watchCoreModule);
	livereloadServer || (livereloadServer = livereload.listen());
}

function watchAppModulesTask() {
	applications.forEach(watchAppModule);
	livereloadServer || (livereloadServer = livereload.listen());
}

function buildCoreModulesTask(done) {
	var buildCount = 0,
		maxCount = libraries.length;

	libraries.forEach(function(moduleName) {
		buildCoreModule(moduleName).on('change', function(err) {
			if (err) done(err);
			if (++buildCount === maxCount) done();
		});
	});
}

function buildAppModulesTask() {
	applications.forEach(buildAppModule);
}

function notifyLivereload(err) {
	err || livereload.changed();
}

function buildCoreModule(moduleName) {
	return makeCoreModuleBuilder(moduleName).build();
}

function buildAppModule(moduleName) {
	return makeAppModuleBuilder(moduleName).build();
}

function watchCoreModule(moduleName) {
	makeCoreModuleBuilder(moduleName).watch().on('change', notifyLivereload);
}

function watchAppModule(moduleName) {
	makeAppModuleBuilder(moduleName).watch().on('change', notifyLivereload);
}

function makeAppModuleBuilder(moduleName) {
	return new AppBuilder('app.' + moduleName, paths.apps + moduleName, paths);
}

function makeCoreModuleBuilder(moduleName) {
	return new CoreBuilder('core.' + moduleName, paths.library + moduleName);
}

function updateConfigs(options) {
	if (options.paths) {
		setPaths(options.paths);
	}

	if (options.libraries) {
		libraries = options.libraries;
	}

	if (options.apps) {
		applications = options.apps;
	}
}

module.exports = {
	watchLibs: watchCoreModulesTask,
	watchApps: watchAppModulesTask,
	buildLibs: buildCoreModulesTask,
	buildApps: buildAppModulesTask,
	configure: updateConfigs
};