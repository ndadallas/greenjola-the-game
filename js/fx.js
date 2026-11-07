/* =========================================================
   FX — static noise, synthesized UI sounds, pixel city
   Everything is generated: no audio or image files needed.
   ========================================================= */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- TV static ---------- */
  function noiseFrame(ctx, w, h, tint) {
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() * 255;
      d[i] = v * tint[0];
      d[i + 1] = v * tint[1];
      d[i + 2] = v * tint[2];
      d[i + 3] = 255;
    }
    // horizontal tracking bands
    for (let b = 0; b < 3; b++) {
      const y = (Math.random() * h) | 0;
      const bh = 1 + ((Math.random() * 3) | 0);
      for (let yy = y; yy < Math.min(h, y + bh); yy++) {
        for (let x = 0; x < w; x++) {
          const k = (yy * w + x) * 4;
          d[k] = d[k + 1] = d[k + 2] = 235;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  const staticCanvas = document.getElementById('static');
  const staticCtx = staticCanvas.getContext('2d');
  let staticRaf = 0;

  function burst(ms = 360) {
    return new Promise((resolve) => {
      if (reduceMotion) { resolve(); return; }
      staticCanvas.classList.add('is-on');
      const end = performance.now() + ms;
      const tick = (t) => {
        noiseFrame(staticCtx, staticCanvas.width, staticCanvas.height, [0.62, 0.68, 0.85]);
        if (t < end) staticRaf = requestAnimationFrame(tick);
        else { staticCanvas.classList.remove('is-on'); resolve(); }
      };
      cancelAnimationFrame(staticRaf);
      staticRaf = requestAnimationFrame(tick);
    });
  }

  /* small looping noise (the "???" album card) */
  function loopNoise(canvas) {
    const ctx = canvas.getContext('2d');
    let last = 0;
    const loop = (t) => {
      if (t - last > 70) {
        noiseFrame(ctx, canvas.width, canvas.height, [0.85, 0.85, 0.85]);
        last = t;
      }
      requestAnimationFrame(loop);
    };
    if (reduceMotion) noiseFrame(ctx, canvas.width, canvas.height, [0.85, 0.85, 0.85]);
    else requestAnimationFrame(loop);
  }

  /* ---------- synthesized UI sounds ---------- */
  let ac = null;
  let enabled = true;

  function audio() {
    if (!enabled) return null;
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  function tone(freq, dur, { type = 'square', gain = 0.05, at = 0, slide = 0 } = {}) {
    const a = audio();
    if (!a) return;
    const t = a.currentTime + at;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function hiss(dur = 0.3, gain = 0.06) {
    const a = audio();
    if (!a) return;
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource();
    const f = a.createBiquadFilter();
    const g = a.createGain();
    f.type = 'highpass';
    f.frequency.value = 900;
    g.gain.value = gain;
    src.buffer = buf;
    src.connect(f).connect(g).connect(a.destination);
    src.start();
  }

  /* slow-attack pad chord, a nod to console boot chimes */
  function pad(freqs, dur = 2.6, gain = 0.035) {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    freqs.forEach((f, i) => {
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      o.detune.value = (i - 1) * 6;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(a.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }

  const sfx = {
    move: () => tone(1320, 0.05, { gain: 0.025 }),
    select: () => { tone(660, 0.07, { gain: 0.04 }); tone(990, 0.12, { gain: 0.04, at: 0.06 }); },
    back: () => tone(520, 0.14, { gain: 0.035, slide: 0.5 }),
    deny: () => { tone(160, 0.12, { type: 'sawtooth', gain: 0.03 }); tone(150, 0.14, { type: 'sawtooth', gain: 0.03, at: 0.12 }); },
    type: () => tone(1800 + Math.random() * 400, 0.018, { gain: 0.012 }),
    static: () => hiss(0.32, 0.05),
    start: () => { pad([196, 293.66, 392, 587.33], 2.4, 0.04); tone(1568, 0.5, { type: 'sine', gain: 0.02, at: 0.15 }); },
  };

  function setSound(on) { enabled = on; }

  /* ---------- pixel city (story screen) ---------- */
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 12x18 sprite: beanie (g/G), skin (s), eyes (K), jacket (j), pants (p), shoes (w)
  const SPRITE = [
    '....gggg....',
    '...gggggg...',
    '..gGgGgGgg..',
    '..gggggggg..',
    '...ssssss...',
    '...sKssKs...',
    '...ssssss...',
    '....ssss....',
    '..jjjjjjjj..',
    '.jjjjjjjjjj.',
    '.jjjjGjjjjj.',
    '.sjjjjjjjjs.',
    '..jjjjjjjj..',
    '...pppppp...',
    '...pp..pp...',
    '...pp..pp...',
    '...pp..pp...',
    '..www..www..',
  ];
  const SPRITE_COLORS = { g: '#3ce03a', G: '#a6ff8f', s: '#5a3a28', K: '#0b0b0b', j: '#1d1f22', p: '#2c2f33', w: '#e8e8e8' };

  function city(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const rand = mulberry(23);
    const buildings = [];
    let x = -4;
    while (x < W) {
      const w = 18 + ((rand() * 34) | 0);
      const h = 50 + ((rand() * 100) | 0);
      const lit = rand() > 0.82 ? '#e8ff3a' : '#3cff3a';
      const style = (rand() * 3) | 0;
      buildings.push({ x, w, h, lit, style, seed: (rand() * 1e6) | 0 });
      x += w + ((rand() * 4) | 0);
    }
    const back = [];
    x = -10;
    while (x < W) {
      const w = 14 + ((rand() * 30) | 0);
      back.push({ x, w, h: 70 + ((rand() * 70) | 0) });
      x += w;
    }

    function drawSprite(sx, sy, scale) {
      SPRITE.forEach((row, ry) => {
        [...row].forEach((c, rx) => {
          if (c === '.') return;
          ctx.fillStyle = SPRITE_COLORS[c];
          ctx.fillRect(sx + rx * scale, sy + ry * scale, scale, scale);
        });
      });
    }

    let frame = 0;
    function draw() {
      frame++;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#050a06');
      g.addColorStop(0.55, '#0c1a10');
      g.addColorStop(1, '#030503');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // drifting cloud bands
      for (let i = 0; i < 4; i++) {
        const cy = 8 + i * 9;
        const off = ((frame * (0.08 + i * 0.03)) % W) | 0;
        ctx.fillStyle = `rgba(40,110,60,${0.12 - i * 0.02})`;
        for (let cx = -W; cx < W * 2; cx += 6) {
          if (((cx / 6) | 0) % 3 === i % 3) ctx.fillRect(cx + off, cy + ((Math.sin(cx * 0.05) * 3) | 0), 18, 4);
        }
      }
      back.forEach((b) => {
        ctx.fillStyle = '#07120a';
        ctx.fillRect(b.x, H - b.h, b.w, b.h);
      });
      buildings.forEach((b) => {
        const top = H - b.h;
        ctx.fillStyle = '#050805';
        ctx.fillRect(b.x, top, b.w, b.h);
        // reseeded every ~1.6s so a few windows switch on/off
        const r = mulberry(b.seed + ((frame / 40) | 0));
        if (b.style === 0) {
          for (let y = top + 4; y < H - 4; y += 6) {
            ctx.fillStyle = r() > 0.15 ? b.lit : '#0e2a10';
            ctx.fillRect(b.x + 2, y, b.w - 4, 3);
          }
        } else if (b.style === 1) {
          for (let y = top + 3; y < H - 3; y += 5) {
            for (let wx = b.x + 2; wx < b.x + b.w - 3; wx += 4) {
              ctx.fillStyle = r() > 0.35 ? b.lit : '#0b1f0c';
              ctx.fillRect(wx, y, 2, 3);
            }
          }
        } else {
          for (let wx = b.x + 2; wx < b.x + b.w - 2; wx += 4) {
            ctx.fillStyle = r() > 0.2 ? b.lit : '#0b1f0c';
            ctx.fillRect(wx, top + 3, 2, b.h - 6);
          }
        }
      });
      const haze = ctx.createLinearGradient(0, H * 0.45, 0, H);
      haze.addColorStop(0, 'rgba(92,255,79,0)');
      haze.addColorStop(1, 'rgba(92,255,79,0.08)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, W, H);
      // Jola on a rooftop, idle bob
      const bob = (frame / 30) % 2 < 1 ? 0 : 1;
      ctx.fillStyle = '#050805';
      ctx.fillRect(W / 2 - 22, H - 68, 44, 68);
      ctx.fillStyle = '#3cff3a';
      ctx.fillRect(W / 2 - 22, H - 68, 44, 1);
      drawSprite(W / 2 - 12, H - 68 - 36 + bob, 2);
    }

    let raf = 0;
    let last = 0;
    function loop(t) {
      if (t - last > 1000 / 24) { draw(); last = t; }
      raf = requestAnimationFrame(loop);
    }
    return {
      start() { cancelAnimationFrame(raf); if (reduceMotion) draw(); else raf = requestAnimationFrame(loop); },
      stop() { cancelAnimationFrame(raf); },
    };
  }

  window.FX = { burst, loopNoise, sfx, setSound, city, reduceMotion };
})();
