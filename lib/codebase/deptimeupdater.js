var util        = require('util');
var events      = require('events');
var _           = require('lodash');

var paths       = require('../../lib/paths');
var log         = require(paths.libdir + '/debug/log');

var DependencyTimeUpdater = function () {
	events.EventEmitter.call(this);
}

util.inherits(DependencyTimeUpdater, events.EventEmitter);

/**
 *
 * @param flatDepTree
 * @param module
 */
function check (flatDepTree, module) {

	var currentmodule = module.module;
	var that = this;
	var modules = that.modules;

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
			check.call(that, flatDepTree, dep);
		}
	});
}

/**
 *
 * @param modules
 * @param next
 */
DependencyTimeUpdater.prototype.run = function (modules, next) {

	this.modules = modules;

	var flatDepTree = {};

	_.forEach(modules, function (module) {
		flatDepTree[module.module] = module.transitive_dependencies.concat(module.requirecalls);
		return module;
	});

	_.forEach(modules, check.bind(this, flatDepTree));

	this.emit('end', this.modules, next);
}

module.exports = DependencyTimeUpdater;

