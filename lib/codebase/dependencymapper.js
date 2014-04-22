var Transform = require('stream').Transform;
var util      = require('util');

var esprima   = require('esprima');
var escodegen = require('escodegen');
var traverse  = require("ast-traverse");

var paths     = require('../../conf/paths');
var codebase  = require(paths.confdir + '/codebase');
var log       = require(paths.libdir + '/debug/log');


function ESfindDependencies (moduleData) {

	var module = moduleData.module;

	var ast = esprima.parse(moduleData.source, {
		comment: true,
		range: true,
		tokens: true
	});

	moduleData.dependencies = [];

	var define = false;
	var updatedDefine = false;

	// has define
	//		has module name
	//			use module name
	//		 no module name
	//			give module name
	// no define

	traverse(ast, {
		pre: function(node, parent, prop, idx) {

			if (node.type === "CallExpression" &&
				node.callee.name === 'define'
				) {

				define = true;

				var depList = node.arguments[0];

				if (node.arguments.length > 2) {
					// has module name
					moduleData.module = node.arguments[0].value;
					depList = node.arguments[1];
				} else {
					// no module name yet

					updatedDefine = true;

					node.arguments.unshift({
						type: 'Literal',
						value: module,
						raw: '"' + escape(module) + '"',
						range: [node.arguments[0].range[0], node.arguments[0].range[0] + module.length]
					});
				}

				depList.elements.forEach(function (arrayItem) {
					if (['require', 'exports', 'module'].indexOf(arrayItem.value) < 0) {
						moduleData.dependencies.push(arrayItem.value);
					}
				});

			}

		}
	});

	if (define && updatedDefine) {

		ast = escodegen.attachComments(ast, ast.comments, ast.tokens);
		moduleData.source = escodegen.generate(ast, {
			comment: true
		});

	} else {
		moduleData.source += ';define("' + module + '",[]);';
	}

	return moduleData;

}



function DependencyMapper () {
	Transform.apply(this, arguments);
}

util.inherits(DependencyMapper, Transform);

DependencyMapper.prototype._transform = function (chunk, encoding, done) {
	var data = JSON.parse(chunk.toString());

	data = ESfindDependencies(data);

	this.push(JSON.stringify(data));

	done();
}

module.exports = DependencyMapper;