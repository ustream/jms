var _              = require('lodash');
var async            = require('async');
var paths          = require('../../conf/paths');
var netConf        = require(paths.confdir + '/network');
var process_events = require(paths.libdir + '/process-events');
var storage        = require(paths.libdir + '/storage');

var modulerequest  = require(paths.libdir + '/server/modulerequest');
var modulecollector  = require(paths.libdir + '/server/modulecollector');
var modulepackager  = require(paths.libdir + '/server/modulepackager');
var modulecache  = require(paths.libdir + '/server/modulecache');

var log = function (msg) {
	process_events.send(process_events.LOG, msg, 'worker');
}


/**
 *
 * @param {ClientRequest} request
 * @param {ServerResponse} response
 */
module.exports = function (request, response) {

	var modulereq = modulerequest(request);



	async.waterfall([
		modulecollector.bind(null, modulereq),
		modulepackager.bind(null, modulereq),
		modulecache.bind(null, modulereq)
	], function (err, source, byteLength, lastModified) {


		if (err) {
			// handle errors

			log(['Error', err].join(' '));

			if (err.statusCode) {
				response.writeHead(err.statusCode, {'Content-Type': 'text/plain'});
				response.end(err.message, 'utf8')
			} else {
				response.writeHead(500, {'Content-Type': 'text/plain'});
				response.end('Internal server error', 'utf8');
			}
			return;
		}

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

		//_.pluck(result, 'source');

	});




}