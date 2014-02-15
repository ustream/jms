var _       = require('lodash');
var async   = require('async');
var paths   = require('../../conf/paths');
var context = require(paths.confdir + '/context');
var log     = require(paths.libdir + '/debug/log');

var buildnumber = require(paths.libdir + '/codebase/buildnumber');

var codebase = require(paths.confdir + '/codebase');

var storage = require(paths.libdir + '/storage');


var ModuleLoader = require(paths.libdir + '/codebase/moduleloader.js');
var DependencyMapper = require(paths.libdir + '/codebase/dependencymapper.js');
var I18nCollector = require(paths.libdir + '/codebase/i18ncollector.js');


function build (is_deploy, build, isRunning, next) {

	log.verbose('builder', 'current build: ' + build + ' is a build running? ' + isRunning + ' is this a new deploy: ' + is_deploy);

	if (!is_deploy && !!build && !isRunning) {
		return next(null);
	}

	if (!is_deploy && !!build && isRunning) {
		return next(null);
	}

	// do some actual stuffs

	if (typeof build !== 'number') {
		build = 0;
	}

	build += 1;

	buildnumber.building(true);

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

		key = build + ":" + key;

		storage.set(key, JSON.stringify(data));
	});


	i18n.on('end', function() {
		log.info('builder', 'build done');

		buildnumber.building(false);
		buildnumber.increment(+new Date(), function (newBuildNumber) {
			next(null);

		});

	});

}




module.exports = function (is_deploy, next) {

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

				build(is_deploy, number, !!running, next);
			})
		});

	}
}