function BranchBound (opts) {
  this.data = opts.data;
}

BranchBound.prototype.getScoreMatrixAsToR = function (objs) {
  var score_matrix = [], score_matrix_partial = [];

  for (var i = 0; i < objs.length; i++) {
    for (var j = 0; j < objs.length; j++) {
      if (objs[i] > objs[j])
        score_matrix_partial[j] = 1;
      else if (objs[i] < objs[j])
        score_matrix_partial[j] = -1;
      else if (objs[i] == objs[j])
        score_matrix_partial = 0;
    }
    score_matrix.push(score_matrix_partial.slice());
    score_matrix_partial = [];
  }

  return score_matrix;
};
