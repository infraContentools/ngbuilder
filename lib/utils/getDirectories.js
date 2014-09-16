var fs = require('graceful-fs'),
	path = require('path');

module.exports = function getDirectories(dir, callback) {
	fs.readdir(dir, function(err, files) {
		if (err) {
			return callback(err);
		}

		files = files.map(function(file) {
			return path.join(dir, file);
		});

		files = files.filter(function(file) {
			return fs.statSync(file).isDirectory();
		});

		callback(null, files);
	});
};