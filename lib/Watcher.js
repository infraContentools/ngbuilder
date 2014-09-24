'use strict';

var Util = require('./util'),
	nodePath = require('path'),
	gulp = require('gulp'),
	colors = require('chalk'),
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
			if (!plugin.watcher) return;

			var watcher;

			if (typeof plugin.watcher === 'string') {
				watcher = [plugin.watcher];
			} else {
				watcher = plugin.watcher;
			}

			watchers.push.apply(watchers, watcher);
		});

		adjustModulePaths(moduleObj, watchers);

		return watchers;
	}

	function adjustModulePaths(modl, paths) {
		paths.forEach(function(path, index) {
			paths[index] = nodePath.join(modl.modulePath, path);
		});
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

	function watch(done) {
		var buildStarted = false,
			allModules = builder.apps.toArray().concat(builder.libs.toArray()),
			livereload = require('gulp-livereload');

		allModules.forEach(function(modl) {
			var watchers = getModuleWatchers(modl);

			if (!watchers.length) return;

			var watcher = gulp.watch(watchers);
			watcher.on('change', function(whatChanged) {
				var changedPath = whatChanged.path.replace(modl.modulePath, '');

				Util.log.info(colors.magenta(changedPath), 'in', colors.cyan(modl.moduleName), 'was', colors.green(whatChanged.type));

				if (buildStarted) return;
				buildStarted = +(new Date());

				processChanges(modl, afterBuild);
			});
		});

		function afterBuild(err) {
			if (err) {
				Util.log.info(colors.red(logSymbols.error + ' Build failed!'));
				Util.log.derror(err);
			} else {
				buildStarted = +(new Date()) - buildStarted;
				Util.log.info(logSymbols.success + ' Built in ' + buildStarted + 'ms');
				livereload.changed();
			}

			buildStarted = false;
		}

		livereload.listen();
		process.on('uncaughtException', done);
	}

	return {
		watch: watch
	};
};