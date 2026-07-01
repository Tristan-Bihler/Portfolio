/* KEYSTROKE — type the falling words before the buffer fills */
(function () {
  const WORDS = [
    'voltage', 'ampere', 'diode', 'mosfet', 'anode', 'cathode', 'relay',
    'sensor', 'kernel', 'buffer', 'pointer', 'array', 'struct', 'python',
    'opencv', 'jekyll', 'github', 'solder', 'copper', 'circuit', 'resistor',
    'capacitor', 'inductor', 'arduino', 'embedded', 'firmware', 'debugger',
    'compile', 'binary', 'logic', 'signal', 'current', 'charge', 'dataset',
    'matrix', 'vector', 'switch', 'router', 'packet', 'socket', 'thread',
    'mutex', 'stack', 'queue', 'heap', 'cache', 'pixel', 'shader', 'ohm',
  ];
  let words, spawnT, lives, target, progress, typed;

  function spawnWord(A) {
    const w = A.pick(WORDS);
    words.push({
      word: w,
      x: A.rnd(90, A.W - 90),
      y: A.HUD_H + 10,
      speed: A.rnd(26, 40) + Math.min(50, A.t * 1.2),
    });
  }

  Arcade.boot({
    slug: 'keystroke',
    menu: { title: 'KEYSTROKE', sub: 'Type the falling words before they hit the floor. Three misses and the buffer is full.' },
    hudCenter: function () { return 'LIVES ' + lives + ' · TYPED ' + typed; },

    start: function (A) {
      words = []; spawnT = 0.2; lives = 3;
      target = null; progress = 0; typed = 0;
    },

    onKey: function (A, k) {
      if (k.length !== 1 || !/[a-z]/i.test(k)) return;
      const ch = k.toLowerCase();

      if (target && words.indexOf(target) < 0) { target = null; progress = 0; }

      if (!target) {
        let cand = null;
        for (const w of words) {
          if (w.word[0] === ch && (!cand || w.y > cand.y)) cand = w;
        }
        if (cand) { target = cand; progress = 1; }
        return;
      }

      if (target.word[progress] === ch) {
        progress++;
        if (progress >= target.word.length) {
          const pts = target.word.length * 10;
          A.score += pts;
          typed++;
          A.popup(target.x, target.y - 10, '+' + pts);
          A.burst(target.x, target.y, A.C.accent, 14, 160);
          words.splice(words.indexOf(target), 1);
          target = null; progress = 0;
        }
      }
    },

    update: function (A, dt) {
      spawnT -= dt;
      const maxWords = 4 + Math.floor(A.t / 20);
      if (spawnT <= 0 && words.length < maxWords) {
        spawnT = Math.max(0.9, 2.1 - A.t * 0.02);
        spawnWord(A);
      }

      for (const w of words) w.y += w.speed * dt;

      const floor = A.H - 34;
      const dropped = words.filter(function (w) { return w.y >= floor; });
      for (const w of dropped) {
        lives--;
        A.shake(0.25);
        A.burst(w.x, floor, A.C.ink, 14, 160);
        if (w === target) { target = null; progress = 0; }
        words.splice(words.indexOf(w), 1);
        if (lives <= 0) {
          A.gameOver('BUFFER FULL', 'You typed ' + typed + ' words');
          return;
        }
      }
    },

    draw: function (A, ctx) {
      const C = A.C;
      // floor
      ctx.strokeStyle = 'rgba(201,91,56,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, A.H - 27.5); ctx.lineTo(A.W, A.H - 27.5);
      ctx.stroke();

      ctx.textBaseline = 'middle';
      for (const w of words) {
        const isT = w === target;
        A.font(isT ? 700 : 500, 19, 1);
        const done = isT ? w.word.slice(0, progress) : '';
        const rest = isT ? w.word.slice(progress) : w.word;
        const total = ctx.measureText(w.word).width;
        let x = w.x - total / 2;

        if (done) {
          ctx.fillStyle = C.accent;
          ctx.textAlign = 'left';
          ctx.fillText(done, x, w.y);
          x += ctx.measureText(done).width;
        }
        ctx.fillStyle = w.y > A.H - 110 ? C.deep : C.mid;
        ctx.textAlign = 'left';
        ctx.fillText(rest, x, w.y);

        if (isT) {
          ctx.strokeStyle = C.accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(w.x - total / 2, w.y + 13);
          ctx.lineTo(w.x + total / 2, w.y + 13);
          ctx.stroke();
        }
      }

      A.font(600, 11, 3);
      ctx.fillStyle = C.dim;
      A.text('JUST START TYPING', A.W / 2, A.H - 12);
    },
  });
})();
