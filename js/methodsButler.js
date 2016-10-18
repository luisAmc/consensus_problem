function MethodsButler (opts) {
	this.file_name = opts.file_name;
	this.k = opts.k;
	this.m = opts.m;
	this.shuffle = opts.shuffle;
	this.k_times = opts.times;

	this.biggest_cluster = -1;

	this.data = this.extractData(opts.data);
	this.vectors = this.asingNumericValueToParticipant();

	console.log(this.data);
	console.log(opts.original_data);
	this.clearComponentsOnHTML();
	this.showDataOnHTML();
	this.showParticipantsOnHTML();
	this.showExpertVectorOnHTML();

	this.executeMethods();
}

MethodsButler.prototype.setK = function(k) {
	this.k = k;
};

MethodsButler.prototype.setM = function(m) {
	this.m = m;
};

MethodsButler.prototype.executeMethods = function() {
	this.runKMeans();
	this.calculateKendallsW();
	this.runDBSCAN();
};

MethodsButler.prototype.calculateKendallsW = function () {
	var kendalls = new KendallsW({
		data: this.vectors
	});

	var w = kendalls.calculateW();
	this.showKendallsResultOnHTML(w);
};

MethodsButler.prototype.runDBSCAN = function () {
	var dbscan = new DBSCAN({
		data: this.vectors
	});
	var results = dbscan.run();
	this.showDBSCANResultOnHTML(results);
};

MethodsButler.prototype.runKMeans = function() {
	var data = [], cluster_assignments = [];
	for (var i = 0; i < this.vectors.length; i++)
		data.push({expert: this.vectors[i], vector: this.vectors[i].classification});

	var rounds = this.k_times;
	while (rounds--) {
		var kmeans = new KMeans({
			k: this.k,
			m: this.m,
			data: data
		});

		var cluster_assignment = kmeans.run();
		var found = false;
		for (var i = 0; i < cluster_assignments.length; i++) {
			if (cluster_assignments[i].result.toString() === cluster_assignment.toString()) {
				found = true;
				cluster_assignments[i].times++;
			}
		}


		if (!found) {
			cluster_assignments.push({
				result: cluster_assignment,
				times: 1
			});
		}

		found = false;
	}


	var max_result, max_times = 0;
	for (var i = 0; i < cluster_assignments.length; i++)
		if (cluster_assignments[i].times > max_times) {
			max_times = cluster_assignments[i].times;
			max_result = cluster_assignments[i].result;
		}

		this.biggest_cluster = this.getBiggestCluster(max_result);
		this.showNoiselessTable(max_result);

		this.showTableOnHTML(max_result);
};

MethodsButler.prototype.getBiggestCluster = function (cluster_results) {
	var clusters = [], cluster_found = false;
	for (var i = 0; i < cluster_results.length; i++) {

		cluster_found = false;
		for (var j = 0; j < clusters.length; j++)
			if (clusters[j].id === cluster_results[i]) {
				clusters[j].appearances++;
				cluster_found = true;
			}

		if (!cluster_found)
			clusters.push({id: cluster_results[i], appearances: 1});

	}

	var ret_val = {id: -1, appearances: -1};
	for (var i = 0; i < clusters.length; i++)
		if (clusters[i].appearances > ret_val.appearances) {
			ret_val.id = clusters[i].id;
			ret_val.appearances = clusters[i].appearances;
		}

	return ret_val.id;
};

MethodsButler.prototype.extractData = function(file) {
	return {
		experts: this.extractExperts(file),
		participants: this.extractParticipants(file),
		classifications: this.extractClassifications(file)
	};
};

MethodsButler.prototype.extractExperts = function(file) {
	var ret_val = [];
	for (var expert = 0; expert < file.length; expert++)
		ret_val.push(file[expert][0]);

	return ret_val;
};

MethodsButler.prototype.extractParticipants = function(file) {
	var ret_val = [];
	for (var participant = 1; participant < file[0].length; participant++)
		ret_val.push(file[0][participant]);

	if (this.shuffle) {
		console.log("Shuffling")
		var i = 0, j = 0, temp = null

		for (i = ret_val.length - 1; i > 0; i -= 1) {
			j = Math.floor(Math.random() * (i + 1))
			temp = ret_val[i]
			ret_val[i] = ret_val[j]
			ret_val[j] = temp
		}

		return ret_val;
	}

	return ret_val.sort(function(a, b) { return a.localeCompare(b); });
};

