
var paths          = require('../../conf/paths');
var process_events = require(paths.libdir + '/process-events');
var storage        = require(paths.libdir + '/storage');



module.exports = function (moduleRequest, source, byteLength, lastModified, done) {

	storage.set(moduleRequest.pathname, JSON.stringify(
		{
			response: source,
			responseLength: byteLength,
			last_modified: lastModified
		}
	));

	done(null, source, byteLength, lastModified)
}