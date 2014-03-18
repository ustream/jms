var http           = require('http');
var util           = require('util');

var paths          = require('../../conf/paths');
var netConf        = require(paths.confdir + '/network');

var moduleresponse = require(paths.libdir + '/server/moduleresponse');

var log            = require(paths.libdir + '/debug/log');

/**
 *
 * @param next
 * @constructor
 */
function ModuleServer (next) {
	http.Server.call(this);

	this.listen(netConf.port, netConf.host);
	this.on('request', moduleresponse);

	log.info('ModuleServer','Server running at http://' + netConf.host + ':' + netConf.port + '/');

/*
	var that = this;
	setInterval(function () {
		that.getConnections(function (err, count) {
			console.log(count);
		})
	},500)
	*/
}

util.inherits(ModuleServer, http.Server);

module.exports = ModuleServer;