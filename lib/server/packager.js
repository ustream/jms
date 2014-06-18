var _              = require('lodash');
var async            = require('async');
var paths          = require('../../lib/paths');
var storage        = require(paths.libdir + '/storage');
var Exception500   = require(paths.libdir + '/exception/500');
/**
 *
 * @param moduleData
 * @param done
 */
function getSource (moduleData, modulerequest, done) {

	var source = _.pluck(moduleData, 'source');
	modulerequest.originals = _.pluck(moduleData, 'originalModule');

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
		source = [
			'window["',
			modulerequest.jmscb,
			'"] = function() { ' +
				'var ret = {};' +
				'ret.payload = function () {',
				source,
				'};' +
				'ret.original=\' ',
					JSON.stringify(modulerequest.originals),
				'\';' +
				'ret.list="',
				modulerequest.include.join('%%%'),
				'";' +
				'return ret;',
			'};'
		].join('');
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


	if (modulerequest.timer) {
		modulerequest.timer.push({preparePackage: +new Date()});
	}

	async.waterfall([
		getSource.bind(null, moduleData, modulerequest),
		ordered.bind(null, modulerequest),
		prepare.bind(null, moduleData)
	], done);
}
