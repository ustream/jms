
var paths        = require('../../conf/paths');
var ModuleServer = require(paths.libdir + '/server/moduleserver');

function Server () {}

Server.prototype.start = function start (next) {
	this.server = new ModuleServer(next);
}

Server.prototype.stop = function stop (next) {
	this.server.close(next)
}

Server.prototype.restart = function restart (next) {
	this.server.close(next)
}

module.exports = new Server();