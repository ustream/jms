var http      = require('http');
var paths     = require('../conf/paths');
var monitConf = require(paths.confdir + '/monit');

function capitaliseFirstLetter(string)
{
	return string.charAt(0).toUpperCase() + string.slice(1);
}


http.get({
	host: monitConf.host,
	port: monitConf.port
}, function( res ) {
	res.on('data', function( data ) {
		var stat = data.toString();
		stat = JSON.parse(stat);

		process.stdout.write([
			'JMS online with ', stat.processes.length, ' process', (stat.processes.length > 1 ? 'es':''), '\n',
			'    ', 'concurrent requests ', stat.concurrent, '\n',
			'    ', 'requests / sec ', stat.reqpersec,  '\n',
			'    ', 'cpu usage (%) ', stat.cpu,  '\n',
			'    ', 'memory usage (MB) ', Math.ceil(stat.mem/ 1024 / 1024),  '\n',
			'    ', 'total requests served ', stat.served,  '\n'
		].join('') + '\n');

	} );
}).on('error', function () {
	process.stdout.write(['ERROR: JMS or JMS monitoring is not online'].join('') + '\n');
});
