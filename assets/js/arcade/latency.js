/* LATENCY — how fast is your interrupt handler? */
(function () {
  const ROUNDS = 5;
  let phase, waitT, t0, results, lastMs, falseStart;

  function nextRound(A) {
    phase = 'wait';
    waitT = A.rnd(1.2, 3.2);
    falseStart = false;
  }

  function press(A) {
    if (phase === 'wait') {
      falseStart = true;
      phase = 'result';
      lastMs = -1;
      waitT = 1.2;
    } else if (phase === 'go') {
      lastMs = Math.round(performance.now() - t0);
      results.push(lastMs);
      phase = 'result';
      waitT = 1.1;
    }
  }

  Arcade.boot({
    slug: 'latency',
    hud: false,
    lowerIsBetter: true,
    fmtScore: function (v) { return Math.round(v) + ' ms'; },
    overLabel: 'Benchmark complete',
    menu: {
      title: 'LATENCY',
      sub: 'Five rounds. Tap the instant the screen turns terracotta. Don’t jump the clock.',
    },

    start: function (A) {
      results = [];
      lastMs = 0;
      nextRound(A);
    },

    onKey: function (A, k) { if (k === ' ') press(A); },
    onTap: function (A) { press(A); },

    update: function (A, dt) {
      waitT -= dt;
      if (phase === 'wait' && waitT <= 0) {
        phase = 'go';
        t0 = performance.now();
      } else if (phase === 'result' && waitT <= 0) {
        if (results.length >= ROUNDS) {
          const avg = Math.round(results.reduce(function (a, b) { return a + b; }, 0) / results.length);
          A.score = avg;
          A.gameOver(avg + ' MS', 'Average over ' + ROUNDS + ' rounds  ·  Best single ' + Math.min.apply(null, results) + ' ms');
        } else {
          nextRound(A);
        }
      }
    },

    draw: function (A, ctx) {
      const C = A.C;

      if (phase === 'go') {
        ctx.fillStyle = C.accent;
        ctx.fillRect(0, 0, A.W, A.H);
        A.font(800, 64, 0);
        ctx.fillStyle = C.bg;
        A.text('TAP!', A.W / 2, A.H / 2);
        return;
      }

      A.font(600, 12, 3);
      ctx.fillStyle = C.dim;
      A.text('ROUND ' + Math.min(results.length + 1, ROUNDS) + ' / ' + ROUNDS, A.W / 2, 80);

      if (phase === 'wait') {
        A.font(800, 44, 0);
        ctx.fillStyle = C.mid;
        A.text('WAIT FOR IT…', A.W / 2, A.H / 2 - 10);
        A.font(300, 15, 0);
        ctx.fillStyle = C.muted;
        A.text('Tap when everything turns terracotta', A.W / 2, A.H / 2 + 40);
      } else if (phase === 'result') {
        if (falseStart) {
          A.font(800, 44, 0);
          ctx.fillStyle = C.deep;
          A.text('FALSE START', A.W / 2, A.H / 2 - 10);
          A.font(300, 15, 0);
          ctx.fillStyle = C.muted;
          A.text('Interrupt fired before the signal — round restarts', A.W / 2, A.H / 2 + 40);
        } else {
          A.font(800, 64, 0);
          ctx.fillStyle = C.ink;
          A.text(lastMs + ' ms', A.W / 2, A.H / 2 - 10);
          A.font(300, 15, 0);
          ctx.fillStyle = C.muted;
          A.text(lastMs < 200 ? 'Real-time certified' : lastMs < 300 ? 'Solid interrupt handling' : 'Garbage collector paused?', A.W / 2, A.H / 2 + 44);
        }
      }

      // previous results
      A.font(600, 12, 1);
      ctx.fillStyle = C.dim;
      A.text(results.map(function (r) { return r + 'ms'; }).join('  ·  '), A.W / 2, A.H - 50);
    },
  });
})();
