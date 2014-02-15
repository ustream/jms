
var paths          = require('../conf/paths');
var storageconfig  = require(paths.confdir + '/storage');
var log            = require(paths.libdir + '/debug/log');

var storage = null;

if ('redis' in storageconfig) {
	log.info('storage', 'setting up redis')

	storage = require(paths.libdir + '/storage/redis');
}

module.exports = {
	get: function (key, next) {
		storage.get(key, next);
	},
	set: function (key, value) {
		storage.set(key, value)
	}
}