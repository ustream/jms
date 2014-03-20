

var concurrent = 0,
	served = 0;

if ('send' in process) {
	process.on("message", function (msg) {

		if ( "type" in msg && msg.type === "god:stats" ) {

			process.send({
				type:"process:stats",
				concurrent: concurrent,
				all: served,
				ts: msg.ts
			});

			served = 0;
		}
	})
}


module.exports = {
	in: function () {
		concurrent += 1;
	},
	out: function () {
		concurrent -= 1;
		served += 1;
	}
}