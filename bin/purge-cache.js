#!/usr/bin/env node

var paths          = require('../lib/paths');
var cachepurge     = require(paths.libdir + '/cachepurge');

var argv = require('minimist')(process.argv.slice(2));

var args = argv._;

function done (err) {
	if (err) {
		return process.exit(1);
	}

	return process.exit(0);
}


if (args[0] && args[1]) {
	cachepurge.deleteKeys(null, [args[0]], [args[1]], done);
} else if (args[0] && !args[1]) {
	cachepurge.deleteSource(null, [args[0]], done);
} else {
	cachepurge.deleteAll(done);
}