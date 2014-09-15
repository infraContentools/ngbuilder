#!/usr/bin/env node

'use strict';

var args = require('minimist')(process.argv.slice(2));
var colors = require('chalk');

if (args._.length === 0) {
	showUsage();
	process.exit(0);
}

var Liftoff = require('liftoff');

var cli = new Liftoff({
	name: 'ngbuilder',
	moduleName: 'ngbuilder',
	configName: 'package'
});

cli.launch({}, handleArguments);

function handleArguments(env) {
	var builder = require('../index');

	if (!env.configPath) {
		builder.log.error('No builder config found');
		process.exit(1);
	}

	builder.loadConfigsFromManifest(env.configBase);

	if (process.cwd() !== env.cwd) {
		process.chdir(env.cwd);
		builder.log.info('Working directory changed to', colors.magenta(env.cwd));
	}

	var cmd = args._[0];

	if ('d' in args) {
		process.env.DEBUG = true;
	}

	switch (cmd) {
		case 'build':
			builder.log.info('Building the entire app! Bear with me...');
			builder.buildLibs();
			builder.buildApps();
			break;

		case 'watch':
			builder.log.info('Watching for changes...');
			builder.watchLibs();
			builder.watchApps();
			break;

		case 'build-libs':
			builder.log.info('Building libs...');
			builder.buildLibs();
			break;

		case 'build-apps':
			builder.log.info('Building apps...');
			builder.buildApps();
			break;

		case 'watch-libs':
			builder.log.info('Watching for changes...');
			builder.watchLibs();
			break;

		case 'watch-apps':
			builder.log.info('Watching for changes...');
			builder.watchApps();
			break;

		case 'serve':
			builder.serveFiles(args.p || 8000);
			break;

		default:
			showUsage();
	}
}

function showUsage() {
	console.log([
		'\n  Usage:\n\n  ' + colors.green('ngbuilder ') + colors.bold('command [args...]\n\n  ') + colors.bold('Available commands:'),
		'',
		' build-apps			Build the top-level applications',
		' build-libs			Build the app libraries',
		' watch-apps 			Watch for changes and auto-rebuild apps',
		' watch-libs 			Watch for changes and auto-rebuild libs',
		' build				Build the entire app for production',
		' watch				Waits for file changes on source files and rebuild modules on demand',
		' serve [-p PORT]		Serve the public folder using a built-in Node.JS server',
		''
	].join('\n\t'));
}