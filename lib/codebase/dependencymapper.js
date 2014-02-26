
var Transform = require('stream').Transform;
var util      = require('util');

var paths     = require('../../conf/paths');
var codebase  = require(paths.confdir + '/codebase');
var log       = require(paths.libdir + '/debug/log');

var defineGrep = /define[\s]*?\([\s\w]*?\[[\s\w]*?([\w"'\/, \n\t\.]*)[\s\w]*?\]/i;

util.inherits(DependencyMapper, Transform);


function findDependencies (moduleData) {

	var module = moduleData.module;

	var match = moduleData.source.match(defineGrep);

	if (match && match[1]) {

		var deps = match[1]
			.replace(/\s/gi,'')
			.replace(/"/gi,'')
			.replace(/'/gi,"")
			.replace(" ","")
			.split(',');

		// add AMD modulename
		// overwrite if defined already, fuck it

		moduleData.source = moduleData.source.replace(/define[\s]*?\([\s\w]*?"?.*?"?,?[\s\w]*?\[/i,'define("' + module + '",[');

		// deps
		moduleData.dependencies = deps;

	} else if (match) {
		// no deps, or not AMD module

		// add AMD modulename
		// overwrite if defined already, fuck it
		moduleData.source = moduleData.source.replace(/define[\s]*?\([\s\w]*?"?.*?"?,?[\s\w]*?\[/i,'define("' + module + '",[');

		// no deps
		moduleData.dependencies = [];

	} else {
		// not an AMD module

		// dummy define for AMD
		moduleData.source += ';define("' + module + '",[]);';
		// no deps
		moduleData.dependencies = [];

	}

	return moduleData;
}



function DependencyMapper () {
	Transform.apply(this, arguments);

}



DependencyMapper.prototype._transform = function (chunk, encoding, done) {

	log.verbose('dependencymapper', 'transform');

	var data = JSON.parse(chunk.toString());

	data = findDependencies(data);

	this.push(JSON.stringify(data));

	done();

}



module.exports = DependencyMapper;