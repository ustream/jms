var _           = require('lodash');
var paths       = require('../../conf/paths');
var exportData  = require(paths.libdir + '/codebase/exporter');
var buildNumber = require(paths.libdir + '/codebase/buildnumber');


var c = exportData.content;

// manage cache alias mappings
// only for apps

// create - run on deploy
//      read to memory, update it, write back to file

// example
//      app/Foo -> AB32FA



// find - run by requests
//      find by cachemap in memory


function save (data) {

	var c = exportData.content;

	c.cacheMap = data;

	exportData.content = c;

}



function getRandomInt (min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomIntSet (amount, min, max) {
	var numset = [];
	while (numset.length < amount) {
		var r = getRandomInt(min, max);
		if (numset.indexOf(r) == -1) {
			numset.push(r)
		}
	}

	return numset;
}

function generate_alias (name, last_modified) {

	var count = 0;
	var timestamp = +new Date(last_modified)

	for (var i = 0, l = name.length ; i < l ; i++) {
		count += name.charCodeAt(i);
	}

	var str = (count + timestamp).toString(36);
	var uniqueName = '';

	var numset = getRandomIntSet(4, 0, str.length);

	for (var i = 0, l = str.length ; i < l ; i++) {
		var char = str[i];
		if (numset[0] == i) {
			char = char.toUpperCase();
			numset.shift();
		}
		uniqueName += char;
	}

	return uniqueName;
}


function clear_deprecated (map) {
	_.each(map, function (mapItem, key) {
		mapItem.map = mapItem.map.slice(0,3);
	});

	return map;

}




exports.createAlias = function (name, last_modified, alias_only_no_save) {

	if (!c.cacheMap) {
		c.cacheMap = {};
	}

	var cmap = c.cacheMap;


	if (alias_only_no_save) {
		var alias = generate_alias(name, last_modified);
		return alias;
	}

	// van e mar
	// 		1 nincs -
	// 			tegyuk bele
	//				uj entry
	// 		2 van
	//			a letezo date < last_modified?
	// 				3 igen
	//					uj entry
	// 				4 nem
	//					nem kell valtoztatni,
	//
	// 		csere az entry-re mindenhol a modulokban

	var alias = false;

	if (!cmap[name]) {
		// 		1 nincs -
		// 			tegyuk bele
		//				uj entry

		cmap[name] = {
			lastModified: +new Date(last_modified),
			map: []
		}

		alias = generate_alias(name, last_modified);
		cmap[name].map.unshift(alias);

	} else if (+new Date(cmap[name].lastModified) < +new Date(last_modified)) {
		// 		2 van
		//			a letezo date < last_modified?

		// 				3 igen
		//					uj entry
		alias = generate_alias(name, last_modified);
		cmap[name].map.unshift(alias);
		cmap[name].lastModified = last_modified;

	} else {
		// 				4 nem
		//					nem kell valtoztatni,

		alias = cmap[name].map[0];
	}

	cmap = clear_deprecated(cmap);

	save(cmap);

	return alias;

}

exports.findAlias = function (alias) {


	var map = exportData.content.cacheMap;
	var foundModule = '';

	_.each(map, function (mapItem, module) {
		var found = mapItem.map.indexOf(alias);
		if (found > -1) {
			foundModule = module;
		}
	});

	return foundModule;

}

exports.getMapJSON = function () {
	var c = exportData.content;
	return JSON.stringify(c);
}

exports.getMapString = function () {
	var c = exportData.content;
	return c.cacheMap.toString();
}