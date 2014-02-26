var TransformStream = require('stream').Transform;
var util            = require('util');



function DeployRunner () {
	TransformStream.apply(this, arguments);


	this.on('drain', function () {
		console.log('plugin example event', 'drain');
	})

	this.on('finish', function () {
		console.log('plugin example event', 'finish');
	})

	this.on('pipe', function () {
		console.log('plugin example event', 'pipe');
	})

	this.on('unpipe', function () {
		console.log('plugin example event', 'unpipe');
	})

}

util.inherits(DeployRunner, TransformStream);


DeployRunner.prototype._transform = function (chunk, encoding, done) {

	console.log('plugin example transform' );

	var data = JSON.parse(chunk.toString());

	data.example = 'example-plugin';

	var pushDone = this.push(JSON.stringify(data));


	if (pushDone) {
		done();
	}
}




DeployRunner.prototype._flush = function (done) {

	console.log('plugin example flush' );

	if (this._lastLineData) {
		this.push(this._lastLineData);
	}
	this._lastLineData = null;

	done();

}








module.exports = {

	deploy: new DeployRunner({ objectMode: true })

}