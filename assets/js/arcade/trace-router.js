/* TRACE ROUTER — snake, but the snake is a PCB trace */
(function () {
  const COLS = 30, ROWS = 16, CELL = 28;
  let snake, dir, queue, food, tick, alive;
  const OX = (900 - COLS * CELL) / 2, OY = 62;

  function freeCell() {
    while (true) {
      const c = { x: (Math.random() * COLS) | 0, y: (Math.random() * ROWS) | 0 };
      if (!snake.some(function (s) { return s.x === c.x && s.y === c.y; })) return c;
    }
  }

  function push(d) {
    const last = queue.length ? queue[queue.length - 1] : dir;
    if (d.x === -last.x && d.y === -last.y) return;
    if (d.x === last.x && d.y === last.y) return;
    if (queue.length < 3) queue.push(d);
  }

  Arcade.boot({
    slug: 'trace-router',
    menu: { title: 'TRACE ROUTER', sub: 'Route the trace to every solder pad. Don’t cross yourself.' },
    hudCenter: function () { return snake ? 'LENGTH ' + snake.length : ''; },

    start: function () {
      snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
      dir = { x: 1, y: 0 };
      queue = [];
      tick = 0;
      food = freeCell();
    },

    onKey: function (A, k) {
      if (k === 'ArrowLeft' || k === 'a') push({ x: -1, y: 0 });
      if (k === 'ArrowRight' || k === 'd') push({ x: 1, y: 0 });
      if (k === 'ArrowUp' || k === 'w') push({ x: 0, y: -1 });
      if (k === 'ArrowDown' || k === 's') push({ x: 0, y: 1 });
    },

    onTap: function (A, x, y) {
      const hx = OX + snake[0].x * CELL + CELL / 2;
      const hy = OY + snake[0].y * CELL + CELL / 2;
      if (Math.abs(x - hx) > Math.abs(y - hy)) push({ x: Math.sign(x - hx), y: 0 });
      else push({ x: 0, y: Math.sign(y - hy) });
    },

    update: function (A, dt) {
      const spd = Math.min(15, 7 + Math.floor(A.score / 60));
      tick += dt;
      if (tick < 1 / spd) return;
      tick = 0;

      if (queue.length) dir = queue.shift();
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
          snake.some(function (s) { return s.x === head.x && s.y === head.y; })) {
        A.shake(0.3);
        A.gameOver('SHORT CIRCUIT', 'Trace length ' + snake.length);
        return;
      }

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        A.score += 10;
        A.popup(OX + food.x * CELL + CELL / 2, OY + food.y * CELL, '+10');
        A.burst(OX + food.x * CELL + CELL / 2, OY + food.y * CELL + CELL / 2, A.C.accent, 10);
        food = freeCell();
      } else {
        snake.pop();
      }
    },

    draw: function (A, ctx) {
      const C = A.C;
      // board
      ctx.fillStyle = C.card;
      A.rrect(OX - 8, OY - 8, COLS * CELL + 16, ROWS * CELL + 16, 4); ctx.fill();
      ctx.fillStyle = C.bg;
      ctx.fillRect(OX, OY, COLS * CELL, ROWS * CELL);

      // food pad
      const fx = OX + food.x * CELL + CELL / 2, fy = OY + food.y * CELL + CELL / 2;
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(fx, fy, 8, 0, Math.PI * 2); ctx.stroke();
      A.circle(fx, fy, 3, C.accent);

      // snake trace
      for (let i = snake.length - 1; i >= 0; i--) {
        const s = snake[i];
        ctx.fillStyle = i === 0 ? C.deep : (i % 2 ? C.accent : C.accent2);
        A.rrect(OX + s.x * CELL + 2, OY + s.y * CELL + 2, CELL - 4, CELL - 4, 7);
        ctx.fill();
      }
      // head eyes
      const h = snake[0];
      ctx.fillStyle = C.bg;
      ctx.fillRect(OX + h.x * CELL + 9, OY + h.y * CELL + 10, 3, 3);
      ctx.fillRect(OX + h.x * CELL + 16, OY + h.y * CELL + 10, 3, 3);
    },
  });
})();
