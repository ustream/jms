#!/usr/bin/env node

var paths          = require('../conf/paths');
var codebaseConf   = require(paths.confdir + '/codebase');
var checkdirs      = require(paths.libdir + '/startup/checkdirs');
var cachepurge     = require(paths.libdir + '/cachepurge');
var builder        = require(paths.libdir + '/startup/builder')
var startTime = +new Date();

function doneBuild (err) {
	var log = require(paths.libdir + '/debug/log');
	var doneTime = +new Date();

	var elapsed = Math.round((doneTime - startTime) / 1000);

	process.stdout.write(['deploy time (sec): ', elapsed ].join('') + '\n');

	if (err) {
		log.error('jms-deploy', err);
		process.exit(1);
		return;
	}

	cachepurge.deleteAll(donePurge);
}

function donePurge (err) {

	var log = require(paths.libdir + '/debug/log');
	if (err) {
		log.warn('jms-deploy', 'cache was not purged successfully');
	} else {
		log.info('jms-deploy', 'cache purged');
	}

	log.info('jms-deploy', 'done');
	process.exit(0);

}

function runBuilder () {
	var log = require(paths.libdir + '/debug/log');

	console.log(process.argv );

	if (process.argv[2]) {
		builder(process.argv[2], doneBuild);
		return;
	}

	Object.keys(codebaseConf.sources).forEach(function (source) {
		console.log(arguments );

		builder(source, function () {})

	})




}

checkdirs(runBuilder);