// TODO bind specific readable/writable streams' events
module.exports = function bindStreamEvents(stream, done) {
	function bind(done) {
		stream.on('error', done);
		stream.on('close', done);
		stream.on('finish', done);
		stream.on('end', done);
	}

	if (done) {
		return bind(done);
	}

	// lazy bind
	return bind;
};