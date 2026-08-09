# Specification — Anniversary Surprise

**Version:** 1.0
**Companion documents:** `README.md`, `SCOPE.md`

---

## 1. Architecture

A single HTML document holds every screen as a `<section class="screen">`. Exactly one
section carries `.is-active` at a time; the rest are `display: none`. A small router in
`script.js` swaps that class. There are no page loads, no routes, and no history entries —
the whole experience is one document.

```
index.html
 └── main#stage
      ├── section#lock       .is-active on load
      ├── section#reveal
      ├── section#envelope
      ├── section#hero
      ├── section#letter
      └── section#wish
 canvas#fx        fixed overlay, z-index 90, pointer-events: none
 audio#song       hidden, loops
```

### 1.1 Screen router

```js
function goTo(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("is-active"));
  const next = document.getElementById(id);
  next.classList.add("is-active");
  next.scrollTop = 0;
  document.body.dataset.screen = id;   // lets CSS theme per screen
}
```

`document.body.dataset.screen` drives the background: deep grape for lock, envelope, and
letter; near-black for the wish screen; a lighter plum once the candles are out.

### 1.2 State

State is a single module-scoped object. There is no persistence — reloading restarts the
experience from the lock screen. Browser storage is deliberately not used.

```js
const state = {
  entered: "",        // digits typed so far
  attempts: 0,
  unlocked: false,
  audioStarted: false,
  micActive: false,
  candlesLit: true
};
```

---

## 2. Configuration contract

`config.js` defines one global. Every user-visible string and asset path comes from here.

| Key | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | yes | Recipient's name or nickname |
| `passcode` | string | yes | Exactly 6 digits, as a string, to preserve leading zeros |
| `passcodeDisplay` | string | yes | Formatted for the reveal, e.g. `"01/01/01"` |
| `hint` | string | no | Shown after 3 failed attempts |
| `polaroidCaption` | string | no | Handwritten caption under the lock-screen photo |
| `envelopeNote` | string | no | Small text under the envelope |
| `heroLines` | string[] | no | 1–2 lines under the hero headline |
| `letter` | string | yes | Template literal; blank lines become paragraphs |
| `signoff` | string | no | Rendered in script font at the letter's end |
| `photos` | string[] | no | 3 paths for the letter's photo strip |
| `candles` | number | no | Default 3 |
| `blowMode` | `"mic"` \| `"click"` | no | Default `"mic"` |
| `song` | string | no | Path to the audio file |

Missing optional keys must degrade silently — the element is not rendered, not left empty.

---

## 3. Design tokens

Declared once in `:root` in `style.css`.

```css
--plum-deep:  #241A3C;   /* page background */
--plum:       #55338C;   /* envelope body, headings on cream */
--plum-dark:  #3D2465;   /* envelope flap, second title line */
--lilac:      #C9A2E8;   /* keypad buttons, lower cake tier */
--teal:       #35C2A8;   /* accent */
--coral:      #FF7A6B;   /* ribbon bow, candle stripes, accent */
--cream:      #F6EEDC;   /* card and letter paper */
--gold:       #F2B441;   /* wax seal, eyebrow text, accents on dark */
--ink:        #2E2340;   /* letter body text */
--night:      #0B0714;   /* wish screen */
--flame-core: #FFF6C9;
--flame-mid:  #FFC24B;
--flame-tip:  #FF7A59;

--script: "Great Vibes", cursive;      /* headlines, captions */
--hand:   "Caveat", cursive;           /* letter body */
--ui:     "Instrument Sans", system-ui; /* keypad, buttons, labels */
```

Type scale uses `clamp()` throughout. No fixed pixel font sizes.

---

## 4. Screen specifications

### 4.1 Lock screen (`#lock`)

**Layout.** Two columns on viewports ≥ 900 px, stacked below that.

Left column: a polaroid — white frame, 14 px padding, 56 px bottom lip, rotated `-4deg`,
drop shadow. A decorative ribbon bow sits on the top-left corner. The caption below the
photo is in `--script`, gold.

Right column: a lock glyph, the label `ENTER A PASSCODE` (uppercase, `0.22em` letter
spacing, `--ui`), six indicator boxes, and a 4×3 keypad.

