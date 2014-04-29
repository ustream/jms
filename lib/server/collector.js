var _              = require('lodash');
var async          = require('async');
var paths          = require('../../conf/paths');
var storage        = require(paths.libdir + '/storage');
var Exception404   = require(paths.libdir + '/exception/404');
var Exception500   = require(paths.libdir + '/exception/500');

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
			m = _.find(modules, {module: name});

		if (!m) {
			onerror(new Exception404(name));
			return;
		}

		returnSum = returnSum.concat(m.transitive_dependencies);
		returnSum.push(name);
	}

	returnSum = _.uniq(returnSum);

	return returnSum;
}


/**
 *
 * @param done
 * @param modulereq
 * @param moduleList
 */
function parseModuleDeps (modulereq, moduleList, done) {


	if (modulereq.timer) {
		modulereq.timer.push({parsingModuleDeps: +new Date()});
	}

	// included stuff
	var includeSum = collectModules(modulereq.include, moduleList, done);

	// excluded stuff
	var excludeSum = collectModules(modulereq.exclude, moduleList, done);

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

	done(null, modulereq, modulesToLoad, alreadyLoaded);
}


/**
 *
 * @param done
 * @param modulereq
 */
function loadModules (modulereq, done) {

	if (modulereq.timer) {
		modulereq.timer.push({loadingModules: +new Date()});
	}

	var m = modulereq.include.concat(modulereq.exclude),
		ml = m.length,
		moduleList = [];

	m.forEach(function (mod, i) {

		storage.get([mod].join(''), function (err, module) {

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
				done(null, modulereq, moduleList)
			}

		}.bind(i));
	});
}


/**
 *
 * @param modulereq
 * @param modulesToLoad
 * @param alreadyLoaded
 * @param done
 */
function loadModuleDeps (modulereq, modulesToLoad, alreadyLoaded, done) {



	if (modulereq.timer) {
		modulereq.timer.push({loadingModuleDeps: +new Date()});
	}

	var l = modulesToLoad.length;

	if (modulesToLoad.length == 0) {
		done(null, alreadyLoaded);
		return;
	}

	modulesToLoad.forEach(function (mod, i) {

		storage.get([mod].join(''), function (err, module) {

			if (err) {
				done(new Exception500(mod));
				return;
			}

			if (module === null) {
				done(new Exception404(mod));
				return;
			}

			alreadyLoaded.push(JSON.parse(module));

			if (i === l-1) {
				done(null, alreadyLoaded);
			}

		})
	})
}

/**
 *
 * @param modulereq
 * @param done
 */
module.exports = function (modulereq, done) {

	async.waterfall([
		loadModules.bind(null, modulereq),
		parseModuleDeps,
		loadModuleDeps
	], done);

}
