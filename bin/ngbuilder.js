#!/usr/bin/env node

'use strict';

var Liftoff = require('liftoff');
var chalk = require('chalk');
var Builder = require('../Builder');

var cli = new Liftoff({
	name: 'Builder',
	moduleName: 'builder',
	configName: 'package'
});

cli.on('require', function(name) {
	console.log('Requiring external module', chalk.magenta(name));
});

cli.on('requireFail', function(name) {
	console.log(chalk.red('Failed to load external module'), chalk.magenta(name));
});

cli.launch(handleArguments);

function handleArguments(env) {
	var argv = env.argv,
		taskInfo = argv._,
		verbose = 'V' in argv,
		versionFlag = ('v' in argv || 'version' in argv);

	if (versionFlag) {
		var cliPackage = require('../package');
		Builder.log(cliPackage.version);
		process.exit(0);
	}

	if (!env.configPath) {
		Builder.error('No builder config found');
		process.exit(1);
	}

	var modulePackage = require(env.configPath);

	console.log(modulePackage);
	console.log(env);
}