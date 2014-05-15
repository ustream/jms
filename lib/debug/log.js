var fs     = require('fs');
var npmlog = require('npmlog');
var paths  = require('../../lib/paths');
var config = require(paths.libdir + '/getconfig');
var debug  = config.debug;


var logHandle = fs.createWriteStream(paths.log, {flags:"a"});


//npmlog.stream = logHandle;
npmlog.level = debug.loglevel;


var padDateDoubleStr = function(i){
	return (i < 10) ? "0" + i : "" + i;
};

var sqlDateTime = function(time){
	if(time == null){ time = new Date(); }
	var dateStr =
		padDateDoubleStr(time.getFullYear()) +
			"-" + padDateDoubleStr(1 + time.getMonth()) +
			"-" + padDateDoubleStr(time.getDate()) +
			" " + padDateDoubleStr(time.getHours()) +
			":" + padDateDoubleStr(time.getMinutes()) +
			":" + padDateDoubleStr(time.getSeconds());
	return dateStr;
};


var log = function(level, module, info){

	//npmlog.heading = sqlDateTime();
	npmlog.log(level, module, info);

}


module.exports = {
	verbose: log.bind(log, 'verbose'),
	info: log.bind(log, 'info'),
	warn: log.bind(log, 'warn'),
	error: log.bind(log, 'error')
}
