var http           = require('http');
var paths          = require('../../lib/paths');
var log            = require(paths.libdir + '/debug/log');
var config         = require(paths.libdir + '/getconfig');
var monitConf      = config.monit;

function onResponseData (clientRequest, httpResponse, moduleRequest) {

	log.verbose('statusResponse', [moduleRequest.remoteAddress, moduleRequest.href].join(' '));

	httpResponse.writeHead(clientRequest.statusCode, {});
	httpResponse.end('', 'utf8');

}

function onResponse(httpResponse, moduleRequest, clientRequest) {
	clientRequest.on('data', onResponseData.bind(null, clientRequest, httpResponse, moduleRequest));
}

module.exports = function (request, httpResponse, moduleRequest) {

	var options = {
		port: monitConf.port,
		hostname: monitConf.host,
		method: 'GET',
		path: '/'
	};

	var req = http.request(options);
	req.end();

	req.on('response', onResponse.bind(null, httpResponse, moduleRequest));
	req.on('error', function() {});
}