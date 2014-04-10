var Transform = require('stream').Transform;
var util      = require('util');

var uglify    = require('uglify-js');

var paths     = require('../../conf/paths');
var log       = require(paths.libdir + '/debug/log');


var EventEmitter = require('events').EventEmitter

function ModuleCompressor (streamConf, pluginConf) {
	Transform.call(this, streamConf);
	this.pluginConf = pluginConf;
}

util.inherits(ModuleCompressor, Transform);

ModuleCompressor.prototype._transform = function (chunk, encoding, done) {

	var err = false;
	var data = JSON.parse(chunk.toString());
	var uglifyObject;

	log.verbose('compressing ', data.module);

	try {
		uglifyObject = uglify.minify(data.source, {fromString: true});
		data.source = uglifyObject.code;
	} catch (e) {

		//TODO
		//this.emit('error', 'Uglify error in ' + data.module + ' at line ' + e.line + ' : ' + e.message)

		throw 'Uglify error in ' + data.module + ' at line ' + e.line + ' : ' + e.message;
	}

	this.push(JSON.stringify(data));
	done();
};

module.exports = {
    deploy: ModuleCompressor
};
