var http           = require('http');
var util           = require('util');
var paths          = require('../../lib/paths');
var config         = require(paths.libdir + '/getconfig');
var netConf        = config.network;

var moduleresponse = require(paths.libdir + '/server/moduleresponse');
var log            = require(paths.libdir + '/debug/log');

/**
 *
 * @param next
 * @constructor
 */
function ModuleServer () {
	http.Server.call(this);

	this.listen(netConf.port, netConf.host);
	this.on('request', moduleresponse);

	log.info('ModuleServer','Server running at http://' + netConf.host + ':' + netConf.port + '/');

}

util.inherits(ModuleServer, http.Server);

module.exports = ModuleServer;
