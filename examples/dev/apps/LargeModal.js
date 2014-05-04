define(['core', 'view/largeModal'], function (core, largeModalView) {

	console.log('large modal');
	
	return function () {

		console.log('large modal run', largeModalView);

		largeModalView.open();

	}
});