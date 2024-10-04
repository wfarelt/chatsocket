//pizarra

const canvas = document.getElementById("drawingBoard");
const ctx = canvas.getContext("2d");
let drawing = false;

canvas.addEventListener("mousedown", () => (drawing = true));
canvas.addEventListener("mouseup", () => (drawing = false));
canvas.addEventListener("mousemove", draw);

let lastSent = 0;
function draw(event) {
    
  if (!drawing) return;
  const now = Date.now();

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  ctx.lineTo(x, y);
  ctx.stroke();

  if (now - lastSent > 150) {
    //Solo enviar datos cada 50ms
    //chatSocket.send(JSON.stringify({ type: "draw", x: x, y: y }));

    chatSocket.send(JSON.stringify({ type: "draw", x: x, y: y }));

    lastSent = now;
  }
}

