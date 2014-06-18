

var http           = require('http');
var paths          = require('../../lib/paths');
var config         = require(paths.libdir + '/getconfig');
var monitConf      = config.monit;

module.exports = function (request, response, modulereq) {

	var options = {
		port: monitConf.port,
		hostname: monitConf.host,
		method: 'GET',
		path: '/'
	};

	var req = http.request(options);
	req.end();

	req.on('response', function(res) {
		res.on('data', function (c) {

			//console.log(c.toString() );

			response.writeHead(res.statusCode, {});
			response.end('', 'utf8');

		});
	});

	req.on('error', function() {
	});

}