var fs             = require('fs');
var cluster        = require('cluster');
var log            = require('./lib/log');
var proc           = require('./conf/proc');
var paths          = require('./conf/paths');
var process_events = require('./lib/process-events');
var build          = require('./lib/startup/build');




log(" - STARTING CLUSTER -" + process.pid, ["bold", "green"]);



process.stdin.resume();
process.title = proc.title;

var workerRestartArray = [];

// used to trask rolling restarts of workers
var workersExpected = 0;


function createPid (next) {

// set pidFile
	if(paths.pidfile != null){
		if (!fs.existsSync(paths.pidfile)) {
			var fd = fs.openSync(paths.pidfile, 'w');
			fs.closeSync(fd);
		}
		fs.writeFileSync(paths.pidfile, process.pid.toString());
	}

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

	next();
}


/*
	event handlers
 */

function onSIGINT () {
	log("Signal: SIGINT");
	workersExpected = 0;
	setupShutdown();
}

function onSIGTERM () {
	log("Signal: SIGTERM");
	workersExpected = 0;
	setupShutdown();
}

function onSIGUSR1 () {
	log("Signal: SIGUSR1");
	log("retrieving stats");
//	process.stdout.write('stats?');
}

function onSIGUSR2 () {

//  kill -s SIGUSR2 PID

// DEPLOY
	log("Signal: SIGUSR2");
	log("swap out new workers one-by-one");

// keszitsunk uj build state-et
	build(function () {
		workerRestartArray = [];

		// lenyeg a lenyeg:
		// egy regi workert leallitani csak az uj started eseten lehet
		// mindig legyen ami kiszolgal

		for (var i in cluster.workers) {
			workerRestartArray.push(cluster.workers[i]);
		}

		log(workerRestartArray.length);

		if(workerRestartArray.length > 0){
			var worker = workerRestartArray.pop();
			process_events.stop(worker);
		}
	});
}

function onSIGHUP () {
	log("Signal: SIGHUP");
	log("reload all workers now");
	for (var i in cluster.workers) {
		var worker = cluster.workers[i];
		worker.send("restart");
	}
}

function onSIGWINCH () {
	log("Signal: SIGWINCH");

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
	log("Signal: SIGTTIN");
	log("add a worker");
	workersExpected++;
	startAWorker();
}

function onSIGTTOU () {
	log("Signal: SIGTTOU");
	log("remove a worker");
	workersExpected--;
	for (var i in cluster.workers){
		var worker = cluster.workers[i];
		worker.send("stop");
		break;
	}
}

function onEXIT (){
	workersExpected = 0;
	log("Bye!")
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


		log("[" + worker.process.pid + "] " + (e.label ? e.label.toUpperCase() : e.event.toUpperCase()) + " : " + e.data);
	}

	if (e.STARTED == e.event) {
		log("[" + worker.process.pid + "] " + e.event.toUpperCase() );

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
	log("starting worker #" + worker.id);

	worker.on('message', workerMessageHandler.bind(null, worker));
}


var setupShutdown = function(){
	log("Cluster manager quitting", "red");
	log("Stopping each worker...");

	for(var i in cluster.workers){
		process_events.stop(cluster.workers[i])
	}

	setTimeout(loopUntilNoWorkers, 1000);
}

var loopUntilNoWorkers = function(){
	if(cluster.workers.length > 0) {
		log("there are still " + cluster.workers.length + " workers...");

		setTimeout(loopUntilNoWorkers, 1000);

	} else {
		log("all workers gone");
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

/////////////
// Fork it //
/////////////

	cluster.setupMaster({
		exec : proc.exec,
		args : process.argv.slice(2),
		silent : proc.silent
	});

///////////////////
// Start workers //
///////////////////

	for (var i = 0; i < proc.workers; i++) {
		workersExpected++;
		startAWorker();
	}

////////////////////
// Cluster events //
////////////////////

	cluster.on('fork', function(worker) {
		log("worker " + worker.process.pid + " (#"+worker.id+") has spawned");
	});

	cluster.on('listening', function(worker, address) {
		log("worker " + worker.process.pid + " (#"+worker.id+") is listening");
	});

	cluster.on('exit', function(worker, code, signal) {
		log("worker " + worker.process.pid + " (#"+worker.id+") has exited");
		setTimeout(reloadAWorker, 1000) // to prevent CPU-splsions if crashing too fast
	});

}


var clustersModule = function () {


	//createPid
	// setupEvents

	build(start);


	return {
		reloadWorker: reloadWorker
	}

}




module.exports = clustersModule();



