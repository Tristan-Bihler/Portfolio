/* STACK JUMP — bounce up the call stack, don’t fall out of scope */
(function () {
  let player, plats, cam, topGen;

  function addPlat(A, wy) {
    const hard = Math.min(0.6, wy / 6000);
    plats.push({
      wx: A.rnd(60, A.W - 60),
      wy: wy,
      w: Math.max(64, 110 - wy * 0.006),
      vx: Math.random() < hard ? A.rnd(40, 90) * (Math.random() < 0.5 ? -1 : 1) : 0,
    });
  }

  Arcade.boot({
    slug: 'stack-jump',
    menu: { title: 'STACK JUMP', sub: 'Bounce up the call stack. Fall out of scope and it’s over.' },

    start: function (A) {
      player = { x: A.W / 2, wy: 20, vy: 620 };
      plats = [{ wx: A.W / 2, wy: 0, w: 200, vx: 0 }];
      topGen = 0;
      cam = 0;
      while (topGen < 700) { topGen += A.rnd(62, 95); addPlat(A, topGen); }
    },

    update: function (A, dt) {
      // horizontal
      let mv = 0;
      if (A.keys['ArrowLeft'] || A.keys['a']) mv -= 1;
      if (A.keys['ArrowRight'] || A.keys['d']) mv += 1;
      if (A.pointer.down) mv = Math.abs(A.pointer.x - player.x) > 14 ? Math.sign(A.pointer.x - player.x) : 0;
      player.x += mv * 330 * dt;
      if (player.x < -14) player.x = A.W + 14;
      if (player.x > A.W + 14) player.x = -14;

      // vertical
      player.vy -= 1150 * dt;
      const prevWy = player.wy;
      player.wy += player.vy * dt;

      if (player.vy < 0) {
        for (const p of plats) {
          if (Math.abs(player.x - p.wx) < p.w / 2 + 12 &&
              prevWy >= p.wy && player.wy <= p.wy) {
            player.wy = p.wy;
            player.vy = 640;
            A.burst(player.x, wyToSy(A, p.wy) + 6, A.C.tag, 5, 60);
            break;
          }
        }
      }

      // platforms drift
      for (const p of plats) {
        if (!p.vx) continue;
        p.wx += p.vx * dt;
        if (p.wx < p.w / 2 + 10 || p.wx > A.W - p.w / 2 - 10) p.vx *= -1;
      }

      // camera & score
      if (player.wy > cam) cam = player.wy;
      A.score = Math.floor(cam / 10);

      // generate above, drop below
      while (topGen < cam + 700) { topGen += A.rnd(62, 95); addPlat(A, topGen); }
      plats = plats.filter(function (p) { return p.wy > cam - 500; });

      // fell out of scope
      if (player.wy < cam - 420) {
        A.gameOver('OUT OF SCOPE', 'Stack height ' + A.score);
      }
    },

    draw: function (A, ctx) {
      const C = A.C;

      for (const p of plats) {
        const sy = wyToSy(A, p.wy);
        if (sy < A.HUD_H - 20 || sy > A.H + 20) continue;
        ctx.fillStyle = C.card;
        A.rrect(p.wx - p.w / 2, sy, p.w, 14, 3); ctx.fill();
        ctx.fillStyle = p.vx ? C.deep : C.accent;
        ctx.fillRect(p.wx - p.w / 2, sy, 4, 14);
        ctx.fillStyle = 'rgba(28,25,23,0.14)';
        ctx.fillRect(p.wx - p.w / 2 + 10, sy + 5, p.w * 0.4, 3);
      }

      // player chip
      const sy = wyToSy(A, player.wy);
      ctx.save();
      ctx.translate(player.x, sy - 14);
      const squash = A.clamp(1 - Math.abs(player.vy) / 2600, 0.82, 1);
      ctx.scale(2 - squash, squash);
      ctx.fillStyle = C.accent;
      A.rrect(-13, -13, 26, 26, 8); ctx.fill();
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-6, 13); ctx.lineTo(-6, 19);
      ctx.moveTo(6, 13); ctx.lineTo(6, 19);
      ctx.stroke();
      ctx.fillStyle = C.bg;
      ctx.fillRect(-7, -5, 4, 4);
      ctx.fillRect(3, -5, 4, 4);
      ctx.restore();
    },
  });

  function wyToSy(A, wy) {
    return (A.H - 120) - (wy - cam);
  }
})();
