var finalhandler = require('finalhandler');
var http = require('http');
var serveStatic = require('serve-static');
var logger = require('./util/log');
var colors = require('chalk');

function StaticServer(path) {
	var serve = serveStatic(path, {
		'index': ['index.html']
	});

	this.server = http.createServer(function(req, res) {
		var done = finalhandler(req, res);
		serve(req, res, done);
	});
}

StaticServer.prototype.listen = function(port) {
	logger.info(colors.green('Serving files on port ', port));
	this.server.listen(port);
};

module.exports = StaticServer;