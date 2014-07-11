var util        = require('util');
var events      = require('events');
var _           = require('lodash');

var paths       = require('../../lib/paths');
var log         = require(paths.libdir + '/debug/log');

var TransitiveDepCollector = function () {
	events.EventEmitter.call(this);
}

util.inherits(TransitiveDepCollector, events.EventEmitter);

/**
 *
 * @param modules
 * @param next
 */
TransitiveDepCollector.prototype.run = function (modules, next) {
	this.modules = modules;

	var ml = modules.length;

	var collector = this;

	// if it has deps, collect deps of deps
	this.modules.forEach(function (module) {

		var moduleData = module;

		log.verbose('builder', 'getting transitive dependencies for ' + module.module);

		if (moduleData.dependencies) {
			moduleData.transitive_dependencies = [];
			moduleData.dependencies.map(collector.walker.bind(collector, module));
		}

		// circular deps contain the module itself, no need for that
		moduleData.transitive_dependencies = moduleData.transitive_dependencies.filter(function (m) {
			return m != moduleData.module;
		});

		moduleData.transitive_dependencies.reverse();

	});


	this.emit('end', this.modules, next);
}

/**
 *
 * @param currentModule
 * @param moduleName
 */
TransitiveDepCollector.prototype.walker = function (currentModule, moduleName) {

	if (['require', 'exports', 'module'].indexOf(moduleName) > -1) {
		return;
	}

	var module = _.find(this.modules, {module : moduleName});

	if (currentModule.transitive_dependencies.indexOf(moduleName) < 0) {
		currentModule.transitive_dependencies.unshift(moduleName);
	}

	if (!module) {
		this.emit('error', {
			type: 'dependencyError', message: 'in ' + currentModule.module + ' - Missing file in dependency definition: "' + moduleName + '"'
		});
		return;
	}

	var unhandledDepCount = _.difference(module.dependencies, currentModule.transitive_dependencies).length;

	if (unhandledDepCount > 0 && module && module.dependencies instanceof Array) {
		module.dependencies.map(this.walker.bind(this, currentModule));
	}
}

module.exports = TransitiveDepCollector;

