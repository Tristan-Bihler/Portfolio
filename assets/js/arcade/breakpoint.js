/* BREAKPOINT — breakout, one block of code at a time */
(function () {
  const COLS = 10, ROWS = 5, BW = 74, BH = 22, GAP = 8;
  let bricks, ball, px, lives, level, stuck;

  function buildWall(A) {
    bricks = [];
    const ox = (A.W - (COLS * BW + (COLS - 1) * GAP)) / 2;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        bricks.push({ x: ox + c * (BW + GAP), y: 84 + r * (BH + GAP), row: r, alive: true });
      }
    }
  }

  function speed(A) { return 330 + level * 35; }

  function launch(A) {
    stuck = false;
    const sp = speed(A);
    const off = A.rnd(-0.4, 0.4);
    ball.vx = off * sp;
    ball.vy = -Math.sqrt(sp * sp - ball.vx * ball.vx);
  }

  Arcade.boot({
    slug: 'breakpoint',
    menu: { title: 'BREAKPOINT', sub: 'Clear every block of legacy code. Don’t drop the pointer.' },
    hudCenter: function () { return 'LIVES ' + lives + ' · LEVEL ' + level; },

    start: function (A) {
      lives = 3; level = 1; stuck = true;
      px = A.W / 2;
      ball = { x: px, y: A.H - 42, vx: 0, vy: 0 };
      buildWall(A);
    },

    onTap: function (A) { if (stuck) launch(A); },
    onKey: function (A, k) { if (k === ' ' && stuck) launch(A); },

    update: function (A, dt) {
      // paddle follows keys or pointer
      let mv = 0;
      if (A.keys['ArrowLeft'] || A.keys['a']) mv -= 1;
      if (A.keys['ArrowRight'] || A.keys['d']) mv += 1;
      if (mv) px += mv * 480 * dt;
      else px += A.clamp(A.pointer.x - px, -560 * dt, 560 * dt);
      px = A.clamp(px, 60, A.W - 60);

      if (stuck) { ball.x = px; ball.y = A.H - 42; return; }

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      if (ball.x < 8 && ball.vx < 0) ball.vx *= -1;
      if (ball.x > A.W - 8 && ball.vx > 0) ball.vx *= -1;
      if (ball.y < A.HUD_H + 8 && ball.vy < 0) ball.vy *= -1;

      // paddle
      if (ball.vy > 0 && ball.y > A.H - 34 && ball.y < A.H - 14 && Math.abs(ball.x - px) < 62) {
        const off = (ball.x - px) / 62;
        const sp = speed(A);
        const ang = -Math.PI / 2 + off * 1.05;
        ball.vx = Math.cos(ang + Math.PI / 2) * sp * Math.sin(off) + off * sp * 0.8;
        ball.vx = off * sp * 0.85;
        ball.vy = -Math.sqrt(Math.max(sp * sp - ball.vx * ball.vx, sp * sp * 0.3));
      }

      // dropped
      if (ball.y > A.H + 20) {
        lives--;
        A.shake(0.3);
        if (lives <= 0) { A.gameOver('NULL POINTER', null); return; }
        stuck = true;
      }

      // bricks
      for (const b of bricks) {
        if (!b.alive) continue;
        if (ball.x > b.x - 7 && ball.x < b.x + BW + 7 && ball.y > b.y - 7 && ball.y < b.y + BH + 7) {
          b.alive = false;
          const pts = (ROWS - b.row) * 10;
          A.score += pts;
          A.popup(b.x + BW / 2, b.y, '+' + pts);
          A.burst(ball.x, ball.y, rowCol(A, b.row), 10);
          // reflect on shallow axis
          const dx = Math.min(Math.abs(ball.x - (b.x - 7)), Math.abs(ball.x - (b.x + BW + 7)));
          const dy = Math.min(Math.abs(ball.y - (b.y - 7)), Math.abs(ball.y - (b.y + BH + 7)));
          if (dx < dy) ball.vx *= -1; else ball.vy *= -1;
          break;
        }
      }

      if (bricks.every(function (b) { return !b.alive; })) {
        level++;
        A.score += 500;
        A.popup(A.W / 2, A.H / 2, '+500 REFACTORED');
        buildWall(A);
        stuck = true;
      }
    },

    draw: function (A, ctx) {
      const C = A.C;
      for (const b of bricks) {
        if (!b.alive) continue;
        ctx.fillStyle = rowCol(A, b.row);
        A.rrect(b.x, b.y, BW, BH, 3); ctx.fill();
      }
      // paddle
      ctx.fillStyle = C.ink;
      A.rrect(px - 62, A.H - 26, 124, 12, 6); ctx.fill();
      ctx.fillStyle = C.accent;
      A.rrect(px - 14, A.H - 26, 28, 12, 6); ctx.fill();
      // ball
      A.circle(ball.x, ball.y, 7, C.deep);
      if (stuck) {
        A.font(600, 11, 3);
        ctx.fillStyle = C.dim;
        A.text('SPACE OR TAP TO LAUNCH', A.W / 2, A.H - 70);
      }
    },
  });

  function rowCol(A, r) {
    return [A.C.deep, A.C.accent, A.C.accent2, A.C.body, A.C.muted][r];
  }
})();
