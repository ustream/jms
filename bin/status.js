var http      = require('http');
var paths     = require('../lib/paths');
var config    = require(paths.libdir + '/getconfig');
var monitConf = config.monit;

function capitaliseFirstLetter(string)
{
	return string.charAt(0).toUpperCase() + string.slice(1);
}


http.get({
	host: monitConf.host,
	port: monitConf.port
}, function( res ) {

	res.on('data', function( data ) {
		if (res.statusCode !== 200) {
			process.stdout.write(['ERROR: JMS or JMS monitoring is not online'].join('') + '\n');
			process.exit(1);
		}

		var stat = data.toString();
		stat = JSON.parse(stat);

		process.stdout.write([
			'JMS online with ', stat.processes.length, ' process', (stat.processes.length > 1 ? 'es':''), '\n',
			'    ', 'concurrent requests ', stat.concurrent, '\n',
			'    ', 'requests / sec ', stat.reqpersec,  '\n',
			'    ', 'cpu usage (%) ', stat.cpu,  '\n',
			'    ', 'memory usage (MB) ', Math.ceil(stat.mem/ 1024 / 1024),  '\n',
			'    ', 'total requests served ', stat.served,  '\n',
			'    ', 'exits per sec ', stat.exitspersec,  '\n'
		].join('') + '\n');
		process.exit(0);

	} );
}).on('error', function () {
	process.stdout.write(['ERROR: JMS or JMS monitoring is not online'].join('') + '\n');
	process.exit(1);
});
