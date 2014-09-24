var finalhandler = require('finalhandler');
var http = require('http');
var serveStatic = require('serve-static');
var logger = require('./util/log');
var colors = require('chalk');

function StaticServer(path) {
	this.path = path;

	var serve = serveStatic(path, {
		'index': ['index.html']
	});

	this.server = http.createServer(function(req, res) {
		var done = finalhandler(req, res);
		serve(req, res, done);
	});
}

StaticServer.prototype.listen = function(port) {
	logger.info('Serving ' + colors.magenta(this.path) + ' on port ' + colors.green(port));
	this.server.listen(port);
};

module.exports = StaticServer;