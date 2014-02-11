#!/usr/bin/env node

var fs        = require('fs');
var http      = require('http');
var async     = require('async');

var paths     = require('../conf/paths');
var proc      = require(paths.confdir + '/proc');

var checkdirs = require(paths.libdir + '/startup/checkdirs');
//var clusters  = require(paths.libdir + '/startup/clusters');

// TODO php addscriptek egy request legyenek
// TODO szebb filebetoltes :(

// TODO: vezerles (status)

// TODO: elozo buildnumber-ek is elerhetoek legyenek (failsafe)

// TODO: releasetags / featurebranch kezeles




async.waterfall([
	checkdirs,
	//clusters,
], function (err, result) {

	console.dir(err)

	// result now equals 'done'
});