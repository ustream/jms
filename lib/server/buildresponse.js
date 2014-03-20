var paths            = require('../../conf/paths');
var storage          = require(paths.libdir + '/storage');
var responseHandler  = require(paths.libdir + '/server/responsehandler');
var statistics       = require(paths.libdir + '/server/stats');
var log              = require(paths.libdir + '/debug/log');

module.exports = function buildResponse (request, response) {

	log.info('buildResponse', request.url);

	storage.get('buildNumber', function (err, number) {

		if (err) {
			responseHandler(request, response, new Exception500());
			statistics.out();
			return;
		}

		response.writeHead(200, {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'OPTIONS,GET',
			'Access-Control-Allow-Headers': 'JMS-buildnumber',
			'Access-Control-Expose-Headers': 'JMS-buildnumber',
			'Content-Type': 'text/plain',
			'JMS-buildnumber': number
		});
		response.end('', 'utf8');
		statistics.out();

	});


}