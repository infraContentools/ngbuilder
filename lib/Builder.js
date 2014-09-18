'use strict';

var fs = require('graceful-fs'),
	path = require('path'),
	gulp = require('gulp'),
	Util = require('./util/'),
	colors = require('chalk'),
	nodePath = require('path'),
	logSymbols = require('log-symbols'),
	Registry = require('./Registry'),

	libs = new Registry(),
	apps = new Registry(),

	builder = {
		ENV: {},
		plugins: new Registry(),
		libs: libs,
		apps: apps,

		loadConfigsFromPath: loadConfigsFromPath,
		buildLibs: buildLibs,
		buildApps: buildApps,
		buildAll: buildProject,
		buildModule: prepareEnvAndBuildModule,
		serveFiles: serveFiles,
		watch: watchProject,

		setEnv: setEnv,
		log: Util.log
	};

function setEnv(env) {
	Util.copy(builder.ENV, env);
}

// TODO try to figure out the root path automatically

function buildLibs(done) {
	loadLibs(function(err, libs) {
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
	loadApps(function(err, apps) {
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
	function modulePlugins(moduleObj) {
		var list = [];

		moduleObj.plugins.forEach(function(name) {
			list.push(builder.plugins.get(name));
		});

		return list;
	}

	function moduleWatchers(moduleObj) {
		var watchers = [];

		modulePlugins(moduleObj).forEach(function(plugin) {
			if (!plugin.watcher) return;

			var watcher;

			if (typeof plugin.watcher === 'string') {
				watcher = [plugin.watcher];
			} else {
				watcher = plugin.watcher;
			}

			watchers.push.apply(watchers, watcher);
		});

		return watchers;
	}

	function adjustModulePaths(modl, paths) {
		paths.forEach(function(path, index) {
			paths[index] = nodePath.join(modl.modulePath, path);
		});
	}

	loadAll(function(err) {
		if (err) return done(err);

		var modules = apps.toArray().concat(libs.toArray()),
			livereload = require('gulp-livereload');

		modules.forEach(function(modl) {
			var paths = moduleWatchers(modl),
				moduleName = colors.green(modl.moduleName);

			if (!paths.length) return;

			// prefix paths with the module path to avoid watching the wrong files
			adjustModulePaths(modl, paths);

			var watcher = gulp.watch(paths);

			watcher.on('change', function(whatChanged) {
				var chagendPath = whatChanged.path.replace(modl.modulePath, '');

				Util.log.info('File ', colors.white(chagendPath), 'was', colors.green(whatChanged.type));

				buildModule(modl, function(err) {
					if (err) {
						Util.log.error(err);
						return;
					}

					Util.log.info('>> Module ' + moduleName + ' rebuilt. Reloading...');
					livereload.changed();
				});
			});
		});

		livereload.listen();
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

	list.forEach(function(moduleObj) {
		queue.push(function(next) {
			buildModule(moduleObj, next);
		});
	});

	Util.async(queue, function(err) {
		if (err) {
			return done && done(err);
		}

		done && done();
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

	loadModulesIntoRegistry(builder.ENV.libraries, libs, done);
}

function loadApps(done) {
	if (!builder.ENV.apps) {
		return done(new Error('Missing config entry: "ngbuilder.apps"'));
	}

	loadModulesIntoRegistry(builder.ENV.apps, apps, done);
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
		options = moduleObj.pluginOptions,
		pluginRegistry = builder.plugins;

	moduleObj.plugins.some(function(pluginName) {
		if (!pluginRegistry.has(pluginName)) {
			doneWithPlugins(new Error('Plugin ' + pluginName + ' is not available'));
			return true;
		}

		queue.push(function(next) {
			var plugin = pluginRegistry.get(pluginName),
				pluginOptions = options[pluginName],
				done = false;

			Util.log.debug('Running plugin ' + colors.green(pluginName));

			plugin.run(moduleObj, pluginOptions, function(err) {
				if (done) return;

				done = true;
				next(err);
			});
		});
	});

	var built = false;

	function done(error) {
		if (built) return;

		if (error) {
			Util.log.debug(logSymbols.error + ' Module ' + moduleName + ' failed to build: ' + colors.red(error.message));
		} else {
			Util.log.debug(logSymbols.success + ' Module ' + moduleName + ' completed');
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
	var pkg = path.join(pathToLoad, 'package.json'),
		ENV = builder.ENV;

	if (!fs.existsSync(pkg)) {
		throw new Error('package.json not found in ' + path);
	}

	pkg = require(pkg);

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
		builder.plugins.register(plugin.name, plugin);
	});
}

function serveFiles(port) {
	var Server = require('./StaticServer');
	var staticServer = new Server(builder.ENV.public || 'public');

	staticServer.listen(port || 8000);

	return staticServer;
}

module.exports = builder;