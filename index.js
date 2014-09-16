'use strict';

var fs = require('graceful-fs'),
	path = require('path'),
	logger = require('./lib/utils/log'),
	copy = require('./lib/utils/copy'),
	getDirectories = require('./lib/utils/getDirectories'),
	logger = require('./lib/utils/log'),
	async = require('async'),
	colors = require('chalk'),

	ENV = {
		root: process.cwd()
	};

/**
 * In a package.json:
 *
 *  "paths": {
 *    "public": "/public",
 *    "apps": "/source/app/modules/",
 *    "libraries": "/source/app/core/"
 *  }
 */

/**
 * ** Build:
 *
 * - list all folders inside sourcePath.libraries and load modules:
 * 		each (module):
 * 		- load module.json
 * 		- create module context object
 * 		- queue the module
 * 		- run async
 */
function buildLibs(done) {
	if (!ENV.libraries) {
		throw new Error('Missing config entry: "ngbuilder.libraries"');
	}

	loadAndBuild(ENV.libraries, done);
}

function buildApps(done) {
	if (!ENV.apps) {
		throw new Error('Missing config entry: "ngbuilder.apps"');
	}

	loadAndBuild(ENV.apps, done);
}

function buildAll(done) {
	buildLibs(function(err) {
		if (err) return done(err);

		buildApps(done);
	});
}

function loadAndBuild(path, done) {
	var queue = [],
		ModuleBuilder = require('./lib/ModuleBuilder');

	loadModulesFromDirectory(path, function(modules) {
		modules.forEach(function(module) {
			var builder = new ModuleBuilder(module);

			queue.push(function(done) {
				var evt = builder.build();
				evt.on('end', done);
				evt.on('error', done);
			});
		});

		async.series(queue, function(err) {
			if (err) {
				logger.info(colors.red('### Build failed ###'));
				return done && done(err);
			}

			logger.info(colors.green('All done.'));
			done && done();
		});
	});
}

function loadModulesFromDirectory(dir, cb) {
	var Context = require('./lib/Context'),
		Module = require('./lib/Module');

	getDirectories(dir, function(error, files) {
		if (error) throw error;

		var modules = [];

		files.forEach(function(modulePath) {
			if (!fs.existsSync(path.join(modulePath, 'module.json'))) return;

			var context = new Context({
				modulePath: modulePath
			});

			copy(context, ENV);

			modules.push(new Module(context));
		});

		cb(modules);
	});
}

function loadConfigsFromPath(pathToLoad) {
	var pkg = path.join(pathToLoad, 'package.json');

	if (!fs.existsSync(pkg)) {
		throw new Error('package.json not found in ' + path);
	}

	pkg = require(pkg);

	if (!pkg.ngbuilder) {
		throw new Error('Builder configs not found in package.json. Make sure you have a "ngbuilder" section in your manifest');
	}

	var options = pkg.ngbuilder,
		relativePaths = options.paths;

	Object.keys(relativePaths).forEach(function(pathName) {
		var relPaths = relativePaths[pathName];

		if (typeof relPaths === 'string') {
			ENV[pathName] = path.join(pathToLoad, relPaths);
		} else {
			ENV[pathName] = relPaths.map(function(relPath) {
				return path.join(pathToLoad, relPath);
			});
		}
	});

	// saves the app version for later interpolation
	ENV.appVersion = pkg.version;
}

function serveFiles(port) {
	var Server = require('./lib/StaticServer');
	var staticServer = new Server(ENV.public || 'public');

	staticServer.listen(port || 8000);

	return staticServer;
}

module.exports = {
	loadConfigsFromPath: loadConfigsFromPath,
	buildLibs: buildLibs,
	buildApps: buildApps,
	buildAll: buildAll,
	serveFiles: serveFiles,
	log: logger
};