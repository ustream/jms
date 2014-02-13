

var paths   = require('../../conf/paths');
var datadir = require(paths.libdir + '/codebase/datadir');
var builder = require(paths.libdir + '/codebase/builder');
var log     = require(paths.libdir + '/debug/log');



var d = require('domain').create();

d.on('error', function(err){
	log.error('build', 'build failed')
	// handle the error safely
	console.dir(err);
});


var build = function (next) {

	var data = d.run(builder(function (err, data) {

		var build = require(paths.libdir + '/codebase/buildnumber').current;

		if (!data) {
			log.info('build', 'loading build: ' + build)
			next();
		} else {
			datadir.save(data, function (err) {
				if (!err) {
					log.info('build', 'new build saved: ' + build);
					next();
				} else {
					log.info('build', 'ERROR ' + JSON.stringify(err));
				}
			});
		}
	}));
}

module.exports = build;