module.exports = function(queue, callback) {
	if (!queue.length) {
		return callback();
	}

	var index = 0,
		current;

	function next(stepError) {
		if (stepError) {
			return callback(stepError);
		}

		current = queue[index++];

		if (!current) {
			return callback();
		}

		try {
			current(next);
		} catch (e) {
			callback(e);
		}
	}

	next();
}