'use strict';

module.exports = (function() {
	var _initialized, karma;

	function init() {
		if (_initialized) return;

		karma = require('karma').server;
		copy = require('../utils/copy');

		_initialized = true;
	}

	function run(context, options, next) {
		var karmaConfig = {
			configFile: __dirname + '/karma.conf.js',
			singleRun: true
		};

		copy(karmaConfig, options);

		karma.start(karmaConfig, function(exitCode) {
			if (exitCode > 0) {
				return next(new Error('Unit testing failed'));
			}

			next();
		});
	}

	return {
		name: 'karma',
		run: run,
		watcher: ['src/**/*.js', 'views/**/*.js']
	}
})();