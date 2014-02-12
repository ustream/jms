
var fs             = require('fs');
var paths          = require('../../conf/paths');
var exporter       = require(paths.libdir + '/codebase/exporter');
var process_events = require(paths.libdir + '/process-events');

var log = function (msg) {
	process_events.send(process_events.LOG, msg, 'buildnumber');
}

module.exports = {

	get current () {
		return exporter.content.buildNumber;
	},

	get currentDate () {
		return exporter.content.buildDate;
	},

	increment: function (date) {

		log('build number increment')

		var c = exporter.content;

		c.buildNumber = c.buildNumber + 1;
		c.buildDate = +date;

		exporter.content = c;

		return c;
	}

}
