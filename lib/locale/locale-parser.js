
var ParseL10nLine = function () {
	this.readable = true;
	this.writable = true;
};

require("util").inherits(ParseL10nLine, require('stream'));

ParseL10nLine.prototype._previousChunkEnd = '';
ParseL10nLine.prototype._brokenChunk = false;

ParseL10nLine.prototype._parser = function (data) {

	if (typeof data == 'undefined') {
		this.emit("data", false);
		return;
	}

	var chunk = data.toString('utf-8').split('\n'),
		chunkLength = chunk.length;

	for (var i = 0 ; i < chunkLength ; i++) {

		// first chunk is a fragment for previousChunkEnd
		// or there was a broken chunk right before this one
		if (i == 0 && (chunk[i].indexOf("' => '") < 0 || this._brokenChunk)) {

			if (this._brokenChunk) {
				this._brokenChunk = false;
			}

			this.emit("data", this._parseLine(this._previousChunkEnd + chunk[i]));
			continue;
		}


		// last chunk is broken
		if (i == chunkLength - 1 && chunk[i].indexOf("' => '") < 0) {
			this._brokenChunk = true;
		}

		// save chunk end
		if (i == chunkLength - 1) {
			this._previousChunkEnd = chunk[i];
		}

		this.emit("data", this._parseLine(chunk[i]));
	}
};

ParseL10nLine.prototype._parseLine =  function (data) {

	var rgx = /'(.*)' => '(.*)'/;

	var res = data.match(rgx);

	if (res) {

		var ulmskey = (res && res[1]) ? res[1].slice(0,res[1].length) : '';
		var ulmsvalue = (res && res[2]) ? res[2] : '';

		return {
			key: ulmskey,
			val: ulmsvalue
		};
	}

	return false;
};


/*
 * Stream write (override).
 */
ParseL10nLine.prototype.write = function () {
	this._parser.apply(this, arguments);
};

/**
 * Stream end (override).
 */
ParseL10nLine.prototype.end = function () {
	this._parser.apply(this, arguments);
	this.emit("end");
};


module.exports = ParseL10nLine;