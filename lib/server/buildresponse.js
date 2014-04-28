var paths            = require('../../conf/paths');
var storage          = require(paths.libdir + '/storage');
var responseHandler  = require(paths.libdir + '/server/responsehandler');
var statistics       = require(paths.libdir + '/server/stats');
var log              = require(paths.libdir + '/debug/log');

/**
 *
 * @param request
 * @param response
 * @param modulereq
 */
module.exports = function buildResponse (request, response, modulereq) {

	log.info('buildResponse', request.url);

	if (modulereq.timer) {
		modulereq.timer.push({fetchBuildNumber: +new Date()});
	}

	storage.get('buildNumber', function (err, number) {


		if (modulereq.timer) {
			modulereq.timer.push({sendingResponse: +new Date()});
		}


		if (err) {
			responseHandler(request, response, modulereq, new Exception500());
			statistics.out();
			return;
		}


		if (modulereq.timer) {
			response.setHeader('JMS-Timers', JSON.stringify(modulereq.timer));
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
