
var paths    = require('../../conf/paths');
var buildnumber = require(paths.libdir + '/codebase/buildnumber');
var process_events = require(paths.libdir + '/process-events');

var ModuleServer = require(paths.libdir + '/server/moduleserver');

var server = null;

var log = function (msg) {
	process_events.send(process_events.LOG, msg, 'worker');
}




function startServer (next) {


	buildnumber.current(function (err, number) {

		log('using current build: ' + number)


		server = new ModuleServer(next);

		//next.call(this, app);

	});

}

var app = {

	start: startServer,

	stop: function (next) {
		server.close(next)
	},
	restart: function (next) {
		server.close(next)
	},

	log: log
}
module.exports = app;