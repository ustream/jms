var async            = require('async');
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

function clearKeys (pattern, done) {
	client.keys(pattern, function (err, result) {
		var keysLength = result.length;
		result.forEach(function (key, i) {
			client.del(key, function (err) {
				if (err) {
					done(err);
					return;
				}
				if (i === keysLength-1) {
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
				done(err);
				return;
			}

			done(null);
		});

	}

};