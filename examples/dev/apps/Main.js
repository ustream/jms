define(['core'], function (core) {

	console.log('init Main app' );

	$('#OpenModalApp').click(function () {
		var btn = $(this)
		btn.button('loading')

		console.log('require largemodal' );

		require(['apps/LargeModal'], function (LargeModal) {

			console.log('largemodal here' );
			
			LargeModal();

			btn.button('reset');
		});

	});

	return function () {

		console.log('run Main app' );

	}

});