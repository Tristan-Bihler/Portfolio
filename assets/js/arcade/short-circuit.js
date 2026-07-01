/* SHORT CIRCUIT — minesweeper on a crowded board */
(function () {
  const COLS = 14, ROWS = 9, CELL = 36, MINES = 20;
  const OX = (900 - COLS * CELL) / 2, OY = 92;
  let grid, placed, opened, flags, flagMode, elapsed, done;

  function each(fn) {
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) fn(grid[y][x], x, y);
  }
  function neighbors(x, y, fn) {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) fn(grid[ny][nx], nx, ny);
    }
  }

  function placeMines(sx, sy) {
    let n = 0;
    while (n < MINES) {
      const x = (Math.random() * COLS) | 0, y = (Math.random() * ROWS) | 0;
      if (grid[y][x].mine) continue;
      if (Math.abs(x - sx) <= 1 && Math.abs(y - sy) <= 1) continue;
      grid[y][x].mine = true;
      n++;
    }
    each(function (c, x, y) {
      let m = 0;
      neighbors(x, y, function (nc) { if (nc.mine) m++; });
      c.n = m;
    });
    placed = true;
  }

  function reveal(A, sx, sy) {
    const stack = [[sx, sy]];
    while (stack.length) {
      const p = stack.pop();
      const c = grid[p[1]][p[0]];
      if (c.open || c.flag) continue;
      c.open = true;
      opened++;
      A.score += 5;
      if (c.n === 0 && !c.mine) {
        neighbors(p[0], p[1], function (nc, nx, ny) {
          if (!nc.open && !nc.flag) stack.push([nx, ny]);
        });
      }
    }
  }

  Arcade.boot({
    slug: 'short-circuit',
    menu: { title: 'SHORT CIRCUIT', sub: '20 shorts hide in the board. Probe every safe pad — flag the rest.' },
    hudCenter: function () {
      return 'SHORTS ' + (MINES - flags) + ' · TIME ' + Math.floor(elapsed) + 'S';
    },

    start: function () {
      grid = [];
      for (let y = 0; y < ROWS; y++) {
        const row = [];
        for (let x = 0; x < COLS; x++) row.push({ mine: false, open: false, flag: false, n: 0 });
        grid.push(row);
      }
      placed = false; opened = 0; flags = 0;
      flagMode = false; elapsed = 0; done = false;
    },

    onKey: function (A, k) { if (k === 'f') flagMode = !flagMode; },

    onTap: function (A, x, y, right) {
      if (done) return;
      // flag-mode toggle button
      if (x > OX + COLS * CELL - 150 && x < OX + COLS * CELL && y > OY - 34 && y < OY - 6) {
        flagMode = !flagMode;
        return;
      }
      const cx = Math.floor((x - OX) / CELL), cy = Math.floor((y - OY) / CELL);
      if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return;
      const c = grid[cy][cx];

      if (right || flagMode) {
        if (!c.open) { c.flag = !c.flag; flags += c.flag ? 1 : -1; }
        return;
      }
      if (c.flag || c.open) return;
      if (!placed) placeMines(cx, cy);

      if (c.mine) {
        c.open = true;
        done = true;
        each(function (cc) { if (cc.mine) cc.open = true; });
        A.shake(0.45);
        A.burst(OX + cx * CELL + CELL / 2, OY + cy * CELL + CELL / 2, A.C.accent, 30, 260);
        A.gameOver('BZZT', 'You probed a short after ' + Math.floor(elapsed) + 's');
        return;
      }
      reveal(A, cx, cy);
      if (opened === COLS * ROWS - MINES) {
        done = true;
        A.score += Math.max(0, 600 - Math.floor(elapsed) * 4);
        A.gameOver('BOARD CLEARED', 'All shorts isolated in ' + Math.floor(elapsed) + 's');
      }
    },

    update: function (A, dt) { if (placed && !done) elapsed += dt; },

    draw: function (A, ctx) {
      const C = A.C;
      const NUMCOL = [null, C.body, C.accent, C.deep, C.ink, C.muted, C.muted, C.muted, C.muted];

      // flag-mode toggle
      ctx.fillStyle = flagMode ? C.accent : C.card;
      A.rrect(OX + COLS * CELL - 150, OY - 34, 150, 28, 3); ctx.fill();
      A.font(600, 10, 2);
      ctx.fillStyle = flagMode ? C.bg : C.muted;
      A.text('FLAG MODE ' + (flagMode ? 'ON' : 'OFF') + ' (F)', OX + COLS * CELL - 75, OY - 20);

      A.font(600, 10, 2);
      ctx.fillStyle = C.dim;
      A.text('RIGHT-CLICK OR FLAG MODE TO MARK', OX + 150, OY - 20, 'center');

      each(function (c, x, y) {
        const px = OX + x * CELL, py = OY + y * CELL;
        if (c.open) {
          ctx.fillStyle = C.bg;
          ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
          ctx.strokeStyle = 'rgba(28,25,23,0.07)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 1.5, py + 1.5, CELL - 3, CELL - 3);
          if (c.mine) {
            A.circle(px + CELL / 2, py + CELL / 2, 8, C.ink);
            ctx.strokeStyle = C.ink;
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
              const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
              ctx.beginPath();
              ctx.moveTo(px + CELL / 2 + Math.cos(a) * 8, py + CELL / 2 + Math.sin(a) * 8);
              ctx.lineTo(px + CELL / 2 + Math.cos(a) * 13, py + CELL / 2 + Math.sin(a) * 13);
              ctx.stroke();
            }
          } else if (c.n > 0) {
            A.font(700, 15, 0);
            ctx.fillStyle = NUMCOL[c.n];
            A.text(String(c.n), px + CELL / 2, py + CELL / 2 + 1);
          }
        } else {
          ctx.fillStyle = C.card;
          A.rrect(px + 1.5, py + 1.5, CELL - 3, CELL - 3, 3); ctx.fill();
          ctx.strokeStyle = 'rgba(28,25,23,0.1)';
          ctx.lineWidth = 1;
          A.rrect(px + 1.5, py + 1.5, CELL - 3, CELL - 3, 3); ctx.stroke();
          if (c.flag) {
            ctx.strokeStyle = C.deep;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px + CELL / 2 - 3, py + CELL - 9);
            ctx.lineTo(px + CELL / 2 - 3, py + 8);
            ctx.stroke();
            ctx.fillStyle = C.accent;
            ctx.beginPath();
            ctx.moveTo(px + CELL / 2 - 3, py + 8);
            ctx.lineTo(px + CELL / 2 + 10, py + 12.5);
            ctx.lineTo(px + CELL / 2 - 3, py + 17);
            ctx.closePath();
            ctx.fill();
          }
        }
      });
    },
  });
})();
