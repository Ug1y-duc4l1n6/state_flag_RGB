// Helper: load JSON
async function loadFlagsData() {
  const res = await fetch('flags_rgb.json');
  return await res.json();
}

// K-means clustering (vanilla JS, k=4)
function kmeans(points, k=4, maxIter=100) {
  // points: [{avg_rgb: [r,g,b], ...}]
  // Returns: {labels: [clusterIdx], centroids: [[r,g,b], ...]}
  const n = points.length;
  let centroids = [];
  // Init: pick k random points
  for (let i = 0; i < k; i++) {
    centroids.push([...points[Math.floor(Math.random()*n)].avg_rgb]);
  }
  let labels = new Array(n).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    // Assign clusters
    for (let i = 0; i < n; i++) {
      let minDist = Infinity, minIdx = 0;
      for (let j = 0; j < k; j++) {
        let d = 0;
        for (let c = 0; c < 3; c++) d += Math.pow(points[i].avg_rgb[c] - centroids[j][c], 2);
        if (d < minDist) { minDist = d; minIdx = j; }
      }
      labels[i] = minIdx;
    }
    // Update centroids
    let newCentroids = Array(k).fill().map(()=>[0,0,0]);
    let counts = Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      let lbl = labels[i];
      for (let c = 0; c < 3; c++) newCentroids[lbl][c] += points[i].avg_rgb[c];
      counts[lbl]++;
    }
    for (let j = 0; j < k; j++) {
      if (counts[j] > 0) {
        for (let c = 0; c < 3; c++) newCentroids[j][c] /= counts[j];
      } else {
        newCentroids[j] = [...points[Math.floor(Math.random()*n)].avg_rgb];
      }
    }
    // Check for convergence
    let done = true;
    for (let j = 0; j < k; j++) {
      for (let c = 0; c < 3; c++) {
        if (Math.abs(newCentroids[j][c] - centroids[j][c]) > 1e-6) done = false;
      }
    }
    centroids = newCentroids;
    if (done) break;
  }
  return {labels, centroids};
}

// Plotting
function plotClusters(points, labels, centroids) {
  const colors = ['red','blue','green','orange','purple','cyan','magenta','yellow'];
  // Points
  const data = [];
  for (let k = 0; k < centroids.length; k++) {
    const clusterPoints = points.filter((_,i)=>labels[i]===k);
    data.push({
      x: clusterPoints.map(p=>p.avg_rgb[0]),
      y: clusterPoints.map(p=>p.avg_rgb[1]),
      z: clusterPoints.map(p=>p.avg_rgb[2]),
      mode: 'markers',
      type: 'scatter3d',
      name: `Cluster ${k+1}`,
      marker: { size: 6, color: colors[k%colors.length] },
      text: clusterPoints.map(p=>p.state)
    });
    // Lines to centroid
    data.push(...clusterPoints.map(p=>({
      x: [p.avg_rgb[0], centroids[k][0]],
      y: [p.avg_rgb[1], centroids[k][1]],
      z: [p.avg_rgb[2], centroids[k][2]],
      mode: 'lines',
      type: 'scatter3d',
      line: { color: colors[k%colors.length], width: 1 },
      showlegend: false
    })));
  }
  // Centroids
  data.push({
    x: centroids.map(c=>c[0]),
    y: centroids.map(c=>c[1]),
    z: centroids.map(c=>c[2]),
    mode: 'markers',
    type: 'scatter3d',
    name: 'Centroids',
    marker: { size: 12, color: 'black', symbol: 'diamond' }
  });
  Plotly.newPlot('plot', data, {
    margin: { l:0, r:0, b:0, t:0 },
    scene: { xaxis: {title:'Red'}, yaxis: {title:'Green'}, zaxis: {title:'Blue'} }
  });
}

// List clusters
function listClusters(points, labels, k) {
  const clustersDiv = document.getElementById('clusters');
  clustersDiv.innerHTML = '';
  for (let i = 0; i < k; i++) {
    const group = document.createElement('div');
    group.className = 'cluster-group';
    const title = document.createElement('div');
    title.className = 'cluster-title';
    title.textContent = `Cluster ${i+1}`;
    group.appendChild(title);
    points.forEach((p, idx) => {
      if (labels[idx] === i) {
        const item = document.createElement('div');
        item.className = 'state-item';
        const img = document.createElement('img');
        img.className = 'state-thumb';
        img.src = p.thumbnail.replace('/workspaces/state_flag_RGB/', '');
        img.alt = p.state;
        item.appendChild(img);
        const name = document.createElement('span');
        name.textContent = p.state;
        item.appendChild(name);
        group.appendChild(item);
      }
    });
    clustersDiv.appendChild(group);
  }
}

// Main
loadFlagsData().then(points => {
  const k = 4;
  const {labels, centroids} = kmeans(points, k);
  plotClusters(points, labels, centroids);
  listClusters(points, labels, k);
});
