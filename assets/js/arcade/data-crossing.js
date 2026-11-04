/* DATA CROSSING — get the bit across the bus, lane by lane */
(function () {
  const CELL = 50, ROWS = 9;
  const OY = 62;
  let player, lanes, lives, level, COLS;

  function laneY(r) { return OY + r * CELL; }

  function buildLanes(A) {
    lanes = [];
    for (let r = 0; r < ROWS; r++) {
      if (r === 0 || r === 4 || r === 8) { lanes.push(null); continue; }
      const dir = r % 2 ? 1 : -1;
      const speed = (55 + Math.random() * 60 + level * 14) * dir;
      const cars = [];
      const n = 3;
      for (let i = 0; i < n; i++) {
        cars.push({
          x: (A.W / n) * i + A.rnd(0, 90),
          w: A.rnd(70, 130),
        });
      }
      lanes.push({ speed: speed, cars: cars });
    }
  }

  function resetPlayer(A) {
    player = { col: (COLS / 2) | 0, row: 8 };
  }

  function step(A, dc, dr) {
    player.col = A.clamp(player.col + dc, 0, COLS - 1);
    player.row = A.clamp(player.row + dr, 0, 8);
    if (player.row === 0) {
      A.score += 100;
      A.popup(player.col * CELL + CELL / 2, laneY(0) + CELL / 2, '+100 DELIVERED');
      level++;
      buildLanes(A);
      resetPlayer(A);
    }
  }

  Arcade.boot({
    slug: 'data-crossing',
    menu: { title: 'DATA CROSSING', sub: 'You are one precious bit. Cross six lanes of bus traffic to the register.' },
    hudCenter: function () { return 'LIVES ' + lives + ' · LEVEL ' + level; },

    start: function (A) {
      COLS = Math.floor(A.W / CELL);
      lives = 3; level = 1;
      buildLanes(A);
      resetPlayer(A);
    },

    onKey: function (A, k) {
      if (k === 'ArrowLeft' || k === 'a') step(A, -1, 0);
      if (k === 'ArrowRight' || k === 'd') step(A, 1, 0);
      if (k === 'ArrowUp' || k === 'w') step(A, 0, -1);
      if (k === 'ArrowDown' || k === 's') step(A, 0, 1);
    },

    onTap: function (A, x, y) {
      const px = player.col * CELL + CELL / 2;
      const py = laneY(player.row) + CELL / 2;
      if (Math.abs(x - px) > Math.abs(y - py)) step(A, Math.sign(x - px), 0);
      else step(A, 0, Math.sign(y - py));
    },

    update: function (A, dt) {
      for (let r = 0; r < ROWS; r++) {
        const lane = lanes[r];
        if (!lane) continue;
        for (const c of lane.cars) {
          c.x += lane.speed * dt;
          if (lane.speed > 0 && c.x > A.W + 20) c.x = -c.w - 20;
          if (lane.speed < 0 && c.x < -c.w - 20) c.x = A.W + 20;
        }
      }

      const lane = lanes[player.row];
      if (lane) {
        const px = player.col * CELL + CELL / 2;
        for (const c of lane.cars) {
          if (px + 15 > c.x && px - 15 < c.x + c.w) {
            lives--;
            A.shake(0.35);
            A.burst(px, laneY(player.row) + CELL / 2, A.C.accent, 20, 200);
            if (lives <= 0) { A.gameOver('PACKET LOST', 'Delivered ' + Math.floor(A.score / 100) + ' bits'); return; }
            resetPlayer(A);
            return;
          }
        }
      }
    },

    draw: function (A, ctx) {
      const C = A.C;

      // strips
      for (let r = 0; r < ROWS; r++) {
        const y = laneY(r);
        if (r === 0) {
          ctx.fillStyle = C.pale;
          ctx.fillRect(0, y, A.W, CELL);
          A.font(600, 11, 3);
          ctx.fillStyle = C.deep;
          A.text('REGISTER', A.W / 2, y + CELL / 2);
        } else if (r === 4 || r === 8) {
          ctx.fillStyle = C.card;
          ctx.fillRect(0, y, A.W, CELL);
        } else {
          ctx.strokeStyle = 'rgba(28,25,23,0.08)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, y + 0.5); ctx.lineTo(A.W, y + 0.5);
          ctx.moveTo(0, y + CELL - 0.5); ctx.lineTo(A.W, y + CELL - 0.5);
          ctx.stroke();
        }
      }

      // packets
      const palette = [C.ink, C.body, C.muted];
      for (let r = 0; r < ROWS; r++) {
        const lane = lanes[r];
        if (!lane) continue;
        for (let i = 0; i < lane.cars.length; i++) {
          const c = lane.cars[i];
          const y = laneY(r);
          ctx.fillStyle = palette[(r + i) % 3];
          A.rrect(c.x, y + 9, c.w, CELL - 18, 6); ctx.fill();
          ctx.fillStyle = C.bg;
          const hx = lane.speed > 0 ? c.x + c.w - 14 : c.x + 8;
          ctx.fillRect(hx, y + 16, 6, CELL - 32);
        }
      }

      // player bit
      const px = player.col * CELL + CELL / 2;
      const py = laneY(player.row) + CELL / 2;
      ctx.fillStyle = C.accent;
      A.rrect(px - 15, py - 15, 30, 30, 8); ctx.fill();
      A.font(700, 14, 0);
      ctx.fillStyle = C.bg;
      A.text('1', px, py + 1);
    },
  });
})();
