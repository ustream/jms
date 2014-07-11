var _              = require('lodash');
var async            = require('async');
var paths          = require('../../lib/paths');
var storage        = require(paths.libdir + '/storage');
var Exception500   = require(paths.libdir + '/exception/500');
/**
 *
 * @param moduleData
 * @param done
 * @param moduleRequest
 */
function getSource (moduleData, moduleRequest, done) {

	var source = _.pluck(moduleData, 'source');

	if (moduleRequest.debug) {
		moduleRequest.originalRes = _.pluck(moduleData, 'originalModule');
		moduleRequest.originalReq = _.pluck(_.filter(moduleData, function (module) {
			return moduleRequest.include.indexOf(module.module) > -1;
		}), 'originalModule');
	}

	done(null, source.join(';'));
}

/**
 *
 * @param moduleRequest
 * @param source
 * @param done
 */
function ordered (moduleRequest, source, done) {

	var manifest;

	if (moduleRequest.debug) {
		manifest = {
			requested: moduleRequest.originalReq,
			received: moduleRequest.originalRes
		};
	}

	if (moduleRequest.jmscb) {
		source = [
			'window["',
			moduleRequest.jmscb,
			'"] = function() { ' ,
				'var ret = {};' ,
				'ret.payload = function () {',
					source,
				'};' ,
				moduleRequest.debug ? 'ret.manifest=\' ' + JSON.stringify(manifest) + '\';' : '',
				'ret.list="',
					moduleRequest.include.join('|'),
				'";' ,
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
