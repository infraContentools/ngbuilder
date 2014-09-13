var colors = require('chalk'),
	inquirer = require('inquirer'),
	join = Array.prototype.join,
	EventEmitter = require('events').EventEmitter;

function Builder(modulePackage) {
	this.pkg = modulePackage;
	this.plugins = {};
}

function getName(builder) {
	return (builder.pkg || {}).name || 'Builder';
}

var proto = Builder.prototype = new EventEmitter();
proto.constructor = Builder;

Builder.error = proto.error = function(err) {
	console.log(colors.red('[ ' + getName(this) + ' ] ') + (err && err.message ? err.message : join.call(arguments, ' ')) + '\n');
};

Builder.info = proto.info = function() {
	if (this.verbose) {
		console.log(colors.cyan(': ' + getName(this) + ' : ') + join.call(arguments, ' '));
	}
}

Builder.ok = proto.ok = function(message) {
	console.log(colors.green(' [ ' + getName(this) + ' ] ') + join.call(arguments, ' '));
};

Builder.ask = proto.ask = function(questions, callback) {
	try {
		inquirer.prompt(questions, callback);
	} catch (e) {
		Builder.error(e);
	}
};

Builder.Task = require('./lib/Task');
Builder.Error = require('./lib/Error');

proto.run = function() {
	var matcher = RegExp('^ngbuilder\-(.+)$'),
		instance = this,
		pkg = this.pkg;

	Object.keys(pkg.devDependencies || {}).forEach(function(name) {
		if (!matcher.test(name)) return;

		instance.info('Loading plugin ' + name);

		try {
			var plugin = require(name);
			plugin(instance);
		} catch (e) {
			instance.error(e);
		}
	});
};

proto.listenToBuilder = function(builder) {
	if (builder instanceof Builder === false) return;

	// TODO
}

Builder.create = function(pkg) {
	if (typeof pkg === 'string') {
		pkg = require('pkg');
	}

	return new Builder(pkg);
};

module.exports = Builder;