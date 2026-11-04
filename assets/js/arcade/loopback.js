/* LOOPBACK — pong against the loopback interface */
(function () {
  let ball, pY, cY, pScore, cScore, serveT, rally;
  const PW = 12, PH = 84;

  function serve(A, dir) {
    ball = {
      x: A.W / 2, y: (A.HUD_H + A.H) / 2,
      vx: 330 * dir, vy: A.rnd(-140, 140),
    };
    rally = 0;
    serveT = 0.9;
  }

  Arcade.boot({
    slug: 'loopback',
    menu: { title: 'LOOPBACK', sub: 'First to 7 points beats the loopback interface.' },
    hudCenter: function () { return 'YOU ' + pScore + ' · CPU ' + cScore; },

    start: function (A) {
      pY = cY = A.H / 2;
      pScore = 0; cScore = 0;
      serve(A, 1);
    },

    update: function (A, dt) {
      const top = A.HUD_H + 12, bot = A.H - 12;

      // player paddle: keys, or drag on touch
      let mv = 0;
      if (A.keys['ArrowUp'] || A.keys['w']) mv -= 1;
      if (A.keys['ArrowDown'] || A.keys['s']) mv += 1;
      if (mv) pY += mv * 400 * dt;
      else if (A.pointer.down) pY += A.clamp(A.pointer.y - pY, -400 * dt, 400 * dt);
      pY = A.clamp(pY, top + PH / 2, bot - PH / 2);

      // cpu paddle
      const cpuMax = 235 + rally * 9;
      const target = ball.vx > 0 ? ball.y : A.H / 2 + 40;
      cY += A.clamp(target - cY, -cpuMax * dt, cpuMax * dt);
      cY = A.clamp(cY, top + PH / 2, bot - PH / 2);

      if (serveT > 0) { serveT -= dt; return; }

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      if (ball.y < top + 6 && ball.vy < 0) ball.vy *= -1;
      if (ball.y > bot - 6 && ball.vy > 0) ball.vy *= -1;

      // paddles
      if (ball.vx < 0 && ball.x < 40 + PW && ball.x > 30 && Math.abs(ball.y - pY) < PH / 2 + 8) {
        ball.vx = Math.min(720, -ball.vx * 1.05);
        ball.vy = (ball.y - pY) * 5 + ball.vy * 0.3;
        rally++;
        A.burst(ball.x, ball.y, A.C.accent, 8, 120);
      }
      if (ball.vx > 0 && ball.x > A.W - 40 - PW && ball.x < A.W - 30 && Math.abs(ball.y - cY) < PH / 2 + 8) {
        ball.vx = Math.max(-720, -ball.vx * 1.05);
        ball.vy = (ball.y - cY) * 5 + ball.vy * 0.3;
        rally++;
        A.burst(ball.x, ball.y, A.C.ink, 8, 120);
      }

      // points
      if (ball.x < -20) {
        cScore++;
        A.shake(0.25);
        if (cScore >= 7) { A.gameOver('CONNECTION LOST', 'You ' + pScore + '  ·  CPU ' + cScore); return; }
        serve(A, 1);
      }
      if (ball.x > A.W + 20) {
        pScore++;
        A.score += 100;
        A.popup(A.W - 80, A.H / 2, '+100');
        if (pScore >= 7) {
          A.score += 300;
          A.gameOver('ACK RECEIVED', 'You beat the loopback  ·  7 : ' + cScore);
          return;
        }
        serve(A, -1);
      }
    },

    draw: function (A, ctx) {
      const C = A.C;
      // center line
      ctx.strokeStyle = 'rgba(28,25,23,0.12)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 14]);
      ctx.beginPath();
      ctx.moveTo(A.W / 2, A.HUD_H + 16);
      ctx.lineTo(A.W / 2, A.H - 16);
      ctx.stroke();
      ctx.setLineDash([]);

      // big faint scores
      A.font(800, 90, 0);
      ctx.fillStyle = 'rgba(28,25,23,0.06)';
      A.text(String(pScore), A.W * 0.3, A.H / 2);
      A.text(String(cScore), A.W * 0.7, A.H / 2);

      // paddles
      ctx.fillStyle = C.accent;
      A.rrect(40, pY - PH / 2, PW, PH, 4); ctx.fill();
      ctx.fillStyle = C.ink;
      A.rrect(A.W - 40 - PW, cY - PH / 2, PW, PH, 4); ctx.fill();

      // ball
      if (serveT <= 0 || Math.floor(A.t * 8) % 2 === 0) {
        ctx.fillStyle = C.deep;
        A.rrect(ball.x - 6, ball.y - 6, 12, 12, 3); ctx.fill();
      }
    },
  });
})();
