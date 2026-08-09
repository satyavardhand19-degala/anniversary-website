/* ------------------------------------------------------------------
   config.js — the only file you need to edit.

   Every user-visible string and asset path in the site comes from here.
   Optional keys can be deleted entirely; the element simply won't render.

   This is a gift for a family member or a friend — a sibling, a cousin,
   a parent, your best mate. Nothing here assumes a romantic relationship;
   swap the copy below for the way you actually talk to them.
   ------------------------------------------------------------------ */

const CONFIG = {
  /* --- who it's for ------------------------------------------------ */
  name: "Amma & Nanna",            // <-- their name, or whatever you actually call them

  /* --- the gate ---------------------------------------------------- */
  passcode: "09082000",           // <-- exactly 8 digits, as a STRING (keeps leading zeros)
  passcodeDisplay: "09 / 08 / 2000", // <-- same date, formatted for the unlock burst
  hint: "The day you two said 'I do'. (DD/MM/YYYY or MM/DD/YYYY)",  // after 3 wrong attempts

  /* --- screen 1: the lock ------------------------------------------ */
  polaroid: "assets/polaroid.jpg",
  polaroidCaption: "Amma & Nanna",

  /* --- screen 3: the envelope -------------------------------------- */
  envelopeNote: "Click the seal to open your surprise",

  /* --- screen 4a: the hero ----------------------------------------- */
  heroPhoto: "assets/hero.jpg",
  heroLines: [
    "Another beautiful year together.",
    "A love that built our entire family."
  ],

  /* --- screen 4b: the letter --------------------------------------- */
  /* Written as "we" — it's from the group. If it's just from you, swap
     every "we" for "I" and it still reads fine. */
  letter: `To the two who started it all,

Happy anniversary! We wanted to put together a grand speech, but we knew you’d both probably just tease us for being too soft, so here is the honest, heartfelt version instead.

Thank you for showing us what real love, commitment, and partnership actually look like. For the years of laughter, the compromises, the inside jokes, and the quiet moments of support that have built our family's foundation. Thank you for always being our home.

We don't say it nearly enough, but we are incredibly proud of the life you have built together. Seeing the way you still laugh at each other's jokes and stand side-by-side through everything is the greatest gift you could have given us.

Now go make a wish, before we all get too sentimental!`,

  signoff: "with all our love.",

  photos: [
    "assets/memory-1.jpg",
    "assets/memory-2.jpg",
    "assets/memory-3.jpg"
  ],
  photoAlts: [
    "A favourite photo of Amma and Nanna",
    "Another beautiful memory together",
    "Celebrating the two of you"
  ],

  /* --- screen 5: the wish ------------------------------------------ */
  candles: 3,
  blowMode: "mic",              // "mic" (with automatic click fallback) or "click"

  /* --- sound ------------------------------------------------------- */
  song: "assets/song.mp3",
  songTitle: "anniversary song"    // shown on the little mute pill
};
