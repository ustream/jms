

var datadir = require('./lib/datadir')
var builder = require('./lib/builder')
var log     = require('./lib/log');

var build = function (next) {

	var data = builder(function (err, data) {

		var build = require('./lib/buildnumber').current;

		if (!data) {
			log('loading build: ' + build)
			next();
		} else {
			datadir.save(data, function (err) {
				if (!err) {
					log('new build saved: ' + build)
					next();
				} else {
					log('ERROR ' + JSON.stringify(err));
				}
			});
		}
	});
}

module.exports = build;