var paths        = require('../../conf/paths');
var codebaseConf = require(paths.confdir + '/codebase');
var storage      = require(paths.libdir + '/storage');
var log          = require(paths.libdir + '/debug/log');

/**
 *
 * @param sourceId
 * @param originalName
 * @param hashedName
 * @param err
 * @param result
 */
function onHget (sourceId, originalName, hashedName, err, result) {

	if (err) {
		return;
	}

	var list;

	if (result.indexOf(null) < 0) {
		var list = JSON.parse(result[0]);

		if (list.indexOf(hashedName) < 0) {
			list.push(hashedName);
		} else {
			return;
		}
	} else {
		list = [hashedName];
	}

	storage.hset('versions:' + sourceId, originalName, JSON.stringify(list));
}

/**
 *
 * @param sourceId
 * @param originalName
 * @param hashedName
 */
function add (sourceId, originalName, hashedName) {
	log.verbose('versions', 'add');
	storage.hmget('versions:' + sourceId, [originalName], onHget.bind(null, sourceId, originalName, hashedName));
}

/**
 *
 * @param sourceId
 * @param list
 * @param done
 */
function purgeSource (sourceId, list, updatedList, done) {
	var keys = [];

	Object.keys(list).forEach(function (m) {
		keys = keys.concat(list[m]);
	});

	var l = keys.length;

	keys.forEach(function (key) {
		storage.hdel('source:' + sourceId, [key], function () {
			l--;
			if (l < 1) {
				updateVersions(sourceId, updatedList, done);
			}
		});
	})


}

/**
 *
 * @param sourceId
 * @param list
 * @param done
 */
function updateVersions (sourceId, list, done) {
	storage.hmset('versions:' + sourceId, list, done);
}

/**
 *
 * @param sourceId
 * @param next
 */
function purge (sourceId, next) {

	var versions = codebaseConf.sources[sourceId].versions;

	storage.hgetall('versions:' + sourceId, function (err, result) {
		if (err) {
			return next(err);
		}

		var purgeList = {};
		var updatedList = {};

		Object.keys(result).filter(function (module) {
			return JSON.parse(result[module]).length > versions;
		}).forEach(function (module) {
			var m = JSON.parse(result[module]);
			purgeList[module] = m.slice(0, m.length-versions);
			updatedList[module]= JSON.stringify(m.slice(versions * -1));
		});

		if (Object.keys(purgeList) < 1) {
			return next();
		}

		log.verbose('versions', 'purge ' + JSON.stringify(purgeList));

		purgeSource(sourceId, purgeList, updatedList, next);
	});
}

module.exports = {
	add: add,
	purge: purge
}