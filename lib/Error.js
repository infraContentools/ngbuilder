module.exports = function BuilderError(message) {
	var error = new Error();
	error.message = message || '';
	return error;
};