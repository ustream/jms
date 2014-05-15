var Transform   = require('stream').Transform;
var util        = require('util');

var paths       = require('../../lib/paths');
var log         = require(paths.libdir + '/debug/log');


/**
 * Stream object to be piped on the deploy process
 *
 * @param options
 * @param pluginPipeline
 * @constructor
 */
function PluginRunner (options, pluginPipeline) {
	Transform.call(this, options);

	this.plugins = pluginPipeline;

	var runner = this;

	this.plugins.on('error', function (data) {
//		console.log('Error in plugins', data);
		runner.emit('error', data)
//		runner.resume()
	});

	this.plugins.on('unpipe', function () {
	//	console.log('plugins unpipe' );
	});
	this.plugins.on('drain', function () {
	//	console.log('plugins drain' );
	});
	this.plugins.on('end', function () {
	//	console.log('plugins end' );
	});
}

util.inherits(PluginRunner, Transform);

/**
 * run received chunk over the plugin pipes, push back the received data to the original piped stream
 *
 * @param chunk
 * @param encoding
 * @param done
 * @private
 */
PluginRunner.prototype._transform = function (chunk, encoding, done) {
	var runner = this;

	this.plugins.once('data', function (chunk_from_plugins) {
		runner.push(chunk_from_plugins);
		done();
	});

	this.plugins.write(chunk, encoding);
}


module.exports = PluginRunner;