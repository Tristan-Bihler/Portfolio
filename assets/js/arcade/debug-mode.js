/* ──────────────────────────────────────────────────────
   DEBUG MODE — a tiny bug-invader shooter
   Palette & typography match the portfolio design system.
   ────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // ── Logical resolution ────────────────────────────
  const W = 900;
  const H = 560;
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.scale(DPR, DPR);

  // ── Palette (── _variables.scss) ──────────────────
  const C = {
    bg:      '#fefcf8',
    card:    '#f5f0e8',
    tag:     '#e8e1d3',
    ink:     '#1c1917',
    mid:     '#2d2520',
    body:    '#4a4540',
    muted:   '#6b6460',
    dim:     '#8a8078',
    accent:  '#c95b38',
    accent2: '#d96b42',
    deep:    '#a33d1e',
  };

  const FONT = '"DM Sans", -apple-system, sans-serif';
  const HS_KEY = 'tgb-debugmode-highscore';

  // ── State ─────────────────────────────────────────
  const S = { MENU: 0, PLAYING: 1, WAVE: 2, OVER: 3, PAUSED: 4 };
  let state = S.MENU;
  let score = 0;
  let best = parseInt(localStorage.getItem(HS_KEY) || '0', 10);
  let newBest = false;
  let lives = 3;
  let wave = 0;
  let waveTimer = 0;
  let time = 0;
  let shake = 0;

  const FLOOR = H - 52;           // top of the PCB strip
  const HUD_H = 46;

  // ── Player ────────────────────────────────────────
  const player = {
    x: W / 2, w: 42, h: 20,
    speed: 350, cooldown: 0, dead: 0, blink: 0,
  };

  // ── Entities ──────────────────────────────────────
  let bugs = [];        // { x, y, w, h, row, alive }
  let shots = [];       // player shots { x, y }
  let bolts = [];       // enemy shots  { x, y, v }
  let blobs = [];       // solder-blob meteors { x, y, vx, vy, r, rot }
  let parts = [];       // particles { x, y, vx, vy, life, col, s }
  let floaters = [];    // score popups { x, y, txt, life }

  let dir = 1;          // fleet direction
  let stepDown = 0;
  let fireClock = 0;
  let blobClock = 6;

  // decorative background pads (PCB vias)
  const pads = [];
  (function () {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) {
      pads.push({ x: rnd() * W, y: HUD_H + rnd() * (FLOOR - HUD_H), r: 1 + rnd() * 1.6 });
    }
  })();

  // ── Wave setup ────────────────────────────────────
  function spawnWave() {
    bugs = [];
    const cols = 9, rows = 4;
    const gx = 64, gy = 46;
    const ox = (W - (cols - 1) * gx) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bugs.push({ x: ox + c * gx, y: 96 + r * gy, w: 30, h: 20, row: r, alive: true });
      }
    }
    dir = 1;
    shots = []; bolts = []; blobs = [];
    fireClock = 1.6;
    blobClock = 7;
  }

  function reset() {
    score = 0; lives = 3; wave = 1; newBest = false;
    player.x = W / 2; player.cooldown = 0; player.dead = 0; player.blink = 0;
    parts = []; floaters = [];
    spawnWave();
    state = S.WAVE;
    waveTimer = 1.4;
  }

  // ── Input ─────────────────────────────────────────
  const keys = {};
  let touchX = null, touchFire = false;

  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if (['ArrowLeft', 'ArrowRight', ' '].includes(k) && state !== S.MENU) e.preventDefault();
    keys[k.toLowerCase()] = true;

    if (k === ' ' || k === 'Enter') {
      if (state === S.MENU || state === S.OVER) { e.preventDefault(); reset(); }
    }
    if (k.toLowerCase() === 'p' && (state === S.PLAYING || state === S.PAUSED)) {
      state = state === S.PAUSED ? S.PLAYING : S.PAUSED;
    }
  });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

  function canvasX(e) {
    const r = canvas.getBoundingClientRect();
    return (e.clientX - r.left) / r.width * W;
  }
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (state === S.MENU || state === S.OVER) { reset(); return; }
    touchX = canvasX(e); touchFire = true;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (touchFire) touchX = canvasX(e);
  });
  canvas.addEventListener('pointerup', () => { touchX = null; touchFire = false; });
  canvas.addEventListener('pointercancel', () => { touchX = null; touchFire = false; });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === S.PLAYING) state = S.PAUSED;
  });

  // ── Helpers ───────────────────────────────────────
  function burst(x, y, col, n, force) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = (0.3 + Math.random() * 0.7) * (force || 160);
      parts.push({
        x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: 0.4 + Math.random() * 0.4,
        col, s: 2 + Math.random() * 3,
      });
    }
  }

  function popup(x, y, txt) {
    floaters.push({ x, y, txt, life: 0.9 });
  }

  function bugValue(row) { return row === 0 ? 30 : row < 3 ? 20 : 10; }

  function loseLife(x, y) {
    burst(x, y, C.accent, 26, 220);
    burst(x, y, C.ink, 12, 160);
    shake = 0.35;
    lives--;
    player.dead = 1.0;
    player.blink = 2.2;
    if (lives <= 0) {
      state = S.OVER;
      if (score > best) { best = score; newBest = true; localStorage.setItem(HS_KEY, String(best)); }
    }
  }

  // ── Update ────────────────────────────────────────
  function update(dt) {
    time += dt;
    if (shake > 0) shake -= dt;

    if (state === S.WAVE) {
      waveTimer -= dt;
      if (waveTimer <= 0) state = S.PLAYING;
      return;
    }
    if (state !== S.PLAYING) return;

    // player
    if (player.dead > 0) {
      player.dead -= dt;
    } else {
      let mv = 0;
      if (keys['arrowleft'] || keys['a']) mv -= 1;
      if (keys['arrowright'] || keys['d']) mv += 1;
      if (touchX !== null) {
        const diff = touchX - player.x;
        if (Math.abs(diff) > 6) mv = Math.sign(diff);
      }
      player.x += mv * player.speed * dt;
      player.x = Math.max(30, Math.min(W - 30, player.x));

      player.cooldown -= dt;
      if ((keys[' '] || touchFire) && player.cooldown <= 0) {
        shots.push({ x: player.x, y: FLOOR - 34 });
        player.cooldown = 0.32;
      }
    }
    if (player.blink > 0) player.blink -= dt;

    // fleet
    const alive = bugs.filter(b => b.alive);
    const total = 36;
    const pace = 26 + (1 - alive.length / total) * 96 + wave * 7;
    let minX = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const b of alive) {
      b.x += dir * pace * dt;
      minX = Math.min(minX, b.x - b.w / 2);
      maxX = Math.max(maxX, b.x + b.w / 2);
      maxY = Math.max(maxY, b.y + b.h / 2);
    }
    if ((dir > 0 && maxX > W - 26) || (dir < 0 && minX < 26)) {
      dir *= -1;
      for (const b of alive) b.y += 16;
    }
    if (maxY > FLOOR - 26 && player.dead <= 0) {
      loseLife(player.x, FLOOR - 20);
      for (const b of alive) b.y -= 80; // push back after breach
    }

    // enemy fire — bottom-most bug per column
    fireClock -= dt;
    if (fireClock <= 0 && alive.length) {
      fireClock = Math.max(0.5, 1.7 - wave * 0.14) * (0.6 + Math.random() * 0.8);
      const byCol = {};
      for (const b of alive) {
        const key = Math.round(b.x / 30);
        if (!byCol[key] || b.y > byCol[key].y) byCol[key] = b;
      }
      const shooters = Object.values(byCol);
      const s = shooters[(Math.random() * shooters.length) | 0];
      bolts.push({ x: s.x, y: s.y + 14, v: 190 + wave * 16 });
    }

    // solder-blob meteor
    blobClock -= dt;
    if (blobClock <= 0) {
      blobClock = 7 + Math.random() * 7;
      const fromLeft = Math.random() < 0.5;
      blobs.push({
        x: fromLeft ? -20 : W + 20,
        y: HUD_H + 30 + Math.random() * 60,
        vx: (fromLeft ? 1 : -1) * (90 + Math.random() * 60),
        vy: 34 + Math.random() * 26,
        r: 11 + Math.random() * 6,
        rot: Math.random() * Math.PI,
      });
    }

    // shots
    for (const s of shots) s.y -= 460 * dt;
    shots = shots.filter(s => s.y > HUD_H - 10);

    for (const b of bolts) b.y += b.v * dt;
    bolts = bolts.filter(b => b.y < FLOOR + 10);

    for (const m of blobs) {
      m.x += m.vx * dt; m.y += m.vy * dt; m.rot += dt * 2.4;
    }
    blobs = blobs.filter(m => m.x > -40 && m.x < W + 40 && m.y < FLOOR + 20);

    // collisions: shots vs bugs / blobs
    for (const s of shots) {
      for (const b of bugs) {
        if (!b.alive) continue;
        if (Math.abs(s.x - b.x) < b.w / 2 + 3 && Math.abs(s.y - b.y) < b.h / 2 + 5) {
          b.alive = false; s.y = -999;
          const val = bugValue(b.row) * wave;
          score += val;
          burst(b.x, b.y, b.row === 0 ? C.accent : C.body, 12);
          popup(b.x, b.y - 8, '+' + val);
          break;
        }
      }
      for (const m of blobs) {
        if ((s.x - m.x) ** 2 + (s.y - m.y) ** 2 < (m.r + 4) ** 2) {
          m.y = 9999; s.y = -999;
          score += 50;
          burst(m.x, m.y, C.accent2, 18, 200);
          popup(m.x, m.y, '+50');
        }
      }
    }
    blobs = blobs.filter(m => m.y < FLOOR + 20);

    // collisions vs player
    if (player.dead <= 0 && player.blink <= 0) {
      for (const b of bolts) {
        if (Math.abs(b.x - player.x) < player.w / 2 && b.y > FLOOR - 32 && b.y < FLOOR) {
          b.y = 9999;
          loseLife(player.x, FLOOR - 20);
          break;
        }
      }
      for (const m of blobs) {
        if (Math.abs(m.x - player.x) < player.w / 2 + m.r && Math.abs(m.y - (FLOOR - 20)) < m.r + 12) {
          m.y = 9999;
          loseLife(player.x, FLOOR - 20);
          break;
        }
      }
    }

    // particles & popups
    for (const p of parts) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 240 * dt; p.life -= dt;
    }
    parts = parts.filter(p => p.life > 0);
    for (const f of floaters) { f.y -= 34 * dt; f.life -= dt; }
    floaters = floaters.filter(f => f.life > 0);

    // wave cleared
    if (state === S.PLAYING && bugs.every(b => !b.alive)) {
      wave++;
      score += 100;
      popup(W / 2, H / 2, '+100 WAVE BONUS');
      spawnWave();
      state = S.WAVE;
      waveTimer = 1.6;
    }
  }

  // ── Drawing ───────────────────────────────────────
  function setFont(weight, size, spacing) {
    ctx.font = weight + ' ' + size + 'px ' + FONT;
    try { ctx.letterSpacing = (spacing || 0) + 'px'; } catch (e) { /* older browsers */ }
  }

  function drawBug(b) {
    const frame = Math.floor(time * 3 + b.row) % 2;
    const col = b.row === 0 ? C.accent : b.row < 3 ? C.body : C.muted;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    // legs (3 per side, splay animates)
    const splay = frame ? 3 : 0;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-b.w / 2 + 4, i * 5);
      ctx.lineTo(-b.w / 2 - 5 - splay, i * 5 + i * 3);
      ctx.moveTo(b.w / 2 - 4, i * 5);
      ctx.lineTo(b.w / 2 + 5 + splay, i * 5 + i * 3);
      ctx.stroke();
    }
    // antennae
    ctx.beginPath();
    ctx.moveTo(-4, -b.h / 2 + 2); ctx.lineTo(-7, -b.h / 2 - 5 - splay);
    ctx.moveTo(4, -b.h / 2 + 2); ctx.lineTo(7, -b.h / 2 - 5 + splay);
    ctx.stroke();
    // body
    ctx.fillStyle = col;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 9);
    else ctx.rect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.fill();
    // wing split + eyes in cream
    ctx.strokeStyle = C.bg;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -b.h / 2 + 3); ctx.lineTo(0, b.h / 2 - 3);
    ctx.stroke();
    ctx.fillStyle = C.bg;
    ctx.fillRect(-6, -3, 3, 3);
    ctx.fillRect(3, -3, 3, 3);
    ctx.restore();
  }

  function drawPlayer() {
    if (player.dead > 0) return;
    if (player.blink > 0 && Math.floor(time * 10) % 2 === 0) return;
    const x = player.x, y = FLOOR - 12;
    ctx.save();
    // soldering-iron tip ship
    ctx.fillStyle = C.accent;
    ctx.beginPath();
    ctx.moveTo(x, y - 24);
    ctx.lineTo(x + 6, y - 8);
    ctx.lineTo(x + player.w / 2, y - 4);
    ctx.lineTo(x + player.w / 2, y);
    ctx.lineTo(x - player.w / 2, y);
    ctx.lineTo(x - player.w / 2, y - 4);
    ctx.lineTo(x - 6, y - 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = C.ink;
    ctx.fillRect(x - 2, y - 21, 4, 6);
    ctx.restore();
  }

  function drawMiniShip(x, y) {
    ctx.fillStyle = C.accent;
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x + 7, y);
    ctx.lineTo(x - 7, y);
    ctx.closePath();
    ctx.fill();
  }

  function drawBlob(m) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.rot);
    ctx.fillStyle = C.dim;
    ctx.beginPath();
    // irregular hexagon "solder blob"
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const r = m.r * (i % 2 ? 0.82 : 1);
      ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = C.tag;
    ctx.beginPath();
    ctx.arc(-m.r * 0.28, -m.r * 0.28, m.r * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBoard() {
    // PCB strip at the bottom
    ctx.fillStyle = C.card;
    ctx.fillRect(0, FLOOR, W, H - FLOOR);
    ctx.strokeStyle = 'rgba(201,91,56,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR + 0.5); ctx.lineTo(W, FLOOR + 0.5);
    ctx.stroke();
    // traces + pads
    ctx.strokeStyle = 'rgba(201,91,56,0.22)';
    ctx.lineWidth = 1.5;
    for (let x = 30; x < W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, H - 8);
      ctx.lineTo(x, H - 22);
      ctx.lineTo(x + 18, H - 34);
      ctx.stroke();
      ctx.fillStyle = 'rgba(201,91,56,0.3)';
      ctx.beginPath();
      ctx.arc(x + 18, H - 34, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawHUD() {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, HUD_H);
    ctx.strokeStyle = 'rgba(28,25,23,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HUD_H + 0.5); ctx.lineTo(W, HUD_H + 0.5);
    ctx.stroke();

    setFont(600, 11, 2);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C.accent;
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', 28, HUD_H / 2);
    ctx.fillStyle = C.mid;
    setFont(700, 15, 1);
    ctx.fillText(String(score).padStart(4, '0'), 88, HUD_H / 2);

    setFont(600, 11, 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.dim;
    ctx.fillText('WAVE ' + String(wave).padStart(2, '0'), W / 2, HUD_H / 2);

    ctx.fillStyle = C.dim;
    ctx.textAlign = 'right';
    ctx.fillText('BEST ' + String(Math.max(best, score)).padStart(4, '0'), W - 110, HUD_H / 2);
    for (let i = 0; i < lives; i++) drawMiniShip(W - 80 + i * 22, HUD_H / 2 + 4);
  }

  function drawCenteredScreen(label, title, sub, prompt) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (label) {
      setFont(600, 12, 3);
      ctx.fillStyle = C.accent;
      ctx.fillText(label.toUpperCase(), W / 2, H / 2 - 96);
    }
    setFont(800, 64, 0);
    ctx.fillStyle = C.ink;
    ctx.fillText(title, W / 2, H / 2 - 40);
    if (sub) {
      setFont(300, 16, 0);
      ctx.fillStyle = C.muted;
      ctx.fillText(sub, W / 2, H / 2 + 18);
    }
    if (prompt) {
      const a = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * 3.4));
      ctx.globalAlpha = a;
      setFont(600, 12, 3);
      ctx.fillStyle = C.accent;
      ctx.fillText(prompt.toUpperCase(), W / 2, H / 2 + 76);
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    ctx.save();
    if (shake > 0) {
      ctx.translate((Math.random() - 0.5) * 8 * shake, (Math.random() - 0.5) * 8 * shake);
    }

    // background
    ctx.fillStyle = C.bg;
    ctx.fillRect(-10, -10, W + 20, H + 20);
    ctx.fillStyle = 'rgba(28,25,23,0.05)';
    for (const p of pads) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    drawBoard();

    if (state === S.MENU) {
      // decorative bug row on the menu
      for (let i = 0; i < 5; i++) {
        drawBug({ x: W / 2 + (i - 2) * 70, y: 130, w: 30, h: 20, row: i === 2 ? 0 : 2 });
      }
      drawCenteredScreen(
        'TGB Arcade',
        'DEBUG MODE',
        'Bugs are invading the codebase. Squash them all.',
        'Press space or tap to start'
      );
      drawPlayer();
      ctx.restore();
      return;
    }

    // entities
    for (const b of bugs) if (b.alive) drawBug(b);
    for (const m of blobs) drawBlob(m);

    ctx.fillStyle = C.accent;
    for (const s of shots) ctx.fillRect(s.x - 1.5, s.y - 7, 3, 12);
    ctx.fillStyle = C.ink;
    for (const b of bolts) ctx.fillRect(b.x - 1.5, b.y - 6, 3, 10);

    drawPlayer();

    for (const p of parts) {
      ctx.globalAlpha = Math.min(1, p.life * 2.5);
      ctx.fillStyle = p.col;
      ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    }
    ctx.globalAlpha = 1;

    setFont(700, 13, 1);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.deep;
    for (const f of floaters) {
      ctx.globalAlpha = Math.min(1, f.life * 2);
      ctx.fillText(f.txt, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    drawHUD();

    if (state === S.WAVE) {
      drawCenteredScreen(null, 'WAVE ' + String(wave).padStart(2, '0'),
        wave === 1 ? 'Compiling hostiles…' : 'Recompiling hostiles…', null);
    } else if (state === S.PAUSED) {
      ctx.fillStyle = 'rgba(254,252,248,0.82)';
      ctx.fillRect(0, 0, W, H);
      drawCenteredScreen(null, 'PAUSED', 'Breakpoint hit.', 'Press P to continue');
    } else if (state === S.OVER) {
      ctx.fillStyle = 'rgba(254,252,248,0.88)';
      ctx.fillRect(0, 0, W, H);
      drawCenteredScreen(
        newBest ? 'New high score' : 'Game over',
        'SEGFAULT',
        'Score ' + String(score).padStart(4, '0') + '  ·  Best ' + String(best).padStart(4, '0'),
        'Press space or tap to retry'
      );
    }

    ctx.restore();
  }

  // ── Loop ──────────────────────────────────────────
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
