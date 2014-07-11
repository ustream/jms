var _              = require('lodash');
var async          = require('async');
var paths          = require('../../lib/paths');
var storage        = require(paths.libdir + '/storage');
var Exception404   = require(paths.libdir + '/exception/404');
var Exception500   = require(paths.libdir + '/exception/500');



/**
 *
 * @param done
 * @param moduleRequest
 */
function loadModules (moduleRequest, done) {

	if (moduleRequest.timer) {
		moduleRequest.timer.push({loadingModules: +new Date()});
	}

	var m = moduleRequest.include.concat(moduleRequest.exclude),
		moduleList = [];

	if (m.indexOf('jmsclient') > -1) {

		var i = m.indexOf('jmsclient');

		m.splice(i, 1);

		storage.get('jmsclient', function (err, result) {

			moduleList.push(JSON.parse(result));

			if (m.length > 0) {
				fetchModules(moduleRequest, m, moduleList, done);
			} else {
				done(null, moduleRequest, moduleList);
			}
		});

	} else {
		fetchModules(moduleRequest, m, moduleList, done);
	}

}



/**
 * collect all module names by the transitive dependencies of the given apps
 *
 * @param {Array} what app list
 * @param {Object} modules modules collection
 * @returns {Array} modules list
 */
function collectModules (what, modules, onerror) {
	var returnSum = [];
	var len = what.length;

	for (var i = 0 ; i < len ; i++) {
		
		var name = what[i],
			m;

		m = _.find(modules, {module: name});

		if (!m) {
			onerror(new Exception404(name));
			return;
		}

		returnSum = returnSum.concat(m.transitive_dependencies);
		returnSum.push(name);
	}

	return _.uniq(returnSum);
}


/**
 *
 * @param done
 * @param moduleRequest
 * @param moduleList
 */
function parseModuleDeps (moduleRequest, moduleList, done) {

	if (moduleList.indexOf(null) > -1) {
		done(new Exception404());
		return;
	}

	if (moduleRequest.timer) {
		moduleRequest.timer.push({parsingModuleDeps: +new Date()});
	}

	// included stuff
	var includeSum = collectModules(moduleRequest.include, moduleList, done);

	// excluded stuff
	var excludeSum = collectModules(moduleRequest.exclude, moduleList, done);

	// trim loaded modules we dont want to serve
	var alreadyLoaded = _.filter(moduleList, function (module) {
		return moduleRequest.include.indexOf(module.module) > -1;
	});

	// trim modules from list that we already loaded
	var modulesToLoad = _.difference(includeSum, excludeSum);

	_.remove(modulesToLoad, function (module) {
		return !!_.find(alreadyLoaded, { module: module });
	});

	done(null, moduleRequest, modulesToLoad, alreadyLoaded);
}


/**
 *
 * @param moduleRequest
 * @param modules
 * @param moduleList
 * @param done
 */
function fetchModules (moduleRequest, modules, moduleList, done) {

	storage.hmget('source:' + moduleRequest.source, modules, function (err, result) {

		if (err) {
			done(new Exception500());
			return;
		}

		if (!result.push) {
			result = [result];
		}

		var moduleList = result.map(JSON.parse);

		if (moduleList.length < modules.length) {
			done(new Exception404());
			return;
		}

		done(null, moduleRequest, moduleList);

	});
}



/**
 *
 * @param moduleRequest
 * @param modulesToLoad
 * @param alreadyLoaded
 * @param done
 */
function loadModuleDeps (moduleRequest, modulesToLoad, alreadyLoaded, done) {

	if (moduleRequest.timer) {
		moduleRequest.timer.push({loadingModuleDeps: +new Date()});
	}

	if (modulesToLoad.length == 0) {
		done(null, alreadyLoaded);
		return;
	}

	storage.hmget('source:' + moduleRequest.source, modulesToLoad, function (err, result) {

		if (err) {
			done(new Exception500());
			return;
		}

		if (!result.push) {
			result = [result];
		}

		var moduleList = result.map(JSON.parse);

		if (moduleList.length < modulesToLoad.length) {
			done(new Exception404());
			return;
		}

		alreadyLoaded = moduleList.concat(alreadyLoaded);

		done(null, alreadyLoaded);
	});
	
}

/**
 *
 * @param moduleRequest
 * @param done
 */
module.exports = function (moduleRequest, done) {

	async.waterfall([
		loadModules.bind(null, moduleRequest),
		parseModuleDeps,
		loadModuleDeps
	], done);

}
