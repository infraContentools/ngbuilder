var colors = require('chalk');
var inquirer = require('inquirer');

var Builder = function(plugins) {
	var name, config;

	builder.rootPath = '';

	for (name in plugins) {
		config = plugins[name];
		Builder.plugins[name] && Builder.plugins[name](config);
	}
};

Builder.error = function(err) {
	console.log(colors.red(' [ ! ] ') + (err.message || err) + '\n');
};

Builder.ok = function(message) {
	console.log(colors.green(' [ OK ] ') + message);
};

Builder.ask = function(questions, callback) {
	try {
		inquirer.prompt(questions, callback);
	} catch (e) {
		Builder.error(e);
	}
};

Builder.Task = require('./lib/Task');
Builder.Error = require('./lib/Error');

Builder.plugins = function(pkg) {
	var matcher = '^angular-builder-(.+)$/';

	Object.keys(pkg.devDependencies || {}).forEach(function(name) {
		if (!matcher.test(name)) return;

		var plugin = require(name);
		plugin(Builder);
	});
};

module.exports = Builder;