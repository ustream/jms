var Transform   = require('stream').Transform;
var PassThrough = require('stream').PassThrough;
var util        = require('util');

var es          = require('event-stream');

var paths       = require('../conf/paths');
var pluginConf  = require(paths.confdir + '/plugins');
var log         = require(paths.libdir + '/debug/log');

var serverPlugins = es.pipeline(new PassThrough({ objectMode: true }));
var deployPlugins = es.pipeline(new PassThrough({ objectMode: true }));

for (var pgin in pluginConf) {

	if (pluginConf[pgin].enabled) {

		var plug = require(paths.pluginsdir + '/' + pgin);

		// ezt valasszuk kulon a futasnak megfeleloen


		if (plug.deploy && plug.deploy instanceof Transform) {
			deployPlugins = es.pipeline(deployPlugins, plug.deploy);
		} else if (plug.deploy && !(plug.deploy instanceof Transform)) {
			log.error('pluginmanager', 'plugin ' + pgin + '.deploy is not an instance of stream.Transform')
		}

		if (plug.server && plug.server instanceof Transform) {
			serverPlugins = es.pipeline(serverPlugins, plug.server);
		} else if (plug.server && !(plug.server instanceof Transform)) {
			log.error('pluginmanager', 'plugin ' + pgin + '.server is not an instance of stream.Transform')
		}

	}

}

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


/**
 *
 * function to be inserted in an async.waterfall
 *
 * @param modulerequest
 * @param moduleData
 * @param done
 * @constructor
 */
function ServerRunner (modulerequest, moduleData, done) {
	serverPlugins.once('data', function (data) {
		done(null, data.modules);
	});
	serverPlugins.write({
		request: modulerequest,
		modules: moduleData
	});
}


module.exports = {
	Deploy: new PluginRunner({ objectMode: true }, deployPlugins),
	Server: ServerRunner
}