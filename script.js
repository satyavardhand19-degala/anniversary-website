/* ==================================================================
   Anniversary Surprise — script.js
   Screen router, passcode gate, canvas effects, cake, audio.
   Everything personal comes from config.js; nothing is hardcoded here.
   ================================================================== */

(() => {
  "use strict";

  /* `const CONFIG` in config.js is a global lexical binding, not a property of
     window — reach it by identifier, and fall back to an empty object so a
     missing config.js degrades instead of throwing. */
  const CFG = (typeof CONFIG !== "undefined" && CONFIG) || {};
  const $  = (sel, root = document) => root.querySelector(sel);

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    entered: "",
    attempts: 0,
    unlocked: false,
    audioStarted: false,
    micActive: false,
    candlesLit: true
  };

  /* ================================================================
     Screen router
     ================================================================ */

  const onEnter = {};   // id -> function, filled in below
  const onLeave = {};

  let currentScreen = "lock";

  function goTo(id) {
    const next = document.getElementById(id);
    if (!next) return;

    if (onLeave[currentScreen]) onLeave[currentScreen]();

    document.querySelectorAll(".screen").forEach(s => s.classList.remove("is-active"));
    next.classList.add("is-active");
    next.scrollTop = 0;
    window.scrollTo(0, 0);

    currentScreen = id;
    document.body.dataset.screen = id;      // lets CSS theme per screen

    if (onEnter[id]) onEnter[id]();
  }

  /* ================================================================
     Canvas effects  (#fx)
     ================================================================ */

  const cv  = $("#fx");
  const ctx = cv.getContext("2d");

  /* anniversary palette — mirrors the accent tokens in style.css */
  const PALETTE = ["#F2B441", "#F6EEDC", "#8B0000", "#FF7A6B", "#FFD700"];
  const MAX_PARTICLES = 400;

  let particles = [];
  let running = false;

  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width  = Math.floor(window.innerWidth  * dpr);
    cv.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // resizing resets the transform
  }

  sizeCanvas();
  window.addEventListener("resize", sizeCanvas);

  function push(list) {
    particles.push(...list);
    if (particles.length > MAX_PARTICLES) {
      particles.splice(0, particles.length - MAX_PARTICLES);   // oldest first
    }
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  /* Confetti — fountains up from a point, then falls under gravity. */
  function burst(count, ox, oy) {
    const n = REDUCED ? 40 : count;
    const x = ox ?? window.innerWidth / 2;
    const y = oy ?? window.innerHeight / 2;
    const out = [];

    for (let i = 0; i < n; i++) {
      out.push({
        kind: "confetti",
        x, y,
        vx: rand(-6.5, 6.5),
        vy: rand(-20, -5),
        w: rand(6, 11),
        h: rand(8, 15),
        rot: rand(0, Math.PI * 2),
        spin: rand(-0.24, 0.24),
        color: pick(PALETTE),
        round: Math.random() < 0.3,
        life: 1
      });
    }
    push(out);
  }

  /* Fireworks — a radial shell that fades out, leaving trails. */
  function firework(ox, oy) {
    const n = REDUCED ? 40 : 70;
    const x = ox ?? rand(0.12, 0.88) * window.innerWidth;
    const y = oy ?? rand(0.15, 0.55) * window.innerHeight;
    const color = pick(PALETTE);
    const out = [];

    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      out.push({
        kind: "spark",
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: rand(2.5, 4.5),
        h: rand(2.5, 4.5),
        rot: 0,
        spin: 0,
        color,
        round: true,
        life: 1
      });
    }
    push(out);
  }

  function loop() {
    const W = window.innerWidth;
    const H = window.innerHeight;

    const hasSparks = particles.some(p => p.kind === "spark");

    if (hasSparks) {
      /* Trails: erase a little of the previous frame instead of clearing it.
         (`destination-out` rather than painting black, so the page behind
         the overlay canvas never darkens.) */
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else {
      ctx.clearRect(0, 0, W, H);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      if (p.kind === "confetti") {
        p.vy += 0.32;
        p.vx *= 0.995;
        p.rot += p.spin;
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > H + 60) { particles.splice(i, 1); continue; }
      } else {
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.vy += 0.06;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.012;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
      }

      ctx.save();
      ctx.globalAlpha = p.kind === "spark" ? Math.max(p.life, 0) : 1;
      ctx.translate(p.x, p.y);
      if (p.rot) ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }

    if (particles.length) {
      requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, W, H);
      running = false;
    }
  }

  /* ================================================================
     Audio
     ================================================================ */

  const audio    = $("#song");
  const mutePill = $("#mute");
  let audioCtx = null;

  if (CFG.song) {
    audio.src = CFG.song;
    audio.volume = 0.4;
    $("#mute-label").textContent = CFG.songTitle || "music";
  }

  /* Called from the first keypad tap — never on load. Browsers block
     autoplay, and iOS needs a gesture before an AudioContext will run. */
  function startAudio() {
    if (state.audioStarted) return;
    state.audioStarted = true;

    if (CFG.song) {
      audio.play().catch(() => { /* blocked; nothing we can do, stay quiet */ });
    }
    ensureAudioContext();
  }

  function ensureAudioContext() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    return audioCtx;
  }

  function showMutePill() {
    if (!CFG.song) return;
    mutePill.hidden = false;
  }

  mutePill.addEventListener("click", () => {
    audio.muted = !audio.muted;
    mutePill.classList.toggle("muted", audio.muted);
    mutePill.setAttribute("aria-pressed", String(audio.muted));
  });

  function rampVolume(to = 1, ms = 2000) {
    if (!CFG.song) return;
    const steps = 20;
    const from = audio.volume;
    let i = 0;
    const id = setInterval(() => {
      i++;
      audio.volume = Math.min(1, Math.max(0, from + (to - from) * (i / steps)));
      if (i >= steps) clearInterval(id);
    }, ms / steps);
  }

  /* ================================================================
     Content — every string comes from config.js
     ================================================================ */

  function renderContent() {
    const name = CFG.name || "";

    /* --- lock: polaroid --- */
    const polaroid = $(".polaroid");
    if (CFG.polaroid) {
      const img = $("#polaroid-img");
      img.src = CFG.polaroid;
      img.alt = CFG.polaroidCaption || (name ? `A photo of ${name}` : "A photo");
    } else {
      polaroid.remove();
    }

    const cap = $("#polaroid-caption");
    if (cap) {
      if (CFG.polaroidCaption) cap.textContent = CFG.polaroidCaption;
      else cap.remove();
    }

    /* --- lock: screen-reader status inside the live region --- */
    srStatus = document.createElement("span");
    srStatus.className = "sr-only";
    $("#dots").appendChild(srStatus);
    announceDots();

    /* --- reveal --- */
    $("#reveal-code").textContent = CFG.passcodeDisplay || "";

    /* --- envelope --- */
    $("#env-name").textContent = name;
    const note = $("#env-note");
    if (CFG.envelopeNote) note.textContent = CFG.envelopeNote;
    else note.remove();

    /* --- hero --- */
    const eyebrow = $("#hero-eyebrow");
    const eyebrowText = (CFG.passcodeDisplay || "").replace(/[\/\-.]/g, "·");
    if (eyebrowText.trim()) eyebrow.textContent = eyebrowText;
    else eyebrow.remove();

    $("#hero-title").textContent = name ? `Happy Anniversary ${name}!` : "Happy Anniversary!";

    const heroLines = $("#hero-lines");
    if (Array.isArray(CFG.heroLines) && CFG.heroLines.length) {
      CFG.heroLines.slice(0, 2).forEach(line => {
        const div = document.createElement("div");
        div.textContent = line;
        heroLines.appendChild(div);
      });
    } else {
      heroLines.remove();
    }

    if (CFG.heroPhoto) {
      $("#hero").style.setProperty("--hero-img", `url("${CFG.heroPhoto}")`);
    }

    /* --- letter --- */
    const body = $("#letter-body");
    (CFG.letter || "")
      .trim()
      .split(/\n\s*\n/)
      .forEach(chunk => {
        const p = document.createElement("p");
        p.textContent = chunk.replace(/\s*\n\s*/g, " ").trim();
        if (p.textContent) body.appendChild(p);
      });

    const signoff = $("#letter-signoff");
    if (CFG.signoff) signoff.textContent = CFG.signoff;
    else signoff.remove();

    const strip = $("#photo-strip");
    const photos = Array.isArray(CFG.photos) ? CFG.photos.filter(Boolean) : [];
    if (photos.length) {
      photos.forEach((src, i) => {
        const img = document.createElement("img");
        img.src = src;
        /* deliberately NOT lazy — preloadPhotos() already warmed these during
           the lock screen, so they should paint instantly, not pop in */
        img.alt = (CFG.photoAlts && CFG.photoAlts[i])
          || (name ? `A memory with ${name}` : "A memory");
        strip.appendChild(img);
      });
    } else {
      strip.remove();
    }

    /* --- wish: build the candles --- */
    const holder = $("#candles");
    const count = Math.max(1, Number(CFG.candles) || 3);
    for (let i = 0; i < count; i++) {
      const candle = document.createElement("div");
      candle.className = "candle";
      candle.innerHTML =
        '<b class="wick"></b>' +
        '<span class="flame"></span>' +
        '<span class="smoke s1"></span>' +
        '<span class="smoke s2"></span>' +
        '<span class="smoke s3"></span>';
      /* stagger the flicker so they don't pulse in unison */
      candle.querySelector(".flame").style.animationDelay = `${(i * 0.23).toFixed(2)}s`;
      holder.appendChild(candle);
    }
  }

  /* Hidden hero and letter photos get fetched while the passcode is being
     typed — roughly 20 seconds of free loading time. */
  function preloadPhotos() {
    [CFG.heroPhoto, ...(CFG.photos || [])]
      .filter(Boolean)
      .forEach(src => { const img = new Image(); img.src = src; });
  }

  /* ================================================================
     Screen 1 — passcode lock
     ================================================================ */

  const keypad  = $("#keypad");
  const dotsRow = $("#dots");
  const dots    = Array.from(document.querySelectorAll("#dots .dot"));
  const hintEl  = $("#hint");

  let srStatus = null;
  let checking = false;

  const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "·", "0", "⌫"];

  function buildKeypad() {
    KEYS.forEach(k => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "key" + (k === "·" ? " is-dot" : "");
      b.textContent = k;
      b.dataset.key = k;

      if (k === "⌫")      b.setAttribute("aria-label", "Delete last digit");
      else if (k === "·") b.setAttribute("aria-label", "Decorative key, no action");
      else                     b.setAttribute("aria-label", `Digit ${k}`);

      keypad.appendChild(b);
    });

    keypad.addEventListener("click", e => {
      const b = e.target.closest(".key");
      if (!b) return;
      startAudio();                       // first tap starts the music
      handleKey(b.dataset.key);
    });
  }

  function announceDots() {
    if (srStatus) srStatus.textContent = `${state.entered.length} of 8 digits entered`;
  }

  function paintDots() {
    dots.forEach((d, i) => d.classList.toggle("filled", i < state.entered.length));
    announceDots();
  }

  function handleKey(k) {
    if (checking || state.unlocked) return;

    if (k === "⌫") {
      state.entered = state.entered.slice(0, -1);
      paintDots();
      return;
    }
    if (k === "·") return;           // decorative, does nothing
    if (!/^[0-9]$/.test(k)) return;

    if (state.entered.length >= 8) return;
    state.entered += k;
    paintDots();

    if (state.entered.length === 8) submit();
  }

  function submit() {
    checking = true;
    /* short pause so the sixth indicator is visibly filled before judgement */
    setTimeout(() => {
      checking = false;
      if (state.entered === String(CFG.passcode)) unlock();
      else fail();
    }, 250);
  }

  function unlock() {
    state.unlocked = true;
    keypad.classList.add("fade-out");     // 400ms fade, runs alongside the swap
    showMutePill();
    goTo("reveal");
  }

  function fail() {
    state.attempts++;

    dotsRow.classList.add("shake");
    setTimeout(() => dotsRow.classList.remove("shake"), 500);

    state.entered = "";
    paintDots();

    if (state.attempts >= 3 && CFG.hint) {
      hintEl.hidden = false;
      hintEl.textContent = CFG.hint;
      requestAnimationFrame(() => hintEl.classList.add("show"));
    }
  }

  /* Physical keyboard mirrors the keypad. */
  window.addEventListener("keydown", e => {
    if (currentScreen !== "lock" || state.unlocked) return;

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      startAudio();
      handleKey(e.key);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      handleKey("⌫");
    } else if (e.key === "Enter" && state.entered.length === 8 && !checking) {
      e.preventDefault();
      submit();
    }
  });

  /* ================================================================
     Screen 2 — unlock reveal
     ================================================================ */

  const revealEl = $("#reveal");
  let revealTimers = [];

  function clearRevealTimers() {
    revealTimers.forEach(clearTimeout);
    revealTimers = [];
  }

  onEnter.reveal = () => {
    burst(180);
    revealTimers.push(setTimeout(() => burst(90), 500));
    revealTimers.push(setTimeout(() => goTo("envelope"), 2600));
  };

  onLeave.reveal = clearRevealTimers;

  revealEl.addEventListener("click", () => {
    if (currentScreen !== "reveal") return;
    goTo("envelope");                     // clicking skips the wait
  });

  /* ================================================================
     Screen 3 — envelope
     ================================================================ */

  const env = $("#env");
  const seal = $("#seal");
  let envTimers = [];

  onEnter.envelope = () => {
    env.classList.remove("open", "slide");
    seal.disabled = false;
  };

  onLeave.envelope = () => {
    envTimers.forEach(clearTimeout);
    envTimers = [];
  };

  seal.addEventListener("click", () => {
    if (seal.disabled) return;
    seal.disabled = true;
    env.classList.add("open");                                        // flap swings
    envTimers.push(setTimeout(() => env.classList.add("slide"), 700)); // card rises
    envTimers.push(setTimeout(() => goTo("hero"), 1400));
  });

  /* ================================================================
     Screen 4 — hero + letter
     ================================================================ */

  $("#to-letter").addEventListener("click", () => goTo("letter"));
  $("#to-wish").addEventListener("click", () => goTo("wish"));

  /* ================================================================
     Screen 5 — make a wish
     ================================================================ */

  const glow      = $("#glow");
  const blowBtn   = $("#blow-btn");
  const relight   = $("#relight");
  const prompt    = $("#wish-prompt");
  const candlesEl = $("#candles");

  /* Blow detection. 55 is the absolute floor from the spec, but a bare
     threshold fires on room noise — on a laptop with automatic gain the
     idle spectrum can already average 50+. So we listen for ~900 ms first,
     take the median as this room's noise floor, and demand a real jump
     above it. Whichever bar is higher wins. */
  const MIC_THRESHOLD   = 55;   // absolute minimum to ever count as a blow
  const MIC_MARGIN      = 28;   // ...and this much above the room's own floor
  const MIC_FRAMES      = 4;    // consecutive frames over the bar (~65 ms)
  const MIC_CALIBRATE   = 48;   // frames of listening before arming (~800 ms)
  const MIC_TIMEOUT     = 8000; // no permission by now -> show the button

  let micStream = null;
  let micToken = 0;
  let fireworksTimer = null;
  let wishTimers = [];

  onEnter.wish = () => {
    relight.hidden = true;
    setupBlow();
  };

  onLeave.wish = () => {
    stopMic();
    stopFireworks();
    document.body.classList.remove("celebrate");
    wishTimers.forEach(clearTimeout);
    wishTimers = [];
  };

  function setupBlow() {
    if (!state.candlesLit) return;

    if (CFG.blowMode === "click") {
      showBlowButton("Blow out the candles");
      prompt.textContent = "Tap the button below";
      prompt.classList.remove("gone");
      return;
    }

    prompt.textContent = "Blow into your microphone…";
    prompt.classList.remove("gone");
    startMic();
  }

  function showBlowButton(label) {
    blowBtn.textContent = label;
    blowBtn.hidden = false;
  }

  async function startMic() {
    const token = ++micToken;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return micFallback();
    }

    /* If the prompt is ignored, quietly offer the button instead. */
    const timeout = setTimeout(() => {
      if (token === micToken && !state.micActive) micFallback();
    }, MIC_TIMEOUT);

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      clearTimeout(timeout);
      return micFallback();          // denied or unavailable — say nothing
    }

    clearTimeout(timeout);

    if (token !== micToken || !state.candlesLit) {
      stream.getTracks().forEach(t => t.stop());
      return;
    }

    const ac = ensureAudioContext();
    if (!ac) {
      stream.getTracks().forEach(t => t.stop());
      return micFallback();
    }

    micStream = stream;
    state.micActive = true;

    const analyser = ac.createAnalyser();
    analyser.fftSize = 512;
    ac.createMediaStreamSource(stream).connect(analyser);

    const buf = new Uint8Array(analyser.frequencyBinCount);
    const calibration = [];
    let bar = null;
    let hits = 0;

    (function listen() {
      if (token !== micToken || !state.candlesLit) return;

      analyser.getByteFrequencyData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i];
      const avg = sum / buf.length;

      /* Counted in frames, not milliseconds: rAF pauses while the tab is
         hidden but the clock doesn't, and a time-based window could arm
         itself on two stale samples. */
      if (calibration.length < MIC_CALIBRATE) {
        calibration.push(avg);                    // still learning the room
        return requestAnimationFrame(listen);
      }

      if (bar === null) {
        calibration.sort((a, b) => a - b);
        const floor = calibration[Math.floor(calibration.length / 2)] || 0;
        bar = Math.max(MIC_THRESHOLD, floor + MIC_MARGIN);
      }

      hits = avg > bar ? hits + 1 : 0;            // a cough or door slam won't hold
      if (hits >= MIC_FRAMES) return extinguish();

      requestAnimationFrame(listen);
    })();
  }

  function micFallback() {
    showBlowButton("Blow out the candles");
    prompt.textContent = "Blow into your mic, or tap below";
  }

  function stopMic() {
    micToken++;
    state.micActive = false;
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      micStream = null;
    }
  }

  blowBtn.addEventListener("click", extinguish);

  function extinguish() {
    if (!state.candlesLit) return;
    state.candlesLit = false;

    stopMic();

    blowBtn.hidden = true;
    prompt.classList.add("gone");
    glow.classList.add("out");
    candlesEl.querySelectorAll(".candle").forEach(c => c.classList.add("out"));

    wishTimers.push(setTimeout(() => {
      document.body.classList.add("celebrate");   // night -> red, 900ms
      firework();
      startFireworks();
    }, 900));

    wishTimers.push(setTimeout(() => rampVolume(1, 2000), 1200));
    wishTimers.push(setTimeout(() => { relight.hidden = false; }, 2200));
  }

  function startFireworks() {
    stopFireworks();
    fireworksTimer = setInterval(firework, 700);
  }

  function stopFireworks() {
    if (fireworksTimer) { clearInterval(fireworksTimer); fireworksTimer = null; }
  }

  relight.addEventListener("click", () => {
    stopFireworks();
    wishTimers.forEach(clearTimeout);
    wishTimers = [];

    document.body.classList.remove("celebrate");
    glow.classList.remove("out");
    candlesEl.querySelectorAll(".candle").forEach(c => c.classList.remove("out"));

    state.candlesLit = true;
    relight.hidden = true;
    if (CFG.song) rampVolume(0.4, 600);

    setupBlow();
  });

  /* ================================================================
     Boot
     ================================================================ */

  renderContent();
  buildKeypad();
  preloadPhotos();

  document.body.dataset.screen = "lock";
})();
