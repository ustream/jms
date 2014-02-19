var _              = require('lodash');
var async            = require('async');
var uglify = require('uglify-js');
var paths          = require('../../conf/paths');
var process_events = require(paths.libdir + '/process-events');
var storage        = require(paths.libdir + '/storage');
var Exception500   = require(paths.libdir + '/exception/500');
/**
 *
 * @param moduleData
 * @param done
 */
function getSource (moduleData, done) {

	var source = _.pluck(moduleData, 'source');
	done(null, source.join(';'));
}

/**
 *
 * @param source
 * @param moduleData
 * @param done
 */
function locale (modulerequest, source, done) {

	if (modulerequest.locale) {

		var ulms_package = '' +
			'if(!window.ustream){' +
			'	window.ustream={}' +
			'}' +
			'ustream = window.ustream;' +
			'if(!ustream.labels){' +
			'	ustream.labels={}' +
			'}' +
			'(function(l){';

		var locale = modulerequest.locale;

		/*
		for (var p = 0, plen = package.length ; p < plen ; p++) {

			var i18n = modules[package[p]].i18n;

			for (var i = 0, ilen = i18n.length ; i < ilen ; i++) {
				ulms_package += 'l["' + i18n[i] + '"]="' + locales[locale].data[i18n[i]] + '";';
			}
		}
		*/

		ulms_package += '})(ustream.labels);';

		source = ulms_package + source;



	}

	done(null, source);

}

/**
 *
 * @param modulerequest
 * @param source
 * @param done
 */
function ordered (modulerequest, source, done) {

	if (modulerequest.jmscb) {
		source = 'window["'+modulerequest.jmscb+'"] = function () {' + source + '};';
	}

	done(null, source);
}

/**
 *
 * @param modulerequest
 * @param source
 * @param done
 */
function compress (modulerequest, source, done) {

	try {
		var uglifyObject = uglify.minify(source, {fromString: true});
		var final_code = uglifyObject.code;
	} catch (e) {
		return done(new Exception500());
	}

	done(null, final_code)
}

/**
 *
 * @param modulerequest
 * @param source
 * @param done
 */
function fif (modulerequest, source, done) {

	if (modulerequest.fif) {
		source = '(function(window) {' +
			'var document = window.document;' +
			'var define = window.define;' +
			source +
			'}(parent.window));'
	}

	done(null, source);
}

/**
 *
 * @param modulerequest
 * @param source
 * @param done
 */
function prepare (moduleData, source, done) {


	var mtimes = _.pluck(moduleData, 'mtime');

	source += '\n';

	/*
	 package lastModified date
	 */
	var lastModified = new Date(0);
	for (var t = 0, mLen = mtimes.length; t < mLen ; t++) {
		mtimes[t] = new Date(mtimes[t]);

		if (mtimes[t].getTime() > lastModified.getTime()) {
			lastModified = mtimes[t];
		}
	}

	/*
	 get length
	 */
	var byteLength = Buffer.byteLength(source, 'utf8');

	done(null, source, byteLength, lastModified);

}




module.exports = function (modulerequest, moduleData, done) {



	async.waterfall([
		getSource.bind(null, moduleData),
		locale.bind(null, modulerequest),
		ordered.bind(null, modulerequest),
		compress.bind(null, modulerequest),
		fif.bind(null, modulerequest),
		prepare.bind(null, moduleData)
	], done);


}