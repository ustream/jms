var _              = require('lodash');
var paths          = require('../../conf/paths');
var netConf        = require(paths.confdir + '/network');
var process_events = require(paths.libdir + '/process-events');
var storage        = require(paths.libdir + '/storage');
var modulerequest  = require(paths.libdir + '/server/modulerequest');

var log = function (msg) {
	process_events.send(process_events.LOG, msg, 'worker');
}

/**
 * collect all module names by the transitive dependencies of the given apps
 *
 * @param {Array} what app list
 * @param {Object} modules modules collection
 * @returns {Array} modules list
 */
function collectModules (what, modules) {


	var returnSum = [];
	var len = what.length;

	for (var i = 0 ; i < len ; i++) {
		var name = what[i],
			m = _.find(modules, {module: name});

		if (!m) {
			throw new NotFoundException(name);
		}

		returnSum = returnSum.concat(m.transitive_dependencies);
		returnSum.push(name);
	}

	returnSum = _.uniq(returnSum);

	return returnSum;
}


/**
 *
 * @param err
 * @param done
 * @param modulereq
 * @param moduleList
 */
function parseModuleDeps (err, done, modulereq, moduleList) {

	// included stuff
	var includeSum = collectModules(modulereq.include, moduleList);

	// excluded stuff
	var excludeSum = collectModules(modulereq.exclude, moduleList);

	// done
	// trim loaded modules we dont want to serve
	var alreadyLoaded = _.filter(moduleList, function (module) {
		return modulereq.include.indexOf(module.module) > -1;
	});

	// trim modules from list that we already loaded
	var modulesToLoad = _.difference(includeSum, excludeSum);

	_.remove(modulesToLoad, function (module) {
		return !!_.find(alreadyLoaded, { module: module });
	});

	done(null, modulesToLoad, alreadyLoaded);
}


/**
 *
 * @param done
 * @param modulereq
 */
function loadRequestedModules (modulereq, done) {
	var m = modulereq.include.concat(modulereq.exclude),
		ml = m.length,
		moduleList = [];

	m.forEach(function (mod, i) {

		storage.get([modulereq.build,':',mod].join(''), function (err, module) {

			if (err) {
				done(new Exception500(mod));
				return;
			}

			if (module === null) {
				done(new Exception404(mod));
				return;
			}

			moduleList = moduleList.concat(JSON.parse(module));

			if (i === ml-1) {
				parseModuleDeps(null, done, modulereq, moduleList);
			}

		}.bind(i))
	});
}




/**
 *
 * @param {ClientRequest} request
 * @param {ServerResponse} response
 */
module.exports = function (request, response) {

	var modulereq = modulerequest(request);

	loadRequestedModules(modulereq, function (err, requiredModuleList, alreadyLoaded) {

		if (err) {
			throw err;
		}

		console.log(requiredModuleList);


		requiredModuleList.foreach(function (mod) {

			storage.get([modulereq.build,':',mod].join(''), function (err, module) {
				if (err) {
					throw new Exception500(mod);
					return;
				}

				if (module === null) {
					throw new Exception404(mod);
					return;
				}

				alreadyLoaded.push(JSON.parse(module));

			})
		})



	});



}