var fs = require('fs');
var colors = require('colors');
var paths = require('../../conf/paths');
var logHandle = fs.createWriteStream(paths.log, {flags:"a"});

var log = function(msg, col){

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

	var padDateDoubleStr = function(i){
		return (i < 10) ? "0" + i : "" + i;
	};
	msg = sqlDateTime() + " | " + msg;
	logHandle.write(msg + "\r\n");
	if(typeof col == "string"){col = [col];}
	for(var i in col){
		msg = colors[col[i]](msg);
	}

}


module.exports = log;
