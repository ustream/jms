var paths          = require('../../conf/paths');
var statistics     = require(paths.libdir + '/server/stats');
var log            = require(paths.libdir + '/debug/log');

module.exports = function cachedResponse (request, response, err, moduleRequest) {




	if (moduleRequest.timer) {
		moduleRequest.timer.push({sendingResponse: +new Date()});
	}


	if (err) {
		// handle errors

		log.error('cachedResponse', ['Error', err].join(' '));

		if (err.statusCode) {
			if (moduleRequest.timer) {
				response.setHeader('JMS-Timers', JSON.stringify(moduleRequest.timer));
			}

			response.writeHead(err.statusCode, {
				'Content-Type': 'text/plain'
			});


			response.end(err.message, 'utf8')
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


	var cached = moduleRequest.response;

	cached.last_modified = new Date(cached.last_modified);

	if (request.headers['if-modified-since']) {
		var ifModifiedSince = new Date(request.headers['if-modified-since']);

		if (+cached.last_modified <= +ifModifiedSince) {
			var responseStatus = 304;
			var responseLength = 0;
			var responseBody = '';
		} else {
			var responseStatus = 200;
			var responseLength = cached.responseLength;
			var responseBody = cached.response;
		}
	} else {
		var responseStatus = 200;
		var responseLength = cached.responseLength;
		var responseBody = cached.response;
	}


	if (moduleRequest.timer) {
		response.setHeader('JMS-Timers', JSON.stringify(moduleRequest.timer));
	}

	response.writeHead(responseStatus, {
		'Content-Type': 'application/x-javascript;charset=UTF-8',
		'Content-Length': responseLength,
		'Cache-Control': 'must-revalidate',
		'Last-Modified': cached.last_modified.toUTCString(),
		'X-JMS-Cache': 'HIT'
	});

	response.end(responseBody, 'utf8');
	statistics.out();

}
