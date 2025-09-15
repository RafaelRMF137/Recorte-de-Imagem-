const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');
const outputCanvas = document.getElementById('outputCanvas');
const outputCtx = outputCanvas.getContext('2d');

let img = new Image();
let polygon = [];
let draggingPoint = null;
const POINT_RADIUS = 6;
const LINE_CLICK_TOLERANCE = 8;

let mode = 'select'; // Modes: select, add, remove

function setMode(m) {
  mode = m;
  // Muda o cursor dependendo do modo
  canvas.style.cursor = {
    select: 'grab',
    add: 'copy',
    remove: 'not-allowed'
  }[mode];
}

function initPolygon() {
  polygon = [
    {x: 200, y: 200}, {x: 250, y: 180}, {x: 300, y: 190}, {x: 350, y: 220},
    {x: 340, y: 300}, {x: 300, y: 320}, {x: 250, y: 310}, {x: 210, y: 270}
  ];
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (img.complete) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Desenhar polígono
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i].x, polygon[i].y);
  }
  ctx.closePath();
  ctx.stroke();

  // Desenhar vértices
  for (let p of polygon) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, POINT_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = (mode === 'remove') ? 'red' : 'white';
    ctx.fill();
    ctx.strokeStyle = 'red';
    ctx.stroke();
  }
}

function getMousePos(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

canvas.addEventListener('mousedown', (e) => {
  const pos = getMousePos(e);

  if (mode === 'select') {
    for (let p of polygon) {
      if (Math.hypot(pos.x - p.x, pos.y - p.y) < POINT_RADIUS) {
        draggingPoint = p;
        return;
      }
    }
  } else if (mode === 'add') {
    const insertIndex = getEdgeClicked(pos);
    if (insertIndex !== -1) {
      polygon.splice(insertIndex + 1, 0, { x: pos.x, y: pos.y });
      draw();
    }
  } else if (mode === 'remove') {
    for (let i = 0; i < polygon.length; i++) {
      const p = polygon[i];
      if (Math.hypot(pos.x - p.x, pos.y - p.y) < POINT_RADIUS) {
        if (polygon.length > 3) {
          polygon.splice(i, 1);
          draw();
        } else {
          alert("O polígono precisa ter pelo menos 3 vértices.");
        }
        return;
      }
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (draggingPoint && mode === 'select') {
    const pos = getMousePos(e);
    draggingPoint.x = pos.x;
    draggingPoint.y = pos.y;
    draw();
  }
});

canvas.addEventListener('mouseup', () => draggingPoint = null);

function getEdgeClicked(pos) {
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    if (distanceToSegment(pos, p1, p2) < LINE_CLICK_TOLERANCE) {
      return i;
    }
  }
  return -1;
}

function distanceToSegment(p, v, w) {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

document.getElementById('imageLoader').addEventListener('change', function(e) {
  const reader = new FileReader();
  reader.onload = function(event) {
    img.onload = function() {
      initPolygon();
      draw();
    }
    img.src = event.target.result;
  }
  reader.readAsDataURL(e.target.files[0]);
});

function exportClip() {
  outputCanvas.width = canvas.width;
  outputCanvas.height = canvas.height;

  outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
  outputCtx.save();

  outputCtx.beginPath();
  outputCtx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i++) {
    outputCtx.lineTo(polygon[i].x, polygon[i].y);
  }
  outputCtx.closePath();
  outputCtx.clip();

  outputCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
  outputCtx.restore();

  const dataURL = outputCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'recorte.png';
  link.click();
}
