var Url                 = require('url');
var paths               = require('../../conf/paths');
var netConf             = require(paths.confdir + '/network');
var debugConf           = require(paths.confdir + '/debug');

var storage             = require(paths.libdir + '/storage');

var log                 = require(paths.libdir + '/debug/log');

var ModuleRequestObject = {
	build: 1,
	debug: false,
	jmscb: false,
	locale: 'en_US',
	include: [],
	exclude: [],
	invalid: false,
	client: false
}


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


function ifRequestExists (done, request, err, exists) {


	if (request.timer) {
		request.timer.push({doneCacheSearch: +new Date()});
	}

	if (exists != null) {

		log.verbose('ModuleRequest', 'has cache for ' + request.href);
		request.cached = true;
		request.response = JSON.parse(exists);

		if (request.timer) {
			request.timer.push({gotCachedResponse: +new Date()});
		}

		return done(request);
	}

	setupRequest(done, request);
}


function setupRequest (done, request) {

	var path = request.pathname,
		params = {},
		_getp = request.url.query ? request.url.query.split('&') : [],
		buildRequest = path.match(/js\/(\d*)\//i),
		moduleRequest = path.match(/\+([a-zA-Z0-9\/,_]*)-?([a-zA-Z0-9\/,_]*)?/i);

	if (!buildRequest) {
		request.invalid = true;
		return done(request);
	}

	_getp.map(function(p){
		var p = p.split('=');
		params[p[0]] = p[1];
	});

	request.build = +buildRequest[1] || ModuleRequestObject.build;
	request.debug = !!params.debug || ModuleRequestObject.debug;
	request.jmscb = params.cb || ModuleRequestObject.jmscb;
	request.locale = params.locale || ModuleRequestObject.locale;

	request.include = extract_modules(moduleRequest[1]);
	request.exclude = extract_modules(moduleRequest[2]);

	if (request.timer) {
		request.timer.push({requestSetupDone: +new Date()});
	}

	done(request);
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

	if (req.method == 'OPTIONS' && url.pathname == '/current') {
		request.buildNumberRequest = true;
		return done(request);
	}

	if (url.pathname == '/client.js') {
		request.client = true;
		request.include.push('jmsclient');
		return done(request);
	}

	if (netConf.cache) {
		storage.get(request.href, ifRequestExists.bind(null, done, request));
	} else {
		setupRequest(done, request);
	}

}

module.exports = ModuleRequest;
