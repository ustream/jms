
var fs       = require('fs');
var paths    = require('../../conf/paths');
var codebase = require(paths.confdir + '/codebase');

var tpl = {
	buildNumber: 0,
	buildDate: 0
};

function create_export_file () {

	var data = tpl;

	write_export_file(tpl);

	return data;
}

function read_export_file () {


	var path = codebase.exportfile;

	if (fs.existsSync(path)) {
		var data = fs.readFileSync(path, 'utf8');

		data = JSON.parse(data);
	} else {
		var data = create_export_file();
	}

	return data;
}

function write_export_file (data) {

	var fd = fs.openSync(codebase.exportfile, 'w');
	var data = JSON.stringify(data);

	fs.writeSync(fd, data);
	fs.closeSync(fd);

}

var content = read_export_file();

module.exports = {

	get content () {
		return content;
	},

	set content (data) {
		content = data;
		write_export_file(data);
	}

}
