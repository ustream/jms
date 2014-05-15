var Url                 = require('url');
var _                   = require('lodash');
var paths               = require('../../conf/paths');
var netConf             = require(paths.confdir + '/network');
var debugConf           = require(paths.confdir + '/debug');

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
 * @param request
 * @param err
 * @param exists
 * @returns {*}
 */
function ifRequestExists (done, request, err, exists) {

	if (request.timer) {
		request.timer.push({doneCacheSearch: +new Date()});
	}

	if (exists.indexOf(null) < 0) {

		log.verbose('ModuleRequest', 'has cache for ' + request.href);

		request.cached = true;
		request.response = JSON.parse(exists);

		if (request.timer) {
			request.timer.push({gotCachedResponse: +new Date()});
		}

		return done(null, request);
	}

	setupRequest(done, request);
}


/**
 *
 * @param done
 * @param request
 * @returns {*}
 */
function setupRequest (done, request) {

	var path = request.pathname,
		params = {},
		_getp = request.url.query ? request.url.query.split('&') : [],
		sourceRequest = path.match(/js\/([a-zA-Z0-9\-_]*)\//i),
		moduleRequest = path.match(/\+([a-zA-Z0-9\/,_]*)-?([a-zA-Z0-9\/,_]*)?/i);

	if (!sourceRequest || !moduleRequest) {
		request.invalid = true;
		return done(new Exception415(request.pathname), request);
	}

	_getp.map(function(p){
		var p = p.split('=');
		params[p[0]] = p[1];
	});

	request.source = sourceRequest[1] || ModuleRequestObject.source;
	request.debug = !!params.debug || ModuleRequestObject.debug;
	request.jmscb = params.cb || ModuleRequestObject.jmscb;
	request.locale = params.locale || ModuleRequestObject.locale;

	request.include = extract_modules(moduleRequest[1]);
	request.exclude = extract_modules(moduleRequest[2]);



	// 302 redirect kell e vagy mar hashelt keres
//	storage.get(request.href, ifRequestExists.bind(null, done, request));
// de ezt az osszes included es excluded keresre
	// ha mindegyik unhashed akkor jo, tudunk ra hashelt verzion kuldeni
	// egyeb esetben 404

	var modulelist = request.include.concat(request.exclude)

	storage.hmget('map:'+request.source, modulelist, function (err, result) {

		if (_.compact(result).length === 0) {
			// normal request using already hashed modules
			return done(null, request);
		}

		if (result.indexOf(null) > -1) {
			// 404
			return done(new Exception404(request.pathname), request);
		} else {
			// 302
			request.redirect = true;
			request.include = result.slice(0, request.include.length);
			request.exclude = result.slice(request.include.length);
			return done(null, request);
		}

		if (request.timer) {
			request.timer.push({requestSetupDone: +new Date()});
		}
	});
}


/**
 *
 * @param url
 * @returns {ModuleRequestObject}
 * @constructor
 */
function ModuleRequest (req, done) {
	var url = Url.parse(req.url),
		request = clone(ModuleRequestObject);

	request.url = url;
	request.href = url.href;
	request.pathname = url.pathname;

	if (debugConf.timer) {
		request.timer = [];
	}

	if (url.pathname == '/status') {
		request.healthcheck = true;
		return done(null, request);
	}

	if (url.pathname == '/client.js') {
		request.client = true;
		request.include.push('jmsclient');
		return done(null, request);
	}

	console.log(request.pathname);
	
	var sourceRequest = request.pathname.match(/js\/([a-zA-Z0-9\-_]*)\//i);

	if (!sourceRequest) {
		return done(new Exception415(request.pathname), request);
	}

	request.source = sourceRequest[1] || ModuleRequestObject.source;

	if (netConf.cache) {
		storage.hmget('cache:' + request.source, [request.href], ifRequestExists.bind(null, done, request));
	} else {
		setupRequest(done, request);
	}

}

module.exports = ModuleRequest;