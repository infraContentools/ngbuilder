'use strict';

var assert = require('assert');
var util = require('util');
var ModuleBuilder = require('./ModuleBuilder');

var concatTask = require('./task/concat');
var viewsTask = require('./task/views');

function CoreModuleBuilder(moduleName, modulePath) {
	assert.ok(moduleName, 'Missing module name');
	assert.ok(modulePath, 'Missing module path');

	ModuleBuilder.apply(this, arguments);

	this.context = {
		moduleName: moduleName,
		modulePath: modulePath
	};

	this.buildSteps = [{
		path: '/views/**/*.html',
		task: viewsTask
	}, {
		path: '/src/**/*.js',
		task: concatTask
	}];
}

util.inherits(CoreModuleBuilder, ModuleBuilder);

module.exports = CoreModuleBuilder;