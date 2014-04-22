
var plugins = [

	{
		name: 'jshint',
		enabled: false
	},

	{
		name: 'example',
		enabled: true,
		options: {
			option_for_plugin: true
		}
	},

    {
		name: 'compressor',
        enabled: true
    }

];

module.exports = plugins;
