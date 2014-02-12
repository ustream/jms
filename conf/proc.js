var paths   = require('./paths');
var numCPUs = require('os').cpus().length;

var numWorkers = numCPUs - 2;
if (numWorkers < 2){ numWorkers = 2 };

var proc = {

	exec: paths.libdir + "/startup/worker",

	workers: numWorkers,

	title: "jms-server-master",

	workerTitlePrefix: " jms-server-worker",

	//silent: true, // don't pass stdout/err to the master
	silent: false, // don't pass stdout/err to the master

	cache: true,

}

module.exports = proc;