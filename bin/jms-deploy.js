#!/usr/bin/env node

var paths          = require('../conf/paths');
var log            = require(paths.libdir + '/debug/log');
var process_events = require(paths.libdir + '/process-events');
var builder        = require(paths.libdir + '/startup/builder');

builder(true, function () {
	log.info('jms-deploy', 'done');
	process.exit();
});