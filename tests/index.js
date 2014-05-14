var assert = require('assert');

suite('Demo test', function(){
	setup(function(){

	});

	suite('Array.indexOf()', function(){
		test('should return -1 when not present', function(){
			assert.equal(-1, [1,2,3].indexOf(4));
		});
	});
});