**Keypad.** Buttons `1`–`9`, then `·`, `0`, and `⌫`. Circular, 62 px diameter, background
`--lilac`, no border. Each is a real `<button>` with an `aria-label`.

**Behavior.**

1. A digit press appends to `state.entered` if length < 6, fills the next indicator dot,
   and starts the audio if it hasn't started.
2. `⌫` removes the last digit and empties that dot. `·` is decorative and does nothing.
3. At 6 digits, validate after a 250 ms delay so the last dot is visibly filled.
4. **Match:** set `state.unlocked = true`, fade the keypad out over 400 ms, call
   `goTo("reveal")`.
5. **No match:** increment `attempts`, run a 500 ms shake on the indicator row, clear
   `state.entered` and all dots. After 3 attempts, fade in `CONFIG.hint` beneath the keypad.

**Shake.**

```css
@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%     { transform: translateX(-9px); }
  40%     { transform: translateX(9px); }
  60%     { transform: translateX(-6px); }
  80%     { transform: translateX(3px); }
}
```

**Keyboard.** Number keys, Backspace, and Enter all work. Tab order runs 1 → 9 → · → 0 → ⌫.

**Preloading.** While this screen is up, create off-screen `Image` objects for the hero and
letter photos so later screens appear instantly.

---

### 4.2 Unlock reveal (`#reveal`)

Full-bleed `--plum-deep`. `CONFIG.passcodeDisplay` sits centered in `--ui` at
`clamp(2.4rem, 9vw, 5rem)`, cream, letter-spaced.

**Sequence.**

| Time | Event |
| --- | --- |
| 0 ms | Screen becomes active; text starts at `scale(0.6)`, `opacity: 0` |
| 0 ms | `burst(180)` fires on the canvas from the center |
| 0–600 ms | Text springs to `scale(1)`, `opacity: 1` — `cubic-bezier(.2,.8,.25,1)` |
| 500 ms | Second `burst(90)` |
| 2600 ms | Auto-advance to `#envelope` |

The auto-advance is cancelled if the user clicks, which advances immediately.

---

### 4.3 Envelope (`#envelope`)

A cream card, max-width 460 px, centered, `border-radius: 4px`, soft shadow, floating on
`--plum-deep` with a slow 6-second vertical bob.

Inside: `Happy Anniversary!` and `CONFIG.name` on two lines in `--script`, then the envelope,
then `CONFIG.envelopeNote` in small `--ui` text.

**Envelope construction.** A `--plum` rectangle at 3:2. The flap is a pseudo-element built
from borders:

```css
.flap {
  border-left:  115px solid transparent;
  border-right: 115px solid transparent;
  border-top:   78px solid #3D2465;
  transform-origin: top center;
  transition: transform .7s cubic-bezier(.34,1.3,.44,1);
}
.envelope.open .flap { transform: rotateX(180deg); }
```

The wax seal is a 46 px gold circle with an inset shadow and a star glyph, centered on the
flap's lower edge, `z-index` above it. It is the click target and must be a `<button>`.

**On click:** add `.open`, wait 700 ms for the flap, slide a letter card up out of the
envelope over 500 ms, then `goTo("hero")` at 1400 ms.

---

### 4.4 Photo hero (`#hero`)

Full-viewport background image, `object-fit: cover`, with a dark scrim so text stays
readable:

```css
background:
  linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.55)),
  url(assets/hero.jpg) center/cover;
```

Content is centered and vertically stacked:

1. Eyebrow — `01 · 01 · 01` in `--ui`, gold, `0.3em` letter spacing, small.
2. Headline — `Happy Anniversary {name}!` in `--script`, `clamp(2.6rem, 8vw, 5rem)`, cream.
3. `CONFIG.heroLines` in `--hand`, one per line, 85% opacity.
4. A ghost button: `READ YOUR LETTER`, 1.5 px cream border, fully rounded, transparent fill.

Each element fades and rises in with a 120 ms stagger. The button advances to `#letter`.

---

### 4.5 Letter (`#letter`)

Two columns on ≥ 900 px: the letter at `1.4fr`, the photo strip at `1fr`. Stacked below,
letter first.

