var paths            = require('../../conf/paths');
var storage          = require(paths.libdir + '/storage');
var process_events   = require(paths.libdir + '/process-events');
var responseHandler  = require(paths.libdir + '/server/responsehandler');

var log = function (msg) {
	process_events.send(process_events.LOG, msg, 'worker');
}


module.exports = function buildResponse (request, response) {

	log(request.url);

	storage.get('buildNumber', function (err, number) {

		if (err) {
			responseHandler(request, response, new Exception500());
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

	});


}