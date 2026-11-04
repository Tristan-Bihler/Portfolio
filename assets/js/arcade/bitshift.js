/* BITSHIFT — 2048, shifted one bit at a time */
(function () {
  const N = 4, CELL = 96, GAP = 10;
  const BOARD = N * CELL + (N - 1) * GAP;
  const OX = (900 - BOARD) / 2, OY = 96;
  let grid, downPos, won;

  function tileStyle(A, v) {
    const e = Math.round(Math.log2(v));
    const bg = [null, A.C.tag, '#e2d8c3', A.C.accent2, A.C.accent, A.C.deep,
      A.C.body, A.C.mid, A.C.ink, A.C.ink, A.C.ink, A.C.ink][Math.min(e, 11)];
    return { bg: bg, fg: e < 3 ? A.C.mid : A.C.bg };
  }

  function emptyCells() {
    const out = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!grid[y][x]) out.push([x, y]);
    }
    return out;
  }

  function spawn() {
    const free = emptyCells();
    if (!free.length) return;
    const p = free[(Math.random() * free.length) | 0];
    grid[p[1]][p[0]] = { v: Math.random() < 0.9 ? 2 : 4, pop: 0.18 };
  }

  function canMove() {
    if (emptyCells().length) return true;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const v = grid[y][x].v;
      if (x + 1 < N && grid[y][x + 1].v === v) return true;
      if (y + 1 < N && grid[y + 1][x].v === v) return true;
    }
    return false;
  }

  function move(A, dx, dy) {
    let moved = false;
    const xs = [], ys = [];
    for (let i = 0; i < N; i++) { xs.push(dx > 0 ? N - 1 - i : i); ys.push(dy > 0 ? N - 1 - i : i); }
    const merged = {};
    for (const y of ys) for (const x of xs) {
      const t = grid[y][x];
      if (!t) continue;
      let cx = x, cy = y;
      while (true) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || nx >= N || ny < 0 || ny >= N) break;
        const o = grid[ny][nx];
        if (!o) { grid[ny][nx] = t; grid[cy][cx] = null; cx = nx; cy = ny; moved = true; continue; }
        if (o.v === t.v && !merged[nx + ',' + ny]) {
          o.v *= 2; o.pop = 0.18;
          merged[nx + ',' + ny] = true;
          grid[cy][cx] = null;
          A.score += o.v;
          moved = true;
          if (o.v === 2048 && !won) {
            won = true;
            A.popup(A.W / 2, OY - 20, '2048 — ELEVEN BITS!');
          }
        }
        break;
      }
    }
    if (moved) {
      spawn();
      if (!canMove()) A.gameOver('OUT OF MEMORY', 'No shifts left');
    }
  }

  Arcade.boot({
    slug: 'bitshift',
    menu: { title: 'BITSHIFT', sub: 'Merge equal powers of two. Eleven shifts gets you to 2048.' },

    start: function () {
      grid = [];
      for (let y = 0; y < N; y++) grid.push([null, null, null, null]);
      won = false;
      spawn(); spawn();
    },

    onKey: function (A, k) {
      if (k === 'ArrowLeft' || k === 'a') move(A, -1, 0);
      if (k === 'ArrowRight' || k === 'd') move(A, 1, 0);
      if (k === 'ArrowUp' || k === 'w') move(A, 0, -1);
      if (k === 'ArrowDown' || k === 's') move(A, 0, 1);
    },

    onTap: function (A, x, y) { downPos = { x: x, y: y }; },
    onRelease: function (A, x, y) {
      if (!downPos) return;
      const dx = x - downPos.x, dy = y - downPos.y;
      downPos = null;
      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
      if (Math.abs(dx) > Math.abs(dy)) move(A, Math.sign(dx), 0);
      else move(A, 0, Math.sign(dy));
    },

    update: function (A, dt) {
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        if (grid[y][x] && grid[y][x].pop > 0) grid[y][x].pop -= dt;
      }
    },

    draw: function (A, ctx) {
      const C = A.C;
      ctx.fillStyle = C.card;
      A.rrect(OX - 12, OY - 12, BOARD + 24, BOARD + 24, 6); ctx.fill();

      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const px = OX + x * (CELL + GAP), py = OY + y * (CELL + GAP);
        ctx.fillStyle = 'rgba(28,25,23,0.05)';
        A.rrect(px, py, CELL, CELL, 5); ctx.fill();

        const t = grid[y][x];
        if (!t) continue;
        const st = tileStyle(A, t.v);
        const k = t.pop > 0 ? 1 + t.pop * 0.9 : 1;
        const s = CELL * k, off = (CELL - s) / 2;
        ctx.fillStyle = st.bg;
        A.rrect(px + off, py + off, s, s, 5); ctx.fill();
        A.font(700, t.v < 128 ? 34 : t.v < 1024 ? 28 : 24, 0);
        ctx.fillStyle = st.fg;
        A.text(String(t.v), px + CELL / 2, py + CELL / 2 + 1);
      }
    },
  });
})();
