
var modules = {

	jsrepo: '../js',

	exportfile: './js-module-server-export.json',

	// apps to pre-package upon deploy
	// useful for large, really-really static groups,
	// base libs, frameworks, etc
	prepackage: [
		'bootstrap'
	],

	init_app: 'loader'

}


module.exports = modules;