module.exports = function copy(dest, src) {
	Object.keys(src).forEach(function(key) {
		dest[key] = src[key];
	});

	return dest;
};