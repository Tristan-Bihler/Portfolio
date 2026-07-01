/* OVERFLOW — falling blocks until the stack overflows */
(function () {
  const COLS = 10, ROWS = 18, CELL = 26;
  const OX = (900 - COLS * CELL) / 2, OY = 50;

  // base cells + bounding size per piece
  const PIECES = {
    I: { n: 4, c: [[0, 1], [1, 1], [2, 1], [3, 1]] },
    O: { n: 2, c: [[0, 0], [1, 0], [0, 1], [1, 1]] },
    T: { n: 3, c: [[1, 0], [0, 1], [1, 1], [2, 1]] },
    S: { n: 3, c: [[1, 0], [2, 0], [0, 1], [1, 1]] },
    Z: { n: 3, c: [[0, 0], [1, 0], [1, 1], [2, 1]] },
    J: { n: 3, c: [[0, 0], [0, 1], [1, 1], [2, 1]] },
    L: { n: 3, c: [[2, 0], [0, 1], [1, 1], [2, 1]] },
  };
  const ORDER = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  let COLORS;

  let board, cur, next, bag, dropT, lines, level, over;

  function cellsOf(p) {
    const def = PIECES[p.type];
    return def.c.map(function (c) {
      let x = c[0], y = c[1];
      for (let r = 0; r < p.rot; r++) {
        const t = x; x = def.n - 1 - y; y = t;
      }
      return [p.x + x, p.y + y];
    });
  }

  function hits(cells) {
    return cells.some(function (c) {
      return c[0] < 0 || c[0] >= COLS || c[1] >= ROWS || (c[1] >= 0 && board[c[1]][c[0]]);
    });
  }

  function pull() {
    if (!bag.length) {
      bag = ORDER.slice();
      for (let i = bag.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        const t = bag[i]; bag[i] = bag[j]; bag[j] = t;
      }
    }
    return bag.pop();
  }

  function spawn(A) {
    cur = { type: next, rot: 0, x: 3, y: -1 };
    next = pull();
    if (hits(cellsOf(cur))) {
      over = true;
      A.gameOver('STACK OVERFLOW', 'Lines cleared ' + lines);
    }
  }

  function tryMove(dx, dy, dr) {
    const p = { type: cur.type, rot: (cur.rot + (dr || 0)) % 4, x: cur.x + dx, y: cur.y + dy };
    if (!hits(cellsOf(p))) { cur = p; return true; }
    if (dr) {
      for (const k of [-1, 1, -2, 2]) {
        const q = { type: p.type, rot: p.rot, x: p.x + k, y: p.y };
        if (!hits(cellsOf(q))) { cur = q; return true; }
      }
    }
    return false;
  }

  function lock(A) {
    for (const c of cellsOf(cur)) {
      if (c[1] < 0) { over = true; A.gameOver('STACK OVERFLOW', 'Lines cleared ' + lines); return; }
      board[c[1]][c[0]] = cur.type;
    }
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y].every(function (v) { return v; })) {
        board.splice(y, 1);
        board.unshift(new Array(COLS).fill(null));
        cleared++;
        y++;
      }
    }
    if (cleared) {
      const pts = [0, 100, 300, 500, 800][cleared] * level;
      A.score += pts;
      lines += cleared;
      level = 1 + Math.floor(lines / 10);
      A.popup(OX + COLS * CELL / 2, OY + 200, '+' + pts);
      A.shake(cleared >= 4 ? 0.35 : 0.12);
    }
    spawn(A);
  }

  function hardDrop(A) {
    while (tryMove(0, 1, 0)) A.score += 1;
    lock(A);
  }

  Arcade.boot({
    slug: 'overflow',
    menu: { title: 'OVERFLOW', sub: 'Keep the stack tidy. Four lines at once is called a refactor.' },
    hudCenter: function () { return 'LINES ' + lines + ' · LEVEL ' + level; },

    start: function (A) {
      board = [];
      for (let y = 0; y < ROWS; y++) board.push(new Array(COLS).fill(null));
      COLORS = {
        I: A.C.accent, O: A.C.accent2, T: A.C.deep,
        S: A.C.body, Z: A.C.muted, J: A.C.ink, L: A.C.dim,
      };
      bag = []; next = pull();
      lines = 0; level = 1; dropT = 0; over = false;
      spawn(A);
    },

    onKey: function (A, k) {
      if (over) return;
      if (k === 'ArrowLeft' || k === 'a') tryMove(-1, 0, 0);
      if (k === 'ArrowRight' || k === 'd') tryMove(1, 0, 0);
      if (k === 'ArrowUp' || k === 'w') tryMove(0, 0, 1);
      if (k === ' ') hardDrop(A);
    },

    onTap: function (A, x, y) {
      if (over) return;
      if (x < OX - 10) tryMove(-1, 0, 0);
      else if (x > OX + COLS * CELL + 10) tryMove(1, 0, 0);
      else if (y < OY + ROWS * CELL * 0.55) tryMove(0, 0, 1);
      else hardDrop(A);
    },

    update: function (A, dt) {
      if (over) return;
      const soft = A.keys['ArrowDown'] || A.keys['s'];
      dropT += dt * (soft ? 9 : 1);
      const interval = Math.max(0.1, 0.75 - (level - 1) * 0.065);
      if (dropT >= interval) {
        dropT = 0;
        if (!tryMove(0, 1, 0)) lock(A);
        else if (soft) A.score += 1;
      }
    },

    draw: function (A, ctx) {
      const C = A.C;
      // frame
      ctx.fillStyle = C.card;
      A.rrect(OX - 10, OY - 10, COLS * CELL + 20, ROWS * CELL + 20, 4); ctx.fill();
      ctx.fillStyle = C.bg;
      ctx.fillRect(OX, OY, COLS * CELL, ROWS * CELL);

      function cell(x, y, col) {
        ctx.fillStyle = col;
        A.rrect(OX + x * CELL + 1.5, OY + y * CELL + 1.5, CELL - 3, CELL - 3, 4);
        ctx.fill();
      }

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (board[y][x]) cell(x, y, COLORS[board[y][x]]);
        }
      }
      if (!over) {
        for (const c of cellsOf(cur)) {
          if (c[1] >= 0) cell(c[0], c[1], COLORS[cur.type]);
        }
      }

      // next preview
      const px = OX + COLS * CELL + 42;
      A.font(600, 11, 3);
      ctx.fillStyle = C.dim;
      A.text('NEXT', px + 40, OY + 12, 'left');
      const def = PIECES[next];
      ctx.fillStyle = COLORS[next];
      for (const c of def.c) {
        A.rrect(px + 40 + c[0] * 18, OY + 32 + c[1] * 18, 15, 15, 3);
        ctx.fill();
      }
    },
  });
})();
