
var redis          = require("redis");

var paths          = require('../../conf/paths');
var storageconfig  = require(paths.confdir + '/storage');
var log            = require(paths.libdir + '/debug/log');

log.info('redis', 'setting up');

var client = redis.createClient(
	storageconfig.redis.port,
	storageconfig.redis.host, {
		parser: 'javascript'
	});

client.on('error', function (err) {
	log.info('redis', 'error');
	throw err;
});

client.on('ready', function () {
	log.info('redis', 'ready');
});

client.on('connect', function () {
	log.info('redis', 'connect')
});

module.exports = {

	get: function (key, next) {
		log.verbose('redis', 'get key ' + key);
		client.get(key, next);
	},

	set: function (key, value) {
		log.verbose('redis', 'set key ' + key);
		client.set(key, value);
	}

};