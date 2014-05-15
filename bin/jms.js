
var paths    = require('../lib/paths');
var ModuleServer = require(paths.libdir + '/server/moduleserver');



var argv = require('minimist')(process.argv.slice(2));

//console.dir(argv)



var server = new ModuleServer(function () {});