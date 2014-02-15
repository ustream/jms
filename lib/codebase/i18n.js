




var Transform = require('stream').Transform;
var util      = require('util');

var paths     = require('../../conf/paths');
var codebase  = require(paths.confdir + '/codebase');
var log       = require(paths.libdir + '/debug/log');

var localeUnitRegxp = /_t_\([\'|\"]([a-z0-9_\.\-]*)[\'|\"],?\)?/gi;


util.inherits(I18nCollector, Transform);




function findLabels (moduleData) {
	var module = moduleData.module;
	var match = moduleData.source.match(localeUnitRegxp);
	var ulmsunits = [];

	if (match) {

		var ulmsunits = match.map(function (item) {
			var k = item.match(/_t_\([\'|\"]([a-z0-9_\.\-]*)[\'|\"],?\)?/i)

			if (k && k[1]) {
				return k[1];
			}
		})

	}

	moduleData.i18n = ulmsunits;

	return moduleData;
}

function I18nCollector () {
	Transform.call(this);

}



I18nCollector.prototype._transform = function (chunk, encoding, done) {

	log.verbose('i18ncollector', 'transform');

	var data = JSON.parse(chunk.toString());

	data = findLabels(data);

	this.push(JSON.stringify(data));

	done();

}

module.exports = I18nCollector;