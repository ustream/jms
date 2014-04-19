var util        = require('util');
var events      = require('events');
var _           = require('lodash');
var paths       = require('../../conf/paths');
var log         = require(paths.libdir + '/debug/log');

var TransitiveDepCollector = function () {
	events.EventEmitter.call(this);
}

util.inherits(TransitiveDepCollector, events.EventEmitter);


TransitiveDepCollector.prototype.run = function (build, modules, next) {
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
	});

	this.emit('end', build, this.modules, next)
}

TransitiveDepCollector.prototype.walker = function (currentModule, moduleName) {

	var module = _.find(this.modules, {module : moduleName});

	currentModule.transitive_dependencies.push(moduleName);

	if (!module) {
		this.emit('error', {type: 'dependencyError', message: 'in ' + currentModule.module + ' - Missing file in dependency definition: "' + moduleName + '"'});
	}

	if (module && module.dependencies instanceof Array) {
		module.dependencies.map(this.walker.bind(this, currentModule));
	}
}

module.exports = TransitiveDepCollector;

