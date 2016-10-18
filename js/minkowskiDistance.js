function MinkowskiDistance(vectors, exp) {
	this.vectors = vectors;
	this.exp = exp;
}

MinkowskiDistance.prototype.calculate = function() {
	var ret_val = [], current_result = 0;

	for (var x = 0; x < this.vectors.length; x++) {
		for (var y = x + 1; y < this.vectors.length; y++) {

			for (var d = 0; d < this.vectors[0].classification.length; d++)
				current_result += Math.pow(Math.abs(this.vectors[x].classification[d] - this.vectors[y].classification[d]),this.exp);

			ret_val.push({
				from: this.vectors[x].expert,
				to: this.vectors[y].expert,
				distance: current_result
			});
			current_result = 0;
		}
	}

	return ret_val;
};