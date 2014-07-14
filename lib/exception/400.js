var Exception400 = function(name) {
	var msg = 'Bad request: ' + name;
	var err = new Error(msg);
	err.name = name;
	err.message = msg;
	err.statusCode = 400;

	return err;
};

module.exports = Exception400;
