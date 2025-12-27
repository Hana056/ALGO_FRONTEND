const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");
let backendData = null;

// =======================
// CONSTANTS
// =======================
const NODE_RADIUS = 40;

// =======================
// DYNAMIC GRAPH DATA
// =======================

// VISUAL LAYOUT (Schematic View)
// =======================

let nodes = [
  { id: "Cairo",     x: 60,  y: 260 },
  { id: "Damietta",  x: 160, y: 80 }, 
  { id: "Arish",     x: 160, y: 360 }, 
  { id: "Acre",      x: 300, y: 100 }, 
  { id: "Gaza",      x: 300, y: 460 }, 
  { id: "Sidon",     x: 450, y: 1  }, 
  { id: "Jerusalem", x: 450, y: 460 }, 
  { id: "Tripoli",   x: 670, y: 1  }, 
  { id: "Damascus",  x: 640, y: 300 }, 
  { id: "Homs",      x: 790, y: 70  }, 
  { id: "Hamah",     x: 780, y: 440 }, 
  { id: "Aleppo",    x: 880, y: 260 }  
]

let edges = [
  // 0: Cairo -> Damietta, Arish, Acre
  { from: "Cairo",     to: "Damietta",  weight: 2 },
  { from: "Cairo",     to: "Arish",     weight: 6 },
  { from: "Cairo",     to: "Acre",      weight: 9 },

  // 1: Damietta -> Arish, Gaza, Acre
  { from: "Damietta",  to: "Arish",     weight: 6 },
  { from: "Damietta",  to: "Gaza",      weight: 7 },
  { from: "Damietta",  to: "Acre",      weight: 9 },

  // 2: Arish -> Gaza, Jerusalem, Acre, Damascus
  { from: "Arish",     to: "Gaza",      weight: 2 },
  { from: "Arish",     to: "Jerusalem", weight: 6 },
  { from: "Arish",     to: "Acre",      weight: 7 },
  { from: "Arish",     to: "Damascus",  weight: 10 },

  // 3: Gaza -> Jerusalem, Acre
  { from: "Gaza",      to: "Jerusalem", weight: 5 },
  { from: "Gaza",      to: "Acre",      weight: 6 },

  // 4: Jerusalem -> Acre, Sidon, Damascus, Aleppo
  { from: "Jerusalem", to: "Acre",      weight: 3 },
  { from: "Jerusalem", to: "Sidon",     weight: 7 },
  { from: "Jerusalem", to: "Damascus",  weight: 6 },
  { from: "Jerusalem", to: "Aleppo",    weight: 12 },

  // 5: Acre -> Sidon, Tripoli, Damascus
  { from: "Acre",      to: "Sidon",     weight: 3 },
  { from: "Acre",      to: "Tripoli",   weight: 4 },
  { from: "Acre",      to: "Damascus",  weight: 8 },

  // 6: Sidon -> Tripoli, Homs, Damascus
  { from: "Sidon",     to: "Tripoli",   weight: 2 },
  { from: "Sidon",     to: "Homs",      weight: 6 },
  { from: "Sidon",     to: "Damascus",  weight: 7 },

  // 7: Tripoli -> Homs, Hamah, Aleppo
  { from: "Tripoli",   to: "Homs",      weight: 4 },
  { from: "Tripoli",   to: "Hamah",     weight: 5 },
  { from: "Tripoli",   to: "Aleppo",    weight: 6 },

  // 8: Homs -> Hamah, Damascus, Aleppo
  { from: "Homs",      to: "Hamah",     weight: 2 },
  { from: "Homs",      to: "Damascus",  weight: 4 },
  { from: "Homs",      to: "Aleppo",    weight: 5 },

  // 9: Hamah -> Damascus, Aleppo
  { from: "Hamah",     to: "Damascus",  weight: 3 },
  { from: "Hamah",     to: "Aleppo",    weight: 4 },

  // 10: Damascus -> Homs, Hamah, Aleppo
  { from: "Damascus",  to: "Homs",      weight: 4 },
  { from: "Damascus",  to: "Hamah",     weight: 3 },
  { from: "Damascus",  to: "Aleppo",    weight: 2 }
];

// =======================
// BACKEND NODE ID → UI NAME MAP
// =======================
const nodeMap = {
  0: "Cairo",
  1: "Damietta",
  2: "Arish",
  3: "Gaza",
  4: "Jerusalem",
  5: "Acre",
  6: "Sidon",
  7: "Tripoli",
  8: "Homs",
  9: "Hamah",
  10: "Damascus",
  11: "Aleppo"
};
function mapPath(path) {
  return path.map(id => nodeMap[id]);
}

// =======================
// UPDATE GRAPH DATA FUNCTION
// =======================
function updateGraphData(newNodes, newEdges) {
  nodes = newNodes;
  edges = newEdges;
  centerGraph();
  drawGraph();
}

