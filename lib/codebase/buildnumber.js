var fs             = require('fs');
var paths          = require('../../conf/paths');
var storage        = require(paths.libdir + '/storage');

module.exports = {

	building: function (number) {
		//log('setting build flag ' + number);
		storage.set('buildRunning', number);
	},

	running: function (next) {
		storage.get('buildRunning', next);
	},

	current: function (next) {
		storage.get('buildNumber', next);
	},

	buildDate: function (next) {
		storage.get('buildDate', next);
	},

	increment: function (date, next) {

		//log('build number increment');

		storage.get('buildNumber', function (err, number) {


			if (err) {
				return next (err);
			}

			number = +number;

			number += 1;

			storage.set('buildNumber', number);
			storage.set('buildDate', +date);

			next(null, number);

		});
	}

}
