var Transform     = require('stream').Transform;
var PassThrough   = require('stream').PassThrough;
var util          = require('util');
var streamCombine = require('stream-combiner');

var paths         = require('../../lib/paths');
var config        = require(paths.libdir + '/getconfig');
var pluginConfigs = config.plugins;
var log           = require(paths.libdir + '/debug/log');

var serverPlugins = streamCombine(new PassThrough({ objectMode: true }));

var pluginConf;

for (var pgin in pluginConfigs) {

	pluginConf = pluginConfigs[pgin];

	if (pluginConf.enabled) {
		var plug = require(paths.pluginsdir + '/' + pluginConf.name);
		if (plug.server) {
			var plugin = new plug.server({ objectMode: true }, pluginConf.options);
			plugin.setEncoding('utf8');
			serverPlugins = streamCombine(serverPlugins, plugin);
		}
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

	if (modulerequest.timer) {
		modulerequest.timer.push({runningPlugins: +new Date()});
	}

	serverPlugins.once('data', function serverPluginDataOnce (data) {
		var modules = JSON.parse(data).modules;
		done(null, modules);
	});
	serverPlugins.write(JSON.stringify({
		request: modulerequest,
		modules: moduleData
	}));
}

module.exports = ServerRunner;