**Paper.** `--cream` background, `--ink` text in `--hand` at `1.15rem` with `1.9` line
height. The torn edge is a repeating conic or zigzag gradient applied to the top and bottom
edges. Six doodled party balloons (`.doodle`) are absolutely positioned at roughly 6%, 33%,
and 72% down the left and right margins, rotated at different angles, `opacity: .5`. Each
balloon is one element: `::before` is the oval body, `::after` the curling string. The `.dN`
modifier sets `color`, which both pseudo-elements inherit via `currentColor`, cycling
`--plum`, `--coral`, `--teal` so the margins read as a party rather than a valentine.

Header: `HAPPY` in small letter-spaced `--ui` caps, then `Anniversary` in `--script` beneath it.

Body: `CONFIG.letter` split on blank lines into `<p>` elements. `CONFIG.signoff` renders
right-aligned in `--script`.

**Photo strip.** Three images stacked with a 12 px gap, each with a white 6 px frame and a
shadow, alternating rotation of `-1.5deg` and `1.5deg`.

**Footer.** A subtle pulsing line, `— tap here for a surprise —`, is the click target for
`goTo("wish")`. The whole letter section is scrollable; this sits at the bottom of the flow.

---

### 4.6 Make a wish (`#wish`)

Background snaps to `--night`. Everything else fades to nothing — this screen is
deliberately empty.

**Content.** `✨ Make a Wish ✨` in `--script`, cream, then the cake, centered.

**Cake.** Two CSS tiers, cream and rose, with scalloped frosting made from a repeating
radial gradient. `CONFIG.candles` candles sit on top: 10 px striped bars, each with a flame
child.

```css
.flame {
  width: 13px; height: 22px;
  background: radial-gradient(circle at 50% 78%,
    var(--flame-core) 0 18%, var(--flame-mid) 45%,
    var(--flame-tip) 78%, transparent 100%);
  border-radius: 50% 50% 46% 46% / 68% 68% 32% 32%;
  animation: flicker 1.15s ease-in-out infinite alternate;
}
```

Each flame gets a staggered `animation-delay` so they don't pulse in unison. A soft radial
glow sits behind the cake and fades out with the flames.

**Blow detection (`blowMode: "mic"`).**

```js
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const ctx = new AudioContext();
const analyser = ctx.createAnalyser();
analyser.fftSize = 512;
ctx.createMediaStreamSource(stream).connect(analyser);

const buf = new Uint8Array(analyser.frequencyBinCount);
function listen() {
  analyser.getByteFrequencyData(buf);
  const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
  if (avg > THRESHOLD) return extinguish();
  requestAnimationFrame(listen);
}
```

- `THRESHOLD` starts at 55 and should be tuned on a real device.
- The reading must exceed the threshold for 3 consecutive frames, so a cough or a door
  slam doesn't trigger it.
- If `getUserMedia` rejects, or no permission arrives within 8 seconds, render a
  `Blow out the candles` button instead and log nothing to the user.
- `blowMode: "click"` skips the mic path entirely.

**Extinguish sequence.**

| Time | Event |
| --- | --- |
| 0 ms | Flames scale to 0 and fade over 500 ms; flicker animation stops |
| 0 ms | Smoke wisps rise 52 px and fade over 1.6 s |
| 0 ms | Glow fades out; `state.candlesLit = false` |
| 900 ms | Background transitions `--night` → `--plum` over 900 ms |
| 900 ms | `firework()` starts, firing every 700 ms from random positions |
| 1200 ms | Music swells (volume ramps 0.4 → 1.0 over 2 s) |

Fireworks continue indefinitely. A quiet `Light them again` control resets the screen.

---

## 5. Canvas effects (`#fx`)

One fixed canvas, `pointer-events: none`, sized to the viewport and scaled by
`devicePixelRatio` on load and on resize. A single `requestAnimationFrame` loop drives both
effects and stops itself when the particle array empties.

**Particle shape.**

```js
{ x, y, vx, vy, w, h, rot, spin, color, round, life }
```

**Confetti.** 160–180 particles from the viewport center. `vx` in `[-6.5, 6.5]`,
`vy` in `[-20, -5]`, gravity `+0.32` per frame, `vx *= 0.995` for drag. 30% render as
circles, the rest as rectangles. Particles are removed once `y > height + 60`.

**Fireworks.** 70 particles from one origin, launched radially:

