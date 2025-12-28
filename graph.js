// Get the canvas element from the HTML page (used to draw the graph)
const canvas = document.getElementById("graphCanvas");

// Get the 2D drawing context of the canvas (allows drawing shapes, lines, text)
const ctx = canvas.getContext("2d");

// Object that will store all data loaded from the backend (JSON output)
let backendData = null;

// Global animation ID used to control and cancel previous animations
let animationId = 0;

// Indicates which algorithm is currently active
// "dijkstra"  → edge labels represent COST
// "dinic"     → edge labels represent CAPACITY
// "mcmf"      → edge labels represent COST | CAPACITY
let currentMode = "dijkstra";


// =======================
// CONSTANTS
// =======================
const NODE_RADIUS = 40;

// =======================
// DYNAMIC GRAPH DATA
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
  { from: "Cairo", to: "Damietta", cost: 2, capacity: 5 },
  { from: "Cairo", to: "Arish", cost: 6, capacity: 6 },
  { from: "Cairo", to: "Acre", cost: 9, capacity: 2 },

  { from: "Damietta", to: "Arish", cost: 6, capacity: 4 },
  { from: "Damietta", to: "Gaza", cost: 7, capacity: 3 },
  { from: "Damietta", to: "Acre", cost: 9, capacity: 2 },

  { from: "Arish", to: "Gaza", cost: 2, capacity: 6 },
  { from: "Arish", to: "Jerusalem", cost: 6, capacity: 3 },
  { from: "Arish", to: "Acre", cost: 7, capacity: 1 },
  { from: "Arish", to: "Damascus", cost: 10, capacity: 1 },

  { from: "Gaza", to: "Jerusalem", cost: 5, capacity: 6 },
  { from: "Gaza", to: "Acre", cost: 6, capacity: 3 },

  { from: "Jerusalem", to: "Acre", cost: 3, capacity: 5 },
  { from: "Jerusalem", to: "Sidon", cost: 7, capacity: 2 },
  { from: "Jerusalem", to: "Damascus", cost: 6, capacity: 4 },
  { from: "Jerusalem", to: "Aleppo", cost: 12, capacity: 2 },

  { from: "Acre", to: "Sidon", cost: 3, capacity: 6 },
  { from: "Acre", to: "Tripoli", cost: 4, capacity: 4 },
  { from: "Acre", to: "Damascus", cost: 8, capacity: 1 },

  { from: "Sidon", to: "Tripoli", cost: 2, capacity: 6 },
  { from: "Sidon", to: "Homs", cost: 6, capacity: 2 },
  { from: "Sidon", to: "Damascus", cost: 7, capacity: 2 },

  { from: "Tripoli", to: "Homs", cost: 4, capacity: 5 },
  { from: "Tripoli", to: "Hamah", cost: 5, capacity: 2 },
  { from: "Tripoli", to: "Aleppo", cost: 6, capacity: 2 },

  { from: "Homs", to: "Hamah", cost: 2, capacity: 6 },
  { from: "Homs", to: "Damascus", cost: 4, capacity: 3 },
  { from: "Homs", to: "Aleppo", cost: 5, capacity: 3 },

  { from: "Hamah", to: "Damascus", cost: 3, capacity: 3 },
  { from: "Hamah", to: "Aleppo", cost: 4, capacity: 6 },

  { from: "Damascus", to: "Homs", cost: 4, capacity: 1 },
  { from: "Damascus", to: "Hamah", cost: 3, capacity: 2 },
  { from: "Damascus", to: "Aleppo", cost: 2, capacity: 5 }
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
// Maps backend numeric node IDs to UI node names
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
// Draws a single node (circle + label), optionally highlighted
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

// Draws a directed arrow between two nodes
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

// Draws an edge with the correct label based on the active algorithm
function drawEdge(edge, color = "gray", width = 2) {
  const fromNode = nodes.find(n => n.id === edge.from);
  const toNode = nodes.find(n => n.id === edge.to);

  drawArrow(fromNode, toNode, color, width);

  let label = "";
  if (currentMode === "dijkstra") {
    label = edge.cost;
  } 
  else if (currentMode === "dinic") {
    label = edge.capacity;
  } 
  else if (currentMode === "mcmf") {
    label = `${edge.cost} | ${edge.capacity}`;
  }

  const midX = (fromNode.x + toNode.x) / 2;
  const midY = (fromNode.y + toNode.y) / 2;

  ctx.fillStyle = "#000";
  ctx.font = "14px serif";
  ctx.fillText(label, midX + 6, midY - 6);
}

// Shifts all nodes so the graph is centered on the canvas
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
function animatePath(path, color, callback = null, index = 0, drawnEdges = [], myId) {
  if (myId !== animationId) return; // Stop old animation

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
    animatePath(path, color, callback, index + 1, drawnEdges, myId);
  }, 800);
}

// =======================
// PHASE 1: SHORTEST PATH
// =======================
const shortestPath = ["Cairo", "Damascus", "Homs", "Aleppo"];

function runDijkstraFromBackend() {
  currentMode = "dijkstra";
  if (!backendData) return;

  animationId++;            //  stop previous animation
  const myId = animationId;

  const path = mapPath(backendData.dijkstra.path);
  const cost = backendData.dijkstra.cost;

  drawGraph();
  animatePath(path, "green", null, 0, [], myId);

  document.getElementById("result").innerText =
    `Shortest path cost = ${cost}`;
}


// =======================
// PHASE 2: CAPACITY (DINIC)
// =======================
function runDinicFromBackend() {
  currentMode = "dinic";
  if (!backendData) return;

  animationId++;
  const myId = animationId;

  const paths = backendData.dinic.paths.map(p => mapPath(p));
  const maxFlow = backendData.dinic.max_flow;

  drawGraph();
  document.getElementById("result").innerText =
    `Maximum flow = ${maxFlow}`;

  let i = 0;
  function animateNext() {
    if (i >= paths.length || myId !== animationId) return;
    animatePath(paths[i], "blue", () => {
      i++;
      animateNext();
    }, 0, [], myId);
  }
  animateNext();
}


// =======================
// PHASE 3: SSP 
// =======================
function runSSPFromBackend() {
  currentMode = "mcmf";
  if (!backendData) return;

  animationId++;
  const myId = animationId;

  const paths = backendData.mcmf.paths.map(p => mapPath(p.nodes));
  const totalCost = backendData.mcmf.total_cost;

  drawGraph();
  document.getElementById("result").innerText =
    `Total min cost = ${totalCost}`;

  let i = 0;
  function animateNext() {
    if (i >= paths.length || myId !== animationId) return;
    animatePath(paths[i], "red", () => {
      i++;
      animateNext();
    }, 0, [], myId);
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
