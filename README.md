# Anniversary Surprise

A single-page, five-screen wedding anniversary gift site for your parents (mother and father). The recipients unlock it with a passcode (such as their anniversary date), open a sealed envelope, read a touching letter with photos, and blow out the candles on a cake.

Nothing in it assumes a commercial relationship. The tone is warm, loving, and deeply personal—the one you'd use with family.

Built with plain HTML, CSS, and JavaScript. No framework, no build step, no backend.

---

## Quick start

1. Download or clone this folder.
2. Open it in VS Code.
3. Install the **Live Server** extension.
4. Right-click `index.html` → **Open with Live Server**.
5. The site runs at `http://127.0.0.1:5500`.

Live Server (or any local server) matters for two reasons: the microphone API only works on
`localhost` or HTTPS, and audio files can fail to load from a raw `file://` path.

If you don't want to install anything, run this in the project folder instead:

```bash
python3 -m http.server 5500
```

---

## Folder structure

```
anniversary-surprise/
├── index.html          All five screens as <section> elements
├── style.css           Theme tokens, screen layouts, animations
├── script.js           Screen router, passcode, canvas effects, audio
├── config.js           ← EDIT THIS. Name, passcode, letter text, photos
└── assets/
    ├── polaroid.jpg    Lock screen photo
    ├── hero.jpg        Full-bleed photo behind the anniversary headline
    ├── memory-1.jpg    Photo strip on the letter page
    ├── memory-2.jpg
    ├── memory-3.jpg
    └── song.mp3        Plays from the unlock onward
```

---

## Customizing it

Everything personal lives in `config.js`. You should not need to touch the other files.

```js
const CONFIG = {
  name: "Mom & Dad",
  passcode: "010101",          // 6 digits — their wedding date or a special anniversary date
  passcodeDisplay: "01/01/01", // shown in the unlock burst
  hint: "The day you two said 'I do'. (DD/MM/YY or MM/DD/YY)",
  envelopeNote: "Click the seal to open your surprise",
  letter: `To the two who started it all, happy anniversary...`,
  signoff: "with all our love.",
  candles: 3,
  blowMode: "mic"              // "mic" or "click"
};
```

The shipped letter is written as **we**, as if it comes from the kids/family. If it's from
you alone, swap every "we" for "I" — it reads the same. `signoff` is the one line rendered
in the big script font, so keep it short: `with all our love.`, `your favourite children.`,
`— the family.`

**Photos.** Drop your own images into `assets/` using the same filenames. Compress them
first — anything over ~300 KB each will make the reveal stutter on a phone.
[Squoosh](https://squoosh.app) does this in the browser for free.

The images that ship in `assets/` are generated placeholders that say so on their face.
Swap all five before you send the link.

**Music.** Replace `assets/song.mp3`. Keep it under about 4 MB so the page loads fast on
mobile data. The file in the repo is 30 seconds of valid but completely **silent** audio —
it exists so the page loads without a 404, not as a soundtrack.

**Colors and fonts.** All defined as CSS custom properties at the top of `style.css`
(`--plum-deep`, `--plum`, `--lilac`, `--teal`, `--coral`, `--cream`, `--gold`, `--script`,
`--hand`). Change them in one place. The confetti and firework colors are a matching array
`PALETTE` near the top of `script.js` — canvas can't read CSS variables, so if you
retheme the tokens, update that array too.

---

## Deploying

**Netlify Drop** — go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag the
project folder onto the page. You get a live HTTPS link in about ten seconds.

**GitHub Pages** — push the folder to a repo, then Settings → Pages → deploy from `main`,
root folder.

Either works. Both give you HTTPS, which the microphone feature requires.

---

## Known constraints

**The passcode is not security.** Anyone who opens DevTools can read it. It exists to build
anticipation, not to protect anything. Don't put anything private behind it.

**Music can't autoplay.** Browsers block audio until the user interacts with the page. The
song is wired to start on the first keypad tap, which is the first interaction anyway.

**The microphone needs permission.** On first use the browser shows a prompt. If the
recipients deny it — or don't answer within 8 seconds — the site falls back to a
"Blow out the candles" button automatically. Set `blowMode: "click"` if you'd rather skip
the prompt entirely.

**Blow detection calibrates itself.** A fixed volume threshold is unreliable: on a laptop
with automatic gain control, an idle room can already read above it, and the candles blow
themselves out the moment the screen loads. So the site listens for its first 48 frames
(~0.8 s), takes the median as that room's noise floor, and only fires on a reading that
clears both `MIC_THRESHOLD` (55) and `noise floor + MIC_MARGIN` (28). Both constants are at
the top of the wish-screen section in `script.js` if you need to tune them — lower
`MIC_MARGIN` if blowing doesn't register, raise it if the candles go out on their own.

**iOS Safari** requires a user gesture before it will start the audio context used for
mic detection. The keypad tap covers this.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Photos don't appear | Filename or extension mismatch | Check names in `assets/` match `config.js` exactly, including case |
| Music never plays | Page opened as `file://` | Use Live Server or a local HTTP server |
| Mic does nothing | Not on localhost or HTTPS | Deploy to Netlify, or set `blowMode: "click"` |
| Confetti looks jagged | Canvas not scaled for the display | Confirm `devicePixelRatio` scaling is intact in `script.js` |
| Layout breaks on phone | Fixed pixel widths added | Use the existing `clamp()` values rather than fixed `px` |
| Candles blow out by themselves | Noisy room, or mic gain set high | Raise `MIC_MARGIN` in `script.js` |
| Blowing does nothing | Mic gain set low | Lower `MIC_MARGIN`, or set `blowMode: "click"` |
| Nothing on screen but the keypad | `config.js` failed to parse | Check the console — a syntax error there leaves every screen blank |

---

## Credits

Fonts from Google Fonts: Great Vibes (script), Caveat (handwriting), Instrument Sans (UI).
Confetti, fireworks, envelope, and cake are hand-written CSS and canvas — no libraries.
