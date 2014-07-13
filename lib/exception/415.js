var Exception415 = function(path) {
	var msg = 'Unsupported request ' + path;
	var err = new Error(msg);
	err.name = 'Unsupported';
	err.message = msg;
	err.statusCode = 415;

	return err;
};

module.exports = Exception415;