MethodsButler.prototype.extractClassifications = function(file) {
	var ret_val = [], data_row = [];
	for (var row = 0; row < file.length; row++) {
		data_row = file[row];
		ret_val.push({
			expert: data_row[0],
			classification: data_row.splice(1)
		});

	}
	return ret_val;
};

MethodsButler.prototype.asingNumericValueToParticipant = function() {
	/*
	 *ret_val: the same classifications but the participants has been changed by their lexicographical index when compare to the others
	 *current_n_c: current numeric classificaction (participants are being changed)
	 *current_c: current classification with tha participants labels (participants haven't changed)
	 */
	var ret_val = [], current_n_c = [], current_c = [];
	for (var classification = 0; classification < this.data.classifications.length; classification++) {
		current_c = this.data.classifications[classification];
		for (var participant = 0; participant < current_c.classification.length; participant++)
			current_n_c.push(this.data.participants.indexOf(current_c.classification[participant]) + 1);

		ret_val.push({expert: current_c.expert, classification: current_n_c});
		current_n_c = [];
	}

	return ret_val;
};

MethodsButler.prototype.showKendallsResultOnHTML = function (w) {
	var container = document.getElementById('kendalls-result');

	var table = document.createElement('table');
	var thead = document.createElement('thead');
	var tbody = document.createElement('tbody');

	var caption = document.createElement('caption');
	caption.innerHTML = "Kendall's W";
	table.appendChild(caption);

	var tr = document.createElement('tr');
	var td = document.createElement('td');
	td.appendChild(document.createTextNode(w));
	tr.appendChild(td);

	tbody.appendChild(tr);

	table.appendChild(thead);
	table.appendChild(tbody);
	container.appendChild(table);
};

MethodsButler.prototype.showNoiselessTable = function (results) {
	var ret_val = [], temp_array = [];

	var container	=	document.getElementById('file-without-noise');
	var divisor = document.createElement('hr');
	var table = document.createElement('table');
	var table_head = document.createElement('thead');
	var table_body = document.createElement('tbody');

	var headers = ['Experto'];
	for (var i = 0; i < this.vectors[0].classification.length; i++)
		headers.push(i + 1);

	var header_tr = document.createElement('tr');
	for (var i = 0; i < headers.length; i++) {
		var th = document.createElement('th');
		th.innerHTML = headers[i];
		header_tr.appendChild(th);
	}

	var table_head = document.createElement('thead');
	table_head.appendChild(header_tr);

	var table_body = document.createElement('tbody');
	for (var i = 0; i < this.vectors.length; i++) {
		if (results[i] === this.biggest_cluster) {
			var table_row = document.createElement('tr');
			var td_expert = document.createElement('td');
			temp_array.push(" " + this.vectors[i].expert + "");
			td_expert.appendChild(document.createTextNode(this.vectors[i].expert));
			table_row.appendChild(td_expert);

			for (var j = 0; j < this.vectors[0].classification.length; j++) {
				var td = document.createElement('td');
				temp_array.push(this.data.participants[this.vectors[i].classification[j] - 1]);
				td.appendChild(document.createTextNode(this.data.participants[this.vectors[i].classification[j] - 1]));
				table_row.appendChild(td);
			}
			ret_val.push(temp_array);
			temp_array = [];
			table_body.appendChild(table_row);
		}
	}
	table.appendChild(table_head);
	table.appendChild(table_body);
	container.appendChild(divisor);

	var description = document.createElement('p');
	description.innerHTML = "Las clasificaciones, excluyendo aquellas de los expertos considerados ruidosos, son las siguientes:";
	container.appendChild(description);
	
	container.appendChild(table);
	noiseless_file = ret_val;

	var link = document.createElement('a');
	link.setAttribute('onClick', 'downloadNoiselessFile()');
	link.innerHTML = "<br>Descargar archivo modificado";

	container.appendChild(link);
};

