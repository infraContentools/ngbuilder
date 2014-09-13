#!/usr/bin/env node

'use strict';

var Liftoff = require('liftoff');
var chalk = require('chalk');
//var Builder = require('../Builder');

var cli = new Liftoff({
	name: 'Builder',
	moduleName: 'builder',
	configName: 'package'
});

cli.launch(handleArguments);

function handleArguments(env) {
	var argv = env.argv,
		taskInfo = argv._,
		verbose = 'V' in argv,
		versionFlag = ('v' in argv || 'version' in argv);

	if (versionFlag) {
		var cliPackage = require('../package');
		console.log(cliPackage.version);
		process.exit(0);
	}

	if (!env.configPath) {
		Builder.error('No builder config found');
		process.exit(1);
	}

	var modulePackage = require(env.configPath),
		builderInstance = Builder.create(modulePackage);

	builderInstance.verbose = verbose;
	builderInstance.env = env;

	if (process.cwd() !== env.cwd) {
		process.chdir(env.cwd);
		Builder.info('Working directory changed to', chalk.magenta(env.cwd)); //tildify(
	}

	builderInstance.run();
	// console.log(modulePackage);
	// console.log(env);

}