// =======================
// DRAWING HELPERS
// =======================
function drawNode(x, y, label, highlight = false) {
  ctx.beginPath();
  ctx.arc(x, y, NODE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = highlight ? "#f4e04d" : "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#000";
  ctx.font = "15px serif";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + 5);
}

function drawArrow(from, to, color, width) {
  const headLength = 14;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);

  const offsetX = NODE_RADIUS * Math.cos(angle);
  const offsetY = NODE_RADIUS * Math.sin(angle);

  const startX = from.x + offsetX;
  const startY = from.y + offsetY;
  const endX = to.x - offsetX;
  const endY = to.y - offsetY;

  ctx.strokeStyle = color;
  ctx.lineWidth = width;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle - Math.PI / 6),
    endY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    endX - headLength * Math.cos(angle + Math.PI / 6),
    endY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawEdge(edge, color = "gray", width = 2) {
  const fromNode = nodes.find(n => n.id === edge.from);
  const toNode = nodes.find(n => n.id === edge.to);

  drawArrow(fromNode, toNode, color, width);

  const midX = (fromNode.x + toNode.x) / 2;
  const midY = (fromNode.y + toNode.y) / 2;
  ctx.fillStyle = "#000";
  ctx.font = "14px serif";
  ctx.fillText(edge.weight, midX + 6, midY - 6);
}

function centerGraph() {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  nodes.forEach(n => {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x);
    maxY = Math.max(maxY, n.y);
  });

  const graphCenterX = (minX + maxX) / 2;
  const graphCenterY = (minY + maxY) / 2;

  const canvasCenterX = canvas.width / 2;
  const canvasCenterY = canvas.height / 2;

  const offsetX = canvasCenterX - graphCenterX;
  const offsetY = canvasCenterY - graphCenterY;

  nodes.forEach(n => {
    n.x += offsetX;
    n.y += offsetY;
  });
}

// =======================
// GRAPH RENDER
// =======================
function drawGraph(highlightNodes = [], highlightEdges = [], color = "green") {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  edges.forEach(edge => {
    const active = highlightEdges.includes(edge);
    drawEdge(edge, active ? color : "gray", active ? 5 : 2);
  });

  nodes.forEach(node => {
    drawNode(
      node.x,
      node.y,
      node.id,
      highlightNodes.includes(node.id)
    );
  });
}

// =======================
// PATH → EDGES
// =======================
function pathToEdges(path) {
  const result = [];
  for (let i = 0; i < path.length - 1; i++) {
    const edge = edges.find(
      e => e.from === path[i] && e.to === path[i + 1]
    );
    if (edge) result.push(edge);
  }
  return result;
}

// =======================
// ANIMATION
// =======================
function animatePath(path, color, callback = null, index = 0, drawnEdges = []) {
  if (index >= path.length - 1) {
    if (callback) callback();
    return;
  }

  const edge = edges.find(
    e => e.from === path[index] && e.to === path[index + 1]
  );
  drawnEdges.push(edge);

  drawGraph(path.slice(0, index + 2), drawnEdges, color);

  setTimeout(() => {
    animatePath(path, color, callback, index + 1, drawnEdges);
  }, 800);
}

// =======================
// PHASE 1: SHORTEST PATH
// =======================
const shortestPath = ["Cairo", "Damascus", "Homs", "Aleppo"];

function runDijkstraFromBackend() {
  if (!backendData) return;

  const path = mapPath(backendData.dijkstra.path);
  const cost = backendData.dijkstra.cost;

  drawGraph(); // reset canvas
  animatePath(path, "green");

  document.getElementById("result").innerText =
    `Shortest path cost = ${cost}`;
}


// =======================
// PHASE 2: CAPACITY (DINIC)
// =======================
function runDinicFromBackend() {
  if (!backendData) return;

  const paths = backendData.dinic.paths.map(p => mapPath(p));
  const maxFlow = backendData.dinic.max_flow;

  drawGraph();
  document.getElementById("result").innerText =
    `Maximum flow = ${maxFlow}`;

  let i = 0;
  function animateNext() {
    if (i >= paths.length) return;
    animatePath(paths[i], "blue", () => {
      i++;
      animateNext();
    });
  }
  animateNext();
}


// =======================
// PHASE 3: SSP (FLOW DECOMPOSITION)
// =======================
function runSSPFromBackend() {
  if (!backendData) return;

  const paths = backendData.mcmf.paths.map(p => mapPath(p.nodes));
  const totalCost = backendData.mcmf.total_cost;

  drawGraph();
  document.getElementById("result").innerText =
    `Total min cost = ${totalCost}`;

  let i = 0;
  function animateNext() {
    if (i >= paths.length) return;
    animatePath(paths[i], "red", () => {
      i++;
      animateNext();
    });
  }
  animateNext();
}


// =======================
// INITIAL DRAW
// =======================
centerGraph();
drawGraph();

fetch("data.json")
  .then(res => res.json())
  .then(data => {
    backendData = data;
    console.log("Backend data loaded:", backendData);
  })
  .catch(err => console.error("Failed to load backend data", err));