var noiseless_file;
function downloadNoiselessFile() {
	var file = Papa.unparse(noiseless_file);
	console.log(file);

	var hiddenElement = document.createElement('a');

	hiddenElement.href = 'data:attachment/text,' + encodeURI(file);
	hiddenElement.target = '_blank';
	hiddenElement.download = 'archivoModificado.txt';
	hiddenElement.click();
}

MethodsButler.prototype.showTableOnHTML = function(results) {
	var container = document.getElementById('kmeans-results');
	var table = document.createElement('table');
	var table_head = document.createElement('thead');
	var table_body = document.createElement('tbody');

	var headers = ['Experto', 'Cluster'];
	var headers_tr = document.createElement('tr');
	for (var i = 0; i < headers.length; i++) {
		var th = document.createElement('th');
		th.innerHTML = headers[i];
		headers_tr.appendChild(th);
	}
	table_head.appendChild(headers_tr);

	for (var index = 0; index < results.length; index++) {
		var tr = document.createElement('tr');

		var expert_td = document.createElement('td');
		expert_td.appendChild(document.createTextNode(this.data.experts[index]));

		var cluster_td = document.createElement('td');
		cluster_td.appendChild(document.createTextNode(results[index]));

		tr.appendChild(expert_td);
		tr.appendChild(cluster_td);

		table_body.appendChild(tr);
	}

    var description_title = document.createElement('span');
		description_title.innerHTML = 'K-Means<br>';
		// description_title.innerHTML = 'K-means (tras ' + this.k_times + ' veces)<br>';
    // var description = document.createElement('p');
    // description.innerHTML = "El algoritmo K-Means toma una cantidad <i>n</i> de observaciones (puntos de información), " +
							// "y los agrupa en <i>k</i> grupos (clusters), donde cada observación pertenece a un grupo basado " +
							// "en la media más cercana (centroide del cluster). La distancia entre los puntos de información " +
							// "y el centroide del cluster es calculada usando la distancia Euclidiana.<br><br> Data la informacion dada, " +
							// "los expertos son agrupados de la siguiente forma:";
    container.appendChild(description_title);
    // container.appendChild(description);

	table.appendChild(table_head);
	table.appendChild(table_body);
	container.appendChild(table);
};

MethodsButler.prototype.showDBSCANResultOnHTML = function (results) {
	var container = document.getElementById('dbscan-results');
	var table = document.createElement('table');
	var table_head = document.createElement('thead');
	var table_body = document.createElement('tbody');

	var headers = ['Experto', 'Cluster'];
	var headers_tr = document.createElement('tr');
	for (var i = 0; i < headers.length; i++) {
		var th = document.createElement('th');
		th.innerHTML = headers[i];
		headers_tr.appendChild(th);
	}
	table_head.appendChild(headers_tr);

	var cluster_value = "";
	for (var index = 0; index < results.length; index++) {
		cluster_value = results[index].cluster_id;
		var tr = document.createElement('tr');

		var expert_td = document.createElement('td');
		expert_td.appendChild(document.createTextNode(results[index].expert));

		var cluster_td = document.createElement('td');

		if (results[index].cluster_id == -2)
			cluster_value = "Ruido";
		cluster_td.appendChild(document.createTextNode(cluster_value));

		tr.appendChild(expert_td);
		tr.appendChild(cluster_td);

		table_body.appendChild(tr);
	}

    var description_title = document.createElement('span');
		description_title.innerHTML = 'DBSCAN<br>';
    // var description = document.createElement('p');
    // description.innerHTML = "El algoritmo K-Means toma una cantidad <i>n</i> de observaciones (puntos de información), " +
		// 					"y los agrupa en <i>k</i> grupos (clusters), donde cada observación pertenece a un grupo basado " +
		// 					"en la media más cercana (centroide del cluster). La distancia entre los puntos de información " +
		// 					"y el centroide del cluster es calculada usando la distancia Euclidiana.<br><br> Data la informacion dada, " +
		// 					"los expertos son agrupados de la siguiente forma:";
    container.appendChild(description_title);
    // container.appendChild(description);

	table.appendChild(table_head);
	table.appendChild(table_body);
	container.appendChild(table);
};

