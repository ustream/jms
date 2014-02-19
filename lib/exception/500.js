
var Exception500 = function() {
	var msg = 'We are sorry';
	this.name = 'Internal error';
	this.message = msg;
	Error.call(this, msg);
};
Exception500.prototype = new Error();
Exception500.prototype.statusCode = 500;


module.exports = Exception500;