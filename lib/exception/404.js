var Exception404 = function(name) {
	var msg = 'Unknown module: ' + name;
	var err = new Error(msg);
	err.name = name;
	err.message = msg;
	err.statusCode = 404;

	return err;
};

module.exports = Exception404;