MethodsButler.prototype.showDataOnHTML = function() {
	var file_name = document.getElementById('file-name');
	file_name.innerHTML = this.file_name;

	var division = document.getElementById('file-data');

	var description = document.createElement('span');
	description.innerHTML = "Archivo<br>";
	division.appendChild(description);

	var table = document.createElement('table');

	var headers = ['Experto'];
	for (var ran_l_i = 0; ran_l_i < this.data.classifications[0].classification.length; ran_l_i++)
		headers.push(ran_l_i + 1);

	var header_tr = document.createElement('tr');
	for (var h_i = 0; h_i < headers.length; h_i++) {
		var th = document.createElement('th');
		th.innerHTML = headers[h_i];
		header_tr.appendChild(th);
	}

	var table_head = document.createElement('thead');
	table_head.appendChild(header_tr);

	var table_body = document.createElement('tbody');
	for (var exp_i = 0; exp_i < this.data.experts.length; exp_i++) {
		var table_row = document.createElement('tr');
		var td_expert = document.createElement('td');
		td_expert.appendChild(document.createTextNode(this.data.experts[exp_i]));
		table_row.appendChild(td_expert);

		for (var part_i = 0; part_i < this.data.classifications[0].classification.length; part_i++) {
			var td = document.createElement('td');
			td.appendChild(document.createTextNode(this.data.classifications[exp_i].classification[part_i]));
			table_row.appendChild(td);
		}
		table_body.appendChild(table_row);
	}
	table.appendChild(table_head);
	table.appendChild(table_body);
	division.appendChild(table);

};

MethodsButler.prototype.clearComponentsOnHTML = function() {
	var containers_to_be_cleared = ['file-data', 'kmeans-results', 'participants-data', 'numeric-classification-data', 'dbscan-results', 'kendalls-result', 'file-without-noise'];

	var dom_element;
	for (var i = 0; i < containers_to_be_cleared.length; i++) {
		dom_element = document.getElementById(containers_to_be_cleared[i]);
		while (dom_element.lastChild)
			dom_element.removeChild(dom_element.lastChild);
	}

};

MethodsButler.prototype.showParticipantsOnHTML = function() {
	var container = document.getElementById('participants-data');
	var table = document.createElement('table');
	var thead = document.createElement('thead');
	var tbody = document.createElement('tbody');

	var description = document.createElement('p');
	description.innerHTML = "Orden de los participantes para la creacion de los vectores de los expertos.";
	container.appendChild(description);

	var caption = document.createElement('caption');
	caption.innerHTML = "Orden de los participantes";
	table.appendChild(caption);

	var tr = document.createElement('tr');
	for (var i = 0; i < this.data.participants.length; i++) {
		var td = document.createElement('td');
		td.appendChild(document.createTextNode(this.data.participants[i]));
		tr.appendChild(td);
	}
	tbody.appendChild(tr);

	table.appendChild(thead);
	table.appendChild(tbody);
	container.appendChild(table);
};

MethodsButler.prototype.showExpertVectorOnHTML = function() {
	var container = document.getElementById('numeric-classification-data');
	var table = document.createElement('table');
	var thead = document.createElement('thead');
	var tbody = document.createElement('tbody');

	var description = document.createElement('p');
	description.innerHTML = "Los vectores de los expertos quedan de la siguiente manera:";
	container.appendChild(description);

	var headers = ['Experto', 'Vector'];
	var header_tr = document.createElement('tr');
	for (var h_i = 0; h_i < headers.length; h_i++) {
		var th = document.createElement('th');
		th.innerHTML = headers[h_i];
		header_tr.appendChild(th);
	}

	thead.appendChild(header_tr);

	for (var i = 0; i < this.vectors.length; i++) {
		var tr = document.createElement('tr');
		var td = document.createElement('td');
		td.appendChild(document.createTextNode(this.vectors[i].expert));
		tr.appendChild(td);

		var td_p = document.createElement('td');
		var vector_string = '(' + this.vectors[i].classification.toString().split(",").join(", ") + ')';
		td_p.appendChild(document.createTextNode(vector_string));
		tr.appendChild(td_p);

		tbody.appendChild(tr);
	}

	table.appendChild(thead);
	table.appendChild(tbody);
	container.appendChild(table);
};
