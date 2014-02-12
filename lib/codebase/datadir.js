

var fs = require('fs');
var async = require('async');

var paths          = require('../../conf/paths');
var process_events = require(paths.libdir + '/process-events');

var log = function (msg) {
	process_events.send(process_events.LOG, msg, 'datadir');
}

var loadedBuilds = {};

function openFileForSave (data, next) {
	var buildNumber = require('./buildnumber').current;
	var file = buildNumber + '.json';

	fs.open('./data/' + file , 'w', next)
}

function saveData (data, fd, next) {
	if (arguments[3]) {
		var err = arguments[1];
		err.in = 'save / open';
		next(err);
		return;
	}

	data = JSON.stringify(data);
	data = new Buffer(data, 'utf8');

	fs.write(fd, data, 0, data.length, 0, next.bind(null, fd));
}

function closeFileAfterSave (fd, written, buffer, next) {
	if (arguments[4]) {
		var err = arguments[1];
		err.in = 'save / open / write';
		next(err);
		return;
	} else {
		fs.close(fd, next);
	}
}

function loadByBuildNumber (buildNumber, next) {
	var file = buildNumber + '.json';

	fs.readFile('./data/' + file, function (err, data) {
		if (err) {
			log(JSON.stringify(err));
			next(err);
		} else {
			next(null, data);
		}

	});

}

module.exports = {


	load: function (buildNumber, modules, locales, next) {

		if (!arguments[3]) {
			next = arguments[2];
			locales = arguments[1];
			modules = {};
		}

		log("loading build " + buildNumber);

		loadByBuildNumber(buildNumber, function (err, data) {

			if (err) {
				next(err);
				return;
			}

			loadedBuilds[buildNumber] = JSON.parse(data.toString('utf8'));

			modules[buildNumber] = loadedBuilds[buildNumber];

			next (null, modules, locales);
		});


		/*
		 if (!loadedBuilds[buildNumber]) {




		 } else {

		 log("[DATADIR] going next cached")


		 modules[buildNumber] = loadedBuilds[buildNumber];
		 next (modules, locales);

		 }*/


	},

	save: function (data, next) {

		async.waterfall([
			openFileForSave.bind(null, data),
			saveData.bind(null, data),
			closeFileAfterSave
		], function () {
			next();
		});

	}
}