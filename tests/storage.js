var assert = require('assert');
var sinon  = require('sinon');
var rewire = require('rewire');

var storage = rewire("../lib/storage");
var storage_mock = {
	get: sinon.spy(),
	set: sinon.spy(),
	hset: sinon.spy(),
	hmset: sinon.spy(),
	hmget: sinon.spy(),
	hkeys: sinon.spy(),
	hdel: sinon.spy(),
	hgetall: sinon.spy(),
	exists: sinon.spy()
}


suite('storage', function(){
	setup(function(){

		storage.__set__("storageconfig", {});
		storage.__set__("log", {});
		storage.__set__("storage", storage_mock);

	});



	suite('get', function(){
		test('should call get on redis storage module', function () {
			storage.get('key', function () {});

			sinon.assert.calledOnce(storage_mock.get);
			sinon.assert.calledWith(storage_mock.get, 'key', sinon.match.func);
		});
	});

	suite('set', function(){
		test('should call set on redis storage module', function () {
			storage.set('key', 123, function () {});

			sinon.assert.calledOnce(storage_mock.set);
			sinon.assert.calledWith(storage_mock.set, 'key', 123, sinon.match.func);
		});
	});

	suite('hset', function(){
		test('should call hset on redis storage module', function () {
			storage.hset('hash', 'key', 123, function () {});

			sinon.assert.calledOnce(storage_mock.hset);
			sinon.assert.calledWith(storage_mock.hset, 'hash', 'key', 123, sinon.match.func);
		});
	});

	suite('hmset', function(){
		test('should call hmset on redis storage module', function () {
			storage.hmset('hash', 'key', 123, function () {});

			sinon.assert.calledOnce(storage_mock.hmset);
			sinon.assert.calledWith(storage_mock.hmset, 'hash', 'key', 123, sinon.match.func);
		});
	});

	suite('hmget', function(){
		test('should call hmget on redis storage module', function () {
			storage.hmget('hash', 'key', [123], function () {});

			sinon.assert.calledOnce(storage_mock.hmget);
			sinon.assert.calledWith(storage_mock.hmget, 'hash', 'key', sinon.match.array, sinon.match.func);
		});
	});
});