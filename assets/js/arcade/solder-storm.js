/* SOLDER STORM — asteroids, but everything is molten solder */
(function () {
  let ship, rocks, bullets, lives, waveN, fireCd;

  function makeRock(A, x, y, size) {
    const r = [0, 13, 22, 35][size];
    const verts = [];
    const n = 9;
    for (let i = 0; i < n; i++) verts.push(r * A.rnd(0.75, 1.15));
    const a = A.rnd(0, Math.PI * 2);
    const sp = A.rnd(40, 90) + (3 - size) * 30 + waveN * 6;
    return {
      x: x, y: y, r: r, size: size, verts: verts,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      rot: A.rnd(0, 6), vr: A.rnd(-1.5, 1.5),
    };
  }

  function spawnWave(A) {
    rocks = [];
    for (let i = 0; i < 3 + waveN; i++) {
      const edge = Math.random() < 0.5;
      rocks.push(makeRock(A,
        edge ? A.rnd(0, A.W) : (Math.random() < 0.5 ? -30 : A.W + 30),
        edge ? (Math.random() < 0.5 ? A.HUD_H - 20 : A.H + 20) : A.rnd(A.HUD_H, A.H),
        3));
    }
  }

  function wrap(A, o, m) {
    if (o.x < -m) o.x = A.W + m;
    if (o.x > A.W + m) o.x = -m;
    if (o.y < A.HUD_H - m) o.y = A.H + m;
    if (o.y > A.H + m) o.y = A.HUD_H - m;
  }

  function shoot(A) {
    if (fireCd > 0) return;
    fireCd = 0.24;
    bullets.push({
      x: ship.x + Math.cos(ship.a) * 16, y: ship.y + Math.sin(ship.a) * 16,
      vx: Math.cos(ship.a) * 520 + ship.vx, vy: Math.sin(ship.a) * 520 + ship.vy,
      life: 1.0,
    });
  }

  Arcade.boot({
    slug: 'solder-storm',
    menu: { title: 'SOLDER STORM', sub: 'Molten blobs everywhere. Rotate, thrust, and blast them down to droplets.' },
    hudCenter: function () { return 'LIVES ' + lives + ' · WAVE ' + waveN; },

    start: function (A) {
      ship = { x: A.W / 2, y: A.H / 2, a: -Math.PI / 2, vx: 0, vy: 0, blink: 2 };
      bullets = []; lives = 3; waveN = 1; fireCd = 0;
      spawnWave(A);
    },

    update: function (A, dt) {
      fireCd -= dt;
      if (ship.blink > 0) ship.blink -= dt;

      // controls
      let thrust = false;
      if (A.keys['ArrowLeft'] || A.keys['a']) ship.a -= 4.2 * dt;
      if (A.keys['ArrowRight'] || A.keys['d']) ship.a += 4.2 * dt;
      if (A.keys['ArrowUp'] || A.keys['w']) thrust = true;
      if (A.keys[' ']) shoot(A);

      if (A.pointer.down) {
        const ta = Math.atan2(A.pointer.y - ship.y, A.pointer.x - ship.x);
        let d = ta - ship.a;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        ship.a += A.clamp(d, -4.2 * dt, 4.2 * dt);
        const dist = Math.hypot(A.pointer.x - ship.x, A.pointer.y - ship.y);
        if (dist > 140) thrust = true;
        if (Math.abs(d) < 0.4) shoot(A);
      }

      if (thrust) {
        ship.vx += Math.cos(ship.a) * 300 * dt;
        ship.vy += Math.sin(ship.a) * 300 * dt;
      }
      ship.vx *= Math.pow(0.4, dt);
      ship.vy *= Math.pow(0.4, dt);
      ship.x += ship.vx * dt;
      ship.y += ship.vy * dt;
      wrap(A, ship, 20);
      ship.thrust = thrust;

      // rocks
      for (const r of rocks) {
        r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt;
        wrap(A, r, 40);
      }

      // bullets
      for (const b of bullets) {
        b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
        wrap(A, b, 4);
      }
      bullets = bullets.filter(function (b) { return b.life > 0; });

      // bullet vs rock
      const born = [];
      for (const r of rocks) {
        for (const b of bullets) {
          if (b.life <= 0) continue;
          if ((b.x - r.x) * (b.x - r.x) + (b.y - r.y) * (b.y - r.y) < r.r * r.r) {
            b.life = 0;
            r.dead = true;
            const pts = [0, 100, 50, 20][r.size];
            A.score += pts;
            A.popup(r.x, r.y, '+' + pts);
            A.burst(r.x, r.y, A.C.dim, 12, 160);
            if (r.size > 1) {
              born.push(makeRock(A, r.x, r.y, r.size - 1));
              born.push(makeRock(A, r.x, r.y, r.size - 1));
            }
            break;
          }
        }
      }
      rocks = rocks.filter(function (r) { return !r.dead; }).concat(born);

      // rock vs ship
      if (ship.blink <= 0) {
        for (const r of rocks) {
          if ((ship.x - r.x) * (ship.x - r.x) + (ship.y - r.y) * (ship.y - r.y) < (r.r + 10) * (r.r + 10)) {
            lives--;
            A.shake(0.4);
            A.burst(ship.x, ship.y, A.C.accent, 26, 220);
            if (lives <= 0) { A.gameOver('MELTDOWN', null); return; }
            ship.x = A.W / 2; ship.y = A.H / 2;
            ship.vx = ship.vy = 0;
            ship.blink = 2.5;
            break;
          }
        }
      }

      if (!rocks.length) {
        waveN++;
        A.score += 200;
        A.popup(A.W / 2, A.H / 2, '+200 WAVE CLEAR');
        spawnWave(A);
      }
    },

    draw: function (A, ctx) {
      const C = A.C;
      // rocks
      for (const r of rocks) {
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(r.rot);
        ctx.fillStyle = C.dim;
        ctx.beginPath();
        for (let i = 0; i < r.verts.length; i++) {
          const a = (i / r.verts.length) * Math.PI * 2;
          ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r.verts[i], Math.sin(a) * r.verts[i]);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = C.tag;
        ctx.beginPath();
        ctx.arc(-r.r * 0.3, -r.r * 0.3, r.r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // bullets
      ctx.fillStyle = C.accent;
      for (const b of bullets) ctx.fillRect(b.x - 2, b.y - 2, 4, 4);

      // ship
      if (ship.blink <= 0 || Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.rotate(ship.a);
        if (ship.thrust) {
          ctx.fillStyle = C.accent2;
          ctx.beginPath();
          ctx.moveTo(-12, -4); ctx.lineTo(-20 - Math.random() * 6, 0); ctx.lineTo(-12, 4);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = C.accent;
        ctx.beginPath();
        ctx.moveTo(16, 0); ctx.lineTo(-11, -10); ctx.lineTo(-6, 0); ctx.lineTo(-11, 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    },
  });
})();
