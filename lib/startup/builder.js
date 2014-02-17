var _                = require('lodash');
var async            = require('async');

var paths            = require('../../conf/paths');
var contextConf      = require(paths.confdir + '/context');
var codebaseConf     = require(paths.confdir + '/codebase');
var log              = require(paths.libdir + '/debug/log');
var buildnumber      = require(paths.libdir + '/codebase/buildnumber');
var storage          = require(paths.libdir + '/storage');
var ModuleLoader     = require(paths.libdir + '/codebase/moduleloader.js');
var DependencyMapper = require(paths.libdir + '/codebase/dependencymapper.js');
var I18nCollector    = require(paths.libdir + '/codebase/i18ncollector.js');

var Locales    = require(paths.libdir + '/locale/locale.js');


function build (is_deploy, build, isRunning, next) {

	log.verbose('builder', 'current build: ' + build + ' is a build running? ' + isRunning + ' is this a new deploy: ' + is_deploy);

	if (!is_deploy && !!build && !isRunning) {
		return next(null);
	}

	if (!is_deploy && !!build && isRunning) {
		return next(null);
	}

	// do some actual stuffs

	console.log(typeof build, build);

	if (typeof build === 'object') {
		build = 0;
	} else {
		build = parseInt(build, 10);
	}

	build += 1;

	buildnumber.building(true);

	log.info('builder', 'starting build');

	var moduleStream = new ModuleLoader(codebaseConf.jsrepo);
	var deps = new DependencyMapper();
	var i18n = new I18nCollector();

	var modules = [];

	moduleStream.setEncoding('utf8');
	deps.setEncoding('utf8');
	i18n.setEncoding('utf8');

	moduleStream.pipe(deps);
	deps.pipe(i18n);


	i18n.on('data', function (data) {
		modules.push(JSON.parse(data));
	});


	i18n.on('end', function() {
		transitiveDeps(build, modules, next);
	});

}

/**
 *
 * @param build
 * @param modules
 * @param next
 */
function transitiveDeps(build, modules, next) {

	log.info('builder', 'calculating transitive dependencies');

	var currentModule;

	function dep_walker (currentModule, moduleName) {

		var module = _.find(modules, {module : moduleName});

		currentModule.transitive_dependencies.push(moduleName);

		if (!module) {
			throw Error('in ' + currentModule.module + ' - Missing file in dependency definition: "' + moduleName + '"')
		}

		if (module.dependencies instanceof Array) {
			module.dependencies.map(dep_walker.bind(null, currentModule));
		}
	}

	// if it has deps, collect deps of deps
	modules.forEach(function (module, i) {
		var moduleData = module;

		log.verbose('builder', 'getting transitive dependencies for ' + module.module);

		if (moduleData.dependencies) {
			moduleData.transitive_dependencies = [];
			currentModule = module;
			moduleData.dependencies.map(dep_walker.bind(null, module));
		}
	});

	save(build, modules, next);
}

/**
 *
 * @param build
 * @param modules
 * @param next
 */
function save (build, modules, next) {

	var l = modules.length;

	log.info('builder', 'saving module data to storage');

	modules.forEach(function (module, i) {

		var key = module.module;
		var data = module;

		key = build + ":" + key;

		storage.set(key, JSON.stringify(data));

		if (i === l-1) {
			finish(next);
		}
	});
}

/**
 *
 * @param next
 */
function finish (next) {
	log.info('builder', 'build done');

	buildnumber.building(false);
	buildnumber.increment(+new Date(), function (newBuildNumber) {
		next(null);
	});
}


module.exports = function (is_deploy, next) {

	log.verbose('builder', 'context is local: ' + contextConf.local);

	if (contextConf.local) {

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
				//Locales(function () {})

			})
		});

	}
}