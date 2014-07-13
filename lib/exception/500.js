var Exception500 = function() {
	var msg = 'We are sorry';
	var err = new Error(msg);
	err.name = 'Internal error';
	err.message = msg;
	err.statusCode = 500;

	return err;
};

module.exports = Exception500;
