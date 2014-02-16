

var process_events = require('../process-events');

var log = function (msg) {
	process_events.send(process_events.LOG, msg);
}

var LocaleFetcher = require('./locale-fetcher');

var locales = {

	'en_US': {
		data: null,
		success: false
	},

	'ja_JP': {
		data: null,
		success: false
	},

	'de_DE': {
		data: null,
		success: false
	}

}




module.exports = function (callback) {

	log("Fetching locales for " + (Object.keys(locales)).join(', '));

	function isReady () {

		var ready = true;

		for (var locale in locales) {

			if (ready) {
				ready = locales[locale].success;
			}
		}

		if (ready) {
			log("Locales loaded");

			callback(null, locales); // async js callback
		}

	}

	for (var locale in locales) {

		(new LocaleFetcher(locale)).once("end", function (locale, data) {

			locales[locale].data = data;
			locales[locale].success = true;

			isReady();
		})
	}
}