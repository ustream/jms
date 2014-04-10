var paths          = require('../../conf/paths');
var storage        = require(paths.libdir + '/storage');


/**
 *
 * @param moduleRequest
 * @param source
 * @param byteLength
 * @param lastModified
 * @param done
 */
module.exports = function (moduleRequest, source, byteLength, lastModified, done) {

	storage.set(moduleRequest.href, JSON.stringify(
		{
			response: source,
			responseLength: byteLength,
			last_modified: lastModified
		}
	));

	done(null, source, byteLength, lastModified);
}