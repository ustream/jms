
var paths    = require('../../conf/paths');
var buildnumber = require(paths.libdir + '/codebase/buildnumber');
var process_events = require(paths.libdir + '/process-events');

var log = function (msg) {
	process_events.send(process_events.LOG, msg, 'worker');
}



var app = {

	start: function (next) {


		buildnumber.current(function (number) {

			console.log(number );

			log('using current build: ' + number)
			next.call(this, app)

		});


	},
	stop: function (next) {
		next.call(this)
	},
	restart: function (next) {
		next.call(this)
	},

	log: function () {}
}
module.exports = app;