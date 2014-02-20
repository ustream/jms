var Url                 = require('url');
var ModuleRequestObject = {
	build:   {
		value: 1,
		configurable:true,
		writable: true
	},
	debug:   {
		value: false,
		configurable:true,
		writable: true
	},
	fif:     {
		value: false,
		configurable:true,
		writable: true
	},
	jmscb:   {
		value:false,
		configurable:true,
		writable: true
	},
	locale:  {
		value:'en_US',
		configurable:true,
		writable: true
	},
	include: {
		value:[],
		configurable:true,
		writable: true
	},
	exclude: {
		value: [],
		configurable:true,
		writable: true
	},
	invalid: {
		value: false,
		configurable:true,
		writable: true
	},
	client: {
		value: false,
		configurable:true,
		writable: true
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
 * @param url
 * @returns {ModuleRequestObject}
 * @constructor
 */
function ModuleRequest (req) {
	var url = Url.parse(req.url),
		request = Object.create({}, ModuleRequestObject),
		path = url.pathname,
		params = {},
		_getp = url.query ? url.query.split('&') : [],
		buildRequest = path.match(/js\/(\d*)\//i),
		moduleRequest = path.match(/\+([a-zA-Z0-9\/,_]*)-?([a-zA-Z0-9\/,_]*)?/i);

	request.pathname = url.pathname;

	if (req.method == 'OPTIONS' && url.pathname == '/current') {
		request.buildNumberRequest = true;
		return request;
	}

	if (url.pathname == '/client.js') {
		request.client = true;
		request.include.push('jmsclient')
		return request;
	}

	_getp.map(function(p){
		var p = p.split('=');
		params[p[0]] = p[1];
	});

	//'/favicon.ico' bazmeg


	if (!buildRequest) {
		request.invalid = true;
		return request;
	}

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