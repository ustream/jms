var async            = require('async');
var paths            = require('../../lib/paths');

var redirectResponse = require(paths.libdir + '/server/redirectresponse');
var responseHandler  = require(paths.libdir + '/server/responsehandler');
var cachedResponse   = require(paths.libdir + '/server/cachedresponse');

var modulerequest    = require(paths.libdir + '/server/modulerequest');
var pluginmanager    = require(paths.libdir + '/pluginmanager/server');
var collector        = require(paths.libdir + '/server/collector');
var packager         = require(paths.libdir + '/server/packager');
var cache            = require(paths.libdir + '/server/cache');
var statusResponse   = require(paths.libdir + '/server/statusresponse');
var statistics       = require(paths.libdir + '/server/stats');

var Exception415     = require(paths.libdir + '/exception/415');

/**
 *
 * @param err
 * @param originalRequest {http.IncomingMessage}
 * @param httpResponse {http.ServerResponse}
 * @param moduleRequest {moduleRequest}
 * @returns {Object}
 */
function moduleResponse (err, originalRequest, httpResponse, moduleRequest) {

	if (err) {
		return responseHandler(originalRequest, httpResponse, moduleRequest, err);
	}

	if (moduleRequest.timer) {
		moduleRequest.timer.push({requestReceived: +new Date()});
		moduleRequest.timer.push({requestProcessed: +new Date()});
	}

	if (moduleRequest.healthcheck) {
		statistics.out();
		return statusResponse(originalRequest, httpResponse, moduleRequest);
	}

	if (moduleRequest.redirect) {
		return redirectResponse(originalRequest, httpResponse, moduleRequest);
	}

	if (moduleRequest.invalid) {
		return responseHandler(originalRequest, httpResponse, moduleRequest, new Exception415(moduleRequest.pathname));
	}

	if (moduleRequest.cached) {
		return cachedResponse(originalRequest, httpResponse, null, moduleRequest);
	}

	async.waterfall([
		collector.bind(null, moduleRequest),
		pluginmanager.bind(null, moduleRequest),
		packager.bind(null, moduleRequest),
		cache.bind(null, moduleRequest)
	], responseHandler.bind(null, originalRequest, httpResponse, moduleRequest));

}

/**
 *
 * @param request {http.IncomingMessage}
 * @param response {http.ServerResponse}
 */
module.exports = function (request, response) {
	statistics.in();
	modulerequest(request, response, moduleResponse);
}
