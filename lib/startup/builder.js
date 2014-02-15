var _       = require('lodash');
var async   = require('async');
var paths   = require('../../conf/paths');
var context = require(paths.confdir + '/context');
var log     = require(paths.libdir + '/debug/log');

var buildnumber = require(paths.libdir + '/codebase/buildnumber');

var codebase = require(paths.confdir + '/codebase');

var storage = require(paths.libdir + '/storage');


var ModuleLoader = require(paths.libdir + '/codebase/load.js');
var DependencyMapper = require(paths.libdir + '/codebase/deps.js');
var I18nCollector = require(paths.libdir + '/codebase/i18n.js');


function build (build, isRunning, next) {

	log.verbose('builder', 'current build: ' + build + ' is a build running? ' + isRunning);

	console.log(!!build );

	if (!!build && !isRunning) {
		return next(null);
	}

	if (!!build && isRunning) {
		return next(null);
	}


	log.info('builder', 'starting build');

	var moduleStream = new ModuleLoader(codebase.jsrepo);
	var deps = new DependencyMapper();
	var i18n = new I18nCollector();

	moduleStream.setEncoding('utf8');
	deps.setEncoding('utf8');
	i18n.setEncoding('utf8');

	moduleStream.pipe(deps);
	deps.pipe(i18n);


	i18n.on('data', function (data) {
		var key = JSON.parse(data).module;
		var data = JSON.parse(data)

		storage.set(key, JSON.stringify(data));
	});


	i18n.on('end', function() {
		log.info('builder', 'build done');
		next(null);
	});




}




module.exports = function (next) {

	log.verbose('builder', 'context is local: ' + context.local);

	if (context.local) {

		(require(paths.libdir + '/locale/locale'))(function (locales) {

			return {

			}

		});

	} else {


		buildnumber.current(function (err, number) {

			if (err) {
				return next(err);
			}

			buildnumber.running(function (err, running) {

				if (err) {
					return next(err);
				}

				build(number, !!running, next);

			})



		});



		/*


		buildNumber

		buildRunning



		ha van buildNumber es  buildRunning = 0
			akkor mehet a worker a buildNumberrel

		 ha van buildNumber es  buildRunning = 1
		 	buildRunning = 0
		 	csinaljon buildet
		 	utana mehet a worker a buildNumberrel

		 ha nincs buildNumber
		 	csinaljon buildet
			utana mehet a worker a buildNumberrel







			// no ebbol egy szep streamet csinaljunk

			// walk codebase
			// read modules
			// check deps
			// i18n
			// save to storage



		async.waterfall([
			require(paths.libdir + '/codebase/load').from, // locales
			require(paths.libdir + '/codebase/dependencies').in_modules, // modules, locales
			require(paths.libdir + '/cache/mapper'), // modules, locales
			require(paths.libdir + '/codebase/i18n')  // modules, locales
		], function (err, modules) {

			if (err) {
				throw err;
			}
			var returnData;

			if (preBuildDate < build.currentDate) {
				returnData = modules;

			} else {
				returnData = false;
			}


			next(null, returnData);

		});


		 */

	}
}