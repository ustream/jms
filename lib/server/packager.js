var _              = require('lodash');
var async            = require('async');
var paths          = require('../../conf/paths');
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

/**
 *
 * @param modulerequest
 * @param moduleData
 * @param done
 */
module.exports = function (modulerequest, moduleData, done) {

	async.waterfall([
		getSource.bind(null, moduleData),
		ordered.bind(null, modulerequest),
		fif.bind(null, modulerequest),
		prepare.bind(null, moduleData)
	], done);


}