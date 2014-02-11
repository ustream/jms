
var fs    = require('fs'),
	paths = require('../../conf/paths'),
	async = require('async');

var checkDir = function (dir) {
	return function (cb) {
		fs.exists(dir, function (exists) {
			if (!exists) {
				fs.mkdir(dir, cb);
			} else {
				cb();
			}
		});
	};
}

var checkdirs = function (next) {
	async.parallel([
		checkDir(paths.piddir),
		checkDir(paths.logdir),
		checkDir(paths.datadir)
	],
	function (err, results) {
		next(err);
	});
};

module.exports = checkdirs;
