//var crc        = require('sse4_crc32');
var paths      = require('../../lib/paths');
var log        = require(paths.libdir + '/debug/log');
var statistics = require(paths.libdir + '/server/stats');
var config     = require(paths.libdir + '/getconfig');

/**
 *
 * @param request
 * @param response
 * @param moduleRequest
 * @param err
 * @param source
 * @param byteLength
 * @param lastModified
 */
module.exports = function responseHandler (request, response, moduleRequest, err, source, byteLength, lastModified) {

	if (moduleRequest.timer) {
		moduleRequest.timer.push({sendingResponse: +new Date() });
	}

	if (err) {
		// handle errors

		log.info('responsehandler', [moduleRequest.remoteAddress, moduleRequest.href, ['Error', err].join(' ')].join(' '));

		if (err.statusCode) {

			if (moduleRequest.timer) {
				response.setHeader('JMS-Timers', JSON.stringify(moduleRequest.timer));
			}

			response.writeHead(err.statusCode, {
				'Content-Type': 'text/plain'
			});

			response.end(err.message, 'utf8');
		} else {

			if (moduleRequest.timer) {
				response.setHeader('JMS-Timers', JSON.stringify(moduleRequest.timer));
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


	log.info('responsehandler', [moduleRequest.remoteAddress, moduleRequest.href].join(' '));

	var responseStatus = 200;

	if (request.headers['if-modified-since']) {
		var ifModifiedSince = new Date(request.headers['if-modified-since']);

		if (+lastModified <= +ifModifiedSince) {
			responseStatus = 304;
			byteLength = 0;
			source = '';
		}
	}

	if (moduleRequest.timer) {
		response.setHeader('JMS-Timers', JSON.stringify(moduleRequest.timer));
	}

	/*
	if (moduleRequest.debug) {
		response.setHeader('X-SourceMap', moduleRequest.href.replace('.js', '.js.map'));
	}
	*/




	// serve content
	response.writeHead(responseStatus, {
		'Content-Type': 'application/x-javascript',
		'Content-Length': byteLength,
		'Cache-Control': config.cacheControl.responseHandler,
		//'ETag': '"' + crc.calculate([lastModified.toUTCString(), moduleRequest.href].join('')).toString(16)+ '"',
		'Expires': (new Date(+new Date() + 2500834000)).toUTCString(),
		'Last-Modified': lastModified.toUTCString(),
		'X-JMS-Cache': 'MISS'
	});


	response.end(source, 'utf8');
	statistics.out();

};
