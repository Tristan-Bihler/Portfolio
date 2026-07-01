/* VOLTAGE HOP — flap a spark through the resistor bank */
(function () {
  let y, vy, pipes, spawnT, started;
  const X = 200, R = 13;

  function hop(A) { vy = -330; started = true; A.burst(X - 8, y + 10, A.C.tag, 4, 60); }

  Arcade.boot({
    slug: 'voltage-hop',
    menu: { title: 'VOLTAGE HOP', sub: 'Hop the spark through the resistor bank. One touch and you’re fried.' },

    start: function (A) {
      y = A.H / 2; vy = 0;
      pipes = []; spawnT = 0.4; started = false;
    },

    onKey: function (A, k) { if (k === ' ' || k === 'ArrowUp' || k === 'w') hop(A); },
    onTap: function (A) { hop(A); },

    update: function (A, dt) {
      if (!started) { y = A.H / 2 + Math.sin(A.t * 3) * 10; return; }

      const speed = 185 + Math.min(120, A.t * 3.5);
      const gap = Math.max(126, 165 - A.score * 1.5);

      vy += 980 * dt;
      y += vy * dt;

      spawnT -= dt;
      if (spawnT <= 0) {
        spawnT = 1.55;
        const gy = A.rnd(A.HUD_H + 70, A.H - 90 - gap);
        pipes.push({ x: A.W + 40, gy: gy, gap: gap, passed: false });
      }

      for (const p of pipes) {
        p.x -= speed * dt;
        if (!p.passed && p.x + 30 < X) {
          p.passed = true;
          A.score += 1;
          A.popup(X, y - 26, '+1');
        }
        // collision
        if (Math.abs(p.x - X) < 30 + R - 4 && (y - R + 3 < p.gy || y + R - 3 > p.gy + p.gap)) {
          A.shake(0.35);
          A.burst(X, y, A.C.accent, 22, 220);
          A.gameOver('FRIED', 'Cleared ' + A.score + ' resistors');
          return;
        }
      }
      pipes = pipes.filter(function (p) { return p.x > -60; });

      if (y > A.H - 24 || y < A.HUD_H + 10) {
        A.shake(0.35);
        A.burst(X, y, A.C.accent, 22, 220);
        A.gameOver('GROUNDED', 'Cleared ' + A.score + ' resistors');
      }
    },

    draw: function (A, ctx) {
      const C = A.C;
      // resistors
      for (const p of pipes) {
        drawResistor(A, ctx, p.x, A.HUD_H, p.gy - A.HUD_H, false);
        drawResistor(A, ctx, p.x, p.gy + p.gap, A.H - 20 - (p.gy + p.gap), true);
      }
      // floor
      ctx.strokeStyle = 'rgba(201,91,56,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, A.H - 19.5); ctx.lineTo(A.W, A.H - 19.5); ctx.stroke();

      // spark
      ctx.save();
      ctx.translate(X, y);
      ctx.rotate(A.clamp(vy / 700, -0.5, 0.6));
      ctx.fillStyle = C.accent;
      A.rrect(-R, -R, R * 2, R * 2, 7); ctx.fill();
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-R, -5); ctx.lineTo(-R - 8, -5);
      ctx.moveTo(-R, 5); ctx.lineTo(-R - 8, 5);
      ctx.stroke();
      // bolt glyph
      ctx.fillStyle = C.bg;
      ctx.beginPath();
      ctx.moveTo(2, -8); ctx.lineTo(-5, 1); ctx.lineTo(-1, 1);
      ctx.lineTo(-2, 8); ctx.lineTo(5, -1); ctx.lineTo(1, -1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      if (!started) {
        A.font(600, 11, 3);
        ctx.fillStyle = C.dim;
        A.text('TAP OR SPACE TO HOP', A.W / 2, A.H / 2 + 90);
      }
    },
  });

  function drawResistor(A, ctx, x, top, h, fromBottom) {
    if (h <= 0) return;
    const C = A.C;
    ctx.fillStyle = C.card;
    A.rrect(x - 30, top, 60, h, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(28,25,23,0.12)';
    ctx.lineWidth = 1.5;
    A.rrect(x - 30, top, 60, h, 4); ctx.stroke();
    // colour bands near the gap end
    const bandY = fromBottom ? top + 12 : top + h - 12;
    const step = fromBottom ? 14 : -14;
    const cols = [C.accent, C.body, C.dim];
    for (let i = 0; i < 3; i++) {
      const by = bandY + step * i;
      if (by > top + 4 && by < top + h - 8) {
        ctx.fillStyle = cols[i];
        ctx.fillRect(x - 30, by, 60, 6);
      }
    }
  }
})();
