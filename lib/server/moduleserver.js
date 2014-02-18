


var http           = require('http');
var util           = require('util');

var paths          = require('../../conf/paths');
var netConf        = require(paths.confdir + '/network');
var process_events = require(paths.libdir + '/process-events');

var moduleresponse = require(paths.libdir + '/server/moduleresponse');

var log = function (msg) {
	process_events.send(process_events.LOG, msg, 'worker');
}


/**
 *
 * @param next
 * @constructor
 */
function ModuleServer (next) {
	http.Server.call(this);

	this.listen(netConf.port, netConf.host);
	this.on('request', moduleresponse);

	log('Server running at http://' + netConf.host + ':' + netConf.port + '/');

}




util.inherits(ModuleServer, http.Server);


module.exports = ModuleServer;