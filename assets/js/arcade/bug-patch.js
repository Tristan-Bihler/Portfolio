/* BUG PATCH — whack the bugs before the shift ends */
(function () {
  const HOLES = [];
  let bugs, timeLeft, spawnT, combo, comboT, patched;

  function initHoles(A) {
    HOLES.length = 0;
    const cx = A.W / 2, cy = (A.HUD_H + A.H) / 2 + 14;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        HOLES.push({ x: cx + (c - 1) * 200, y: cy + (r - 1) * 140 });
      }
    }
  }

  Arcade.boot({
    slug: 'bug-patch',
    menu: { title: 'BUG PATCH', sub: '45 seconds on the clock. Squash bugs as they crawl out of the board.' },
    hudCenter: function () {
      return 'TIME ' + Math.ceil(timeLeft) + 'S' + (combo > 1 ? ' · COMBO ×' + Math.min(combo, 5) : '');
    },

    start: function (A) {
      initHoles(A);
      bugs = []; timeLeft = 45; spawnT = 0.5;
      combo = 0; comboT = 0; patched = 0;
    },

    onTap: function (A, x, y) {
      let hitSomething = false;
      for (const b of bugs) {
        if (b.hit) continue;
        const h = HOLES[b.hole];
        const up = b.progress();
        if (up > 0.2 && Math.hypot(x - h.x, y - (h.y - up * 34)) < 34) {
          b.hit = true;
          b.t = 0;
          hitSomething = true;
          combo = comboT > 0 ? combo + 1 : 1;
          comboT = 1.2;
          const pts = 10 * Math.min(combo, 5);
          A.score += pts;
          patched++;
          A.popup(h.x, h.y - 50, '+' + pts);
          A.burst(h.x, h.y - 30, A.C.accent, 12, 150);
          break;
        }
      }
      if (!hitSomething) { combo = 0; comboT = 0; }
    },

    update: function (A, dt) {
      timeLeft -= dt;
      comboT -= dt;
      if (comboT <= 0) combo = 0;

      if (timeLeft <= 0) {
        A.gameOver('SHIFT OVER', 'You patched ' + patched + ' bugs');
        return;
      }

      spawnT -= dt;
      const activeMax = timeLeft > 30 ? 2 : 3;
      if (spawnT <= 0 && bugs.filter(function (b) { return !b.hit; }).length < activeMax) {
        spawnT = Math.max(0.45, 1.0 - (45 - timeLeft) * 0.012);
        const used = bugs.map(function (b) { return b.hole; });
        const free = [];
        for (let i = 0; i < 9; i++) if (used.indexOf(i) < 0) free.push(i);
        if (free.length) {
          const ttl = Math.max(0.8, 1.7 - (45 - timeLeft) * 0.02);
          bugs.push({
            hole: A.pick(free), t: 0, ttl: ttl, hit: false,
            progress: function () {
              if (this.hit) return Math.max(0, 1 - this.t * 6);
              const a = Math.min(1, this.t / 0.22);
              const b2 = Math.min(1, Math.max(0, (this.ttl - this.t) / 0.22));
              return Math.min(a, b2);
            },
          });
        }
      }

      for (const b of bugs) b.t += dt;
      bugs = bugs.filter(function (b) {
        return b.hit ? b.t < 0.2 : b.t < b.ttl;
      });
    },

    draw: function (A, ctx) {
      const C = A.C;
      for (let i = 0; i < HOLES.length; i++) {
        const h = HOLES[i];

        // bug behind slot
        const b = bugs.find(function (bb) { return bb.hole === i; });
        if (b) {
          const up = b.progress();
          if (up > 0.02) {
            const by = h.y - up * 34;
            ctx.save();
            ctx.translate(h.x, by);
            const col = b.hit ? C.dim : C.accent;
            ctx.strokeStyle = col;
            ctx.lineWidth = 2.5;
            const wig = Math.sin(Date.now() / 60) * 3;
            for (let s = -1; s <= 1; s++) {
              ctx.beginPath();
              ctx.moveTo(-16, s * 7); ctx.lineTo(-25 - wig, s * 7 + s * 4);
              ctx.moveTo(16, s * 7); ctx.lineTo(25 + wig, s * 7 + s * 4);
              ctx.stroke();
            }
            ctx.fillStyle = col;
            A.rrect(-17, -18, 34, 36, 13); ctx.fill();
            ctx.strokeStyle = C.bg;
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, 14); ctx.stroke();
            ctx.fillStyle = C.bg;
            ctx.fillRect(-7, -8, 4, 4);
            ctx.fillRect(3, -8, 4, 4);
            ctx.restore();
          }
        }

        // slot on top so bugs rise "out of" it
        ctx.fillStyle = 'rgba(28,25,23,0.14)';
        ctx.beginPath();
        ctx.ellipse(h.x, h.y + 26, 44, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.bg;
        ctx.fillRect(h.x - 48, h.y + 26, 96, 30);
      }
    },
  });
})();
