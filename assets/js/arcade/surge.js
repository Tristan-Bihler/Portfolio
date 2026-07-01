/* SURGE — protect the capacitor bank from the voltage spikes */
(function () {
  let bases, missiles, booms, waveN, toSpawn, spawnT, interWave;

  function startWave(A) {
    toSpawn = 3 + waveN * 2;
    spawnT = 0.5;
    interWave = 0;
  }

  function spawnMissile(A) {
    const alive = bases.filter(function (b) { return b.alive; });
    const targetX = Math.random() < 0.75 && alive.length
      ? A.pick(alive).x + A.rnd(-14, 14)
      : A.rnd(60, A.W - 60);
    const x0 = A.rnd(30, A.W - 30);
    const sp = 55 + waveN * 11;
    const dx = targetX - x0, dy = (A.H - 46) - A.HUD_H;
    const len = Math.hypot(dx, dy);
    missiles.push({
      x: x0, y: A.HUD_H + 4, x0: x0, y0: A.HUD_H + 4,
      vx: dx / len * sp, vy: dy / len * sp,
    });
  }

  Arcade.boot({
    slug: 'surge',
    menu: { title: 'SURGE', sub: 'Voltage spikes are raining on the capacitor bank. Detonate suppressors in their path.' },
    hudCenter: function () { return 'WAVE ' + waveN + ' · BANK ' + bases.filter(function (b) { return b.alive; }).length + '/3'; },

    start: function (A) {
      bases = [{ x: 150, alive: true }, { x: 450, alive: true }, { x: 750, alive: true }];
      missiles = []; booms = []; waveN = 1;
      startWave(A);
    },

    onTap: function (A, x, y) {
      if (booms.filter(function (b) { return b.growing; }).length >= 3) return;
      if (y > A.H - 60) y = A.H - 60;
      booms.push({ x: x, y: Math.max(y, A.HUD_H + 20), r: 6, growing: true, fade: 1 });
    },

    update: function (A, dt) {
      // spawn
      if (toSpawn > 0) {
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = A.rnd(0.5, 1.4) * (30 / (25 + waveN * 5));
          spawnMissile(A);
          toSpawn--;
        }
      } else if (!missiles.length) {
        interWave += dt;
        if (interWave > 1.4) {
          const bonus = bases.filter(function (b) { return b.alive; }).length * 100;
          A.score += bonus;
          A.popup(A.W / 2, A.H / 2, '+' + bonus + ' WAVE ' + waveN + ' HELD');
          waveN++;
          startWave(A);
        }
      }

      // booms
      for (const b of booms) {
        if (b.growing) {
          b.r += 130 * dt;
          if (b.r >= 58) b.growing = false;
        } else {
          b.fade -= dt * 1.6;
        }
      }
      booms = booms.filter(function (b) { return b.growing || b.fade > 0; });

      // missiles
      for (const m of missiles) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;

        for (const b of booms) {
          if ((m.x - b.x) * (m.x - b.x) + (m.y - b.y) * (m.y - b.y) < b.r * b.r) {
            m.dead = true;
            A.score += 25;
            A.popup(m.x, m.y, '+25');
            A.burst(m.x, m.y, A.C.accent, 8, 120);
            break;
          }
        }
        if (m.dead) continue;

        if (m.y >= A.H - 46) {
          m.dead = true;
          A.shake(0.3);
          A.burst(m.x, A.H - 46, A.C.ink, 16, 180);
          for (const b of bases) {
            if (b.alive && Math.abs(m.x - b.x) < 42) {
              b.alive = false;
              A.shake(0.5);
              A.burst(b.x, A.H - 46, A.C.accent, 30, 260);
            }
          }
          if (!bases.some(function (b) { return b.alive; })) {
            A.gameOver('BLACKOUT', 'The bank held for ' + (waveN - 1) + ' full waves');
            return;
          }
        }
      }
      missiles = missiles.filter(function (m) { return !m.dead; });
    },

    draw: function (A, ctx) {
      const C = A.C;

      // ground
      ctx.fillStyle = C.card;
      ctx.fillRect(0, A.H - 40, A.W, 40);
      ctx.strokeStyle = 'rgba(201,91,56,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, A.H - 40.5); ctx.lineTo(A.W, A.H - 40.5); ctx.stroke();

      // capacitor bases
      for (const b of bases) {
        if (b.alive) {
          ctx.fillStyle = C.accent;
          A.rrect(b.x - 26, A.H - 78, 52, 38, 4); ctx.fill();
          ctx.fillStyle = C.bg;
          ctx.fillRect(b.x - 26, A.H - 68, 52, 5);
          ctx.strokeStyle = C.ink;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(b.x - 10, A.H - 78); ctx.lineTo(b.x - 10, A.H - 86);
          ctx.moveTo(b.x + 10, A.H - 78); ctx.lineTo(b.x + 10, A.H - 86);
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(28,25,23,0.15)';
          A.rrect(b.x - 26, A.H - 60, 52, 20, 4); ctx.fill();
        }
      }

      // missiles with trail
      for (const m of missiles) {
        ctx.strokeStyle = 'rgba(28,25,23,0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(m.x0, m.y0); ctx.lineTo(m.x, m.y);
        ctx.stroke();
        ctx.fillStyle = C.ink;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y + 7);
        ctx.lineTo(m.x - 4, m.y - 4);
        ctx.lineTo(m.x + 4, m.y - 4);
        ctx.closePath();
        ctx.fill();
      }

      // suppressor booms
      for (const b of booms) {
        ctx.globalAlpha = b.growing ? 0.85 : Math.max(0, b.fade) * 0.85;
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = (b.growing ? 1 : Math.max(0, b.fade)) * 0.15;
        A.circle(b.x, b.y, b.r, C.accent);
        ctx.globalAlpha = 1;
      }

      // crosshair
      const p = A.pointer;
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x - 10, p.y); ctx.lineTo(p.x + 10, p.y);
      ctx.moveTo(p.x, p.y - 10); ctx.lineTo(p.x, p.y + 10);
      ctx.stroke();
    },
  });
})();
