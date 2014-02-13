var fs             = require('fs');
var cluster        = require('cluster');
var async          = require('async');

var paths          = require('../../conf/paths');

var log            = require(paths.libdir + '/debug/log');
var procConf       = require(paths.confdir + '/proc');
var paths          = require(paths.confdir + '/paths');
var process_events = require(paths.libdir + '/process-events');
var build          = require(paths.libdir + '/startup/build');




log.info('clusters', 'starting process ' + process.pid);



process.stdin.resume();
process.title = procConf.title;

var workerRestartArray = [];

// used to trask rolling restarts of workers
var workersExpected = 0;


log.verbose('clusters', procConf.title);

function createPid (next) {

// set pidFile
	if(paths.pidfile != null){
		if (!fs.existsSync(paths.pidfile)) {
			var fd = fs.openSync(paths.pidfile, 'w');
			fs.closeSync(fd);
		}
		fs.writeFileSync(paths.pidfile, process.pid.toString());
	}

	log.verbose('clusters', 'pidfile created ');

	next();
}


function setupEvents (next) {

	process.on('SIGINT',   onSIGINT);
	process.on('SIGTERM',  onSIGTERM);
	process.on('SIGUSR1',  onSIGUSR1);
	process.on('SIGUSR2',  onSIGUSR2);
	process.on('SIGHUP',   onSIGHUP);
	process.on('SIGWINCH', onSIGWINCH);
	process.on('SIGTTIN',  onSIGTTIN);
	process.on('SIGTTOU',  onSIGTTOU);
	process.on('exit',     onEXIT);

	log.verbose('clusters', 'process event handlers done');

	next();
}


/*
	event handlers
 */

function onSIGINT () {
	log.info('clusters', "Signal: SIGINT");
	workersExpected = 0;
	setupShutdown();
}

function onSIGTERM () {
	log.info('clusters', "Signal: SIGTERM");
	workersExpected = 0;
	setupShutdown();
}

function onSIGUSR1 () {
	log.info('clusters', "Signal: SIGUSR1");
	log.info('clusters', "retrieving stats");
//	process.stdout.write('stats?');
}

function onSIGUSR2 () {

//  kill -s SIGUSR2 PID

// DEPLOY
	log.info('clusters', "Signal: SIGUSR2");
	log.info('clusters', "swap out new workers one-by-one");

// keszitsunk uj build state-et
	build(function () {
		workerRestartArray = [];

		// lenyeg a lenyeg:
		// egy regi workert leallitani csak az uj started eseten lehet
		// mindig legyen ami kiszolgal

		for (var i in cluster.workers) {
			workerRestartArray.push(cluster.workers[i]);
		}

		log.info('clusters', workerRestartArray.length);

		if(workerRestartArray.length > 0){
			var worker = workerRestartArray.pop();
			process_events.stop(worker);
		}
	});
}

function onSIGHUP () {
	log.info('clusters', "Signal: SIGHUP");
	log.info('clusters', "reload all workers now");
	for (var i in cluster.workers) {
		var worker = cluster.workers[i];
		worker.send("restart");
	}
}

function onSIGWINCH () {
	log.info('clusters', "Signal: SIGWINCH");

	// terminal ablak ujrameterezes kuldi ezeket rendesen

	/*	log("stop all workers");
	 workersExpected = 0;
	 for (var i in cluster.workers){
	 var worker = cluster.workers[i];
	 worker.send("stop");
	 }
	 */
}

function onSIGTTIN () {
	log.info('clusters', "Signal: SIGTTIN");
	log.info('clusters', "add a worker");
	workersExpected++;
	startAWorker();
}

function onSIGTTOU () {
	log.info('clusters', "Signal: SIGTTOU");
	log.info('clusters', "remove a worker");
	workersExpected--;
	for (var i in cluster.workers){
		var worker = cluster.workers[i];
		worker.send("stop");
		break;
	}
}

function onEXIT (){
	workersExpected = 0;
	log.info('clusters', "Bye!")
}

/*
	worker functions
 */

var workerMessageHandler = function(worker, message) {

	var e = process_events.parse(message);

	if(worker.state == "none"){
		return;
	}

	if (e.LOG == e.event) {


		log.info('clusters', "[" + worker.process.pid + "] " + (e.label ? e.label.toUpperCase() : e.event.toUpperCase()) + " : " + e.data);
	}

	if (e.STARTED == e.event) {
		log.info('clusters', "[" + worker.process.pid + "] " + e.event.toUpperCase() );

		if(workerRestartArray.length > 0){
			var worker = workerRestartArray.pop();
			process_events.stop(worker);
		}

		// itt mehet a kilovendo workerek megolese
	}
}


var startAWorker = function(){

	// adja at a workernek az aktualis built state adatot

	var worker = cluster.fork();
	log.info('clusters', "starting worker #" + worker.id);

	worker.on('message', workerMessageHandler.bind(null, worker));
}


var setupShutdown = function(){
	log.warn('clusters', "Cluster manager quitting");
	log.info('clusters', "Stopping each worker...");

	for(var i in cluster.workers){
		process_events.stop(cluster.workers[i])
	}

	setTimeout(loopUntilNoWorkers, 1000);
}

var loopUntilNoWorkers = function(){
	if(cluster.workers.length > 0) {
		log.verbose('clusters', "there are still " + cluster.workers.length + " workers...");

		setTimeout(loopUntilNoWorkers, 1000);

	} else {
		log.verbose('clusters', "all workers gone");
		if(paths.pidfile != null){
			fs.unlinkSync(paths.pidfile);
		}

		process.exit();
	}
}

var reloadWorker = function(next){
	var count = 0;

	for (var i in cluster.workers){
		count++;
	}

	if(workersExpected > count){
		startAWorker();
	}

}


var start = function () {


	log.verbose('clusters', 'forking process');
/////////////
// Fork it //
/////////////

	cluster.setupMaster({
		exec : procConf.exec,
		args : process.argv.slice(2),
		silent : procConf.silent
	});

///////////////////
// Start workers //
///////////////////

	for (var i = 0; i < procConf.workers; i++) {
		workersExpected++;

		log.verbose('clusters', 'starting worker ' + i);

		startAWorker();
	}

////////////////////
// Cluster events //
////////////////////

	cluster.on('fork', function(worker) {
		log.verbose('cluster', "worker " + worker.process.pid + " (#"+worker.id+") has spawned");
	});

	cluster.on('listening', function(worker, address) {
		log.verbose('cluster', "worker " + worker.process.pid + " (#"+worker.id+") is listening");
	});

	cluster.on('exit', function(worker, code, signal) {
		log.verbose('cluster', "worker " + worker.process.pid + " (#"+worker.id+") has exited");
		setTimeout(reloadWorker, 1000) // to prevent CPU-splsions if crashing too fast
	});

}


var d = require('domain').create();

d.on('error', function(err){
	log.error('clusters', 'start up failed')
	// handle the error safely
	console.log(err);
});


var clustersModule = function (next) {



	async.waterfall([
		createPid,
		setupEvents
	], function (err, result) {

		log.verbose('clusters', 'starting up');

		if (err) {
			log.error('clusters', 'start up failed')
			throw err;
		}

		d.run(build(start));


		// result now equals 'done'
	});

	next(null);

}




module.exports = clustersModule;



