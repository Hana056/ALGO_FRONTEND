const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");

// =======================
// CONSTANTS
// =======================
const NODE_RADIUS = 40;

// =======================
// DYNAMIC GRAPH DATA
// =======================
let nodes = [
  { id: "Cairo", x: 100, y: 100 },
  { id: "Gaza", x: 320, y: 80 },
  { id: "Damascus", x: 100, y: 340 },
  { id: "Homs", x: 320, y: 340 },
  { id: "Aleppo", x: 580, y: 220 }
];

let edges = [
  { from: "Cairo", to: "Gaza", weight: 5 },
  { from: "Cairo", to: "Damascus", weight: 3 },
  { from: "Gaza", to: "Homs", weight: 2 },
  { from: "Damascus", to: "Homs", weight: 4 },
  { from: "Homs", to: "Aleppo", weight: 1 }
];

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

function runShortestPath(cost) {
  animatePath(shortestPath, "green");
  document.getElementById("result").innerText =
    `Shortest path cost from Cairo to Aleppo = ${cost}`;
}

// =======================
// PHASE 2: CAPACITY (DINIC)
// =======================
const capacityPaths = [
  ["Cairo", "Gaza", "Homs", "Aleppo"],
  ["Cairo", "Damascus", "Homs", "Aleppo"]
];

function runCapacity(maxFlow) {
  document.getElementById("result").innerText =
    `Maximum possible flow from Cairo to Aleppo = ${maxFlow} units`;

  let i = 0;

  function next() {
    if (i >= capacityPaths.length) return;

    animatePath(capacityPaths[i], "blue", () => {
      i++;
      next();
    });
  }

  next();
}

// =======================
// PHASE 3: SSP (FLOW DECOMPOSITION)
// =======================
const sspPaths = [
  ["Cairo", "Damascus", "Homs", "Aleppo"],
  ["Cairo", "Gaza", "Homs", "Aleppo"]
];

function runSSP(numPaths) {
  document.getElementById("result").innerText =
    `Flow decomposed into ${numPaths} disjoint paths`;

  let step = 0;
  function animateNext() {
    if (step >= sspPaths.length) return;
    animatePath(sspPaths[step], "red", () => {
      step++;
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

