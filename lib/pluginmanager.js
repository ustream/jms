

var Transform   = require('stream').Transform;
var util        = require('util');
var async               = require('async');

var paths       = require('../conf/paths');
var pluginConf  = require(paths.confdir + '/plugins');
var log         = require(paths.libdir + '/debug/log');



var deployplugins = [];
var serverplugins = [];

for (var pgin in pluginConf) {

	if (pluginConf[pgin].enabled) {

		var plug = require(paths.pluginsdir + '/' + pgin );

		if (plug.deploy) {
			deployplugins.push(plug.deploy)
		}

		if (plug.server) {
			serverplugins.push(plug.server)
		}


	}

}

if (deployplugins.length > 0) {
	var firstDeployPlugin = deployplugins.shift();
}




function DeployPluginRunner () {

	Transform.call(this);

}

util.inherits(DeployPluginRunner, Transform);







DeployPluginRunner.prototype._transform = function (chunk, encoding, done) {

	log.verbose('DeployPluginRunner', 'transform');





if (deployplugins.length > 0 || firstDeployPlugin) {
	var data = JSON.parse(chunk.toString());

	async.waterfall(
		[firstDeployPlugin.bind(null, data)].concat(deployplugins),
		function (err, result) {

			if (err) {
				throw err;
				return;
			}
			this.push(JSON.stringify(result));
			done();
		}.bind(this)


	)

} else {

	this.push(chunk);
	done();
}








}








module.exports = {
	Deploy: DeployPluginRunner
}