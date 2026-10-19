// store.js — The permanent Hall of Fame deck
//
// Every fake caption the table inducts lands here and stays, game night after game night.
// Expert Mode deals its real answers from this deck.
//   DATA_DIR set:  kept in DATA_DIR/hall-of-fame.json (loaded at start, saved after each add)
//   otherwise:     memory only — the deck is gone when the server restarts
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MAX_ENTRIES = 5000;
const DIR = process.env.DATA_DIR || '';
const FILE = DIR ? path.join(DIR, 'hall-of-fame.json') : null;

const norm = (t) => String(t || '').toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '').replace(/ +/g, ' ').trim();
// Captions pulled from The Gallery for good (Nate's "he he" was a test of Frame It, not a real frame)
const RETIRED = [{ author: 'nate', caption: /^(he ?)+$/ }];
const isRetired = (e) => RETIRED.some(r => String(e.author || '').trim().toLowerCase() === r.author && r.caption.test(norm(e.caption)));
const keyOf = (e) => e.cartoonId + '|' + norm(e.caption);
const MONTH = (ms) => new Date(ms).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/New_York' });
const str = (v, max) => String(v === undefined || v === null ? '' : v).slice(0, max);

// Server stamps: every caption this server frames gets a stamp (a keyed fingerprint) that phones keep with it.
// Gallery games only ever deal a real answer whose stamp checks out, so a phone can't slip in a caption of its own.
// Set GALLERY_SECRET (Render: Environment) so stamps survive a restart; without it they last until the next restart.
const SECRET = process.env.GALLERY_SECRET || crypto.randomBytes(32).toString('hex');
const STAMP_LASTS = !!process.env.GALLERY_SECRET;
const stampOf = (e) => crypto.createHmac('sha256', SECRET).update(Number(e.cartoonId) + '|' + norm(e.caption) + '|' + String(e.author || '').trim().toLowerCase()).digest('base64url').slice(0, 32);
function isStamped(e) {
  if (!e || typeof e.sig !== 'string' || e.sig.length !== 32) return false;
  const a = Buffer.from(e.sig), b = Buffer.from(stampOf(e));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
// A deck: the server keeps one (saved to DATA_DIR if set), and every room gets its own,
// filled from the phones at the table and from what the table frames tonight.
function createDeck(FILE = null, quiet = true) {
  let entries = [];            // oldest first
  let keys = new Set();        // cartoonId|normalised caption, for spotting duplicates
  let authorCache = null;      // lowercase author -> entries, rebuilt after a change
  let cartoonCache = null;     // cartoonId -> Map(lowercase author -> entries) — stamped entries only
  const trusted = new WeakSet(); // entries whose server stamp checked out (worked out once, when they come in)
  const vet = (e) => { if (isStamped(e)) trusted.add(e); return e; };

  const newId = () => { let id; do id = crypto.randomBytes(6).toString('base64url'); while (entries.some(e => e.id === id)); return id; };

  // Only well-formed entries get in (from the file or from a game)
  function clean(e) {
    if (!e || typeof e !== 'object') return null;
    const cartoonId = Number(e.cartoonId), caption = str(e.caption, 300).trim();
    if (!Number.isInteger(cartoonId) || !caption) return null;
    if (isRetired({ caption, author: e.author })) return null;
    const at = Number.isFinite(Number(e.at)) && Number(e.at) > 0 ? Number(e.at) : Date.now();
    return {
      id: typeof e.id === 'string' && e.id ? e.id.slice(0, 24) : newId(),
      cartoonId,
      image: str(e.image, 100),
      caption,
      author: str(e.author, 40),
      flaggers: Array.isArray(e.flaggers) ? e.flaggers.slice(0, 8).map(n => str(n, 40)) : [],
      flags: Number.isInteger(Number(e.flags)) && Number(e.flags) >= 0 ? Number(e.flags) : 0,
      month: typeof e.month === 'string' && e.month ? e.month.slice(0, 40) : MONTH(at),
      at,
      ...(typeof e.best === 'string' && e.best ? { best: e.best.slice(0, 60) } : {}),
      ...(typeof e.sig === 'string' && e.sig ? { sig: e.sig.slice(0, 32) } : {}),
    };
  }

  let version = 0;   // goes up on every change (callers cache what they work out from the deck)
  function changed() { authorCache = null; cartoonCache = null; version++; }

  function load() {
    if (!FILE) { if (!quiet) console.log('  The Gallery (server copy): memory only — phones carry the Gallery between nights.'); return; }
    if (!FILE && !quiet) { console.log('  Hall of Fame: memory only (set DATA_DIR to keep it) — it resets when the server restarts.'); return; }
    try { fs.mkdirSync(DIR, { recursive: true }); } catch (e) { console.warn('  Hall of Fame: could not make', DIR, e.message); }
    let raw;
    try { raw = fs.readFileSync(FILE, 'utf8'); }
    catch (e) { console.warn(`  Hall of Fame: no file at ${FILE} yet — starting empty.`); return; }
    try {
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) throw new Error('not a list');
      for (const x of list) { const e = clean(x); if (e && !keys.has(keyOf(e))) { entries.push(vet(e)); keys.add(keyOf(e)); } }
      entries.sort((a, b) => a.at - b.at);
      while (entries.length > MAX_ENTRIES) keys.delete(keyOf(entries.shift()));
      console.log(`  Hall of Fame: ${entries.length} captions loaded from ${FILE}`);
    } catch (e) {
      // Keep the broken file for a human to look at; start a fresh deck
      console.warn(`  Hall of Fame: ${FILE} is unreadable (${e.message}) — starting empty.`);
      try { fs.renameSync(FILE, FILE + '.corrupt-' + Date.now()); } catch (e2) {}
      entries = []; keys = new Set();
    }
  }

  // Write a temp file, then swap it in, so a crash mid-save never leaves half a file
  function save() {
    if (!FILE) return;
    const tmp = `${FILE}.tmp-${process.pid}`;
    try {
      fs.writeFileSync(tmp, JSON.stringify(entries));
      fs.renameSync(tmp, FILE);
    } catch (e) {
      console.error('Hall of Fame save failed', e.message);   // the deck still lives in memory
      try { fs.unlinkSync(tmp); } catch (e2) {}
    }
  }

  // Returns the stored entry, or null for a duplicate (or junk). keep = trust the entry's own id/date (synced from a phone)
  function add(entry, keep) {
    const e = clean(keep ? entry : { ...(entry || {}), id: undefined, at: undefined, month: entry && entry.month });
    if (e && keys.has(keyOf(e))) {
      const x = entries.find(y => keyOf(y) === keyOf(e));
      if (x && e.best && !x.best) { x.best = e.best; changed(); save(); }
      // The same caption again, now with a good stamp (and the same author): the stored copy takes the stamp
      if (x && !trusted.has(x) && isStamped(e) && x.author.trim().toLowerCase() === e.author.trim().toLowerCase()) { x.sig = e.sig; vet(x); changed(); save(); }
    }
    if (!e || keys.has(keyOf(e))) return null;
    entries.push(vet(e));
    keys.add(keyOf(e));
    while (entries.length > MAX_ENTRIES) keys.delete(keyOf(entries.shift()));   // the oldest go first
    changed();
    save();
    return copy(e);
  }

  const copy = (e) => ({ ...e, flaggers: [...e.flaggers] });
  const all = () => entries.slice().reverse().map(copy);                                // newest first
  const recent = (n) => entries.slice(-n).reverse().map(copy);                          // the n newest
  const byCartoon = (cartoonId, onlyStamped) => entries.filter(e => e.cartoonId === Number(cartoonId) && (!onlyStamped || trusted.has(e))).reverse().map(copy);
  const count = () => entries.length;
  // Only the stamped entries (the ones this server framed): what Gallery games may deal as the real answer
  const stamped = () => entries.filter(e => trusted.has(e)).reverse().map(copy);

  // lowercase author -> how many of their captions are in the deck
  function authorCounts() {
    if (!authorCache) { authorCache = new Map(); for (const e of entries) { const a = e.author.toLowerCase(); authorCache.set(a, (authorCache.get(a) || 0) + 1); } }
    return authorCache;
  }
  // cartoonId -> Map(lowercase author -> how many), for "which cartoons can this table be dealt" (stamped only)
  function cartoonAuthors() {
    if (!cartoonCache) {
      cartoonCache = new Map();
      for (const e of entries) {
        if (!trusted.has(e)) continue;   // Gallery games deal only what this server framed
        if (!cartoonCache.has(e.cartoonId)) cartoonCache.set(e.cartoonId, new Map());
        const m = cartoonCache.get(e.cartoonId), a = e.author.toLowerCase();
        m.set(a, (m.get(a) || 0) + 1);
      }
    }
    return cartoonCache;
  }


  load();
  // Caption of the Night: the entry remembers it (shown with a ribbon in The Gallery)
  function markBest(cartoonId, caption, label) {
    const k = Number(cartoonId) + '|' + norm(caption), x = entries.find(y => keyOf(y) === k);
    if (!x || x.best) return false;
    x.best = str(label, 60); changed(); save(); return true;
  }
  return { all, add, markBest, byCartoon, count, recent, authorCounts, cartoonAuthors, stamped, version: () => version };
}

const server = createDeck(FILE, false);
// The server's own saved copy is trusted: stamp anything in it that isn't stamped yet
for (const e of server.all()) if (!isStamped(e)) server.add({ ...e, sig: stampOf(e) }, true);
if (!STAMP_LASTS) console.log('  Gallery stamps: GALLERY_SECRET not set — Gallery games use captions framed since the last restart.');
module.exports = { ...server, createDeck, norm, isRetired, MAX_ENTRIES, file: FILE, stampOf, isStamped };
