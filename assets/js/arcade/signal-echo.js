/* SIGNAL ECHO — simon says, in four channels */
(function () {
  const SIZE = 128, GAP = 16;
  let seq, idx, phase, timer, litPad, audio;
  const FREQS = [329.6, 261.6, 220, 164.8];

  function padRect(A, i) {
    const cx = A.W / 2, cy = (A.HUD_H + A.H) / 2;
    const col = i % 2, row = (i / 2) | 0;
    return {
      x: cx - SIZE - GAP / 2 + col * (SIZE + GAP),
      y: cy - SIZE - GAP / 2 + row * (SIZE + GAP),
    };
  }

  function beep(i, dur) {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = i < 0 ? 110 : FREQS[i];
      gain.gain.setValueAtTime(0.12, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
      osc.connect(gain).connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + dur);
    } catch (e) { /* no audio, no problem */ }
  }

  function flashLen() { return Math.max(0.18, 0.45 - seq.length * 0.018); }

  function extend(A) {
    seq.push((Math.random() * 4) | 0);
    idx = 0;
    phase = 'show';
    timer = 0.6;
    litPad = -1;
  }

  function press(A, i) {
    if (phase !== 'input') return;
    litPad = i; timer = 0.22;
    beep(i, 0.22);
    if (i !== seq[idx]) {
      beep(-1, 0.5);
      A.shake(0.3);
      A.gameOver('DESYNC', 'You echoed ' + (seq.length - 1) + ' signals');
      return;
    }
    idx++;
    if (idx >= seq.length) {
      A.score = seq.length * 10;
      A.popup(A.W / 2, A.HUD_H + 40, 'ROUND ' + seq.length + ' ✓');
      phase = 'gap';
      timer = 0.7;
    }
  }

  Arcade.boot({
    slug: 'signal-echo',
    menu: { title: 'SIGNAL ECHO', sub: 'Watch the signal, echo it back. One wrong bit and you desync.' },
    hudCenter: function () { return seq ? 'ROUND ' + seq.length : ''; },

    start: function (A) {
      seq = [];
      extend(A);
    },

    onKey: function (A, k) {
      const n = parseInt(k, 10);
      if (n >= 1 && n <= 4) press(A, n - 1);
    },

    onTap: function (A, x, y) {
      for (let i = 0; i < 4; i++) {
        const p = padRect(A, i);
        if (x > p.x && x < p.x + SIZE && y > p.y && y < p.y + SIZE) { press(A, i); return; }
      }
    },

    update: function (A, dt) {
      timer -= dt;
      if (phase === 'show') {
        if (litPad >= 0 && timer <= 0) {
          litPad = -1;
          timer = 0.12;
          if (idx >= seq.length) { phase = 'input'; idx = 0; }
        } else if (litPad < 0 && timer <= 0 && idx < seq.length) {
          litPad = seq[idx];
          beep(litPad, flashLen());
          timer = flashLen();
          idx++;
        }
      } else if (phase === 'input') {
        if (litPad >= 0 && timer <= 0) litPad = -1;
      } else if (phase === 'gap') {
        if (litPad >= 0 && timer <= 0) litPad = -1;
        if (timer <= 0) extend(A);
      }
    },

    draw: function (A, ctx) {
      const C = A.C;
      const cols = [C.accent, C.body, C.dim, C.deep];
      for (let i = 0; i < 4; i++) {
        const p = padRect(A, i);
        const lit = litPad === i;
        if (lit) {
          ctx.fillStyle = cols[i];
          A.rrect(p.x, p.y, SIZE, SIZE, 14); ctx.fill();
        } else {
          ctx.fillStyle = C.card;
          A.rrect(p.x, p.y, SIZE, SIZE, 14); ctx.fill();
          ctx.strokeStyle = cols[i];
          ctx.lineWidth = 2.5;
          A.rrect(p.x + 1, p.y + 1, SIZE - 2, SIZE - 2, 13); ctx.stroke();
        }
        A.font(600, 13, 1);
        ctx.fillStyle = lit ? C.bg : cols[i];
        A.text(String(i + 1), p.x + SIZE / 2, p.y + SIZE / 2);
      }

      A.font(600, 11, 3);
      ctx.fillStyle = C.dim;
      A.text(
        phase === 'input' ? 'YOUR TURN' : phase === 'show' ? 'LISTEN…' : 'NICE',
        A.W / 2, A.H - 34
      );
    },
  });
})();