```js
const angle = Math.random() * Math.PI * 2;
const speed = 2 + Math.random() * 6;
vx = Math.cos(angle) * speed;
vy = Math.sin(angle) * speed;
```

Gravity `+0.06`, drag `0.97`, and `life` decrementing from 1 to 0 driving `globalAlpha`.
Trails come from painting `rgba(0,0,0,0.12)` over the canvas each frame rather than
clearing it.

**Palette.** `["#F2B441", "#F6EEDC", "#C9A2E8", "#35C2A8", "#FF7A6B"]` — gold, cream, lilac,
teal, coral, mirroring the accent tokens.

**Cap.** Hard limit of 400 live particles. New bursts drop the oldest first.

---

## 6. Audio

- One `<audio>` element, `loop`, `preload="auto"`, initial `volume = 0.4`.
- Started inside the first keypad `click` handler — never on load.
- The `play()` promise is caught; a rejection is ignored silently.
- A mute toggle sits fixed bottom-right on every screen after unlock: a small pill showing
  the track name, matching the toast in the reference video.
- Volume ramps to 1.0 during the extinguish sequence via a 20-step interval.

---

## 7. Responsive rules

| Breakpoint | Change |
| --- | --- |
| ≥ 900 px | Lock screen and letter are two columns |
| < 900 px | Both stack; polaroid above keypad, letter above photo strip |
| < 480 px | Keypad buttons drop to 54 px; hero headline uses the lower `clamp()` bound |
| Any | Cake is `width: min(280px, 78vw)` |

Use `100dvh`, not `100vh`, so mobile browser chrome doesn't clip the lock screen.

---

## 8. Accessibility

- All interactive elements are `<button>`; nothing relies on a `div` click handler.
- Visible focus ring: `outline: 3px solid var(--cream); outline-offset: 3px`.
- Keypad digits carry `aria-label`; the indicator row is `aria-live="polite"` announcing
  how many digits have been entered.
- Photos have real `alt` text drawn from config, not empty strings.
- Contrast: cream on `--plum-deep` is roughly 14:1, and `--plum` on `--cream` roughly 8:1.
  Gold is reserved for large or decorative text on dark ground, never for body copy and
  never on the white polaroid frame, where it falls under 2:1 — that caption uses `--plum`.
- `prefers-reduced-motion: reduce` cuts particle counts to 40, disables flicker and bob,
  removes the rise-in stagger, and collapses transitions to 0.01 ms.

---

## 9. Performance budget

| Item | Budget |
| --- | --- |
| Total page weight | ≤ 8 MB |
| Each photo | ≤ 300 KB |
| Audio | ≤ 4 MB |
| Time to interactive on 4G | ≤ 2.5 s |
| Animation frame rate | 60 fps on a mid-range 2021 phone |

Hero and letter photos are preloaded during the lock screen, which buys roughly 20 seconds
of loading time hidden behind the passcode entry.

---

## 10. Browser support

| Browser | Version | Notes |
| --- | --- | --- |
| Chrome / Edge | 90+ | Full support |
| Safari (macOS / iOS) | 15+ | AudioContext needs a user gesture; the keypad tap covers it |
| Firefox | 88+ | Full support |
| Samsung Internet | 15+ | Full support |

No Internet Explorer. No polyfills. No transpilation — modern syntax ships as written.

---

## 11. Acceptance criteria

1. Loading the site shows the lock screen with all six indicators empty.
2. Typing the correct code advances to the reveal within 500 ms of the sixth digit.
3. Typing a wrong code shakes the row, clears it, and stays on the lock screen.
4. After three failures, the hint appears.
5. The reveal shows the formatted date with confetti and auto-advances.
6. Clicking the wax seal opens the flap and advances to the hero.
7. "Read your letter" opens the letter with all three photos loaded.
8. The letter footer advances to the wish screen.
9. Candles are lit and flickering on arrival at the wish screen.
10. Blowing into the mic — or clicking the fallback button — extinguishes every flame,
    turns the background plum, and starts fireworks.
11. Music starts at the first keypad tap and can be muted.
12. Every screen is usable at 360 px wide with no horizontal scroll.
13. With reduced motion enabled, all screens remain reachable and readable.
14. No errors or warnings in the browser console at any point in the flow.
