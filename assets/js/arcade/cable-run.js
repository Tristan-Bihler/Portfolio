/* CABLE RUN — endless run across the workbench */
(function () {
  let py, vy, jumps, obs, spawnT, dist, groundOff;

  Arcade.boot({
    slug: 'cable-run',
    menu: { title: 'CABLE RUN', sub: 'Sprint the workbench. Jump the parts bin — double jump is allowed.' },

    start: function (A) {
      py = 0; vy = 0; jumps = 0;
      obs = []; spawnT = 1.2; dist = 0; groundOff = 0;
    },

    onKey: function (A, k) { if (k === ' ' || k === 'ArrowUp' || k === 'w') jump(A); },
    onTap: function (A) { jump(A); },

    update: function (A, dt) {
      const speed = Math.min(640, 330 + A.t * 9);
      dist += speed * dt;
      groundOff = (groundOff + speed * dt) % 40;
      A.score = Math.floor(dist / 20);

      // physics (py is height above ground, positive = up)
      vy -= 1600 * dt;
      py += vy * dt;
      if (py <= 0) { py = 0; vy = 0; jumps = 0; }

      spawnT -= dt;
      if (spawnT <= 0) {
        spawnT = A.rnd(0.75, 1.5) * (400 / speed);
        const type = A.pick(['res', 'res', 'cap', 'wide']);
        obs.push({
          x: A.W + 60,
          w: type === 'wide' ? 72 : type === 'cap' ? 30 : 26,
          h: type === 'cap' ? 54 : type === 'wide' ? 24 : 32,
          type: type,
        });
      }

      const FLOOR = A.H - 64;
      const px = 150, pw = 26, ph = 34;
      const pTop = FLOOR - ph - py, pBot = FLOOR - py;

      for (const o of obs) {
        o.x -= speed * dt;
        if (o.x + o.w > px - pw / 2 && o.x < px + pw / 2 &&
            pBot > FLOOR - o.h && pTop < FLOOR) {
          A.shake(0.35);
          A.burst(px, pTop + ph / 2, A.C.accent, 24, 220);
          A.gameOver('TRIPPED', 'Distance ' + A.score + ' m');
          return;
        }
      }
      obs = obs.filter(function (o) { return o.x > -100; });
    },

    draw: function (A, ctx) {
      const C = A.C;
      const FLOOR = A.H - 64;

      // ground
      ctx.strokeStyle = 'rgba(28,25,23,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, FLOOR + 0.5); ctx.lineTo(A.W, FLOOR + 0.5);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(28,25,23,0.1)';
      ctx.lineWidth = 2;
      for (let x = -groundOff; x < A.W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, FLOOR + 12); ctx.lineTo(x + 18, FLOOR + 12);
        ctx.stroke();
      }

      // obstacles
      for (const o of obs) {
        if (o.type === 'cap') {
          ctx.fillStyle = C.body;
          A.rrect(o.x, FLOOR - o.h, o.w, o.h, 5); ctx.fill();
          ctx.fillStyle = C.tag;
          ctx.fillRect(o.x, FLOOR - o.h + 10, o.w, 7);
        } else if (o.type === 'wide') {
          ctx.fillStyle = C.muted;
          A.rrect(o.x, FLOOR - o.h, o.w, o.h, 4); ctx.fill();
          ctx.fillStyle = C.bg;
          ctx.fillRect(o.x + 8, FLOOR - o.h + 8, o.w - 16, 4);
        } else {
          ctx.fillStyle = C.card;
          A.rrect(o.x, FLOOR - o.h, o.w, o.h, 5); ctx.fill();
          ctx.strokeStyle = 'rgba(28,25,23,0.2)';
          ctx.lineWidth = 1.5;
          A.rrect(o.x, FLOOR - o.h, o.w, o.h, 5); ctx.stroke();
          ctx.fillStyle = C.accent;
          ctx.fillRect(o.x, FLOOR - o.h + 7, o.w, 5);
          ctx.fillStyle = C.dim;
          ctx.fillRect(o.x, FLOOR - o.h + 17, o.w, 5);
        }
      }

      // runner chip
      const px = 150, ph = 34;
      const pTop = FLOOR - ph - py;
      ctx.save();
      ctx.translate(px, pTop + ph / 2);
      ctx.fillStyle = C.accent;
      A.rrect(-13, -ph / 2, 26, ph - 8, 7); ctx.fill();
      // running legs
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 3;
      const run = py > 0 ? 0 : Math.sin(Date.now() / 55) * 6;
      ctx.beginPath();
      ctx.moveTo(-6, ph / 2 - 8); ctx.lineTo(-6 - run, ph / 2);
      ctx.moveTo(6, ph / 2 - 8); ctx.lineTo(6 + run, ph / 2);
      ctx.stroke();
      ctx.fillStyle = C.bg;
      ctx.fillRect(2, -8, 5, 5);
      ctx.restore();
    },
  });

  function jump(A) {
    if (jumps < 2) {
      vy = jumps === 0 ? 640 : 560;
      jumps++;
      A.burst(150, A.H - 64, A.C.tag, 5, 60);
    }
  }
})();
