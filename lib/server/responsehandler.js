var paths      = require('../../conf/paths');
var log        = require(paths.libdir + '/debug/log');
var statistics = require(paths.libdir + '/server/stats');

/**
 *
 * @param request
 * @param response
 * @param modulereq
 * @param err
 * @param source
 * @param byteLength
 * @param lastModified
 */
module.exports = function buildResponse (request, response, modulereq, err, source, byteLength, lastModified) {

	if (modulereq.timer) {
		modulereq.timer.push({sendingResponse: +new Date() });
	}

	if (err) {
		// handle errors

		log.verbose('responsehandler', ['Error', err].join(' '));

		if (err.statusCode) {

			if (modulereq.timer) {
				response.setHeader('JMS-Timers', JSON.stringify(modulereq.timer));
			}

			response.writeHead(err.statusCode, {
				'Content-Type': 'text/plain'
			});

			response.end(err.message, 'utf8')
		} else {

			if (modulereq.timer) {
				response.setHeader('JMS-Timers', JSON.stringify(modulereq.timer));
			}

			response.writeHead(500, {
				'Access-Control-Allow-Origin': '*',
				'Content-Type': 'text/plain'
			});

			response.end('Internal server error', 'utf8');
		}
		statistics.out();
		return;
	}


	log.info('responsehandler', request.url);

	var responseStatus = 200;

	if (request.headers['if-modified-since']) {
		var ifModifiedSince = new Date(request.headers['if-modified-since']);

		if (+lastModified <= +ifModifiedSince) {
			responseStatus = 304;
			byteLength = 0;
			source = '';
		}
	}

	if (modulereq.timer) {
		response.setHeader('JMS-Timers', JSON.stringify(modulereq.timer));
	}

	// serve content
	response.writeHead(responseStatus, {
		'Content-Type': 'application/x-javascript;charset=UTF-8',
		'Content-Length': byteLength,
		'Last-Modified': lastModified.toUTCString(),
		'Cache-Control': 'must-revalidate',
		'X-JMS-Cache': 'MISS'
	});


	response.end(source, 'utf8');
	statistics.out();

}
