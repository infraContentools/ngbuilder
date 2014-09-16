'use strict';

var copy = require('./utils/copy');

function Context(data) {
	copy(this, data);
}

module.exports = Context;