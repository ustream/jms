
var paths          = require('../../conf/paths');
var codebase       = require(paths.confdir + '/codebase');
var process_events = require(paths.libdir + '/process-events');
var cacheAlias     = require(paths.libdir + '/cache/alias');
var buildNumber    = require(paths.libdir + '/codebase/buildnumber');

var log = function (msg) {
	process_events.send(process_events.LOG, msg, 'cache-mapper');
}


var _ = require('lodash');






module.exports = function(modules, callback) {

	var aliases = {};

	_.each(modules, function(data, name) {

		if(name.indexOf('apps/') > -1 ||
			name.indexOf('bootstrap') > -1) {

			var last_modified = modules[name].mtime;

			/*			if (name == 'apps/TestApp') {
			 log(name)
			 log(last_modified)
			 }
			 */
			_.each( modules[name].transitive_dependencies, function(dep) {

				/*				if (name == 'apps/TestApp') {
				 log(dep)
				 }
				 */
				if (modules[dep].mtime.getTime() > last_modified.getTime()) {
					last_modified = modules[dep].mtime;
				}
			});

			/*
			 if (name == 'apps/TestApp') {
			 log(name)
			 log(last_modified)
			 }
			 */
			var alias = cacheAlias.createAlias(name, last_modified);

			aliases[name] = {
				alias: alias,
				last_modified: last_modified
			};
		}
	});


	// log(JSON.stringify(aliases))


	// lecsereljuk mindenhol az aliasokra
	_.each(modules, function(module, name) {
		_.each(aliases, function (aliasObject, replaced) {
			module.source = module.source.replace(new RegExp(replaced,'g'), aliasObject.alias);

			if (module.mtime.getTime() < aliasObject.last_modified.getTime()) {
				module.mtime = aliasObject.last_modified;
			}

		});
	});


	// find the latest modified time in the whole codebase
	// that will be the time of the build, if new build needed

	var latestMTime = _.max(_.uniq(_.pluck(modules, 'mtime')));

	if (+latestMTime > +buildNumber.currentDate) {
		buildNumber.increment(latestMTime);
	}

	var alias = cacheAlias.createAlias('cachemap', buildNumber.currentDate, true);

	var aliasName = "JSMS_" + alias;

	modules[alias] = {
		mtime: new Date(buildNumber.currentDate),
		path: '../js/loader.js',
		source: aliasName + " = " + cacheAlias.getMapJSON() + ";",
		dependencies: [],
		transitive_dependencies: []
	}

	if (modules[codebase.init_app]) {

		modules[codebase.init_app].transitive_dependencies.map(function (dep) {
			modules[dep].source = modules[dep].source.replace(new RegExp("JSMS_cacheMap",'g'), aliasName);
		})

		modules[codebase.init_app].source = modules[codebase.init_app].source.replace(new RegExp("JSMS_cacheMap",'g'), aliasName);

		modules[codebase.init_app].transitive_dependencies.unshift(alias);
	}
	callback(null, modules);


}
