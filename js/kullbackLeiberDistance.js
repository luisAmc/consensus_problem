function KullbackLeiberDistance(vectors) {
	this.vectors = vectors;
}

KullbackLeiberDistance.prototype.calculate = function() {
	var ret_val = [], current_result = 0;

	for (var x = 0; x < this.vectors.length; x++) {
		for (var y = x + 1; y < this.vectors.length; y++) {
			
			for (var d = 0; d < this.vectors[0].classification.length; d++){
				current_result += (this.vectors[x].classification[d] * Math.log(((this.vectors[x].classification[d] + 1)/(this.vectors[y].classification[d] + 1))));
			}
			
			ret_val.push({
				from: this.vectors[x].expert,
				to: this.vectors[y].expert,
				distance: Math.sqrt(current_result)
			});
			current_result = 0;
		}
	}

	return ret_val;
};