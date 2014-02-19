
var Exception415 = function(path) {
	var msg = 'Unsupported request ' + path;
	this.name = 'Unsupported';
	this.message = msg;
	Error.call(this, msg);
};
Exception415.prototype = new Error();
Exception415.prototype.statusCode = 415;


module.exports = Exception415;