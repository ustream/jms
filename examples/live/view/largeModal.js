define([], function () {

	console.log('large modal view');

	var template = '<div class="modal fade" id="LargeModalView">' +
		'<div class="modal-dialog">' +
			'<div class="modal-content">' +
				'<div class="modal-header">' +
					'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
					'<h4 class="modal-title">Superb modal title</h4>' +
				'</div>' +
				'<div class="modal-body">' +
					'<p>One fine body&hellip;</p>' +
				'</div>' +
				'<div class="modal-footer">' +
					'<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
					'<button type="button" class="btn btn-primary">Save changes</button>' +
				'</div>' +
			'</div><!-- /.modal-content -->' +
		'</div><!-- /.modal-dialog -->' +
	'</div><!-- /.modal -->';


	if (!$('#LargeModalView').size()) {
		$(document.body).append(template);
	}
	var modal = $('#LargeModalView').modal({
		show:false
	});

	return {
		open: function () {
			modal.modal('show')
		},
		close: function () {
			modal.modal('hide')
		}
	};

})