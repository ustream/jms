var util        = require('util');
var events      = require('events');
var _           = require('lodash');
var crc         = require("sse4_crc32");

var esprima     = require('esprima');
var escodegen   = require('escodegen');
var traverse    = require("ast-traverse");

var paths       = require('../../conf/paths');
var storage     = require(paths.libdir + '/storage');
var log         = require(paths.libdir + '/debug/log');

var ModuleHasher = function () {
	events.EventEmitter.call(this);
}

util.inherits(ModuleHasher, events.EventEmitter);

function hashName (module) {

	module.originalModule = module.module;

	if (module.module !== 'jmsclient') {
		module.module = crc.calculate(
			[module.module, module.mtime].join('')
		).toString(16);
	}
	storage.hset('map', module.originalModule, module.module);

	return module;
}

function createModuleNameMap (modules) {
	var mmap = {};
	_.forEach(modules, function (module) {
		mmap[module.originalModule] = module.module;
	});
	return mmap;
}

function hashArrayItem (item) {
	return this[item];
}

ModuleHasher.prototype.run = function (build, modules, next) {

	this.modules = _.forEach(modules, hashName);

	var moduleNameCollection = createModuleNameMap(this.modules);

	this.modules.forEach(function (module) {
		var moduleData = module;

		if (module === 'jmsclient') {
			return;
		}

		//log.verbose('builder', 'getting transitive dependencies for ' + module.module);

		var ast = esprima.parse(moduleData.source, {
			comment: true,
			range: true,
			tokens: true
		});
		traverse(ast, {
			pre: function(node, parent, prop, idx) {
				if (node.type === "Literal") {
					if (!!moduleNameCollection[node.value]) {
						node.value = moduleNameCollection[node.value];
						node.raw = '"' + moduleNameCollection[node.value] + '"';
					}
				}
			}
		});

		ast = escodegen.attachComments(ast, ast.comments, ast.tokens);
		module.source = escodegen.generate(ast, {
			comment: true
		});

		module.dependencies = _.map(module.dependencies, hashArrayItem, moduleNameCollection);
		module.transitive_dependencies = _.map(module.transitive_dependencies, hashArrayItem, moduleNameCollection);

	});

	this.emit('end', build, this.modules, next)
}

module.exports = ModuleHasher;

