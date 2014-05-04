var util        = require('util');
var events      = require('events');
var _           = require('lodash');
var crc         = require("sse4_crc32");

var esprima     = require('esprima');
var escodegen   = require('escodegen');
var traverse    = require("estraverse");

var paths       = require('../../conf/paths');
var storage     = require(paths.libdir + '/storage');
var log         = require(paths.libdir + '/debug/log');

var ModuleHasher = function (options, sourceId) {
	events.EventEmitter.call(this);

	this.sourceId = sourceId;
}

util.inherits(ModuleHasher, events.EventEmitter);

/**
 *
 * @param module
 * @returns {Object}
 */
function hashName (sourceId, module) {

	module.originalModule = module.module;

	if (module.module !== 'jmsclient') {
		module.module = crc.calculate(
			[module.module, module.mtime].join('')
		).toString(16);
	}
	storage.hset('map:' + sourceId, module.originalModule, module.module);

	return module;
}

/**
 *
 * @param modules
 * @returns {Array}
 */
function createModuleNameMap (modules) {
	var mmap = {};
	_.forEach(modules, function (module) {
		mmap[module.originalModule] = module.module;
	});
	return mmap;
}

/**
 *
 * @param item
 * @returns {*}
 */
function hashArrayItem (item) {
	return this[item];
}

/**
 *
 * @param modules
 * @param next
 */
ModuleHasher.prototype.run = function (modules, next) {

	this.modules = _.forEach(modules, hashName.bind(null, this.sourceId));

	var moduleNameCollection = createModuleNameMap(this.modules);

	this.modules.forEach(function (module) {
		var moduleData = module;

		if (module === 'jmsclient') {
			return;
		}

		var ast = esprima.parse(moduleData.source);

		//log.verbose('builder', 'getting transitive dependencies for ' + module.module);

		traverse.traverse(ast, {
			enter: function(node) {
				if (node.type === "Literal") {
					if (!!moduleNameCollection[node.value] && typeof moduleNameCollection[node.value] === 'string') {
						node.value = moduleNameCollection[node.value];
						node.raw = '\'' + moduleNameCollection[node.value] + '\'';
					}
				}
			}
		});

		module.source = escodegen.generate(ast);
		module.dependencies = _.map(module.dependencies, hashArrayItem, moduleNameCollection);
		module.transitive_dependencies = _.map(module.transitive_dependencies, hashArrayItem, moduleNameCollection);

	});

	this.emit('end', this.modules, next);
}

module.exports = ModuleHasher;

