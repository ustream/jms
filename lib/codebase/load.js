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

	this._processDir(dir);


}

/**
 *
 * @param size
 * @private
 */
Loader.prototype._read = function (size) {

}

/**
 *
 * @param path
 * @private
 */
Loader.prototype._processDir = function (path) {

	fs.readdir(path, function (err, dir) {

		//console.log(dir );

		if (!dir) {
			return;
		}

		dir.map(function (name) {
			var item = path + '/' + name;

			if (name[0] !== '.') {

				log.verbose('load', item)

				this._processPathItem( item );
			}
		}.bind(this));

	}.bind(this));
}

/**
 *
 * @param path
 * @private
 */
Loader.prototype._processPathItem  = function (path) {

	fs.stat(path, function (err, itemStat) {

		if(itemStat.isDirectory()) {
			this._processDir(path);
		}
		else if (itemStat.isFile()) {
			this._processFile(path);
		}

	}.bind(this))
}

/**
 *
 * @param path
 * @private
 */
Loader.prototype._processFile = function (path) {

	var module = path.replace(outermostPath, '').replace('.js','');

	fs.stat(path, function (err, stat) {
		fs.readFile(path, 'utf8', function (err, data) {

			var streamData = {
				module: module
			};

			streamData[module] = {
				mtime: new Date(stat.mtime),
				path: path,
				source: data
			};

			log.verbose('load', module);

			this.push(JSON.stringify(streamData), 'utf8');

		}.bind(this));
	}.bind(this));
}

module.exports = Loader;
