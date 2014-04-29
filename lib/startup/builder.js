var _                      = require('lodash');
var domain                 = require('domain');

var paths                  = require('../../conf/paths');
var contextConf            = require(paths.confdir + '/context');
var codebaseConf           = require(paths.confdir + '/codebase');
var log                    = require(paths.libdir + '/debug/log');
var storage                = require(paths.libdir + '/storage');
var PluginManager          = require(paths.libdir + '/pluginmanager/deploy');
var buildnumber            = require(paths.libdir + '/codebase/buildnumber');
var ModuleLoader           = require(paths.libdir + '/codebase/moduleloader');
var DependencyMapper       = require(paths.libdir + '/codebase/dependencymapper');

var TransitiveDepCollector = require(paths.libdir + '/codebase/transitivedeps');
var ModuleHasher           = require(paths.libdir + '/codebase/modulehasher');
var DependencyTimeUpdater  = require(paths.libdir + '/codebase/deptimeupdater');

var buildDomain = domain.create();

buildDomain.collectedErrors = [];

buildDomain.on('error', function (data) {
	if(data.type && data.type === 'dependencyError') {
		buildDomain.collectedErrors.push(data.message);
	} else {
		// TODO
		console.log('build error', data );
	}
});

var collector = new TransitiveDepCollector();
var updatemtimes = new DependencyTimeUpdater();
var modulehasher = new ModuleHasher();

buildDomain.add(collector);
buildDomain.add(modulehasher);



function build (is_deploy, build, isRunning, next) {

	log.verbose('builder', 'current build: ' + build + ' is a build running? ' + isRunning + ' is this a new deploy: ' + is_deploy);

	if (!is_deploy && !!build && !isRunning) {
		return next(null);
	}

	if (!is_deploy && !!build && isRunning) {
		return next(null);
	}

	if (typeof build === 'object') {
		build = 0;
	} else {
		build = parseInt(build, 10);
	}

	build += 1;

	buildnumber.building(true);

	log.info('builder', 'starting build');

	var moduleStream = new ModuleLoader({ objectMode: true }, codebaseConf.jsrepo);
	var deps = new DependencyMapper({ objectMode: true });
	var plugins = PluginManager;

	moduleStream.setEncoding('utf8');
	deps.setEncoding('utf8');
	plugins.setEncoding('utf8');



	var modules = [];

	var stream = moduleStream
		.pipe(deps)
		.pipe(plugins);

	stream.on('error', function (data) {
//		console.log('stream error');
	});

	stream.on('drain', function () {
//		console.log('drain' );
	});

	stream.on('data', function (data) {
		modules.push(JSON.parse(data));
	});

	stream.on('end', function() {



		// 1 collect
		// 2 update mtime
		// 3 hash it



		modulehasher.on('end', function (build, modules, next) {
			save(build, modules, next);
		});

		updatemtimes.on('end', modulehasher.run.bind(modulehasher));


		collector.on('end', updatemtimes.run.bind(updatemtimes));
		collector.run(build, modules, next);

	});

}




/**
 *
 * @param build
 * @param modules
 * @param next
 */
function save (build, modules, next) {
	if (buildDomain.collectedErrors.length > 0) {
		return next(buildDomain.collectedErrors);
	}

	log.info('builder', 'saving module data to storage');

	var saveData = {};

	modules.forEach(function (module, i) {
		saveData[module.module] = JSON.stringify(module);
	});

	storage.hmset('codebase', saveData, function (err) {
		finish(err, next);
	});

}

/**
 *
 * @param next
 */
function finish (err, next) {
	log.info('builder', 'build done');

	if (err) {
		return next(err);
	}

	buildnumber.building(false);
	buildnumber.increment(+new Date(), function (err, newBuildNumber) {

		if (err) {
			return next(err);
		}

		storage.purgeBuild(newBuildNumber-5, next);
	});
}

/**
 *
 * @param is_deploy
 * @param next
 */
function prodBuild (is_deploy, next) {

	buildnumber.current(function (err, number) {
		if (err) {
			return next(err);
		}

		buildnumber.running(function (err, running) {
			if (err) {
				return next(err);
			}
			build(is_deploy, number, !!running, next);
		});
	});
}



module.exports = function (is_deploy, next) {

	log.verbose('builder', 'context is local: ' + contextConf.local);

	if (contextConf.local) {

		(require(paths.libdir + '/locale/locale'))(function (locales) {

			return {} // todo

		});

	} else {
		prodBuild(is_deploy, next);
	}
}
