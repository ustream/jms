
var fs             = require('fs');
var paths          = require('../../conf/paths');

var process_events = require(paths.libdir + '/process-events');
var storage        = require(paths.libdir + '/storage');

var log = function (msg) {
	process_events.send(process_events.LOG, msg, 'buildnumber');
}

module.exports = {

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

		log.info('buildnumber', 'build number increment');

		storage.get('buildNumber', function (err, number) {

			number += 1;

			storage.set('buildNumber', number);
			storage.set('buildDate', +date);

			next(number);

		});
	}

}
