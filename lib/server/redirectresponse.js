var paths            = require('../../lib/paths');
var storage          = require(paths.libdir + '/storage');
var responseHandler  = require(paths.libdir + '/server/responsehandler');
var statistics       = require(paths.libdir + '/server/stats');
var log              = require(paths.libdir + '/debug/log');

/**
 *
 * @param request
 * @param response
 * @param moduleRequest
 */
module.exports = function redirectResponse (request, response, moduleRequest) {

	log.info('redirectResponse',[moduleRequest.remoteAddress, moduleRequest.href].join(' '));

	if (moduleRequest.timer) {
		moduleRequest.timer.push({redirectResponse: +new Date()});
	}

	if (moduleRequest.timer) {
		moduleRequest.timer.push({sendingResponse: +new Date()});
	}

	if (moduleRequest.timer) {
		response.setHeader('JMS-Timers', JSON.stringify(moduleRequest.timer));
	}

	var location = '/js/' + moduleRequest.source + '/+';

	location += moduleRequest.include.join(',');

	if (moduleRequest.exclude.length > 0) {
		location += '-';
		location += moduleRequest.exclude.join(',');
	}

	location += '.js';

	if (moduleRequest.url.query) {
		location += '?' + moduleRequest.url.query;
	}

	/*
	response.writeHead(302, {
		'Cache-Control': 'no-cache, no-store, private, must-revalidate, max-age=0, max-stale=0, post-check=0, pre-check=0',
		'Pragma': 'no-cache',
		'Expires': 0,
		'Location': location
	});
	*/

	response.writeHead(302, {
		'Cache-Control': 'max-age=300, s-maxage=300',
		'Expires': (new Date(+new Date() + 300000)).toUTCString(),
		'Location': location
	});

	response.end('', 'utf8');
	statistics.out();
}
