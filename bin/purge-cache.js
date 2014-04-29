#!/usr/bin/env node

var paths          = require('../conf/paths');
var storage        = require(paths.libdir + '/storage');


if (process.argv[2]) {
	deleteKeys(null, [process.argv[2]]);
} else {
	storage.hkeys('cache', deleteKeys);
}

function deleteKeys (err, keys) {

	if (err) {
		process.exit(1);
		return;
	}

	if (!keys || keys.length < 1) {
		process.exit(0);
		return;
	}

	keys.forEach(deleteSingleKey);

	process.exit(0);
	return;
}

function deleteSingleKey (key) {
	storage.hdel('cache', [key], function (err, result) {
		if (err) {
			process.exit(1);
			return;
		}
	});
}