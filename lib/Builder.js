'use strict';

var fs = require('graceful-fs'),
	noop = function() {},
	path = require('path'),
	gulp = require('gulp'),
	Util = require('./util/'),
	colors = require('chalk'),
	nodePath = require('path'),
	logSymbols = require('log-symbols'),
	Registry = require('./Registry'),

	TYPE_LIB = 1,
	TYPE_APP = 2,

	plugins = new Registry(),
	libs = new Registry(),
	apps = new Registry(),

	builder = {
		ENV: {},
		TYPE_LIB: TYPE_LIB,
		TYPE_APP: TYPE_APP,

		plugins: plugins,
		libs: libs,
		apps: apps,

		loadConfigsFromPath: loadConfigsFromPath,
		buildLibs: buildLibs,
		buildApps: buildApps,
		buildAll: buildProject,
		buildModule: prepareEnvAndBuildModule,
		serveFiles: serveFiles,
		watch: watchProject,

		_: {
			buildModule: buildModule,
			loadAll: loadAll,
			buildModulesOfList: buildModulesOfList
		},

		setEnv: setEnv,
		log: Util.log,
		async: Util.async
	};

function setEnv(env) {
	Util.copy(builder.ENV, env);
}

// TODO try to figure out the root path automatically

function buildLibs(done) {
	loadLibs(function(err) {
		if (err) {
			return done(err);
		}

		buildModulesOfList(libs.toArray(), function(err) {
			if (err) {
				Util.log.error(new Error('Failed to build libs'));
			}

			done(err);
		});
	});
}

function buildApps(done) {
	loadApps(function(err) {
		if (err) {
			return done(err);
		}

		buildModulesOfList(apps.toArray(), function(err) {
			if (err) {
				Util.log.error(new Error('Failed to build apps'));
			}

			done(err);
		});
	});
}

function loadAll(done) {
	Util.async([loadLibs, loadApps], done);
}

function buildProject(done) {
	Util.async([buildLibs, buildApps], done);
}

function watchProject(done) {
	var Watcher = require('./Watcher');

	loadAll(function(err) {
		if (err) return done(err);

		var watcher = new Watcher(builder);
		watcher.watch();
		done(null, watcher);
	});
}

function prepareEnvAndBuildModule(module, done) {
	loadAll(function(err) {
		if (err) return done(err);

		buildModule(module, done);
	});
}

function buildModulesOfList(list, done) {
	var queue = [];

	done = done || noop;

	list.forEach(function(moduleObj) {
		queue.push(function(next) {
			buildModule(moduleObj, next);
		});
	});

	Util.async(queue, function(err) {
		if (err) {
			return done(err);
		}

		done();
	});
}

function findModule(moduleName, done) {
	var found,

		iterator = function(moduleObj) {
			if (moduleName === moduleObj.moduleName) {
				found = true;
				done(null, moduleObj);
			}
		};

	libs.each(iterator);

	if (!found) {
		apps.each(iterator);
	}

	if (!found) {
		done(new Error('Module not found: ' + moduleName));
	}
}

function buildModule(moduleToBuild, done) {
	if (!moduleToBuild) {
		return done(new Error('Invalid module: ', moduleToBuild));
	}

	if (typeof moduleToBuild === 'string') {
		findModule(moduleToBuild, function(err, foundModule) {
			if (err) {
				return done(err);
			}

			runModulePlugins(foundModule, done);
		});
	} else {
		runModulePlugins(moduleToBuild, done);
	}
}

function loadLibs(done) {
	if (!builder.ENV.libraries) {
		return done(new Error('Missing config entry: "ngbuilder.libraries"'));
	}

	loadModulesIntoRegistry(builder.ENV.libraries, libs, function(err) {
		libs.each(function(lib) {
			lib.type = TYPE_LIB;
		});

		done(err);
	});
}

function loadApps(done) {
	if (!builder.ENV.apps) {
		return done(new Error('Missing config entry: "ngbuilder.apps"'));
	}

	loadModulesIntoRegistry(builder.ENV.apps, apps, function(err) {
		apps.each(function(lib) {
			lib.type = TYPE_APP;
		});

		done(err);
	});
}

