var assert = require('assert');
var sinon  = require('sinon');
var rewire = require('rewire');

var cachepurge = rewire("../lib/cachepurge");
var storage_mock = {
	hkeys: sinon.spy(),
	hdel: sinon.spy()
}
var codebase_mock = {
	sources: {
		'live' : {},
		'dev' : {}
	}
};

suite('cachepurge', function(){

	setup(function(){
		cachepurge.__set__("codebaseConf", codebase_mock);
		cachepurge.__set__("storage", storage_mock);
	});

	teardown(function(){
		storage_mock.hkeys.reset();
		storage_mock.hdel.reset();
	});

	suite('deleteSource', function(){
		test('get all cache keys from redis for a source', function () {
			var spy = sinon.spy();
			cachepurge.deleteSource(null, 'live', spy)

			sinon.assert.calledOnce(storage_mock.hkeys);
			sinon.assert.calledWith(storage_mock.hkeys, 'cache:live', sinon.match.func);
		});

		test('delete all cache keys from redis for a source', function () {
			var spy = sinon.spy();
			cachepurge.deleteSource(null, 'live', spy);

			var cb = storage_mock.hkeys.getCall(0).args[1];

			cb(null, ['a', 'b', 'c']);

			sinon.assert.callCount(storage_mock.hdel, 3);
			sinon.assert.calledWith(storage_mock.hdel, 'cache:live', ['a'], sinon.match.func);
			sinon.assert.calledWith(storage_mock.hdel, 'cache:live', ['b'], sinon.match.func);
			sinon.assert.calledWith(storage_mock.hdel, 'cache:live', ['c'], sinon.match.func);
		});
	});

	suite('deleteKeys', function(){

		test('delete all cache keys from redis for a source', function () {

			cachepurge.deleteKeys(null, 'live', ['a', 'b', 'c'], function () {});

			sinon.assert.callCount(storage_mock.hdel, 3);
			sinon.assert.calledWith(storage_mock.hdel, 'cache:live', ['a'], sinon.match.func);
			sinon.assert.calledWith(storage_mock.hdel, 'cache:live', ['b'], sinon.match.func);
			sinon.assert.calledWith(storage_mock.hdel, 'cache:live', ['c'], sinon.match.func);
		});
	});


	suite('deleteAll', function(){

		test('fetch all sources to be deleted', function () {

			cachepurge.deleteAll('live', ['a', 'b', 'c'], function () {});

			sinon.assert.callCount(storage_mock.hkeys, 2);
			sinon.assert.calledWith(storage_mock.hkeys, 'cache:live', sinon.match.func);
			sinon.assert.calledWith(storage_mock.hkeys, 'cache:dev', sinon.match.func);
		});
	});

});