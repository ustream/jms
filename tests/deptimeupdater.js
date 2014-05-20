var assert = require('assert');
var sinon  = require('sinon');
var rewire = require('rewire');

var DeptimeUpdater = rewire("../lib/codebase/deptimeupdater");


suite('dependency mtime updater', function(){
	setup(function(){

		DeptimeUpdater.__set__("log", { verbose: function () {} });

	});

	teardown(function(){


	});

	suite('run', function () {


		test('simple dep tree, all dependents are timed to the freshest dependency', function (done) {

			var modules = [
				{
					module: 'mod/Foo',
					dependencies: ['mod/Bar'],
					transitive_dependencies: ['deps/Baz', 'mod/Bar'],
					mtime: new Date("2014-05-13T14:57:32.000Z"),
					requirecalls: []
				},
				{
					module: 'mod/Bar',
					dependencies: ['deps/Baz'],
					transitive_dependencies: ['deps/Baz'],
					mtime: new Date("2014-05-13T14:57:32.000Z"),
					requirecalls: []
				},
				{
					module: 'deps/Baz',
					dependencies: [],
					transitive_dependencies: [],
					mtime: new Date("2014-05-14T14:57:32.000Z"),
					requirecalls: []
				}
			];

			try {

				var next = sinon.spy();
				var deps = new DeptimeUpdater();

				deps.on('end', function (modules, cb) {
					modules.forEach(function (module) {
						assert.equal(+new Date(module.mtime), 1400079452000);
					});
					done();
				});

				deps.run(modules, next);

			} catch (e) {
				done(e);
			}
		});



	});

});