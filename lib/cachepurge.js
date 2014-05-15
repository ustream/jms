

var paths          = require('../lib/paths');
var storage        = require(paths.libdir + '/storage');
var config         = require(paths.libdir + '/getconfig');
var codebaseConf   = config.codebase;

function deleteKeys (err, source, keys, next) {

	if (err) {
		next(err);
		return;
	}

	if (!keys || keys.length < 1) {
		next(null);
		return;
	}

	try {
		keys.forEach(deleteSingleKey.bind(null, source));
	} catch (e) {
		return next(e);
	}

	return next(null);

}

function deleteSingleKey (source, key) {
	storage.hdel('cache:' + source, [key], function (err, result) {
		if (err) {
			throw err;
			return;
		}
	});
}

function deleteAll (next) {
	var keys = Object.keys(codebaseConf.sources);
	var done = function (err) {
		if (!keys || err) {
			keys = false;
			return next(err);
		}

		keys.pop();

		if (keys.length == 0) {
			next();
		}
	}

	for(var source in codebaseConf.sources) {
		deleteSource(source, done);
	}
}

function deleteSource (source, next) {
	storage.hkeys('cache:' + source, function (err, keys) {
		deleteKeys(err, source, keys, next);
	});
}

module.exports = {
	deleteSource: deleteSource,
	deleteKeys: deleteKeys,
	deleteAll: deleteAll
}