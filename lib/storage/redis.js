var async          = require('async');
var redis          = require('redis');

var paths          = require('../../conf/paths');
var storageconfig  = require(paths.confdir + '/storage');
var log            = require(paths.libdir + '/debug/log');

log.info('redis', 'setting up');

var client = redis.createClient(
				storageconfig.redis.port,
				storageconfig.redis.host,
				{
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

function clearKeys (pattern, done) {
	client.keys(pattern, function (err, result) {
		if (err) {
			return done(err);
		}

		if (result == null || result.length == 0) {
			done(null);
		}

		var keysLength = result.length;

		result.forEach(function (key, i) {
			client.del(key, function (err) {
				if (err) {
					return done(err);
				}
				if (i == keysLength-1) {
					done(null);
				}
			});
		});
	});
}

module.exports = {

	get: function (key, next) {
		log.verbose('redis', 'get key ' + key);
		client.get(key, next);
	},

	hset: function (hash, key, value) {
		log.verbose('redis', 'set hash ' + hash + ' key' + key);
		client.hset(hash, key, value);
	},

	hmset: function (hash, data, next) {
		log.verbose('redis', 'set hash ' + hash + ' data' + data);
		client.hmset(hash, data, next);
	},

	hmget: function (hash, keys, next) {
		log.verbose('redis', 'hmget hash ' + hash + ' keys ' + keys.join(','));
		client.hmget(hash, keys, next);
	},

	set: function (key, value) {
		log.verbose('redis', 'set key ' + key);
		client.set(key, value);
	},

	exists: function (key, next) {
		log.verbose('redis', 'exists ' + key);
		client.exists(key, next);
	},

	purgeBuild: function (buildNumber, done) {

		log.info('redis', 'purge build ' + buildNumber);

		async.waterfall([
			clearKeys.bind(null, buildNumber + ':*'),
			clearKeys.bind(null, '/js/' + buildNumber + '/*')
		], function (err, result) {
			if (err) {
				return done(err);
			}
			return done(null);
		});

	}

};