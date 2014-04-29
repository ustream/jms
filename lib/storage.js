
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
	},
	hset: function (hash, key, value) {
		storage.hset(hash, key, value)
	},
	hmset: function (hash, data, next) {
		storage.hmset(hash, data, next)
	},
	hmget: function (hash, keys, next) {
		storage.hmget(hash, keys, next)
	},
	exists: function (key, next) {
		storage.exists(key, next);
	},

	close: function () {},

	purgeBuild: function (buildNumber, next) {
		// todo - refactor
		next(null);
		//storage.purgeBuild(buildNumber, next)
	}
}