

// TODO: handle defined AMD modulenames

var defineGrep = /define[\s]*?\([\s\w]*?\[[\s\w]*?([\w"'\/, \n\t\.]*)[\s\w]*?\]/i,
	currentModule,
	modules;

function find_deps (modules) {

	var moduleData;

	for (var module in modules) {
		moduleData = modules[module];

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

			modules[module].source = moduleData.source.replace(/define[\s]*?\([\s\w]*?"?.*?"?,?[\s\w]*?\[/i,'define("' + module + '",[');

			// deps
			modules[module].dependencies = deps;

		} else if (match) {
			// no deps, or not AMD module

			// add AMD modulename
			// overwrite if defined already, fuck it
			modules[module].source = moduleData.source.replace(/define[\s]*?\([\s\w]*?"?.*?"?,?[\s\w]*?\[/i,'define("' + module + '",[');

			// no deps
			modules[module].dependencies = [];

		} else {
			// not an AMD module

			// dummy define for AMD
			modules[module].source += ';define("' + module + '",[]);';
			// no deps
			modules[module].dependencies = [];

		}

	}

	return modules;
}




function find_transitive_deps (_modules) {

	var currentModule;


	function dep_walker (module) {

		_modules[currentModule].transitive_dependencies.push(module);

		if (!_modules[module]) {
			throw Error('in ' + currentModule + ' - Missing file in dependency definition: "' + module + '"')
		}

		if (_modules[module].dependencies instanceof Array) {
			_modules[module].dependencies.map(dep_walker);
		}
	}
	// ha van dependecy, azok depjeit is kigyujteni

	for (var module in _modules) {

		var moduleData = _modules[module];

		if (moduleData.dependencies) {
			moduleData.transitive_dependencies = [];
			currentModule = module;
			moduleData.dependencies.map(dep_walker);
		}
	}

	return _modules;
}


exports.in_modules = function(_modules, _callback) {

	modules = find_deps(_modules);
	modules = find_transitive_deps(modules);

	_callback(null, modules);

}

exports.of = function (module) {
	var mod = {};
	mod[module.name] = module;

	return find_deps(mod);
}

exports.resolve_transitive_deps = function (_modules) {
	return find_transitive_deps(_modules);
}