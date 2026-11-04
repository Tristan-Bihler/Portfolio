/* POWER GRID — lights out: shut the whole grid down */
(function () {
  const N = 5, CELL = 76, GAP = 8;
  const BOARD = N * CELL + (N - 1) * GAP;
  const OX = (900 - BOARD) / 2, OY = 96;
  let grid, level, movesLeft, solvedCount;

  function toggle(x, y) {
    [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
      const nx = x + d[0], ny = y + d[1];
      if (nx >= 0 && nx < N && ny >= 0 && ny < N) grid[ny][nx] = !grid[ny][nx];
    });
  }

  function allOff() {
    return grid.every(function (row) { return row.every(function (c) { return !c; }); });
  }

  function scramble() {
    const presses = 2 + level;
    do {
      grid = [];
      for (let y = 0; y < N; y++) grid.push([false, false, false, false, false]);
      for (let i = 0; i < presses; i++) {
        toggle((Math.random() * N) | 0, (Math.random() * N) | 0);
      }
    } while (allOff());
    movesLeft = presses * 3;
  }

  Arcade.boot({
    slug: 'power-grid',
    menu: { title: 'POWER GRID', sub: 'Every switch flips its neighbours. Shut the whole grid down before the budget runs out.' },
    hudCenter: function () { return 'GRID ' + level + ' · MOVES LEFT ' + movesLeft; },

    start: function () {
      level = 1; solvedCount = 0;
      scramble();
    },

    onTap: function (A, x, y) {
      const cx = Math.floor((x - OX) / (CELL + GAP));
      const cy = Math.floor((y - OY) / (CELL + GAP));
      if (cx < 0 || cx >= N || cy < 0 || cy >= N) return;
      // ignore clicks in the gaps
      if ((x - OX) - cx * (CELL + GAP) > CELL || (y - OY) - cy * (CELL + GAP) > CELL) return;

      toggle(cx, cy);
      movesLeft--;
      A.burst(OX + cx * (CELL + GAP) + CELL / 2, OY + cy * (CELL + GAP) + CELL / 2, A.C.accent2, 6, 90);

      if (allOff()) {
        const pts = 100 * level + movesLeft * 10;
        A.score += pts;
        solvedCount++;
        A.popup(A.W / 2, OY - 24, '+' + pts + ' GRID DARK');
        level++;
        scramble();
      } else if (movesLeft <= 0) {
        A.shake(0.3);
        A.gameOver('OVERLOAD', 'You shut down ' + solvedCount + ' grids');
      }
    },

    update: function () {},

    draw: function (A, ctx) {
      const C = A.C;
      ctx.fillStyle = C.card;
      A.rrect(OX - 14, OY - 14, BOARD + 28, BOARD + 28, 6); ctx.fill();

      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const px = OX + x * (CELL + GAP), py = OY + y * (CELL + GAP);
          if (grid[y][x]) {
            ctx.fillStyle = C.accent;
            A.rrect(px, py, CELL, CELL, 6); ctx.fill();
            ctx.fillStyle = 'rgba(254,252,248,0.35)';
            A.rrect(px + 10, py + 10, CELL - 20, 10, 5); ctx.fill();
          } else {
            ctx.fillStyle = C.bg;
            A.rrect(px, py, CELL, CELL, 6); ctx.fill();
            ctx.strokeStyle = 'rgba(28,25,23,0.12)';
            ctx.lineWidth = 1.5;
            A.rrect(px + 0.5, py + 0.5, CELL - 1, CELL - 1, 6); ctx.stroke();
          }
        }
      }
    },
  });
})();
