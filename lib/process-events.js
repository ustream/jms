var _       = require('lodash');
var cluster = require('cluster');
var paths   = require('../conf/paths');
var log     = require(paths.libdir + '/debug/log');

var event_list = {
	START: 'start',
	STARTING: 'starting',
	STARTED: 'started',

	STOP: 'stop',
	STOPPING: 'stopping',
	STOPPED: 'stopped',

	RESTART: 'restart',
	RESTARTING: 'restarting',
	RESTARTED: 'restarted',

	LOG: 'log',
	EXIT: 'exit',

	SIGINT: 'SIGINT',
	SIGTERM: 'SIGTERM',
	SIGKILL: 'SIGKILL',
	SIGUSR1: 'SIGUSR1',
	SIGUSR2: 'SIGUSR2',
	SIGHUP: 'SIGHUP',
	SIGWINCH: 'SIGWINCH',
	SIGTTIN: 'SIGTTIN',
	SIGTTOU: 'SIGTTOU'
}

/**
 * send to process or worker
 *
 * @param event {String}
 * @param worker {Object} optional, only if send to worker
 * @param data {Mixed} optional
 */
var send = cluster.isWorker ? function (event) {

	var sendTo, data, label;

	if (cluster.isMaster) {
		sendTo = arguments[1];
		data = arguments[2] || '';
		label = arguments[3] || '';
	} else {
		sendTo = process;
		data = arguments[1] || '';
		label = arguments[2] || '';
	}

	var sendObj = {
		e: event,
		d: data,
		l: label
	}

	sendTo.send(JSON.stringify(sendObj));

} : function (event) {

	sendTo = arguments[1];
	if (typeof sendTo != 'object') {
		data = arguments[1] || '';
		label = arguments[2] || '';
	} else {
		data = arguments[2] || '';
		label = arguments[3] || '';
	}

	if (event == event_list.LOG && typeof sendTo != 'object') {

		log.info( (label ? label.toUpperCase() : event.toUpperCase()), data);
		return;
	}

	var sendTo, data, label;

	var sendObj = {
		e: event,
		d: data,
		l: label
	}

	sendTo.send(JSON.stringify(sendObj));

}

var process_events = {

	send: send,

	parse: function (message) {
		try {
			var event = JSON.parse(message);
		} catch (e) {
			var event = {
				e: 'unknown',
				d: message,
				l: ''
			}
		}

		var returnData = _.clone(event_list);
		returnData.event = event.e;
		returnData.data = event.d;
		returnData.label = event.l;

		return returnData;
	}

}

process_events = _.extend(process_events, event_list);


_.map(event_list, function (val, key) {
	process_events[val] = send.bind(null, val);
});

module.exports = process_events;