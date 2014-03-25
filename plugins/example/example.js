var TransformStream = require('stream').Transform;
var util            = require('util');




function DeployRunner (streamConf, pluginConf) {
	TransformStream.call(this, streamConf);
	this.pluginConf = pluginConf;
}

util.inherits(DeployRunner, TransformStream);

DeployRunner.prototype._transform = function (chunk, encoding, done) {

	var data = JSON.parse(chunk.toString());

	data.example = 'example-plugin';
	data.options = this.pluginConf;

	var pushDone = this.push(JSON.stringify(data));


	if (pushDone) {
		done();
	}
}





function ServerRunner (streamConf, pluginConf) {
	TransformStream.call(this, streamConf);
	this.pluginConf = pluginConf;
}

util.inherits(ServerRunner, TransformStream);

ServerRunner.prototype._transform = function (chunk, encoding, done) {

	var pushDone = this.push(chunk);

	if (pushDone) {
		done();
	}
}



module.exports = {
	deploy: DeployRunner,
	server: ServerRunner
}