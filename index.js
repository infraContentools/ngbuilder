module.exports = require('./lib/Builder');

/**
 * In the package.json:
 *
 *  "paths": {
 *    "public": "/public",
 *    "apps": "/source/app/modules/",
 *    "libraries": "/source/app/core/"
 *  }
 */

/**
 * ** Build steps:
 *
 * - list all folders inside sourcePath and load modules:
 * - each (module):
 *		- load module.json
 *		- create module context object
 *		- queue the module
 * - run async
 */