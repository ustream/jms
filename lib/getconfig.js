
var fs    = require('fs');

var paths = require('../lib/paths');
var conf  = paths.config + '/config';

var argv  = require('minimist')(process.argv.slice(2));

if (argv.config) {
	if (fs.existsSync(paths.config + '/' + argv.config)) {
		conf = paths.config + '/' + argv.config.replace('.js', '');
	} else if (fs.existsSync(paths.config + '/' + argv.config + '.js')) {
		conf = paths.config + '/' + argv.config;
	} else if (fs.existsSync(paths.config + '/config.' + argv.config + '.js')) {
		conf = paths.config + '/config.' + argv.config;
	} else if (fs.existsSync(argv.config)) {
		conf = argv.config;
	}
}

module.exports = require(conf);