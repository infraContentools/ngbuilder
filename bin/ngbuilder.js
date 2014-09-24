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
		builder.setEnv({
			debug: true
		});
	} else if ('q' in args) {
		process.env.QUIET = true;
		builder.setEnv({
			quiet: true
		});
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
				path: args.d || args._[1]
			});
			break;

		default:
			showUsage();
	}
}

function showUsage() {
	var columnSize = 40,
		sp = Array(columnSize).join(' ');

	var commands = {
		'-v': 'Be verbose (debug)',
		'-q': 'Supress logs (quiet)',
		'': '',
		'build-apps': 'Build the top-level applications',
		'build-libs': 'Build the app libraries',
		'build-module [-m] <moduleName>': 'Build the specified module. -m is optional',
		'build': 'Build the entire app for production',

		'watch': 'Waits for file changes on source files and rebuild modules on demand',

		'serve': 'With no arguments - reads the public path from package.json ("serverRoot" or "public" options)',
		'serve path/to/files': '',
		'serve -p 8000 -d public/path': 'Serve the public folder using a built-in Node.JS server (default port: 8000)'
	};

	console.log('\nusage:  ' + colors.bold('ngbuilder command [args...] [-v]\n\n  ') + colors.green('Available commands and options:'));
	Object.keys(commands).forEach(function(cmd) {
		console.log('  ' + colors.bold(cmd) + sp.substr(0, columnSize - cmd.length) + colors.white(commands[cmd]));
	});
}