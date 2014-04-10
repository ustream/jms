#!/usr/bin/env node

var paths          = require('../conf/paths');
var log            = require(paths.libdir + '/debug/log');
var builder        = require(paths.libdir + '/startup/builder');

builder(true, function (err) {

	if (err) {
		log.error('jms-deploy', err);
		process.exit(1);
		return;
	}


	log.info('jms-deploy', 'done');
	process.exit();
});