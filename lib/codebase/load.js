



var path = require('path');
var fs = require('fs');
var paths   = require('../../conf/paths');
var modules = require(paths.confdir + '/modules');

var outermostPath;

var loadedModules = {};


function processDir (path) {
	var dir = fs.readdirSync(path);
	dir.map(function (name) {
		var item = path + '/' + name;

		if (name[0] !== '.') {
			processPathItem( item, fs.statSync(item) );
		}
	});
}


function processPathItem (path,  itemStat) {

	if(itemStat.isDirectory()) {
		processDir(path);
	}
	else if (itemStat.isFile()) {
		processFile(path);
	}
}


function processFile (path) {

	var module = path.replace(outermostPath, '').replace('.js','');

	var stat = fs.statSync(path);
	var data = fs.readFileSync(path, 'utf8');

	loadedModules[module] = {
		mtime: new Date(stat.mtime),
		path: path,
		source: data
	};
}


exports.from = function(callback) {
	outermostPath = modules.jsrepo + '/';

	processDir(modules.jsrepo);

	callback(null, loadedModules); // async js callback

}

exports.load = function(module, callback) {

	var path = modules.jsrepo + '/' + module + '.js';

	console.log(path)

	var data = fs.readFileSync(path, 'utf8');

	callback.call(this, {
		name: module,
		path: path,
		source: data
	});

}