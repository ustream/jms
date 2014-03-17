var TransformStream = require('stream').Transform;
var util            = require('util');




function DeployRunner () {
	TransformStream.apply(this, arguments);
}

util.inherits(DeployRunner, TransformStream);

DeployRunner.prototype._transform = function (chunk, encoding, done) {

	//console.log('plugin example transform' );

	var data = JSON.parse(chunk.toString());

	data.example = 'example-plugin';

	var pushDone = this.push(JSON.stringify(data));


	if (pushDone) {
		done();
	}
}





function ServerRunner () {
	TransformStream.apply(this, arguments);
}

util.inherits(ServerRunner, TransformStream);

ServerRunner.prototype._transform = function (chunk, encoding, done) {

	//console.log('plugin example transform server run' );

	var pushDone = this.push(chunk);


	if (pushDone) {
		done();
	}
}



module.exports = {
	deploy: DeployRunner,
	server: ServerRunner
}