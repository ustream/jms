

var paths   = require('../../conf/paths');
var datadir = require(paths.libdir + '/codebase/datadir');
var builder = require(paths.libdir + '/codebase/builder');
var log     = require(paths.libdir + '/debug/log');

var build = function (next) {

	var data = builder(function (err, data) {

		var build = require('./lib/buildnumber').current;

		if (!data) {
			log('loading build: ' + build)
			next();
		} else {
			datadir.save(data, function (err) {
				if (!err) {
					log('new build saved: ' + build);
					next();
				} else {
					log('ERROR ' + JSON.stringify(err));
				}
			});
		}
	});
}

module.exports = build;