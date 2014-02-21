
var paths    = require('../../conf/paths');
var buildnumber = require(paths.libdir + '/codebase/buildnumber');
var process_events = require(paths.libdir + '/process-events');

var ModuleServer = require(paths.libdir + '/server/moduleserver');

var server = null;


function startServer (next) {

	server = new ModuleServer(next);

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