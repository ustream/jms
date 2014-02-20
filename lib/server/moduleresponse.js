var _              = require('lodash');
var async            = require('async');
var paths          = require('../../conf/paths');
var netConf        = require(paths.confdir + '/network');
var process_events = require(paths.libdir + '/process-events');
var storage        = require(paths.libdir + '/storage');

var modulerequest  = require(paths.libdir + '/server/modulerequest');
var collector      = require(paths.libdir + '/server/collector');
var packager       = require(paths.libdir + '/server/packager');
var cache          = require(paths.libdir + '/server/cache');

var Exception415 = require(paths.libdir + '/exception/415');

var log = function (msg) {
	process_events.send(process_events.LOG, msg, 'worker');
}


/**
 *
 * @param request
 * @param response
 * @param err
 * @param source
 * @param byteLength
 * @param lastModified
 */
function responseHandler (request, response, err, source, byteLength, lastModified) {


	if (err) {
		// handle errors

		log(['Error', err].join(' '));

		if (err.statusCode) {
			response.writeHead(err.statusCode, {
				'Access-Control-Allow-Origin': '*',
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

	log(request.url);

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
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/x-javascript;charset=UTF-8',
		'Content-Length': byteLength,
		'Last-Modified': lastModified.toUTCString(),
		'Cache-Control': 'must-revalidate',
		'X-JMS-Cache': 'MISS'
	});

	response.end(source, 'utf8');
}


/**
 *
 * @param {ClientRequest} request
 * @param {ServerResponse} response
 */
module.exports = function (request, response) {

	var modulereq = modulerequest(request);


	if (modulereq.buildNumberRequest) {
		log(request.url);
		storage.get('buildNumber', function (err, number) {
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
		return;
	}

	if (modulereq.invalid) {
		return responseHandler(request, response, new Exception415(modulereq.pathname));
	}

	async.waterfall([
		collector.bind(null, modulereq),
		packager.bind(null, modulereq),
		cache.bind(null, modulereq)
	], responseHandler.bind(null, request, response));




}