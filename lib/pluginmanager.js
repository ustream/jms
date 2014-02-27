var Transform   = require('stream').Transform;
var PassThrough = require('stream').PassThrough;
var util        = require('util');

var es          = require('event-stream');

var paths       = require('../conf/paths');
var pluginConf  = require(paths.confdir + '/plugins');
var log         = require(paths.libdir + '/debug/log');




var serverPlugins = new PassThrough({ objectMode: true });


var previousPlug = deployPlugins;

var deployPlugins = es.pipeline(new PassThrough({ objectMode: true }));





for (var pgin in pluginConf) {

	if (pluginConf[pgin].enabled) {

		var plug = require(paths.pluginsdir + '/' + pgin);

		if (plug.deploy && plug.deploy instanceof Transform) {

			console.log(pgin );

			deployPlugins = es.pipeline(deployPlugins, plug.deploy)


		} else if (plug.deploy && !(plug.deploy instanceof Transform)) {
			log.error('pluginmanager', 'plugin ' + pgin + '.deploy is not an instance of stream.Transform')
		}

		if (plug.server && plug.server instanceof Transform) {

			serverPlugins = serverPlugins.pipe(plug.server);

		} else if (plug.server && !(plug.server instanceof Transform)) {
			log.error('pluginmanager', 'plugin ' + pgin + '.server is not an instance of stream.Transform')
		}

	}

}

function PluginRunner (options, pluginPipeline) {
	Transform.call(this, options);
	this.plugins = pluginPipeline;
}

util.inherits(PluginRunner, Transform);
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

module.exports = {
	Deploy: new PluginRunner({ objectMode: true }, deployPlugins),
	Server: new PluginRunner({ objectMode: true }, serverPlugins)
}