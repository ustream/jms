var _       = require('lodash');
var async   = require('async');
var paths   = require('../../conf/paths');
var context = require(paths.confdir + '/context');
var log            = require(paths.libdir + '/debug/log');


module.exports = function (next) {

	log.verbose('builder', 'context is local: ' + context.local);

	if (context.local) {

		(require(paths.libdir + '/locale/locale'))(function (locales) {

			return {

			}

		});

	} else {


		var build = require(paths.libdir + '/codebase/buildnumber');

		var preBuildDate = build.currentDate;

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
	}
}