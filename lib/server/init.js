
var app = {

	start: function (next) {

			next.call(this, app)

	},
	stop: function (next) {
		next.call(this)
	},
	restart: function (next) {
		next.call(this)
	},

	log: function () {}
}
module.exports = app;