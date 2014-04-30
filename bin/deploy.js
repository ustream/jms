#!/usr/bin/env node

var paths          = require('../conf/paths');
var checkdirs      = require(paths.libdir + '/startup/checkdirs');
var cachepurge     = require(paths.libdir + '/cachepurge');
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
	require(paths.libdir + '/startup/builder')(true, doneBuild);
}

checkdirs(runBuilder);