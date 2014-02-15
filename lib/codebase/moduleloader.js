var path     = require('path');
var fs       = require('fs');
var Readable = require('stream').Readable;
var util     = require('util');

var paths    = require('../../conf/paths');
var codebase = require(paths.confdir + '/codebase');
var log      = require(paths.libdir + '/debug/log');

var outermostPath = codebase.jsrepo + '/';
var readmore = true;

util.inherits(Loader, Readable);

/**
 *
 * @param dir
 * @constructor
 */
function Loader(dir) {

	Readable.call(this);

	log.verbose('load', dir);

	this.on('error', function (err) {
		log.error('load', 'error happened');
		console.log(err)
	});

	//this._processDir(dir);

	this._processDir(dir, function(err, results) {
		if (err) throw err;

		//console.log(results);

		this._processFiles(results)
	}.bind(this))

}

/**
 *
 * @param size
 * @private
 */
Loader.prototype._read = function (size) {

}



Loader.prototype._processDir = function(dir, done) {
	var results = [];

	fs.readdir(dir, function(err, list) {

		if (err)
			return done(err);

		var pending = list.length;

		if (!pending)
			return done(null, results);

		list.forEach(function(file) {
			file = dir + '/' + file;

			fs.stat(file, function(err, stat) {

				if (stat && stat.isDirectory()) {

					this._processDir(file, function(err, res) {
						results = results.concat(res);
						if (!--pending)
							done(null, results);
					});

				} else {

					results.push(file);
					if (!--pending)
						done(null, results);

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
Loader.prototype._processFiles = function (fileList) {


	fileList.forEach(function(file, i) {
		var module = file.replace(outermostPath, '').replace('.js','');
		fs.stat(file, function (err, stat) {
			fs.readFile(file, 'utf8', function (err, data) {

				var streamData = {
					module: module,
					mtime: new Date(stat.mtime),
					path: file,
					source: data
				};

				log.verbose('load', module);

				this.push(JSON.stringify(streamData), 'utf8');

				if (i == fileList.length - 1) {
					this.push(null);
				}

			}.bind(this));
		}.bind(this));


	}.bind(this))



}

module.exports = Loader;
