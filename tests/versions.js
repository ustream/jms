var assert = require('assert');
var sinon  = require('sinon');
var rewire = require('rewire');

var versions = rewire("../lib/codebase/versions");
var storage_mock = {
	hset: sinon.spy(),
	hdel: sinon.spy(),
	hgetall: sinon.spy(),
	hmget: sinon.spy()
}


suite('versions', function(){
	setup(function(){

		versions.__set__("log", { verbose: function () {} });
		versions.__set__("storage", storage_mock);
		versions.__set__("codebaseConf", {sources: { live: { versions: 2 } } });

	});

	teardown(function(){

		storage_mock.hset.reset();
		storage_mock.hdel.reset();
		storage_mock.hgetall.reset();
		storage_mock.hmget.reset();

	});

	suite('add', function(){
		test('get stored versions for a module', function () {
			var spy = sinon.spy();
			versions.add('live', 'foo/Bar', 'abcd1234');

			sinon.assert.calledOnce(storage_mock.hmget);
			sinon.assert.calledWith(storage_mock.hmget, 'versions:live', ['foo/Bar'], sinon.match.func);
		});

		test('insert new version', function () {
			var spy = sinon.spy();
			versions.add('live', 'foo/Bar', 'abcd1234');

			var cb = storage_mock.hmget.getCall(0).args[2];

			cb(null, ['["def67841"]']);

			sinon.assert.calledOnce(storage_mock.hset);
			sinon.assert.calledWith(storage_mock.hset, 'versions:live', 'foo/Bar', '["def67841","abcd1234"]');
		});

		test('create new version array', function () {
			var spy = sinon.spy();
			versions.add('live', 'foo/Bar', 'abcd1234');

			var cb = storage_mock.hmget.getCall(0).args[2];

			cb(null, [null]);

			sinon.assert.calledOnce(storage_mock.hset);
			sinon.assert.calledWith(storage_mock.hset, 'versions:live', 'foo/Bar', '["abcd1234"]');
		});

		test('skip versions already present in the list', function () {
			var spy = sinon.spy();
			versions.add('live', 'foo/Bar', 'abcd1234');

			var cb = storage_mock.hmget.getCall(0).args[2];

			cb(null, ['["abcd1234"]']);

			sinon.assert.notCalled(storage_mock.hset);
		});

	});

	suite('purge', function(){

		test('get all module version list', function () {
			var spy = sinon.spy();
			versions.purge('live');

			sinon.assert.calledOnce(storage_mock.hgetall);
			sinon.assert.calledWith(storage_mock.hgetall, 'versions:live', sinon.match.func);
		});

		test('delete modules from list that are over the config limit (2)', function () {
			var spy = sinon.spy();
			versions.purge('live', function () {});

			var cb = storage_mock.hgetall.getCall(0).args[1];

			cb(null, {
				'foo/Bar': '["def67841","abcd1234"]',
				'foo/Baz': '["d78d6741","abcd1234","d78d6333","abcd1234","d78d6741","abcd1234"]'
			});

			sinon.assert.callCount(storage_mock.hdel, 4);
			sinon.assert.calledWith(storage_mock.hdel, 'source:live', ["d78d6741"], sinon.match.func);
			sinon.assert.calledWith(storage_mock.hdel, 'source:live', ["abcd1234"], sinon.match.func);
			sinon.assert.calledWith(storage_mock.hdel, 'source:live', ["d78d6333"], sinon.match.func);
			sinon.assert.calledWith(storage_mock.hdel, 'source:live', ["abcd1234"], sinon.match.func);

		});
	});

});