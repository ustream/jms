#!/usr/bin/env node

var fs        = require('fs');
var http      = require('http');
var async     = require('async');

var paths     = require('../conf/paths');
var proc      = require(paths.confdir + '/proc');
var log       = require(paths.libdir + '/debug/log');

// TODO php addscriptek egy request legyenek

// TODO: vezerles (status)

// TODO: releasetags / featurebranch kezeles


async.waterfall([
	require(paths.libdir + '/startup/checkdirs'),
	require(paths.libdir + '/startup/clusters'),
], function (err, result) {


	if (err) {
		log.error('error accured');
		throw err;
	}

	// result now equals 'done'
});