function loadModulesIntoRegistry(dir, registry, done) {
	Util.log.debug('Loading modules from path:', colors.gray(dir));

	loadModulesFromDirectory(dir, function(err, modules) {
		if (err) {
			return done(err);
		}

		modules.forEach(function(moduleObj) {
			registry.register(moduleObj.moduleName, moduleObj);
		});

		done(null, registry);
	});
}

function runModulePlugins(moduleObj, doneWithPlugins) {
	var queue = [],
		moduleName = colors.cyan(moduleObj.moduleName),
		options = moduleObj.pluginOptions;

	moduleObj.plugins.some(function(pluginName) {
		if (!plugins.has(pluginName)) {
			doneWithPlugins(new Error('Plugin ' + pluginName + ' is not available'));
			return true;
		}

		queue.push(function(next) {
			var plugin = plugins.get(pluginName),
				pluginOptions = options[pluginName],
				done = false;

			if (pluginOptions === false) {
				return next();
			}

			// if only invoked the plugin by name ({pluginName: true}), pass an empty object for options
			if (pluginOptions === true) {
				pluginOptions = {};
			}

			Util.log.debug('Running plugin ' + colors.green(pluginName));

			plugin.run(moduleObj, pluginOptions, function(err) {
				if (done) return;

				done = true;

				// FIXME I have no idea why, but without a timer the output is never written
				setTimeout(function() {
					next(err);
				}, 5);
			});
		});
	});

	var built = false,
		startTime = new Date();

	function done(error) {
		if (built) return;

		if (error) {
			Util.log.debug(logSymbols.error + ' Module ' + moduleName + ' failed to build');
		} else {
			var duration = (new Date()) - startTime;
			Util.log.debug(logSymbols.success + ' Module ' + moduleName + ' rebuilt in ' + duration + 'ms');
		}

		built = true;
		doneWithPlugins(error || null);
	}

	Util.async(queue, done);
}

function loadModulesFromDirectory(dir, callback) {
	var Module = require('./module/Module'),
		ENV = builder.ENV,
		modules = [];

	Util.getDirectories(dir, function(error, modulePaths) {
		if (error) {
			return callback(error);
		}

		var lastItem = modulePaths.length - 1;

		modulePaths.forEach(function(modulePath, index) {
			fs.exists(path.join(modulePath, 'module.json'), function(exists) {
				if (exists) {
					var module = new Module(modulePath);
					Util.copy(module, ENV);
					modules.push(module);
				}

				if (index === lastItem) {
					callback(null, modules);
				}
			});
		});
	});
}

function loadConfigsFromPath(pathToLoad) {
	pathToLoad = String(pathToLoad);

	var pkg = path.join(pathToLoad, 'package.json'),
		ENV = builder.ENV;

	if (!fs.existsSync(pkg)) {
		throw new Error('package.json not found in ' + path);
	}

	ENV.root = pathToLoad;

	try {
		pkg = require(pkg);
	} catch (e) {
		Util.log.error(new Error('Invalid package.json file in ' + path));
		return;
	}

	if (!pkg.ngbuilder) {
		throw new Error('Builder configs not found in package.json. Make sure you have a "ngbuilder" section in your manifest');
	}

	loadPlugins(pkg);

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

function loadPlugins(pkg) {
	var deps = {},
		pluginMatchRe = /^ngbuilder-.*$/;

	Util.copy(deps, pkg.dependencies);
	Util.copy(deps, pkg.devDependencies);

	deps = Object.keys(deps || {});

	deps.forEach(function(name) {
		var match = name.match(pluginMatchRe),
			plugin;

		if (!match) return;

		plugin = require(nodePath.join(builder.ENV.root, 'node_modules', match[0]));
		plugins.register(plugin.name, plugin);
	});
}

function serveFiles(options) {
	options = options || {};

	var serverRoot = options.path || builder.ENV.serverRoot || builder.ENV.public,
		port = options.port || 8000;

	var Server = require('./StaticServer');
	var staticServer = new Server(serverRoot);

	staticServer.listen(port);

	return staticServer;
}

module.exports = builder;