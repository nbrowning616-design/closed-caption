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
// Captions pulled from The Gallery for good: the "he he" test frame (Nick, Oct 19 2026: gone for good), and any
// frame that is nothing but laughing ("he he", "hehe", "heh", "hee hee", "ha ha"), whoever wrote it
const LAUGH_ONLY = /^((he+h?|ha+h?|hi+) ?)+$/;
const isRetired = (e) => LAUGH_ONLY.test(norm(e.caption));
const keyOf = (e) => e.cartoonId + '|' + norm(e.caption);
const MONTH = (ms) => new Date(ms).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/New_York' });
const str = (v, max) => String(v === undefined || v === null ? '' : v).slice(0, max);
// A deck: the server keeps one (saved to DATA_DIR if set), and every room gets its own,
// filled from the phones at the table and from what the table frames tonight.
function createDeck(FILE = null, quiet = true) {
  let entries = [];            // oldest first
  let keys = new Set();        // cartoonId|normalised caption, for spotting duplicates
  let authorCache = null;      // lowercase author -> entries, rebuilt after a change
  let cartoonCache = null;     // cartoonId -> Map(lowercase author -> entries)

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
      ...(typeof e.sig === 'string' && e.sig ? { sig: e.sig.slice(0, 64) } : {}),   // the server's stamp: framed at a real table (Expert Mode deals only these)
    };
  }

  function changed() { authorCache = null; cartoonCache = null; }

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
      for (const x of list) { const e = clean(x); if (e && !keys.has(keyOf(e))) { entries.push(e); keys.add(keyOf(e)); } }
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
    if (e && e.best && keys.has(keyOf(e))) { const x = entries.find(y => keyOf(y) === keyOf(e)); if (x && !x.best) { x.best = e.best; changed(); save(); } }
    if (!e || keys.has(keyOf(e))) return null;
    entries.push(e);
    keys.add(keyOf(e));
    while (entries.length > MAX_ENTRIES) keys.delete(keyOf(entries.shift()));   // the oldest go first
    changed();
    save();
    return copy(e);
  }

  const copy = (e) => ({ ...e, flaggers: [...e.flaggers] });
  const all = () => entries.slice().reverse().map(copy);                                // newest first
  const recent = (n) => entries.slice(-n).reverse().map(copy);                          // the n newest
  const byCartoon = (cartoonId) => entries.filter(e => e.cartoonId === Number(cartoonId)).reverse().map(copy);
  const count = () => entries.length;

  // lowercase author -> how many of their captions are in the deck
  function authorCounts() {
    if (!authorCache) { authorCache = new Map(); for (const e of entries) { const a = e.author.toLowerCase(); authorCache.set(a, (authorCache.get(a) || 0) + 1); } }
    return authorCache;
  }
  // cartoonId -> Map(lowercase author -> how many), for "which cartoons can this table be dealt"
  function cartoonAuthors() {
    if (!cartoonCache) {
      cartoonCache = new Map();
      for (const e of entries) {
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
  return { all, add, markBest, byCartoon, count, recent, authorCounts, cartoonAuthors };
}

const server = createDeck(FILE, false);
module.exports = { ...server, createDeck, norm, isRetired, MAX_ENTRIES, file: FILE };
