var paths    = require('./paths');
var codebase = {

	jsrepo: paths.basedir + '/js',

	exportfile: paths.datadir + '/js-module-server-export.json',

	// apps to pre-package upon deploy
	// useful for large, really-really static groups,
	// base libs, frameworks, etc
	prepackage: [
		'bootstrap'
	],

	init_app: 'loader',

    loadHidden: false,

};


module.exports = codebase;
