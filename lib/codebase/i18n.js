
var defineGrep = /_t_\([\'|\"]([a-z0-9_\.\-]*)[\'|\"],?\)?/gi,
	modules;

function find_locales (modules, callback) {

	var moduleData;

	for (var module in modules) {
		moduleData = modules[module];

		var match = moduleData.source.match(defineGrep);
		var ulmsunits = [];

		if (match) {

			var ulmsunits = match.map(function (item) {
				var k = item.match(/_t_\([\'|\"]([a-z0-9_\.\-]*)[\'|\"],?\)?/i)

				if (k && k[1]) {
					return k[1];
				}
			})

		}

		modules[module].i18n = ulmsunits;
	}




	callback(null, modules);

	return modules;
}

module.exports = function(_modules, _callback) {

	modules = find_locales(_modules, _callback);

}
