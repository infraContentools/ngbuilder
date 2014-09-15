'use strict';

var livereload = require('gulp-livereload');
var livereloadServer;

var CoreBuilder = require('./lib/CoreModuleBuilder');
var AppBuilder = require('./lib/AppModuleBuilder');

var paths = {},
	libraries = [],
	applications = [],
	libPrefix = 'core.',
	appPrefix = 'app.';

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
	var buildCount = 0;

	libraries.forEach(function(moduleName) {
		buildCoreModule(moduleName).on('change', function(err) {
			if (err) done(err);
			if (++buildCount === libraries.length) done();
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
	return new AppBuilder(appPrefix + moduleName, paths.apps + moduleName, paths);
}

function makeCoreModuleBuilder(moduleName) {
	return new CoreBuilder(libPrefix + moduleName, paths.library + moduleName);
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

	if (options.libPrefix) {
		libPrefix = options.libPrefix;
	}

	if (options.appPrefix) {
		appPrefix = options.appPrefix;
	}
}

function loadConfigsFromManifest(__dirname) {
	var fs = require('fs'),
		path = require('path'),
		pkg = path.join(__dirname, 'package.json');

	if (!fs.existsSync(pkg)) {
		throw new Error('package.json not found in ' + __dirname);
	}

	pkg = require(pkg);

	if (!pkg.ngbuilder) {
		throw new Error('Builder configs not found in package.json. Make sure you have a "ngbuilder" section in your manifest');
	}

	var options = pkg.ngbuilder,
		paths = ngbuilder.paths;

	var paths = {
		'public': makePath(paths.public),
		'apps': makePath(paths.apps),
		'libraries': makePath(paths.libraries)
		//'includes': [makePath('source/app')]
	};

	function makePath(partial) {
		return path.join(__dirname, partial);
	}

	updateConfigs({
		paths: paths,
		libraries: options.libraries || [],
		apps: options.apps || [],
		libPrefix: options.libPrefix || false,
		appPrefix: options.appPrefix || false
	});
}

function serveFiles(port) {
	var Server = require('./lib/StaticServer'),

		staticServer = new Server(paths.publicPath);

	staticServer.listen(port || 8000);

	return staticServer;
}

module.exports = {
	watchLibs: watchCoreModulesTask,
	watchApps: watchAppModulesTask,
	buildLibs: buildCoreModulesTask,
	buildApps: buildAppModulesTask,
	configure: updateConfigs,
	loadConfigsFromManifest: loadConfigsFromManifest,
	serve: serveFiles
};