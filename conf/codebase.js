var paths    = require('./paths');
var codebase = {

	jsrepo: paths.basedir + '/examples/js',

	sources: {

		'live': {
			root: paths.basedir + '/examples/live'
		},

		'dev': {
			root: paths.basedir + '/examples/dev'
		}

	},




	loadHidden: false,

};


module.exports = codebase;
