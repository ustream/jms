


var stream = require('stream'),
	request = require('request'),
	zlib = require('zlib'),
	ParseL10nLine = require('./locale-parser'),
	FilterL10nUnits = require('./locale-filter');

var process_events = require('../process-events');

var log = function (msg) {
	process_events.send(process_events.LOG, msg);
}


var LocaleFetcher = function (locale) {

	this.path = '/l10ncache/translations_%LOCALE%_';

	this.host = 'http://static.ustream.tv';

	this.flag_404 = false;

	this.locale = locale;

	this.getLocale(new Date());
};

require("util").inherits(LocaleFetcher, require('events').EventEmitter);

LocaleFetcher.prototype.getLocale = function (date) {

	var url = this.host + this.getl10cacheUrl(date);
	this.req = request(url);


	this.req.once("response", function (response) {

		log(response.request.href)

		if (response.statusCode == 200) {

			this.req
				.pipe(zlib.createGunzip())
				.pipe((new ParseL10nLine(this.locale)))
				.pipe((new FilterL10nUnits(this.locale))
					.once('end', this.onEnd.bind(this)));

		} else if (response.statusCode == 404) {

			log("Error " + response.statusCode + " while trying to get " + response.request.href);

			if (false && this.flag_404) {

				log("Error: could not reach l10n caches, aborting.");

				return;
			} else {

				//this.flag_404 = true;
				this.getLocale(new Date(date.getTime() - (1000 * 60 * 60 * 24) ));
			}

		} else {
			log("Error " + response.statusCode + " while trying to get " + response.request.href);

		}
		return;

	}.bind(this));

}


LocaleFetcher.prototype.onEnd = function (locale, data) {
	this.emit("end", this.locale, data);

}

LocaleFetcher.prototype.getl10cacheUrl = function (date) {

	var mon = date.getMonth() + 1,
		day = date.getDate();

	return [
		this.path.replace('%LOCALE%', this.locale),
		date.getFullYear(),
		'-',
		mon > 9 ? mon : '0' + mon,
		'-',
		day > 9 ? day : '0' + day,
		'.php.gz'
	].join('');
}



module.exports = LocaleFetcher;