var assert = require('assert');
var sinon  = require('sinon');
var rewire = require('rewire');

var TransitiveDeps = rewire("../lib/codebase/transitivedeps");


suite('transitivedeps', function(){
	setup(function(){

		TransitiveDeps.__set__("log", { verbose: function () {} });

	});

	teardown(function(){


	});

	suite('run', function () {


		test('simple transitive deps', function (done) {

			var modules = [
				{
					module: 'mod/Foo',
					dependencies: ['mod/Bar']
				},
				{
					module: 'mod/Bar',
					dependencies: ['deps/Baz']
				},
				{
					module: 'deps/Baz',
					dependencies: []
				}
			];

			try {

				var next = sinon.spy();
				var deps = new TransitiveDeps();

				deps.on('end', function (modules, cb) {

					sinon.assert.match(modules[0].transitive_dependencies, sinon.match.array);
					sinon.assert.match(modules[1].transitive_dependencies, sinon.match.array);
					sinon.assert.match(modules[2].transitive_dependencies, sinon.match.array);

					assert.equal(JSON.stringify(modules[0].transitive_dependencies), JSON.stringify([  'mod/Bar', 'deps/Baz' ]))

					done();
				});

				deps.on('error', function (err) {
					throw(new Error(err.message));
				});

				deps.run(modules, next);

			} catch (e) {
				done(e);
			}
		});

		test('missing module', function (done) {

			var modules = [
				{
					module: 'mod/Foo',
					dependencies: ['mod/Bar']
				},
				{
					module: 'mod/Bar',
					dependencies: ['deps/Baz']
				}
			];

			try {

				var next = sinon.spy();
				var deps = new TransitiveDeps();

				deps.on('end', function (modules, cb) {

				});

				deps.on('error', function (err) {})
				deps.once('error', function (err) {

					assert.equal(err.type, 'dependencyError');
					done();

				});

				deps.run(modules, next);

			} catch (e) {
				done(e);
			}
		});

		test('circular transitive deps', function (done) {

			var modules = [
				{
					module: 'mod/Foo',
					dependencies: ['mod/Bar']
				},
				{
					module: 'mod/Bar',
					dependencies: ['mod/Foo', 'deps/Baz']
				},
				{
					module: 'deps/Baz',
					dependencies: []
				}
			];

			try {

				var next = sinon.spy();
				var deps = new TransitiveDeps();

				deps.on('end', function (modules, cb) {

					assert.equal(JSON.stringify(modules[0].transitive_dependencies), JSON.stringify([ 'mod/Bar', 'deps/Baz' ]));
					done();

				});

				deps.on('error', function (err) {
					throw(new Error(err.message));
				});

				deps.run(modules, next);

			} catch (e) {
				done(e);
			}
		});


	});

});