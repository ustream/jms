

var paths          = require('../conf/paths');
var storage        = require(paths.libdir + '/storage');


function deleteKeys (err, keys, next) {

	if (err) {
		next(err);
		return;
	}

	if (!keys || keys.length < 1) {
		next(null);
		return;
	}

	try {
		keys.forEach(deleteSingleKey);
	} catch (e) {
		return next(e);
	}

	return next(null);

}

function deleteSingleKey (key) {
	storage.hdel('cache', [key], function (err, result) {
		if (err) {
			throw err;
			return;
		}
	});
}

function deleteAll (next) {
	storage.hkeys('cache', function (err, keys) {
		deleteKeys(err, keys, next);
	});
}

module.exports = {
	deleteKeys: deleteKeys,
	deleteAll: deleteAll
}