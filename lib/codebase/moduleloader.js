var path     = require('path');
var fs       = require('graceful-fs');
var Readable = require('stream').Readable;
var util     = require('util');
var _        = require('lodash');

var paths    = require('../../conf/paths');
var codebase = require(paths.confdir + '/codebase');
var log      = require(paths.libdir + '/debug/log');

var outermostPath = codebase.jsrepo + '/';
var clientLibPath = paths.basedir + '/client/';

/**
 *
 * @param dir
 * @constructor
 */
function Loader(options, dir) {
	Readable.call(this, options);

	log.verbose('load', dir);

	this.on('error', function (err) {
		// todo
		log.error('load', err);
		//console.log(err);
	});

	this.processDir(dir, function(err, results) {

		// todo
		if (err) {
			throw err;
		}

		results.unshift('jmsclient');

		this.processFiles(results);

	}.bind(this));

}

util.inherits(Loader, Readable);

/**
 *
 * @param size
 * @private
 */
Loader.prototype._read = function (size) {
}



Loader.prototype.processDir = function(dir, done) {
	var results = [];

	fs.readdir(dir, function(err, list) {


		if (err) {
			return done(err); // todo
		}

		var pending = list.length;

		if (!pending) {
			return done(null, results);
		}

		list.forEach(function(file) {

			// if filename starts with ., it's a hidden file on unix
			var hidden = file.indexOf('.') === 0;

			file = dir + '/' + file;

			fs.stat(file, function(err, stat) {

				if (stat && stat.isDirectory()) {

					this.processDir(file, function(err, res) {
						results = results.concat(res);
						if (!--pending) {
							done(null, results);
						}
					});

				} else {

					if (!hidden || codebase.loadHidden) { //
						results.push(file);
					} else {
						log.verbose('skip', file);
					}
					if (!--pending) {
						done(null, results);
					}

				}
			}.bind(this));
		}.bind(this));
	}.bind(this));
};

/**
 *
 * @param path
 * @private
 */
Loader.prototype.processFiles = function (fileList) {

	var listLength = fileList.length;

	fileList.forEach(function(file) {

		var module = file
			.replace(clientLibPath, '')
			.replace(outermostPath, '')
			.replace('.js','');

		if (module == 'jmsclient') {

			fs.readFile(clientLibPath + 'jmsclient.js', 'utf8', function (err, jmsclient) {

				fs.readFile(clientLibPath + 'almond.js', 'utf8', function (err, almond) {

					log.verbose('load', 'jmsclient');

					var streamData = {

						module: 'jmsclient',
						mtime: new Date(),
						path: 'jmsclient',
						source: almond + jmsclient
					};

					this.push(JSON.stringify(streamData), 'utf8');

					listLength -= 1;
					if (listLength === 0) {
						this.push(null);
					}

				}.bind(this));
			}.bind(this));

			return;
		}

		fs.stat(file, function (err, stat) {
			fs.readFile(file, 'utf8', function (err, data) {

				if (err) {
					// TODO
					console.log(err);
					return;
				}

				var streamData = {
					module: module,
					mtime: new Date(stat.mtime),
					path: file,
					source: data
				};

				log.verbose('load', module);

				this.push(JSON.stringify(streamData), 'utf8');

				listLength -= 1;
				if (listLength === 0) {
					this.push(null);
				}

			}.bind(this));
		}.bind(this));
	}.bind(this));
}

module.exports = Loader;
