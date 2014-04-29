#!/usr/bin/env node

var paths          = require('../conf/paths');
var checkdirs      = require(paths.libdir + '/startup/checkdirs');
var startTime = +new Date();

function runBuilder () {

	var log = require(paths.libdir + '/debug/log');

	require(paths.libdir + '/startup/builder')(true, function (err) {

		var doneTime = +new Date();

		var elapsed = Math.round((doneTime - startTime) / 1000);

		process.stdout.write(['deploy time (sec): ', elapsed ].join('') + '\n');

		if (err) {
			log.error('jms-deploy', err);
			process.exit(1);
			return;
		}

		log.info('jms-deploy', 'done');
		process.exit(0);
	});

}


checkdirs(runBuilder);