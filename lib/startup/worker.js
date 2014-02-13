#!/usr/bin/env node

var cluster = require('cluster');
var paths   = require('../../conf/paths');

// load in the application class
var application    = require(paths.libdir + "/server/init");
var process_events = require(paths.libdir + '/process-events');

var log = function (msg) {
	process_events.send(process_events.LOG, msg, 'worker');
}




// start the server!
var startServer = function(next) {

	if (cluster.isWorker) {
		process_events.starting();
	}

	application.start(function(api_from_callback){

		api = api_from_callback;

		log("Boot Sucessful @ worker #" + process.pid);

		if (typeof next == "function") {
			if (cluster.isWorker) {
				process_events.started();
			}
			next(api);
		}
	});
}




// handle signals from master if running in cluster
if (cluster.isWorker) {
	process.on('message', function(message) {

		var e = process_events.parse(message);

		var msg = e.event;

		if(msg == "start"){
			process_events.starting();

			startServer(function() {
				process_events.started();
			});
		}

		if(msg == "stop"){
			process_events.stopping();

			application.stop(function(){
				api = null;
				process_events.stopped();
				process.exit();
			});
		}

		if(msg == "restart"){
			process_events.restarting();

			application.restart(function(success, api_from_callback) {
				api = api_from_callback;
				process_events.restarted();

			});
		}
	});
}

// start the server!
startServer(function(api){
	log("Successfully Booted!", ["green", "bold"]);
});