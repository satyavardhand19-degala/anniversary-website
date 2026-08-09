# Scope — Anniversary Surprise

**Version:** 1.0
**Status:** Draft for approval
**Owner:** _you_

---

## 1. Purpose

Build a personal, single-recipient anniversary gift website for a family member or a friend.
One person opens a link, moves through a short sequence of screens, and ends on a
celebration moment. The site is a gift, not a product — success is measured by the
recipient's reaction, not by metrics.

The register is warm and familiar, not romantic: the letter can be signed by a whole group,
and the decorative language throughout is party (balloons, confetti, cake), never courtship.

---

## 2. Goals

- Deliver a five-screen experience that runs start to finish in under three minutes.
- Make the personal content (name, date, letter, photos) editable in one file.
- Run on a laptop and on a phone without a separate build.
- Ship as static files that can be hosted free and shared as a single link.

---

## 3. In scope

### Screens

| # | Screen | Core interaction |
| --- | --- | --- |
| 1 | Passcode lock | Numeric keypad, 6-digit entry, shake on wrong code |
| 2 | Unlock reveal | Date animates in with a confetti burst |
| 3 | Envelope card | Click the wax seal, flap swings open |
| 4a | Photo hero | Full-bleed image, headline, "Read your letter" button |
| 4b | Letter | Handwritten note plus a 3-photo strip |
| 5 | Make a wish | Cake with lit candles, blow them out, fireworks |

### Features

- Client-side passcode gate with a configurable 6-digit code.
- Canvas confetti and fireworks, hand-written, no third-party library.
- CSS envelope with an animated opening flap and wax seal.
- CSS cake with flickering candle flames.
- Candle extinguish via microphone volume detection, with a click button as fallback.
- Background music that starts on first user interaction, with a mute control.
- Responsive layout down to a 360 px viewport.
- Reduced-motion support: animations shortened or removed when the OS requests it.
- Single `config.js` holding all personal content.

### Deliverables

- `index.html`, `style.css`, `script.js`, `config.js`
- `assets/` folder with placeholder images and audio
- `README.md` (setup and customization)
- `SPECIFICATION.md` (technical detail)
- A deployed link on Netlify or GitHub Pages

---

## 4. Out of scope

These are deliberately excluded. Adding any of them changes the timeline.

- **Any backend.** No server, no database, no API, no environment variables.
- **Real authentication.** The passcode is theatre. Nothing private goes behind it.
- **User accounts, admin panel, or a CMS.** Content is edited by changing `config.js`.
- **Multiple recipients or reusable templates.** One name, one code, one letter.
- **Analytics or tracking of any kind.**
- **Uploading photos through the browser.** Images are placed in `assets/` manually.
- **Video playback, guest books, RSVP, or comment features.**
- **Internet Explorer and browsers older than roughly 2021.**
- **Server-rendered SEO, sitemap, or social preview optimization.** The link goes to one
  person; it should not be discoverable.
- **Automated tests.** Verification is manual against the acceptance criteria.

---

## 5. Assumptions

- The recipient opens the link on a modern Chrome, Safari, Edge, or Firefox browser.
- The passcode will be told to them separately, or guessable from the hint.
- Photos are supplied as JPG or PNG and compressed before being added.
- The music file is owned or licensed by whoever ships it. A private, unlisted link is
  still a public URL — assume anyone with the link can open it.
- Total asset weight stays under 8 MB so the site loads on mobile data.

---

## 6. Phases

| Phase | Work | Rough effort |
| --- | --- | --- |
| 1 | Project skeleton, theme tokens, screen router | 1–2 h |
| 2 | Passcode lock and unlock reveal | 2 h |
| 3 | Envelope and seal animation | 1–2 h |
| 4 | Photo hero and letter page | 2 h |
| 5 | Cake, candles, mic detection, fireworks | 2–3 h |
| 6 | Audio, responsive pass, reduced motion | 1–2 h |
| 7 | Content swap, compression, deploy | 1 h |

Roughly 10–14 hours of focused work for someone comfortable with HTML, CSS, and JS.
One long night is realistic if you already have the photos ready.

---

## 7. Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Recipient denies microphone access | The centerpiece moment doesn't fire | Automatic fallback to a click button |
| Autoplay blocked, music never starts | Loses atmosphere | Start audio on the first keypad tap |
| Large photos stall the reveal | Animation stutters on mobile | Compress to under 300 KB; preload during the lock screen |
| Recipient opens it on an old phone | Layout or canvas breaks | Test on one real device before sending |
| They forget or mistype the passcode | They're locked out of their own gift | Show the hint after three failed attempts |
| Fonts fail to load offline | Falls back to system serif | Accept it, or self-host the two font files |

---

## 8. Definition of done

- All five screens reachable in sequence, no dead ends.
- Correct passcode advances; wrong passcode shakes and clears.
- Envelope, candles, confetti, and fireworks all animate without console errors.
- Works on one real phone and one laptop.
- All personal content lives in `config.js` — no names or dates hardcoded elsewhere.
- Deployed to a live HTTPS URL and opened successfully from a device that never ran it locally.
