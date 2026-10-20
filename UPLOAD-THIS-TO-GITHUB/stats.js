// stats.js — #41 a private tally for Nick: how many games, how big, how people found the room, what got shared.
// Counts only. No names, no captions, no room codes, no addresses: nothing here can point at a person.
//
// Seen only at /stats?k=<STATS_KEY> (the server answers 404 without the env var, or with the wrong key).
// Kept in a small file: DATA_DIR/stats.json when DATA_DIR is set (a disk that survives redeploys), otherwise
// STATS_FILE, otherwise the system's temp folder. On Render's free plan that folder is wiped on every redeploy,
// so the tally starts over then ('since' says when it started).
const fs = require('fs');
const os = require('os');
const path = require('path');

const FILE = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'stats.json')
  : process.env.STATS_FILE || path.join(os.tmpdir(), 'closed-caption-stats.json');
const VIA = ['qr', 'link', 'code'];
const SHARES = ['recap', 'gallery'];
const DAYS_KEPT = 400;

const blank = () => ({
  since: Date.now(),
  started: 0, finished: 0,
  players: {},                       // players at the start of a game -> games
  joins: { qr: 0, link: 0, code: 0 },
  shares: { recap: 0, gallery: 0 },
  days: {},                          // 'YYYY-MM-DD' (New York) -> { started, finished, joins, shares }
});

let t = blank();
try {
  const d = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  if (d && typeof d === 'object' && Number(d.since)) {
    t = blank();
    t.since = Number(d.since);
    t.started = Number(d.started) || 0; t.finished = Number(d.finished) || 0;
    for (const [k, v] of Object.entries(d.players || {})) if (/^\d{1,2}$/.test(k)) t.players[k] = Number(v) || 0;
    for (const k of VIA) t.joins[k] = Number((d.joins || {})[k]) || 0;
    for (const k of SHARES) t.shares[k] = Number((d.shares || {})[k]) || 0;
    for (const [k, v] of Object.entries(d.days || {})) if (/^\d{4}-\d\d-\d\d$/.test(k) && v && typeof v === 'object') t.days[k] = { started: Number(v.started) || 0, finished: Number(v.finished) || 0, joins: Number(v.joins) || 0, shares: Number(v.shares) || 0 };
  }
} catch (e) { /* no file yet (or unreadable): start a fresh tally */ }

let saveT = null;
function saveNow() {
  clearTimeout(saveT); saveT = null;
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    const tmp = FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(t));
    fs.renameSync(tmp, FILE);
  } catch (e) { console.warn('  (stats not saved: ' + (e.code || e.message) + ')'); }
}
const saveSoon = () => { if (!saveT) saveT = setTimeout(saveNow, 5000); };

const dayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
function today() {
  const k = dayKey();
  if (!t.days[k]) {
    t.days[k] = { started: 0, finished: 0, joins: 0, shares: 0 };
    const keys = Object.keys(t.days).sort();
    while (keys.length > DAYS_KEPT) delete t.days[keys.shift()];
  }
  return t.days[k];
}

module.exports = {
  file: FILE,
  // a game began with n players at the table
  started(n) {
    n = Math.max(0, Math.min(99, Math.round(Number(n) || 0)));
    t.started++; today().started++;
    t.players[n] = (t.players[n] || 0) + 1;
    saveSoon();
  },
  finished() { t.finished++; today().finished++; saveSoon(); },
  // a new seat taken through Join: by the QR code, an invite link, or the code typed in
  joined(via) { const k = VIA.includes(via) ? via : 'code'; t.joins[k]++; today().joins++; saveSoon(); },
  // a recap picture or a Gallery card shared (or saved) from a phone
  shared(what) { if (!SHARES.includes(what)) return; t.shares[what]++; today().shares++; saveSoon(); },
  flush: saveNow,
  report() {
    const games = Object.values(t.players).reduce((a, b) => a + b, 0);
    const seats = Object.entries(t.players).reduce((a, [n, c]) => a + Number(n) * c, 0);
    const days = Object.keys(t.days).sort().reverse().slice(0, 60);
    return {
      since: new Date(t.since).toISOString(),
      note: 'Counts only: no names, captions, room codes or addresses. Starts over when the server is redeployed (unless DATA_DIR points at a disk).',
      games: { started: t.started, finished: t.finished, finishedShare: t.started ? Math.round(100 * t.finished / t.started) + '%' : null },
      playersPerGame: { average: games ? Math.round(10 * seats / games) / 10 : null, counts: { ...t.players } },
      joins: { ...t.joins },
      shares: { ...t.shares },
      days: Object.fromEntries(days.map(k => [k, { ...t.days[k] }])),
    };
  },
};
