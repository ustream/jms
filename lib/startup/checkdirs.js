
var fs    = require('fs'),
	paths = require('../../conf/paths');

var checkdirs = function (next) {

		if (!fs.existsSync(paths.piddir)) {
			fs.mkdirSync(paths.piddir)
		}

		if (!fs.existsSync(paths.logdir)) {
			fs.mkdirSync(paths.logdir)
		}

		if (!fs.existsSync(paths.datadir)) {
			fs.mkdirSync(paths.datadir)
		}

		next(null);
	};

module.exports = checkdirs;
