var ipm2  = require('pm2-interface')();
var paths = require('../conf/paths');
var monitConf = require(paths.confdir + '/monit');

var concurrent = 0,
	served = 0,
	reqpersec = 0,
	cputime = 0,
	memory = 0,
	procData = [],
	exits = 0,
	exceptions = 0;

var all = 0,
	ts = 0,
	tsreq = 0,
	con = 0;


var req_max = 500;




if (monitConf.enabled) {

	ipm2.on('ready', function() {

		ipm2.bus.on('process:stats', function(data) {
			var elapsed = data.data.ts - ts;
			all += data.data.all;
			con += data.data.concurrent;

			if (elapsed > 0) {

				served = all;
				reqpersec = Math.round(((all - tsreq) / (elapsed / 1000)) * 100) / 100;
				concurrent = con;

				tsreq = all;
				con = 0;
			}

			ts = data.data.ts
		});


		//ipm2.bus.on('process:online', function(event, data){
		//});


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
				data.processes.forEach(function (proc) {

					if (proc.name !== 'jms') return;

					if (proc.pm2_env.status !== 'online') return;

					procData.push({
						status: proc.pm2_env.status,
						uptime: data.system.time - proc.pm2_env.created_at
					});
				});

/*
*



 { name: 'jms',
 instances: 8,
 exec_mode: 'cluster_mode',
 env:
 { pm_cwd: '/Users/_nec/sandbox/jms',
 LOGNAME: '_nec',
 ITERM_SESSION_ID: 'w0t0p0',
 HOME: '/Users/_nec',
 COLORFGBG: '7;0',
 SHLVL: '2',
 ITERM_PROFILE: 'Default',
 PWD: '/Users/_nec/sandbox/jms',
 PATH: '/Users/_nec/bin:/opt/local/bin:/opt/local/sbin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:/usr/X11/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin',
 __CHECKFIX1436934: '1',
 __CF_USER_TEXT_ENCODING: '0x1F5:0:0',
 SSH_AUTH_SOCK: '/tmp/launch-UxgLFU/Listeners',
 USER: '_nec',
 NVM_DIR: '/Users/_nec/.nvm',
 USTREAM_DEVELOPER_MODE: 'true',
 Apple_PubSub_Socket_Render: '/tmp/launch-QRqh7c/Render',
 TMPDIR: '/var/folders/6h/rflnry_s0zg1lw56cnzmzfy40000gn/T/',
 SHELL: '/bin/bash',
 TERM: 'xterm',
 TERM_PROGRAM: 'iTerm.app' },
 pm_exec_path: '/Users/_nec/sandbox/jms/bin/jms.js',
 pm_out_log_path: '/Users/_nec/sandbox/jms/logs/jms-out-63.log',
 pm_err_log_path: '/Users/_nec/sandbox/jms/logs/jms-err-63.log',
 pm_pid_path: '/Users/_nec/sandbox/jms/pid/jms.pid',
 pm_id: 63,
 restart_time: 0,
 unstable_restarts: 0,
 created_at: 1395326797788,
 pm_uptime: 1395326797788,
 status: 'online',
 TERM_PROGRAM: 'iTerm.app',
 TERM: 'xterm',
 SHELL: '/bin/bash',
 TMPDIR: '/var/folders/6h/rflnry_s0zg1lw56cnzmzfy40000gn/T/',
 Apple_PubSub_Socket_Render: '/tmp/launch-QRqh7c/Render',
 USTREAM_DEVELOPER_MODE: 'true',
 NVM_DIR: '/Users/_nec/.nvm',
 USER: '_nec',
 SSH_AUTH_SOCK: '/tmp/launch-UxgLFU/Listeners',
 __CF_USER_TEXT_ENCODING: '0x1F5:0:0',
 __CHECKFIX1436934: '1',
 PATH: '/Users/_nec/bin:/opt/local/bin:/opt/local/sbin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:/usr/X11/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin',
 PWD: '/Users/_nec/sandbox/jms',
 ITERM_PROFILE: 'Default',
 SHLVL: '2',
 COLORFGBG: '7;0',
 HOME: '/Users/_nec',
 ITERM_SESSION_ID: 'w0t0p0',
 LOGNAME: '_nec',
 pm_cwd: '/Users/_nec/sandbox/jms' }
*/


			})

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

		if (reqpersec > req_max) {
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
			exceptions: exceptions

		}));

	}).listen(monitConf.port, monitConf.host);
}