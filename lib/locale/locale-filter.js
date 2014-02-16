
var FilterL10nUnits = function (locale) {
	this.readable = true;
	this.writable = true;

	this.locale = locale;

	this._units = {};
};

require("util").inherits(FilterL10nUnits, require('stream'));

FilterL10nUnits.prototype._filter = function (data) {
	if (data && typeof data !== 'undefined') {

		// add www if needed

		if (data.key.slice(0,3) ==	'js.' ) {
			this._units[data.key] = data.val;
		}
	}
};

/*
 * Stream write (override).
 */
FilterL10nUnits.prototype.write = function () {
	this._filter.apply(this, arguments);
};

/**
 * Stream end (override).
 */
FilterL10nUnits.prototype.end = function () {
	this._filter.apply(this, arguments);

	this.emit("end", this.locale, this._units);
};


module.exports = FilterL10nUnits;