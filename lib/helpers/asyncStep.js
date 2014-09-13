module.exports = function asyncStep(stream) {
	return function(done) {
		stream.on('end', done);
		stream.on('finish', done);
		stream.on('error', done);
	};
};