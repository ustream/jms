var Transform   = require('stream').Transform;
var util        = require('util');

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

	// chunk -> pluginStream
	// pluginStream 'data' -> push, done

	var runner = this;

	this.plugins.once('data', function (chunk_from_plugins) {
		runner.push(chunk_from_plugins);
		done();
	});
	this.plugins.write(chunk, encoding);
}


module.exports = PluginRunner