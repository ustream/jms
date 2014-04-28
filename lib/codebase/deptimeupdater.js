var util        = require('util');
var events      = require('events');
var _           = require('lodash');

var paths       = require('../../conf/paths');
var storage     = require(paths.libdir + '/storage');
var log         = require(paths.libdir + '/debug/log');

var DependencyTimeUpdater = function () {
	events.EventEmitter.call(this);
}

util.inherits(DependencyTimeUpdater, events.EventEmitter);

DependencyTimeUpdater.prototype.run = function (build, modules, next) {

	this.modules = modules;

	var flatDepTree = {};

	// TODO - ide fel kell venni a require hivasokat is!!!
	// de a kiszolgalashoz nem!!!

	_.forEach(modules, function (module) {
		flatDepTree[module.module] = module.transitive_dependencies;
		return module;
	});

	_.forEach(modules, function (module) {

		var currentmodule = module.module;

		var k = Object.keys(flatDepTree).filter(function (mod) {

			if (flatDepTree[mod]) {
				return flatDepTree[mod].reduce(function (acc, dependency) {
					if (dependency === currentmodule) {
						acc = mod;
					}
					return acc;
				}, false);
			}
		}, this);

		k.forEach(function (dependent) {

			var dep = _.find(modules, {module: dependent});

			// update dependent's mod time to dependency's mod time, since
			// it creates a new version of the dep subtree
			if (new Date(dep.mtime) < new Date(module.mtime)) {
				dep.mtime = module.mtime;
			}
		});
	});

	this.emit('end', build, this.modules, next);
}

module.exports = DependencyTimeUpdater;

