var _       = require('lodash');
var async   = require('async');
var paths   = require('../../conf/paths');
var context = require(paths.confdir + '/context');

module.exports = function (next) {
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
			require('./cache-mapper'), // modules, locales
			require('./parse-locales')  // modules, locales
		], function (err, modules) {


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