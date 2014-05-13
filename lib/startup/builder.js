var _                      = require('lodash');
var domain                 = require('domain');

var paths                  = require('../../conf/paths');
var contextConf            = require(paths.confdir + '/context');

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




function build (isRunning, sourceId, next) {

	log.verbose('builder',' is a build running? ' + isRunning );

	/*if (isRunning) {
		return next(null);
	}*/

	buildnumber.building(1); // "running" set to true

	log.info('builder', 'starting build');

	var moduleStream = new ModuleLoader({ objectMode: true }, sourceId);
	var deps = new DependencyMapper({ objectMode: true });
	var plugins = PluginManager;

	moduleStream.setEncoding('utf8');
	deps.setEncoding('utf8');
	plugins.setEncoding('utf8');


	var transdepcollector = new TransitiveDepCollector();
	var updatemtimes = new DependencyTimeUpdater();
	var modulehasher = new ModuleHasher({}, sourceId);

	buildDomain.add(transdepcollector);
	buildDomain.add(modulehasher);

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

		transdepcollector.on('end', updatemtimes.run.bind(updatemtimes));

		updatemtimes.on('end', modulehasher.run.bind(modulehasher));

		modulehasher.on('end', function (modules, next) {
			save(sourceId, modules, next);
		});

		// collect -> updatemtime -> hash
		transdepcollector.run(modules, next);

	});

}




/**
 *
 * @param build
 * @param modules
 * @param next
 */
function save (sourceId, modules, next) {
	if (buildDomain.collectedErrors.length > 0) {
		return next(buildDomain.collectedErrors);
	}

	log.info('builder', 'saving module data to storage');

	var saveData = {};
	var jmsClient = '';

	modules.forEach(function (module, i) {
		if (module.module == 'jmsclient') {
			jmsClient = JSON.stringify(module);
			return;
		}
		saveData[module.module] = JSON.stringify(module);
	});

	storage.hmset('source:' + sourceId, saveData, function (err) {

		if (err) {
			return finish(err, sourceId, next);
		}

		storage.set('jmsclient', jmsClient, function (err) {
			return finish(err, sourceId, next);
		});

	});

}

/**
 *
 * @param next
 */
function finish (err, sourceId, next) {
	log.info('builder', 'build done');

	if (err) {
		return next(err, sourceId);
	}

	buildnumber.building(false);

	next(err, sourceId);
}

/**
 *
 * @param is_deploy
 * @param next
 */
function prodBuild (sourceId, next) {

	buildnumber.running(function (err, running) {
		if (err) {
			return next(err);
		}
		running = +running;

		build(!!running, sourceId, next);

	});
}



module.exports = function (sourceId, next) {

	log.verbose('builder', 'context is local: ' + contextConf.local);

	if (contextConf.local) {

		(require(paths.libdir + '/locale/locale'))(function (locales) {

			return {} // todo

		});

	} else {
		prodBuild(sourceId, next);
	}
}
