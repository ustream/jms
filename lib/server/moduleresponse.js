var async           = require('async');
var paths           = require('../../conf/paths');

var buildResponse   = require(paths.libdir + '/server/buildresponse');
var responseHandler = require(paths.libdir + '/server/responsehandler');
var cachedResponse  = require(paths.libdir + '/server/cachedresponse');

var modulerequest   = require(paths.libdir + '/server/modulerequest');
var pluginmanager   = require(paths.libdir + '/pluginmanager/server');
var collector       = require(paths.libdir + '/server/collector');
var packager        = require(paths.libdir + '/server/packager');
var cache           = require(paths.libdir + '/server/cache');

var Exception415    = require(paths.libdir + '/exception/415');

var statistics      = require(paths.libdir + '/server/stats');

/**
 *
 * @param {ClientRequest} request
 * @param {ServerResponse} response
 */
module.exports = function (request, response) {

	statistics.in();

	modulerequest(request, function (modulereq) {

		if (modulereq.buildNumberRequest) {
			return buildResponse(request, response);
		}

		if (modulereq.invalid) {
			return responseHandler(request, response, new Exception415(modulereq.pathname));
		}

		if (modulereq.cached) {
			return cachedResponse(request, response, null, modulereq);
		}

		async.waterfall([
			collector.bind(null, modulereq),
			pluginmanager.bind(null, modulereq),
			packager.bind(null, modulereq),
			cache.bind(null, modulereq)
		], responseHandler.bind(null, request, response));

	});

}