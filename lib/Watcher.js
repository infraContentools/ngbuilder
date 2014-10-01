'use strict';

var Util = require('./util'),
	nodePath = require('path'),
	gulp = require('gulp'),
	colors = require('chalk'),
	EE = require('events').EventEmitter,
	logSymbols = require('log-symbols');

module.exports = function Watcher(builder) {
	function getModulePlugins(moduleObj) {
		var list = [];

		moduleObj.plugins.forEach(function(name) {
			if (!builder.plugins.has(name)) {
				throw new Error('Plugin not found: ' + name);
			}

			list.push(builder.plugins.get(name));
		});

		return list;
	}

	function getModuleWatchers(moduleObj) {
		var watchers = [];

		getModulePlugins(moduleObj).forEach(function(plugin) {
			var watcher = plugin.watcher || plugin.watchers;

			if (!watcher) return;

			if (typeof watcher === 'function') {
				watcher = watcher(moduleObj);
			} else {
				watcher = toArray(watcher).map(function(path) {
					return nodePath.join(moduleObj.modulePath, path);
				});
			}

			watchers.push.apply(watchers, watcher);
		});

		return watchers;
	}

	function toArray(stuff) {
		if (typeof stuff === 'string') {
			stuff = [stuff];
		}

		return stuff;
	}

	function processChanges(modl, done) {
		builder._.buildModule(modl, function(err) {
			if (!err && modl.type === builder.TYPE_LIB) {
				// TODO cache the list
				var appsToRebuild = [];

				builder.apps.toArray().forEach(function(app) {
					if (app.requires.indexOf(modl.moduleName) !== -1) {
						appsToRebuild.push(app);
					}
				});

				return builder._.buildModulesOfList(appsToRebuild, done);
			}

			done(err);
		});
	}

	var livereload = require('gulp-livereload');
	livereload.options.silent = true;

	var buildQueue = [],
		isBuilding = false;

	function addToQueue(moduleObj) {
		buildQueue.push(moduleObj);
		Util.log.info('» Build of', colors.cyan(moduleObj.moduleName), 'queued');
		checkQueue();
	}

	function checkQueue() {
		if (isBuilding || !buildQueue.length) return;

		var nextBuild = buildQueue.shift();
		isBuilding = true;
		processChanges(nextBuild, function(err) {
			isBuilding = false;
			if (err) {
				return afterBuild(err);
			}

			if (!buildQueue.length) {
				return afterBuild();
			}

			checkQueue();
		});
	}

	function afterBuild(err) {
		if (err) {
			Util.log.info(colors.red(logSymbols.error + ' Build failed!'));
			Util.log.derror(err);
			watcherInstance.emit('error', err);
		} else {
			Util.log.info(colors.green('Build completed.'));
			livereload.changed();
			watcherInstance.emit('change');
		}
	}

	function watch() {
		var allModules = builder.apps.toArray().concat(builder.libs.toArray()),
			lastChanged;

		allModules.forEach(function(modl) {
			var watchers = getModuleWatchers(modl);

			if (!watchers.length) return;

			var watcher = gulp.watch(watchers);
			watcher.on('error', function(err) {
				watcherInstance.emit('error', err);
			});

			watcher.on('change', function(whatChanged) {
				var changedPath = whatChanged.path.replace(modl.modulePath, '');

				Util.log.info(colors.magenta(changedPath), 'in', colors.cyan(modl.moduleName), 'was', colors.green(whatChanged.type));

				if (lastChanged === modl.moduleName) return;
				lastChanged = modl.moduleName;

				addToQueue(modl);
			});
		});

		livereload.listen();
	}

	var watcherInstance = new EE();

	// Starts watching the project
	watcherInstance.watch = watch;

	// Notifies liveReload
	watcherInstance.reload = function reload() {
		livereload.changed();
	};

	return watcherInstance;
};