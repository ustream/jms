var paths          = require('../../conf/paths');
var process_events = require(paths.libdir + '/process-events');

var log                 = require(paths.libdir + '/debug/log');

module.exports = function buildResponse (request, response, err, source, byteLength, lastModified) {

	if (err) {
		// handle errors

		log.verbose('responsehandler', ['Error', err].join(' '));

		if (err.statusCode) {
			response.writeHead(err.statusCode, {
				'Content-Type': 'text/plain'
			});
			response.end(err.message, 'utf8')
		} else {
			response.writeHead(500, {
				'Access-Control-Allow-Origin': '*',
				'Content-Type': 'text/plain'
			});
			response.end('Internal server error', 'utf8');
		}
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

	// serve content
	response.writeHead(responseStatus, {
		'Content-Type': 'application/x-javascript;charset=UTF-8',
		'Content-Length': byteLength,
		'Last-Modified': lastModified.toUTCString(),
		'Cache-Control': 'must-revalidate',
		'X-JMS-Cache': 'MISS'
	});

	response.end(source, 'utf8');

}