var paths    = require('../lib/paths');

module.exports = {

	/**
	 * codebase configuration
	 *
	 * this is where you can define multiple codebase repos by their base path
	 * all modules in each repo are relatively named to their root path
	 */
	codebase: {

		sources: {

			'live': {
				root: paths.basedir + '/examples/live',
				versions: 5,
				loadHidden: false
			},

			'dev': {
				root: paths.basedir + '/examples/dev',
				versions: 5,
				loadHidden: false
			}

		}

	},

	/**
	 * network configuration
	 */
	network: {

		host: '127.0.0.1',

		port: 1337,

		/**
		 * internal cache turned on or off
		 */
		cache: true
	},


	debug: {

		/**
		 * set logging level verbose|info|warn|error
		 */
		loglevel: 'verbose',

		/**
		 * enable debugging timers, to benchmark inner operations
		 * timer output is sent out in response headers
		 */
		timer: true

	},

	plugins: [

		{
			name: 'jshint',
			enabled: false
		},

		{
			name: 'example',
			enabled: true,
			options: {
				option_for_plugin: true
			}
		},

		{
			name: 'compressor',
			enabled: true
		}

	],

	storage: {

		redis: {
			host: '127.0.0.1',
			port: 6379,
			database: 0
		}

	},

	monit: {

		enabled: true,

		host: '127.0.0.1',

		port: 57475,

		interval: 1000,

		max_requests: 1000

	},

	context: {

		/**
		 * local context will read modules from file on each request
		 * to support development on local machines
		 */
		local: false

	},

	cacheControl: {
		// lib/server/responsehandler.js
		responseHandler:  'public, max-age=2500834, s-maxage=2500834',
		// lib/server/cachedresponse.js
		cachedResponse: 'public, max-age=2500834, s-maxage=2500834',
		// lib/server/redirectresponse.js
		redirectResponse: 'max-age=300, s-maxage=300'
	}

};
