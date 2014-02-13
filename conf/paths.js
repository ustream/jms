var basedir = process.cwd();
var paths = {

	basedir: basedir,

	confdir: basedir + "/conf",
	libdir: basedir + "/lib",

	piddir: basedir + "/pids",
	pidfile: basedir + "/pids/cluster_pidfile",

	datadir: basedir + "/data",

	logdir: basedir + "/logs",
	log: basedir + "/logs/cluster.log",

}

module.exports = paths;