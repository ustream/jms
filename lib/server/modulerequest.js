var Url                 = require('url');
var _                   = require('lodash');
var paths               = require('../../lib/paths');
var config              = require(paths.libdir + '/getconfig');
var netConf             = config.network;
var debugConf           = config.debug;

var storage             = require(paths.libdir + '/storage');
var log                 = require(paths.libdir + '/debug/log');


var Exception415    = require(paths.libdir + '/exception/415');
var Exception404    = require(paths.libdir + '/exception/404');

var ModuleRequestObject = {
	//build: 1,
	debug: false,
	redirect: false,
	jmscb: false,
	source: 'live',
	include: [],
	exclude: [],
	invalid: false,
	client: false
}


/**
 *
 * @param obj
 * @returns {*}
 */
function clone(obj) {
	// Handle the 3 simple types, and null or undefined
	if (null == obj || "object" != typeof obj) return obj;

	// Handle Date
	if (obj instanceof Date) {
		var copy = new Date();
		copy.setTime(obj.getTime());
		return copy;
	}

	// Handle Array
	if (obj instanceof Array) {
		var copy = [];
		for (var i = 0, len = obj.length; i < len; i++) {
			copy[i] = clone(obj[i]);
		}
		return copy;
	}

	// Handle Object
	if (obj instanceof Object) {
		var copy = {};
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
		}
		return copy;
	}

}

/**
 * extract a module list from url fragments
 *
 * @param from {String}
 * @returns {Array}
 */
function extract_modules (from) {
	if (from) {
		from = from.replace('.js', '');
	}
	var extracted = from ? from.split(',') : [];
	return extracted;
}

/**
 *
 * @param done
 * @param originalRequest {http.IncomingMessage}
 * @param httpResponse {http.ServerResponse}
 * @param moduleRequest
 * @param err
 * @param exists
 * @returns {*}
 */
function ifRequestExists (done, originalRequest, httpResponse, moduleRequest, err, exists) {

	if (moduleRequest.timer) {
		moduleRequest.timer.push({doneCacheSearch: +new Date()});
	}

	if (exists.indexOf(null) < 0) {

		log.verbose('ModuleRequest', 'has cache for ' + moduleRequest.href);

		moduleRequest.cached = true;
		moduleRequest.response = JSON.parse(exists);

		if (moduleRequest.timer) {
			moduleRequest.timer.push({gotCachedResponse: +new Date()});
		}

		return done(null, originalRequest, httpResponse, moduleRequest);
	}

	setupRequest(originalRequest, httpResponse, moduleRequest, done);
}

/**
 *
 * @param originalRequest
 * @param httpResponse
 * @param moduleRequest
 * @param done
 * @returns {*}
 */
function setupRequest (originalRequest, httpResponse, moduleRequest, done) {

	var path = moduleRequest.pathname;
	var params = {};
	var _getp = moduleRequest.url.query ? moduleRequest.url.query.split('&') : [];
	var parsedSourceRequest = path.match(/js\/([a-zA-Z0-9\-_]*)\//i);
	var parsedModuleRequest = path.match(/\+([a-zA-Z0-9\/,_]*)-?([a-zA-Z0-9\/,_]*)?/i);

	if (!parsedSourceRequest || !parsedModuleRequest) {
		moduleRequest.invalid = true;
		return done(new Exception415(moduleRequest.pathname), originalRequest, httpResponse, moduleRequest);
	}

	// TODO: avoid closure
	_getp.map(function explodeParams (p) {
		var p = p.split('=');
		params[p[0]] = p[1];
	});

	moduleRequest.source = parsedSourceRequest[1] || ModuleRequestObject.source;

	moduleRequest.params = params;

	moduleRequest.debug = !!params.debug || ModuleRequestObject.debug;

	moduleRequest.jmscb = params.cb || ModuleRequestObject.jmscb;

	moduleRequest.include = extract_modules(parsedModuleRequest[1]);

	moduleRequest.exclude = extract_modules(parsedModuleRequest[2]);

	// 302 redirect kell e vagy mar hashelt keres
	//	storage.get(request.href, ifRequestExists.bind(null, done, request));
	// de ezt az osszes included es excluded keresre
	// ha mindegyik unhashed akkor jo, tudunk ra hashelt verzion kuldeni
	// egyeb esetben 404

	var modulelist = moduleRequest.include.concat(moduleRequest.exclude);

	storage.hmget(
		'map:' + moduleRequest.source,
		modulelist,
		onMapResult
			.bind(null, originalRequest, httpResponse, moduleRequest, done)
	);

}

/**
 *
 * @param originalRequest
 * @param httpResponse
 * @param moduleRequest
 * @param done
 * @param err
 * @param result
 * @returns {*}
 */
function onMapResult (originalRequest, httpResponse, moduleRequest, done, err, result) {

	if (moduleRequest.timer) {
		moduleRequest.timer.push({requestSetupDone: +new Date()});
	}

	if (_.compact(result).length === 0) {
		// normal request using already hashed modules
		return done(null, originalRequest, httpResponse, moduleRequest);
	}

	if (result.indexOf(null) > -1) {
		// 404
		return done(new Exception404(moduleRequest.pathname), originalRequest, httpResponse, moduleRequest);
	} else {
		// 302
		moduleRequest.redirect = true;
		moduleRequest.include = result.slice(0, moduleRequest.include.length);
		moduleRequest.exclude = result.slice(moduleRequest.include.length);
		return done(null, originalRequest, httpResponse, moduleRequest);
	}

}

/**
 *
 * @param originalRequest
 * @param httpResponse
 * @param done
 * @returns {*}
 * @constructor
 */
function ModuleRequest (originalRequest, httpResponse, done) {

	var url = Url.parse(originalRequest.url);
	var moduleRequest = clone(ModuleRequestObject);

	moduleRequest.url = url;
	moduleRequest.href = url.href;
	moduleRequest.pathname = url.pathname;
	moduleRequest.headers = originalRequest.headers;
	moduleRequest.remoteAddress = originalRequest.connection.remoteAddress;

	// set up debugging timer
	if (debugConf.timer) {
		moduleRequest.timer = [];
	}

	// some basic routing
	if (url.pathname == '/status') {
		moduleRequest.healthcheck = true;
		return done(null, originalRequest, httpResponse, moduleRequest);
	}

	if (url.pathname == '/client.js') {
		moduleRequest.client = true;
		moduleRequest.include.push('jmsclient');
		return done(null, originalRequest, httpResponse, moduleRequest);
	}

	// from which repo
	var sourceRequest = moduleRequest.pathname.match(/js\/([a-zA-Z0-9\-_]*)\//i);

	if (!sourceRequest) {
		return done(new Exception415(moduleRequest.pathname), originalRequest, httpResponse, moduleRequest);
	}

	moduleRequest.source = sourceRequest[1] || ModuleRequestObject.source;

	// has cached response or else
	if (netConf.cache) {
		storage.hmget('cache:' + moduleRequest.source, [moduleRequest.href], ifRequestExists.bind(null, done, originalRequest, httpResponse, moduleRequest));
	} else {
		setupRequest(originalRequest, httpResponse, moduleRequest, done);
	}

}

module.exports = ModuleRequest;