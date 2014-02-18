


var Url            = require('url');

var ModuleRequestObject = {
	build:   1,
	debug:   false,
	fif:     false,
	jmscb:   false,
	locale:  'en_US',
	include: [],
	exclude: []
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
 * @param url
 * @returns {ModuleRequestObject}
 * @constructor
 */
function ModuleRequest (request) {
	var url = Url.parse(request.url);
		request = Object.create(ModuleRequestObject),
		path = url.pathname,
		params = {},
		_getp = url.query ? url.query.split('&') : [],
		buildRequest = path.match(/js\/(\d*)\//i),
		moduleRequest = path.match(/\+([a-zA-Z0-9\/,_]*)-?([a-zA-Z0-9\/,_]*)?/i);

	_getp.map(function(p){
		var p = p.split('=');
		params[p[0]] = p[1];
	});

	request.pathname = url.pathname;

	request.build = +buildRequest[1] || ModuleRequestObject.build;
	request.debug = !!params.debug || ModuleRequestObject.debug;
	request.fif = !!params.fif || ModuleRequestObject.fif;
	request.jmscb = params.cb || ModuleRequestObject.jmscb;
	request.locale = params.locale || ModuleRequestObject.locale;

	request.include = extract_modules(moduleRequest[1]);
	request.exclude = extract_modules(moduleRequest[2]);

	return request;
}

module.exports = ModuleRequest;