/* XOR — tic-tac-toe against a mostly-rational machine */
(function () {
  const CELL = 128;
  let board, turn, thinkT, streak, roundEnd, winLine, msg;
  const OX = (900 - CELL * 3) / 2, OY = 88;

  const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  function winner(b) {
    for (const l of LINES) {
      if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return { p: b[l[0]], line: l };
    }
    if (b.every(function (c) { return c; })) return { p: 'draw', line: null };
    return null;
  }

  function minimax(b, isCpu, depth) {
    const w = winner(b);
    if (w) {
      if (w.p === 'O') return 10 - depth;
      if (w.p === 'X') return depth - 10;
      return 0;
    }
    let best = isCpu ? -99 : 99;
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = isCpu ? 'O' : 'X';
      const v = minimax(b, !isCpu, depth + 1);
      b[i] = null;
      best = isCpu ? Math.max(best, v) : Math.min(best, v);
    }
    return best;
  }

  function cpuMove() {
    const free = [];
    for (let i = 0; i < 9; i++) if (!board[i]) free.push(i);
    if (!free.length) return;
    // 20% of the time the machine daydreams
    if (Math.random() < 0.2) return free[(Math.random() * free.length) | 0];
    let best = -99, pickIdx = free[0];
    for (const i of free) {
      board[i] = 'O';
      const v = minimax(board, false, 0);
      board[i] = null;
      if (v > best) { best = v; pickIdx = i; }
    }
    return pickIdx;
  }

  function newRound() {
    board = [null, null, null, null, null, null, null, null, null];
    turn = 'X'; thinkT = 0; roundEnd = 0; winLine = null; msg = 'YOUR MOVE — YOU ARE X';
  }

  function finishCheck(A) {
    const w = winner(board);
    if (!w) return false;
    winLine = w.line;
    roundEnd = 1.4;
    if (w.p === 'X') {
      streak++;
      A.score += 100;
      A.popup(A.W / 2, OY - 26, '+100 MACHINE XORED');
      msg = 'YOU WIN — NEXT ROUND';
    } else if (w.p === 'draw') {
      A.score += 25;
      A.popup(A.W / 2, OY - 26, '+25 STALEMATE');
      msg = 'DRAW — NEXT ROUND';
    } else {
      msg = '';
      A.shake(0.3);
      A.gameOver('XORED', 'Win streak ' + streak);
    }
    return true;
  }

  Arcade.boot({
    slug: 'xor',
    menu: { title: 'XOR', sub: 'Tic-tac-toe against a machine that is rational 80% of the time. Exploit the other 20%.' },
    hudCenter: function () { return 'STREAK ' + streak; },

    start: function () {
      streak = 0;
      newRound();
    },

    onTap: function (A, x, y) {
      if (turn !== 'X' || roundEnd > 0) return;
      const cx = Math.floor((x - OX) / CELL), cy = Math.floor((y - OY) / CELL);
      if (cx < 0 || cx > 2 || cy < 0 || cy > 2) return;
      const i = cy * 3 + cx;
      if (board[i]) return;
      board[i] = 'X';
      if (!finishCheck(A)) {
        turn = 'O';
        thinkT = 0.5;
        msg = 'MACHINE IS THINKING…';
      }
    },

    update: function (A, dt) {
      if (roundEnd > 0) {
        roundEnd -= dt;
        if (roundEnd <= 0 && A.state === 'playing') newRound();
        return;
      }
      if (turn === 'O') {
        thinkT -= dt;
        if (thinkT <= 0) {
          const i = cpuMove();
          if (i !== undefined) board[i] = 'O';
          if (!finishCheck(A)) {
            turn = 'X';
            msg = 'YOUR MOVE';
          }
        }
      }
    },

    draw: function (A, ctx) {
      const C = A.C;

      // grid lines
      ctx.strokeStyle = 'rgba(28,25,23,0.18)';
      ctx.lineWidth = 3;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(OX + i * CELL, OY + 8); ctx.lineTo(OX + i * CELL, OY + 3 * CELL - 8);
        ctx.moveTo(OX + 8, OY + i * CELL); ctx.lineTo(OX + 3 * CELL - 8, OY + i * CELL);
        ctx.stroke();
      }

      // marks
      for (let i = 0; i < 9; i++) {
        const x = OX + (i % 3) * CELL + CELL / 2;
        const y = OY + ((i / 3) | 0) * CELL + CELL / 2;
        if (board[i] === 'X') {
          ctx.strokeStyle = C.accent;
          ctx.lineWidth = 8;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x - 28, y - 28); ctx.lineTo(x + 28, y + 28);
          ctx.moveTo(x + 28, y - 28); ctx.lineTo(x - 28, y + 28);
          ctx.stroke();
        } else if (board[i] === 'O') {
          ctx.strokeStyle = C.ink;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(x, y, 30, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.lineCap = 'butt';

      // winning line
      if (winLine) {
        const a = winLine[0], b = winLine[2];
        ctx.strokeStyle = C.deep;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(OX + (a % 3) * CELL + CELL / 2, OY + ((a / 3) | 0) * CELL + CELL / 2);
        ctx.lineTo(OX + (b % 3) * CELL + CELL / 2, OY + ((b / 3) | 0) * CELL + CELL / 2);
        ctx.stroke();
      }

      A.font(600, 11, 3);
      ctx.fillStyle = C.dim;
      A.text(msg, A.W / 2, A.H - 34);
    },
  });
})();
