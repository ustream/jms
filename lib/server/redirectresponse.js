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
module.exports = function redirectResponse (request, response, modulereq) {

	log.info('redirectResponse', request.url);

	if (modulereq.timer) {
		modulereq.timer.push({redirectResponse: +new Date()});
	}


	if (modulereq.timer) {
		modulereq.timer.push({sendingResponse: +new Date()});
	}


	if (modulereq.timer) {
		response.setHeader('JMS-Timers', JSON.stringify(modulereq.timer));
	}



	var location = '/js/' + modulereq.source + '/+';


	location += modulereq.include.join(',');

	if (modulereq.exclude.length > 0) {
		location += '-';
		location += modulereq.exclude.join(',');
	}

	location += '.js';

	if (modulereq.url.query) {
		location += '?' + modulereq.url.query;
	}


	response.writeHead(302, {
		'Location': location
	});


	response.end('', 'utf8');
	statistics.out();

	return;

}
