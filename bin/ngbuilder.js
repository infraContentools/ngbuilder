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
	var builder = require('../lib/Builder');

	if (!env.configPath) {
		builder.log.error('No builder config found');
		process.exit(1);
	}

	builder.setEnv({
		root: process.cwd()
	});

	builder.loadConfigsFromPath(env.configBase);

	if (process.cwd() !== env.cwd) {
		process.chdir(env.cwd);
		builder.log.info('Working directory changed to', colors.magenta(env.cwd));
	}

	var cmd = args._[0],
		debug = 'v' in args;

	if (debug) {
		process.env.DEBUG = true;
	} else if ('q' in args) {
		process.env.QUIET = true;
	}

	function done(err) {
		if (err) {
			if (debug) builder.log.error(err);

			builder.log.info(colors.red('!!! build failed !!!'));
		} else {
			builder.log.info(colors.green('### done ###'));
		}

		process.exit(err ? 1 : 0);
	}

	switch (cmd) {
		case 'build':
			builder.log.info(colors.green('>>> Building the entire app! Bear with me...'));
			builder.buildAll(done);
			break;

		case 'build-module':
			console.log(args);
			builder.buildModule(args.m || args._[1], done);
			break;

		case 'watch':
			builder.log.info('Watching for changes...');
			builder.watch(done);
			break;

		case 'build-libs':
			builder.log.info(colors.green('Building libs...'));
			builder.buildLibs(done);
			break;

		case 'build-apps':
			builder.log.info(colors.green('Building apps...'));
			builder.buildApps(done);
			break;

		case 'serve':
			builder.serveFiles({
				port: args.p,
				path: args.d
			});
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
		' build				Build the entire app for production',

		' watch				Waits for file changes on source files and rebuild modules on demand',

		' serve [-p PORT]		Serve the public folder using a built-in Node.JS server',
		''
	].join('\n\t'));
}