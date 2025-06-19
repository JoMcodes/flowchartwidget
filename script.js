const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    let ideas = [];
    let connections = [];
    let history = [];
    let connecting = false;
    let selected = null;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawLines();
    }

    function drawLines() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      for (const [a, b] of connections) {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(aRect.left + aRect.width/2, aRect.top + aRect.height/2);
        ctx.lineTo(bRect.left + bRect.width/2, bRect.top + bRect.height/2);
        ctx.stroke();
      }
    }

    function saveState() {
      history.push({
        ideas: ideas.map(i => i.outerHTML),
        connections: connections.map(([a, b]) => [ideas.indexOf(a), ideas.indexOf(b)])
      });
    }

    function addIdea(x = 100, y = 100) {
      const div = document.createElement("div");
      div.className = "idea";
      div.textContent = "Idea";
      div.style.left = `${x}px`;
      div.style.top = `${y}px`;
      div.setAttribute("contenteditable", "true");

      let offsetX, offsetY;
      div.addEventListener("mousedown", e => {
        offsetX = e.offsetX;
        offsetY = e.offsetY;
        const move = e => {
          div.style.left = `${e.pageX - offsetX}px`;
          div.style.top = `${e.pageY - offsetY}px`;
          drawLines();
        };
        const up = () => {
          document.removeEventListener("mousemove", move);
          document.removeEventListener("mouseup", up);
          saveState();
        };
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
      });

      div.addEventListener("click", e => {
        if (!connecting) return;
        if (selected && selected !== div) {
          const existing = connections.find(([a, b]) =>
            (a === selected && b === div) || (a === div && b === selected));
          if (existing) {
            connections = connections.filter(([a, b]) => !(a === selected && b === div || a === div && b === selected));
          } else {
            connections.push([selected, div]);
          }
          selected = null;
          drawLines();
          saveState();
        } else {
          selected = div;
        }
      });

      document.body.appendChild(div);
      ideas.push(div);
      saveState();
    }

    function undo() {
      if (history.length < 2) return;
      history.pop();
      const prev = history[history.length - 1];
      connections = [];
      ideas.forEach(i => i.remove());
      ideas = [];
      prev.ideas.forEach(html => {
        const temp = document.createElement("div");
        temp.innerHTML = html;
        const div = temp.firstChild;
        document.body.appendChild(div);
        ideas.push(div);
      });
      prev.connections.forEach(([i, j]) => {
        connections.push([ideas[i], ideas[j]]);
      });
      drawLines();
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    document.getElementById("add").onclick = () => addIdea();
    document.getElementById("delete").onclick = () => {
      if (!selected) return;
      connections = connections.filter(([a, b]) => a !== selected && b !== selected);
      ideas = ideas.filter(i => i !== selected);
      selected.remove();
      selected = null;
      drawLines();
      saveState();
    };
    document.getElementById("connect").onclick = e => {
      connecting = !connecting;
      e.target.classList.toggle("active", connecting);
      selected = null;
    };
    document.getElementById("undo").onclick = () => undo();

    saveState();