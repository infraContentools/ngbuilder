var colors = require('chalk'),
	date = require('dateformat'),
	inspect = require('util').inspect;

function logError(error) {
	if (error.plugin === 'gulp-traceur') {
		return logTraceurError(error);
	}

	if (error.plugin === 'gulp-ng-annotate') {
		return logAnnotateError(error);
	}

	if (error.plugin === 'gulp-jshint') {
		return logJshintError(error);
	}

	if (error.plugin === 'gulp-browserify') {
		return logBrowserifyError(error);
	}

	log(colors.red('# Error\n'), error.message || error);
}

function log() {
	var time = timestamp();
	var args = Array.prototype.slice.call(arguments);
	args.unshift(time);
	console.log.apply(console, args);
}

function logTraceurError(error) {
	var msg = [
		colors.red('Traceur Error:'),
		colors.white(error.message),
		error.filename ? colors.green(error.filename) : ''
	].join('\n');

	log(msg);
}

function logAnnotateError(error) {
	var msg = [
		colors.red('Ng-Annotate Error:'),
		colors.white(error.message)
	].join('\n');

	log(msg);
}

function logJshintError(error) {
	var filename = error.message.replace('JSHint failed for: ', '');

	var msg = [
		colors.red('JSLint error:'),
		colors.green(filename.split(', ').join('\n'))
	].join('\n');

	log(msg);
}

function logBrowserifyError(error) {
	log(colors.red('Browserify failed!\n') + colors.white('\nError: ') +
		colors.red(error.message) + colors.white('\nStack: ') + colors.green(error.stack));
}


function timestamp() {
	return '[' + colors.grey(date(new Date(), 'HH:MM:ss')) + ']';
}

module.exports = {
	info: log,
	error: logError,
	timestamp: timestamp
};