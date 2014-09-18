function Registry() {
	this.$list = {};
}

Registry.prototype = {
	register: function(name, fn) {
		this.$list[name] = fn;
	},

	get: function(name) {
		return this.$list[name];
	},

	has: function(name) {
		return name in this.$list;
	},

	each: function(iterator) {
		var list = this.$list;
		Object.keys(list).forEach(function(key) {
			iterator(list[key], key, list);
		});
	},

	toArray: function() {
		var list = [];

		this.each(function(item) {
			list.push(item);
		});

		return list;
	}
};

module.exports = Registry;