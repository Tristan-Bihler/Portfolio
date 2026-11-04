/* ──────────────────────────────────────────────────────
   TGB ARCADE — shared runtime for all mini games.
   Handles canvas, palette, input, state machine,
   HUD, particles, popups and highscores.
   ────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const C = {
    bg: '#fefcf8', card: '#f5f0e8', tag: '#e8e1d3',
    ink: '#1c1917', mid: '#2d2520', body: '#4a4540',
    muted: '#6b6460', dim: '#8a8078',
    accent: '#c95b38', accent2: '#d96b42', deep: '#a33d1e',
    pale: 'rgba(201,91,56,0.12)',
  };
  const FONT = '"DM Sans", -apple-system, sans-serif';

  function boot(g) {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = g.W || 900, H = g.H || 560;
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.scale(DPR, DPR);

    const HS_KEY = 'tgb-arcade-' + g.slug;

    const A = {
      C: C, W: W, H: H, ctx: ctx, canvas: canvas,
      HUD_H: g.hud === false ? 0 : 46,
      state: 'menu', t: 0, score: 0,
      best: parseFloat(localStorage.getItem(HS_KEY)) || 0,
      newBest: false, overTitle: 'GAME OVER', overSub: null,
      keys: {}, pointer: { x: W / 2, y: H / 2, down: false },
      parts: [], floats: [], shakeT: 0,
    };

    // ── helpers ─────────────────────────────────────
    A.font = function (w, s, sp) {
      ctx.font = w + ' ' + s + 'px ' + FONT;
      try { ctx.letterSpacing = (sp || 0) + 'px'; } catch (e) { /* older browsers */ }
    };
    A.text = function (txt, x, y, align, base) {
      ctx.textAlign = align || 'center';
      ctx.textBaseline = base || 'middle';
      ctx.fillText(txt, x, y);
    };
    A.rrect = function (x, y, w, h, r) {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
      else ctx.rect(x, y, w, h);
    };
    A.circle = function (x, y, r, col) {
      if (col) ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    A.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    A.rnd = function (a, b) { return a + Math.random() * (b - a); };
    A.pick = function (arr) { return arr[(Math.random() * arr.length) | 0]; };
    A.fmt = function (v) {
      return g.fmtScore ? g.fmtScore(v) : String(Math.max(0, Math.round(v))).padStart(4, '0');
    };
    A.burst = function (x, y, col, n, force) {
      for (let i = 0; i < (n || 12); i++) {
        const a = Math.random() * Math.PI * 2;
        const v = (0.3 + Math.random() * 0.7) * (force || 160);
        A.parts.push({
          x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          life: 0.4 + Math.random() * 0.4, col: col, s: 2 + Math.random() * 3,
        });
      }
    };
    A.popup = function (x, y, txt) { A.floats.push({ x: x, y: y, txt: txt, life: 0.9 }); };
    A.shake = function (s) { A.shakeT = Math.max(A.shakeT, s); };
    A.gameOver = function (title, sub) {
      A.state = 'over';
      A.overTitle = title || 'GAME OVER';
      A.overSub = sub || null;
      const better = g.lowerIsBetter
        ? (A.best === 0 || A.score < A.best)
        : A.score > A.best;
      if (A.score > 0 && better) {
        A.best = A.score; A.newBest = true;
        localStorage.setItem(HS_KEY, String(A.best));
      }
    };

    // decorative background vias
    const pads = [];
    (function () {
      let seed = 7;
      const rnd = function () { return (seed = (seed * 16807) % 2147483647) / 2147483647; };
      for (let i = 0; i < 70; i++) {
        pads.push({ x: rnd() * W, y: A.HUD_H + rnd() * (H - A.HUD_H), r: 1 + rnd() * 1.6 });
      }
    })();

    function start() {
      A.score = 0; A.newBest = false; A.t = 0;
      A.parts = []; A.floats = []; A.shakeT = 0;
      A.overTitle = 'GAME OVER'; A.overSub = null;
      if (g.start) g.start(A);
      A.state = 'playing';
    }

    // ── input ───────────────────────────────────────
    function normKey(k) { return k.length === 1 ? k.toLowerCase() : k; }

    window.addEventListener('keydown', function (e) {
      const k = e.key;
      if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(k) >= 0) e.preventDefault();
      A.keys[normKey(k)] = true;
      if ((k === ' ' || k === 'Enter') && (A.state === 'menu' || A.state === 'over')) { start(); return; }
      if ((k === 'p' || k === 'P') && (A.state === 'playing' || A.state === 'paused')) {
        A.state = A.state === 'paused' ? 'playing' : 'paused';
        return;
      }
      if (A.state === 'playing' && g.onKey) g.onKey(A, k, e);
    });
    window.addEventListener('keyup', function (e) { A.keys[normKey(e.key)] = false; });

    function pxy(e) {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
    }
    canvas.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      const p = pxy(e);
      A.pointer.x = p.x; A.pointer.y = p.y;
      if (A.state === 'menu' || A.state === 'over') { start(); return; }
      A.pointer.down = true;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
      if (A.state === 'playing' && g.onTap) g.onTap(A, p.x, p.y, e.button === 2);
    });
    canvas.addEventListener('pointermove', function (e) {
      const p = pxy(e);
      A.pointer.x = p.x; A.pointer.y = p.y;
    });
    function release(e) {
      A.pointer.down = false;
      if (A.state === 'playing' && g.onRelease) g.onRelease(A, A.pointer.x, A.pointer.y);
    }
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && A.state === 'playing') A.state = 'paused';
    });

    // ── drawing ─────────────────────────────────────
    function drawScreen(label, title, sub, prompt) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (label) {
        A.font(600, 12, 3);
        ctx.fillStyle = C.accent;
        ctx.fillText(label.toUpperCase(), W / 2, H / 2 - 96);
      }
      A.font(800, 58, 0);
      ctx.fillStyle = C.ink;
      ctx.fillText(title, W / 2, H / 2 - 40);
      if (sub) {
        A.font(300, 16, 0);
        ctx.fillStyle = C.muted;
        ctx.fillText(sub, W / 2, H / 2 + 18);
      }
      if (prompt) {
        ctx.globalAlpha = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(Date.now() / 300));
        A.font(600, 12, 3);
        ctx.fillStyle = C.accent;
        ctx.fillText(prompt.toUpperCase(), W / 2, H / 2 + 76);
        ctx.globalAlpha = 1;
      }
    }

    function drawHUD() {
      if (g.hud === false) return;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, A.HUD_H);
      ctx.strokeStyle = 'rgba(28,25,23,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, A.HUD_H + 0.5); ctx.lineTo(W, A.HUD_H + 0.5);
      ctx.stroke();

      if (typeof g.hud === 'function') { g.hud(A, ctx); return; }

      A.font(600, 11, 2);
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C.accent;
      ctx.textAlign = 'left';
      ctx.fillText('SCORE', 28, A.HUD_H / 2);
      ctx.fillStyle = C.mid;
      A.font(700, 15, 1);
      ctx.fillText(A.fmt(A.score), 88, A.HUD_H / 2);

      if (g.hudCenter) {
        A.font(600, 11, 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = C.dim;
        ctx.fillText(String(g.hudCenter(A)).toUpperCase(), W / 2, A.HUD_H / 2);
      }

      A.font(600, 11, 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = C.dim;
      const bestShown = g.lowerIsBetter
        ? (A.best || 0) : Math.max(A.best, A.score);
      ctx.fillText('BEST ' + A.fmt(bestShown), W - 28, A.HUD_H / 2);
    }

    // ── loop ────────────────────────────────────────
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      if (A.state === 'playing') {
        A.t += dt;
        g.update(A, dt);
        for (const p of A.parts) {
          p.x += p.vx * dt; p.y += p.vy * dt;
          p.vy += 240 * dt; p.life -= dt;
        }
        A.parts = A.parts.filter(function (p) { return p.life > 0; });
        for (const f of A.floats) { f.y -= 34 * dt; f.life -= dt; }
        A.floats = A.floats.filter(function (f) { return f.life > 0; });
        if (A.shakeT > 0) A.shakeT -= dt;
      }

      ctx.save();
      if (A.shakeT > 0) {
        ctx.translate((Math.random() - 0.5) * 8 * A.shakeT, (Math.random() - 0.5) * 8 * A.shakeT);
      }

      // background
      ctx.fillStyle = C.bg;
      ctx.fillRect(-10, -10, W + 20, H + 20);
      if (g.bg !== false) {
        ctx.fillStyle = 'rgba(28,25,23,0.05)';
        for (const p of pads) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (A.state === 'menu') {
        if (g.menuArt) g.menuArt(A, ctx);
        drawScreen(
          g.menu.label || 'TGB Arcade',
          g.menu.title,
          g.menu.sub,
          g.menu.prompt || 'Press space or tap to start'
        );
      } else {
        g.draw(A, ctx);

        for (const p of A.parts) {
          ctx.globalAlpha = Math.min(1, p.life * 2.5);
          ctx.fillStyle = p.col;
          ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
        }
        ctx.globalAlpha = 1;

        A.font(700, 13, 1);
        ctx.textAlign = 'center';
        ctx.fillStyle = C.deep;
        for (const f of A.floats) {
          ctx.globalAlpha = Math.min(1, f.life * 2);
          ctx.fillText(f.txt, f.x, f.y);
        }
        ctx.globalAlpha = 1;

        drawHUD();

        if (A.state === 'paused') {
          ctx.fillStyle = 'rgba(254,252,248,0.82)';
          ctx.fillRect(0, 0, W, H);
          drawScreen(null, 'PAUSED', 'Breakpoint hit.', 'Press P to continue');
        } else if (A.state === 'over') {
          ctx.fillStyle = 'rgba(254,252,248,0.88)';
          ctx.fillRect(0, 0, W, H);
          drawScreen(
            A.newBest ? 'New high score' : (g.overLabel || 'Game over'),
            A.overTitle,
            A.overSub || ('Score ' + A.fmt(A.score) + '  ·  Best ' + A.fmt(A.best)),
            'Press space or tap to retry'
          );
        }
      }

      ctx.restore();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  window.Arcade = { boot: boot, C: C };
})();
