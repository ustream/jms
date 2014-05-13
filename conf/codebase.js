var paths    = require('./paths');
var codebase = {

	jsrepo: paths.basedir + '/examples/js',

	sources: {

		'live': {
			versions: 5,
			root: paths.basedir + '/examples/live'
		},

		'dev': {
			versions: 5,
			root: paths.basedir + '/examples/dev'
		}

	},

	loadHidden: false,

};


module.exports = codebase;
