var ipm2  = require('pm2-interface')();
var paths = require('../conf/paths');
var monitConf = require(paths.confdir + '/monit');

var concurrent = 0,
	served = 0,
	reqpersec = 0,
	cputime = 0,
	memory = 0,
	procData = [],
	exitspersec = 0,
	exits = 0,
	exceptions = 0;

var all_requests = 0,
	timestamp = 0,
	requests_in_timestamp = 0,
	exits_in_timestamp = 0,
	concurrent_requests = 0;

if (monitConf.enabled) {

	ipm2.on('ready', function() {

		ipm2.bus.on('process:stats', function(data) {
			var elapsed = data.data.ts - timestamp;
			all_requests += data.data.all;
			concurrent_requests += data.data.concurrent;

			if (elapsed > 0) {

				served = all_requests;
				reqpersec = Math.round(((all_requests - requests_in_timestamp) / (elapsed / 1000)) * 100) / 100;
				concurrent = concurrent_requests;
				requests_in_timestamp = all_requests;
				concurrent_requests = 0;

				exitspersec = Math.round(((exits - exits_in_timestamp) / (elapsed / 1000)) * 100) / 100;
				exits_in_timestamp = exits;

			}
			timestamp = data.data.ts
		});

		ipm2.bus.on('process:exit', function(event, data){
			++exits;
		});

		ipm2.bus.on('process:exception', function(event, data){
			++exceptions;
		});

		setInterval( function () {

			var msg = {
				type:"god:stats",
				ts: +new Date()
			};

			ipm2.rpc.getSystemData({
				name:"jms"
			}, function (err, data) {

				procData = [];

				if (data) {
					data.processes.forEach(function (proc) {

						if (proc.name !== 'jms') return;

						if (proc.pm2_env.status !== 'online') return;

						procData.push({
							status: proc.pm2_env.status,
							uptime: data.system.time - proc.pm2_env.created_at
						});
					});
				}
			});

			ipm2.rpc.getMonitorData({
				name: "jms"
			}, function(err, processData) {
				var len = processData.length,
					mem = 0,
					cpu = 0;

				for (var i = 0; i < len ; i++) {
					mem += processData[i].monit.memory;
					cpu += processData[i].monit.cpu;
				}

				memory = mem;
				cputime = Math.round(cpu / len);
			});

			ipm2.rpc.msgProcess(
				{
					name: "jms",
					msg:msg
				},
				function (err, res) {}
			);

		}, monitConf.interval);
	});

	var http = require('http');
	http.createServer(function (req, res) {

		var status = 200;

		if (procData.length < 1) {
			status = 503;
		}

		if (reqpersec > monitConf.max_requests) {
			status = 503;
		}

		if (exitspersec > 1) {
			status = 503;
		}

		res.writeHead(status, {
			'Content-Type': 'text/plain',
			'Access-Control-Allow-Origin': '*'
		});

		res.end(JSON.stringify({
			concurrent: concurrent,
			served: served,
			reqpersec: reqpersec,
			cpu: cputime,
			mem: memory,
			processes: procData,
			exits: exits,
			exitspersec: exitspersec,
			exceptions: exceptions

		}));

	}).listen(monitConf.port, monitConf.host);
}