var file;

$(document).ready(function () {
	$('#csv-input-file').change(handleInputChange);
	$('#clusters-quantity').change(reRun);
	$('#method-selected').change(reRun);
	$('#shuffle-checkbox').change(reRun);
	$('#times').change(reRun);
});

function handleInputChange (evt) {
	file = evt.target.files[0];
	Papa.parse(file, {
		complete: function (results) {
			methods = new MethodsButler({
				file_name: file.name,
				original_data: results.data.slice(),
				data: results.data.slice(),
				k: document.getElementById('clusters-quantity').value,
				m: document.getElementById('method-selected').value,
				shuffle: document.getElementById('shuffle-checkbox').checked,
				times: document.getElementById('times').value
			});
		}
	});
};

function reRun() {
	Papa.parse(file, {
		complete: function (results) {
			methods = new MethodsButler({
				file_name: file.name,
				data: results.data,
				k: document.getElementById('clusters-quantity').value,
				m: document.getElementById('method-selected').value,
				shuffle: document.getElementById('shuffle-checkbox').checked,
				times: document.getElementById('times').value
			});
		}
	});
};
