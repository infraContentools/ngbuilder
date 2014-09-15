'use strict';

var assert = require('assert');
var util = require('util');
var ModuleBuilder = require('./ModuleBuilder');

var browserifyTask = require('./task/browserify');
var concatTask = require('./task/concat');
var viewsTask = require('./task/views');

function AppModuleBuilder(moduleName, modulePath, sourcePaths) {
	assert.ok(moduleName, 'Missing module name');
	assert.ok(modulePath, 'Missing module path');
	assert.ok(sourcePaths, 'Missing global source paths');

	ModuleBuilder.apply(this, arguments);

	this.context = {
		moduleName: moduleName,
		modulePath: modulePath,
		publicPath: sourcePaths.public,
		includePaths: sourcePaths.libraries
	};

	this.buildSteps = [{
		path: '/views/**/*.html',
		task: viewsTask
	}, {
		path: '/src/**/*.js',
		task: concatTask
	}, {
		path: 'index.js',
		task: browserifyTask
	}];
}

util.inherits(AppModuleBuilder, ModuleBuilder);

module.exports = AppModuleBuilder;