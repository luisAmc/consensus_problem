function DBSCAN(opts) {
  this.data = opts.data;
  this.values = {
    UNCLASSIFIED: -1,
    NOISE: -2,
    CORE_POINT: 1,
    NOT_CORE_POINT: 0,
    SUCCESS: 0
  };

  this.preparePoints();
  // this.run(this.data, this.data.length, 3, 2, this.euclidean_distance);
  // this.print_points(this.data, this.data.length);
  this.results = {};
}

DBSCAN.prototype.run = function () {
  var cluster_id = 0, points = this.data, num_points = this.data.length, epsilon = 3, minpts = 2, dist = this.euclidean_distance;
  for (var i = 0; i < num_points; ++i)
    if (points[i].cluster_id === this.values.UNCLASSIFIED)
      if (this.expand(i, cluster_id, points, num_points, epsilon, minpts, dist) === this.values.CORE_POINT)
        cluster_id++;
  return points;
};

DBSCAN.prototype.preparePoints = function () {
  for (var i = 0; i < this.data.length; i++)
    this.data[i].cluster_id = -1;
};

DBSCAN.prototype.get_epsilon_neighbours = function (index, points, num_points, epsilon, dist) {
  var i, en = [], d;
  for (i = 0; i < num_points; ++i) {
    if (i === index)
      continue;
    d = dist(points[index], points[i]);
    if (d > epsilon)
      continue;
    else
      en.push(i);
  }
  return en;
};

DBSCAN.prototype.expand = function (index, cluster_id, points, num_points, epsilon, minpts, dist) {
  var i, return_value = this.values.NOT_CORE_POINT, seeds = this.get_epsilon_neighbours(index, points, num_points, epsilon, dist);
  if (seeds.length < minpts)
    points[index].cluster_id = this.values.NOISE;
  else {
    points[index].cluster_id = cluster_id;
    for (i = 0; i < seeds.length; ++i)
      points[seeds[i]].cluster_id = cluster_id;
    for (i = 0; i < seeds.length; ++i)
      this.spread(seeds[i], seeds, cluster_id, points, num_points, epsilon, minpts, dist);
    return_value = this.values.CORE_POINT;
  }
  return return_value;
};

DBSCAN.prototype.spread = function (index, seeds, cluster_id, points, num_points, epsilon, minpts, dist) {
  var i, c, d, idx, spread = this.get_epsilon_neighbours(index, points, num_points, epsilon, dist);
  c = spread.length;
  if (c >= minpts) {
    for (i = 0; i < c; ++i) {
      idx = spread[i];
      d = points[idx];
      if (d.cluster_id === this.values.NOISE || d.cluster_id === this.values.UNCLASSIFIED) {
        if (d.cluster_id === this.values.UNCLASSIFIED)
          seeds.push(idx);
        d.cluster_id = cluster_id;
      }
    }
  }
  return this.values.SUCCESS;
};

DBSCAN.prototype.euclidean_distance = function (a, b) {
  var sum = 0;
  for (var i = 0; i < a.classification.length; i++)
    sum += Math.pow((a.classification[i] - b.classification[i]), 2);

  return Math.sqrt(sum);
};

DBSCAN.prototype.print_points = function (points, num_points) {
  console.log("Number of points: " + num_points);
  var str = "";
  for (var i = 0; i < num_points; i++) {
    p = points[i];
    console.log(p.expert);
    for (var j = 0; j < p.classification.length; j++)
      console.log(JSON.stringify(p.classification));
    console.log("-> " + p.cluster_id);
  }
};
