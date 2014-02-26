var Transform = require('stream').Transform;
var util      = require('util');

var uglify         = require('uglify-js');
var paths     = require('../../conf/paths');
var log       = require(paths.libdir + '/debug/log');

util.inherits(ModuleCompressor, Transform);

function ModuleCompressor () {
	Transform.apply(this, arguments);
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

ModuleCompressor.prototype._transform = function (chunk, encoding, done) {


	var data = JSON.parse(chunk.toString());


	log.verbose('modulecompressor', 'transform ' + data.module  + ' ' + data.example);


	try {
		var uglifyObject = uglify.minify(data.source, {fromString: true});
		data.source = uglifyObject.code;
	} catch (e) {
		throw new Error('Uglify error in ' + data.module);
	}

	this.push(JSON.stringify(data));

	done();
}

module.exports = ModuleCompressor;