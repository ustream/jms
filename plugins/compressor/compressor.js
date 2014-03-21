var Transform = require('stream').Transform;
var util      = require('util');

var uglify    = require('uglify-js');

function ModuleCompressor (streamConf, pluginConf) {
	Transform.call(this, streamConf);
	this.pluginConf = pluginConf;
}

util.inherits(ModuleCompressor, Transform);

ModuleCompressor.prototype._transform = function (chunk, encoding, done) {
	var data = JSON.parse(chunk.toString()), uglifyObject;
	try {
		uglifyObject = uglify.minify(data.source, {fromString: true});
		data.source = uglifyObject.code;
	} catch (e) {
		throw new Error('Uglify error in ' + data.module);
	}

	this.push(JSON.stringify(data));

	done();
};

module.exports = {
    deploy: ModuleCompressor
};
