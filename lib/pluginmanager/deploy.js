var Transform    = require('stream').Transform;
var PassThrough  = require('stream').PassThrough;
var es           = require('event-stream');

var paths        = require('../../conf/paths');
var pluginConfigs   = require(paths.confdir + '/plugins');
var log          = require(paths.libdir + '/debug/log');
var PluginRunner = require(paths.libdir + '/pluginmanager/runner');

var deployPlugins = es.pipeline(new PassThrough({ objectMode: true }));

var pluginConf;

for (var pgin in pluginConfigs) {

	pluginConf = pluginConfigs[pgin];
	if (pluginConf.enabled) {

		var plug = require(paths.pluginsdir + '/' + pgin);

		if (plug.deploy) {
			var plugin = new plug.deploy({ objectMode: true }, pluginConf.options);
			plugin.setEncoding('utf8');
			deployPlugins = es.pipeline(deployPlugins, plugin);
		}
		/*else if (plug.deploy && !(plug.deploy instanceof Transform)) {
			log.error('pluginmanager', 'plugin ' + pgin + '.deploy is not an instance of stream.Transform')
		}*/
	}

}

module.exports = new PluginRunner({ objectMode: true }, deployPlugins);