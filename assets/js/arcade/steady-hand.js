/* STEADY HAND — the Feintechnik wire-loop test, digitized */
(function () {
  let path, level, lives, phase, furthest, blinkT, lastP;

  function buildPath(A) {
    path = [];
    const n = 9;
    let y = A.rnd(A.H / 2 - 60, A.H / 2 + 60);
    for (let i = 0; i <= n; i++) {
      const x = 80 + (A.W - 160) * (i / n);
      if (i > 0) y = A.clamp(y + A.rnd(-150, 150), A.HUD_H + 70, A.H - 70);
      path.push({ x: x, y: y });
    }
  }

  function radius() { return Math.max(15, 30 - level * 3); }

  function distToPath(px, py) {
    let min = 1e9, prog = 0, acc = 0, total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      total += Math.hypot(path[i + 1].x - path[i].x, path[i + 1].y - path[i].y);
    }
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len2 = dx * dx + dy * dy;
      let t = ((px - a.x) * dx + (py - a.y) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const qx = a.x + dx * t, qy = a.y + dy * t;
      const d = Math.hypot(px - qx, py - qy);
      if (d < min) {
        min = d;
        prog = (acc + Math.sqrt(len2) * t) / total;
      }
      acc += Math.sqrt(len2);
    }
    return { d: min, prog: prog };
  }

  function zap(A) {
    lives--;
    blinkT = 0.5;
    A.shake(0.35);
    A.burst(A.pointer.x, A.pointer.y, A.C.accent, 20, 200);
    if (lives <= 0) {
      A.gameOver('CONTACT', 'Steadiness rating: level ' + level);
      return;
    }
    phase = 'ready';
    furthest = 0;
  }

  Arcade.boot({
    slug: 'steady-hand',
    menu: { title: 'STEADY HAND', sub: 'The classic wire-loop test. Trace the wire without touching it — it gets narrower.' },
    hudCenter: function () { return 'LIVES ' + lives + ' · WIRE ' + level; },

    start: function (A) {
      level = 1; lives = 3; phase = 'ready'; furthest = 0; blinkT = 0;
      buildPath(A);
      lastP = null;
    },

    update: function (A, dt) {
      if (blinkT > 0) blinkT -= dt;
      const p = A.pointer;

      if (phase === 'ready') {
        if (Math.hypot(p.x - path[0].x, p.y - path[0].y) < 20) {
          phase = 'trace';
          furthest = 0;
          lastP = { x: p.x, y: p.y };
        }
        return;
      }

      // trace phase
      if (lastP && Math.hypot(p.x - lastP.x, p.y - lastP.y) > 90) {
        // teleporting across the board counts as touching the wire
        zap(A);
        return;
      }
      lastP = { x: p.x, y: p.y };

      const r = distToPath(p.x, p.y);
      if (r.d > radius()) { zap(A); return; }
      furthest = Math.max(furthest, r.prog);

      const end = path[path.length - 1];
      if (furthest > 0.96 && Math.hypot(p.x - end.x, p.y - end.y) < 24) {
        const pts = 100 + level * 50;
        A.score += pts;
        A.popup(end.x - 40, end.y - 30, '+' + pts);
        level++;
        buildPath(A);
        phase = 'ready';
        furthest = 0;
      }
    },

    draw: function (A, ctx) {
      const C = A.C;
      const r = radius();

      // corridor
      ctx.strokeStyle = C.card;
      ctx.lineWidth = r * 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (const p of path) ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // wire
      ctx.strokeStyle = 'rgba(201,91,56,0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (const p of path) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineCap = 'butt';

      // start / end pads
      const s = path[0], e = path[path.length - 1];
      A.circle(s.x, s.y, 20, phase === 'ready' ? C.accent : C.tag);
      A.font(600, 9, 1);
      ctx.fillStyle = phase === 'ready' ? C.bg : C.muted;
      A.text('START', s.x, s.y);
      A.circle(e.x, e.y, 20, C.ink);
      ctx.fillStyle = C.bg;
      A.text('END', e.x, e.y);

      // probe cursor
      const p = A.pointer;
      if (blinkT <= 0 || Math.floor(Date.now() / 80) % 2 === 0) {
        ctx.strokeStyle = phase === 'trace' ? C.deep : C.dim;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.stroke();
        A.circle(p.x, p.y, 2.5, phase === 'trace' ? C.deep : C.dim);
      }

      if (phase === 'ready') {
        A.font(600, 11, 3);
        ctx.fillStyle = C.dim;
        A.text('MOVE YOUR PROBE TO START', A.W / 2, A.H - 30);
      }
    },
  });
})();
