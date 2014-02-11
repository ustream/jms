
var paths = {

	confdir: process.cwd() + "/conf",
	libdir: process.cwd() + "/lib",

	piddir: process.cwd() + "/pids",
	pidfile: process.cwd() + "/pids/cluster_pidfile",

	datadir: process.cwd() + "/data",

	logdir: process.cwd() + "/logs",
	log: process.cwd() + "/logs/cluster.log",

}

module.exports = paths;