
var Exception404 = function(name) {
	var msg = 'Unknown module: ' + name;
	this.name = name;
	this.message = msg;
	Error.call(this, msg);
};
Exception404.prototype = new Error();
Exception404.prototype.statusCode = 404;


module.exports = Exception404;