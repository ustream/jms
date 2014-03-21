var Transform     = require('stream').Transform;
var PassThrough   = require('stream').PassThrough;
var util          = require('util');
var es            = require('event-stream');

var paths         = require('../../conf/paths');
var pluginConfigs = require(paths.confdir + '/plugins');
var log           = require(paths.libdir + '/debug/log');

var serverPlugins = es.pipeline(new PassThrough({ objectMode: true }));

var pluginConf;

for (var pgin in pluginConfigs) {

	pluginConf = pluginConfigs[pgin];

	if (pluginConf.enabled) {

		var plug = require(paths.pluginsdir + '/' + pgin);

		if (plug.server) {
			var plugin = new plug.server({ objectMode: true }, pluginConf.options);
			plugin.setEncoding('utf8');
			serverPlugins = es.pipeline(serverPlugins, plugin);
		}/* else if (plug.server && !(plug.server instanceof Transform)) {
			log.error('pluginmanager', 'plugin ' + pgin + '.server is not an instance of stream.Transform')
		}*/
	}
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
		var modules = JSON.parse(data).modules;
		done(null, modules);
	});
	serverPlugins.write(JSON.stringify({
		request: modulerequest,
		modules: moduleData
	}));
}

module.exports = ServerRunner;