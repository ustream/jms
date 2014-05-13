var paths       = require('../../conf/paths');
var storage     = require(paths.libdir + '/storage');
var log         = require(paths.libdir + '/debug/log');

function onHget (sourceId, originalName, hashedName, err, result) {

	if (err) {
		return;
	}

	var list;

	if (result.indexOf(null) < 0) {
		var list = JSON.parse(result[0])
		if (list.indexOf(hashedName) < 0) {
			list.push(hashedName);
		} else {
			return;
		}
	} else {
		list = [hashedName]
	}

	storage.hset('versions:' + sourceId, originalName, JSON.stringify(list));
}

function add (sourceId, originalName, hashedName) {
	log.verbose('versions', 'add');
	storage.hmget('versions:' + sourceId, [originalName], onHget.bind(null, sourceId, originalName, hashedName));
}

module.exports = {
	add: add
}