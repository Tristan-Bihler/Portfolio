/* ORBIT — one button, two orbits, endless debris */
(function () {
  const R = [100, 180];
  let angle, dir, ring, rr, mines, pickups, spawnT, pickT, cx, cy;

  function swap(A) {
    ring = 1 - ring;
    A.burst(shipX(), shipY(), A.C.tag, 6, 80);
  }

  function shipX() { return cx + Math.cos(angle) * rr; }
  function shipY() { return cy + Math.sin(angle) * rr; }

  function angDist(a, b) {
    let d = Math.abs(a - b) % (Math.PI * 2);
    return d > Math.PI ? Math.PI * 2 - d : d;
  }

  Arcade.boot({
    slug: 'orbit',
    menu: { title: 'ORBIT', sub: 'One button. Two orbits. Hop between them before you hit the debris.' },

    start: function (A) {
      cx = A.W / 2; cy = (A.HUD_H + A.H) / 2;
      angle = -Math.PI / 2; dir = 1; ring = 0; rr = R[0];
      mines = []; pickups = [];
      spawnT = 1.2; pickT = 2;
    },

    onKey: function (A, k) { if (k === ' ' || k === 'ArrowUp' || k === 'w') swap(A); },
    onTap: function (A) { swap(A); },

    update: function (A, dt) {
      const speed = 1.5 + Math.min(1.4, A.t * 0.03);
      angle += dir * speed * dt;
      rr += (R[ring] - rr) * Math.min(1, dt * 10);
      A.score += dt * 10;

      // mines
      spawnT -= dt;
      if (spawnT <= 0 && mines.length < 6) {
        spawnT = Math.max(0.7, 1.7 - A.t * 0.02);
        let a, r2, tries = 0;
        do {
          a = A.rnd(0, Math.PI * 2);
          r2 = (Math.random() * 2) | 0;
          tries++;
        } while (tries < 20 && r2 === ring && angDist(a, angle) < 1.1);
        mines.push({ a: a, ring: r2, warm: 1.0, life: 7 });
      }
      for (const m of mines) {
        if (m.warm > 0) m.warm -= dt;
        else m.life -= dt;
      }
      mines = mines.filter(function (m) { return m.life > 0; });

      // pickups
      pickT -= dt;
      if (pickT <= 0 && pickups.length < 2) {
        pickT = A.rnd(2, 4);
        pickups.push({ a: A.rnd(0, Math.PI * 2), ring: (Math.random() * 2) | 0 });
      }

      // collisions
      for (const m of mines) {
        if (m.warm <= 0 && m.ring === ring && Math.abs(R[m.ring] - rr) < 18 && angDist(m.a, angle) < 0.14) {
          A.shake(0.4);
          A.burst(shipX(), shipY(), A.C.accent, 26, 240);
          A.score = Math.floor(A.score);
          A.gameOver('DEORBITED', 'You survived ' + Math.floor(A.t) + ' seconds');
          return;
        }
      }
      for (const p of pickups) {
        if (p.ring === ring && Math.abs(R[p.ring] - rr) < 18 && angDist(p.a, angle) < 0.15) {
          p.got = true;
          A.score += 25;
          A.popup(cx + Math.cos(p.a) * R[p.ring], cy + Math.sin(p.a) * R[p.ring], '+25');
          A.burst(shipX(), shipY(), A.C.accent, 10, 120);
        }
      }
      pickups = pickups.filter(function (p) { return !p.got; });
    },

    draw: function (A, ctx) {
      const C = A.C;

      // rings
      ctx.setLineDash([4, 10]);
      ctx.lineWidth = 2;
      for (let i = 0; i < 2; i++) {
        ctx.strokeStyle = i === ring ? 'rgba(201,91,56,0.4)' : 'rgba(28,25,23,0.14)';
        ctx.beginPath();
        ctx.arc(cx, cy, R[i], 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // core
      A.circle(cx, cy, 34, C.pale);
      A.circle(cx, cy, 12, C.accent);

      // pickups
      for (const p of pickups) {
        const x = cx + Math.cos(p.a) * R[p.ring], y = cy + Math.sin(p.a) * R[p.ring];
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = C.accent;
        ctx.fillRect(-6, -6, 12, 12);
        ctx.restore();
      }

      // mines
      for (const m of mines) {
        const x = cx + Math.cos(m.a) * R[m.ring], y = cy + Math.sin(m.a) * R[m.ring];
        if (m.warm > 0) {
          if (Math.floor(m.warm * 10) % 2 === 0) {
            ctx.strokeStyle = C.dim;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.stroke();
          }
        } else {
          ctx.fillStyle = C.ink;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a2 = (i / 6) * Math.PI * 2;
            ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a2) * 10, y + Math.sin(a2) * 10);
          }
          ctx.closePath();
          ctx.fill();
        }
      }

      // ship
      const x = shipX(), y = shipY();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + dir * Math.PI / 2);
      ctx.fillStyle = C.accent;
      ctx.beginPath();
      ctx.moveTo(12, 0); ctx.lineTo(-8, -8); ctx.lineTo(-4, 0); ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
  });
})();
