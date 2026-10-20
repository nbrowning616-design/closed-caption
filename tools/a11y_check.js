#!/usr/bin/env node
/* Closed Caption — accessibility check (#29). Plays one round on a local server with a host and three guests
   (phones at 390×844) and, on every stage, checks two phones (the host and a guest) with:
     • axe-core (WCAG 2.0/2.1 A + AA rules: contrast, labels, roles, nesting…)
     • tap targets: every visible button / link / field is at least 44 × 44 px (or has a 44 px hit area)
     • text size: no visible text under 12 px
     • no sideways scrolling
   Exit code 0 = clean, 1 = something to fix. It prints rule names, counts and CSS selectors only — never the
   text on the page, so no caption (and never the real one) ends up in a log.

   Needs: Node 18+, the game's own dependencies (npm install in UPLOAD-THIS-TO-GITHUB), Playwright with
   Chromium, and axe-core. If they aren't installed globally:  npm i --no-save playwright axe-core
   Usage:  node tools/a11y_check.js            (env: PORT=4310, AXE_PATH=…/axe.min.js, PLAYWRIGHT=…/playwright)
*/
'use strict';
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

function need(name, envKey, fallbacks) {
  const tries = [process.env[envKey], name, ...fallbacks].filter(Boolean);
  for (const t of tries) { try { return require.resolve(t); } catch (e) {} }
  console.error(`Can't find ${name}. Install it (npm i --no-save ${name.split('/')[0]}) or set ${envKey}.`);
  process.exit(2);
}
const PW = require(need('playwright', 'PLAYWRIGHT', ['/opt/npm-tools/node_modules/playwright']));
const AXE = fs.readFileSync(need('axe-core/axe.min.js', 'AXE_PATH', []), 'utf8');
const APP = path.join(__dirname, '..', 'UPLOAD-THIS-TO-GITHUB');
const PORT = Number(process.env.PORT || 4310);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const CAPS = ['He said the view was worth it.', 'I told you we should have taken the stairs.', 'This is not what the brochure promised.', 'Act natural. He can smell fear.'];
const NAMES = ['Nick', 'Margaret', 'Bob', 'Dottie'];

// In the page: tap targets, text sizes, overflow. Returns selectors (tag.class), never text.
function audit() {
  const sel = (e) => (e.id ? '#' + e.id : e.tagName.toLowerCase() + [...e.classList].slice(0, 3).map(c => '.' + c).join(''));
  const vis = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05 && r.bottom > 0 && r.top < innerHeight * 3; };
  const out = { small: [], tiny: [], overflow: 0 };
  const hit = (e) => { const r = e.getBoundingClientRect(); let w = r.width, h = r.height;
    for (const ps of ['::before', '::after']) { const c = getComputedStyle(e, ps); if (c.content && c.content !== 'none' && c.position === 'absolute') { const t = parseFloat(c.top) || 0, l = parseFloat(c.left) || 0, b = parseFloat(c.bottom) || 0, rr = parseFloat(c.right) || 0; if (c.inset !== 'auto' || c.top !== 'auto') { w = Math.max(w, r.width - l - rr); h = Math.max(h, r.height - t - b); } } }
    return { w, h }; };
  document.querySelectorAll('button, a[href], input:not([type=hidden]), textarea, select, summary, [role="button"], [onclick]').forEach(e => {
    if (!vis(e) || e.closest('.ios-haptic, [aria-hidden="true"]') || e.disabled) return;
    if (e.tagName === 'INPUT' && e.type === 'checkbox' && e.closest('label')) return;
    if (e.closest('a, button, [role="button"]') !== e && e.matches('[onclick]') && !e.matches('button, a, [role="button"]')) return;
    const { w, h } = hit(e);
    if (w < 43.5 || h < 43.5) out.small.push(`${sel(e)} ${Math.round(w)}x${Math.round(h)}`);
  });
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode; if (!t.nodeValue.trim()) continue;
    const e = t.parentElement; if (!e || seen.has(e) || !vis(e) || e.closest('[aria-hidden="true"], svg, .sr-only, script, style')) continue;
    seen.add(e);
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (fs < 11.95) out.tiny.push(`${sel(e)} ${fs}px`);
  }
  out.overflow = Math.max(0, document.documentElement.scrollWidth - innerWidth);
  out.small = [...new Set(out.small)]; out.tiny = [...new Set(out.tiny)];
  return out;
}

async function check(page, label, report) {
  await page.evaluate(AXE);
  const r = await page.evaluate(async () => {
    const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, resultTypes: ['violations'] });
    return res.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, where: v.nodes.slice(0, 4).map(n => n.target.join(' ')) }));
  });
  const a = await page.evaluate(audit);
  report.push({ label, axe: r, small: a.small, tiny: a.tiny, overflow: a.overflow });
}

(async () => {
  const srv = spawn('node', ['server.js'], { cwd: APP, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  let ok = false;
  for (let i = 0; i < 80 && !ok; i++) { try { ok = (await fetch(`http://localhost:${PORT}/healthz`)).ok; } catch (e) {} if (!ok) await sleep(150); }
  if (!ok) { console.error('server did not start'); srv.kill(); process.exit(2); }
  const browser = await PW.chromium.launch();
  const report = [];
  const errors = [];
  try {
    const pages = [];
    for (let i = 0; i < 4; i++) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message.slice(0, 120)));
      await p.goto(`http://localhost:${PORT}/`); pages.push(p);
    }
    const [host, guest] = pages;
    const S = (p) => p.evaluate(() => state ? { phase: state.phase, isDealer: state.isDealer, isMyTurn: state.isMyTurn, open: (state.openCaptions || []).length, mine: state.myOpenIndex, reel: state.reel ? { step: state.reel.step, n: state.reel.order.length } : null } : null);
    const until = async (fn, ms = 20000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await guest.evaluate(fn).catch(() => false)) return; await sleep(150); } throw new Error('stuck waiting'); };
    await sleep(1500);
    await check(guest, 'home', report);
    await host.evaluate((n) => send({ action: 'create', name: n, timer: 120, seen: [] }), NAMES[0]);
    await host.waitForFunction(() => !!state && !!state.code);
    const code = await host.evaluate(() => state.code);
    for (let i = 1; i < 4; i++) await pages[i].evaluate(([c, n]) => send({ action: 'join', code: c, name: n }), [code, NAMES[i]]);
    await sleep(1200);
    await host.evaluate(() => send({ action: 'update_settings', settings: { rounds: 1 } }));
    await sleep(500);
    await check(host, 'lobby (host)', report); await check(guest, 'lobby (guest)', report);
    await host.evaluate(() => { document.getElementById('room-options').open = true; });
    await check(host, 'lobby room options (host)', report);
    await host.evaluate(() => { document.getElementById('room-options').open = false; openMenu(); });
    await sleep(400); await check(host, 'menu', report);
    await host.evaluate(() => closeMenu());
    const inv = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
    await inv.goto(`http://localhost:${PORT}/?join=${code}`); await sleep(1200);
    await check(inv, 'invite landing', report);
    await inv.goto(`http://localhost:${PORT}/?join=QQQQ`); await sleep(1200);
    await check(inv, 'invite: game over', report);
    await inv.context().close();
    await host.evaluate(() => send({ action: 'start' }));
    await until(() => state && state.phase === 'writing');
    await sleep(4500);
    await check(guest, 'writing', report);
    await pages[2].evaluate(() => askSkip()); await sleep(400);
    await check(pages[2], 'skip this cartoon? sheet', report);
    await pages[2].evaluate(() => closeMenu());
    for (let i = 0; i < 4; i++) await pages[i].evaluate((c) => send({ action: 'submit_caption', caption: c, mode: 'keep' }), CAPS[i]);
    await until(() => state.phase === 'reading'); await sleep(4300);
    await check(guest, 'reading (with a first-game tip)', report);
    let dealer = host; for (const p of pages) if ((await S(p)).isDealer) dealer = p;
    await dealer.evaluate(() => send({ action: 'advance' }));
    await until(() => state.phase === 'first_bets'); await sleep(800);
    await check(guest, 'bets', report);
    const bet = async (phase) => { for (let k = 0; k < 16; k++) { let any = false; for (const p of pages) { const s = await S(p); if (!s || s.phase !== phase) return; if (s.isMyTurn) { const t = [...Array(s.open).keys()].find(x => x !== s.mine); await p.evaluate((t) => send({ action: 'place_bet', target: t ?? 'closed', count: 1 }), t); any = true; await sleep(250); } } if (!any) await sleep(300); } };
    // First bets go in all at once, in secret: the guest bets first and waits on the others (the locked-in screen)
    { const s = await S(guest); if (s.isMyTurn) { await guest.evaluate((t) => send({ action: 'place_bet', target: t, count: 1 }), [...Array(s.open).keys()].find(x => x !== s.mine) ?? 'closed'); await sleep(700); await check(guest, 'bets (in, waiting on the rest)', report); } }
    await bet('first_bets');
    await until(() => state.phase !== 'first_bets'); await sleep(1200);
    // Then the steal (before the flip), the flip, the last chips, in whatever order the table goes
    const done = new Set();
    for (let k = 0; k < 120; k++) {
      const ph = (await S(guest)).phase;
      if (ph === 'answer') break;
      if (ph === 'steal' && !done.has('steal')) {
        done.add('steal'); await sleep(400); await check(guest, 'steal (guest)', report); await check(dealer, 'steal (dealer)', report);
        await dealer.evaluate(() => { const i = state.bets.findIndex(b => b.target !== 'pass' && b.count > 0 && b.playerId !== myPlayerId); send({ action: 'steal', betIndex: i < 0 ? null : i }); });
      } else if (ph === 'reveal') {
        const at = await guest.evaluate(() => (state.flipAt || 0) - (Date.now() + (typeof clockOffset === 'number' ? clockOffset : 0)));
        if (at > 0) { await sleep(Math.min(at, 14000) + 400); continue; }
        if (!done.has('reveal')) { done.add('reveal'); await sleep(2400); await check(guest, 'flip', report); }
        await dealer.evaluate(() => send({ action: 'advance' })); await sleep(1600);
      } else if (ph === 'second_bets') await bet('second_bets');
      await sleep(300);
    }
    await until(() => state.phase === 'answer'); await sleep(14000);
    await check(guest, 'reveal', report);
    await dealer.evaluate(() => send({ action: 'reel_skip' }));
    await until(() => state.reel && state.reel.step > state.reel.order.length); await sleep(800);
    await check(guest, 'round recap', report);
    await dealer.evaluate(() => send({ action: 'advance' }));
    await until(() => state.phase === 'framing'); await sleep(1200);
    await check(guest, 'frame it', report);
    for (const p of pages) await p.evaluate(() => send({ action: 'frame_pick', target: 'pass' }));
    await until(() => state.phase === 'scores'); await sleep(9000);
    await host.evaluate(() => send({ action: 'verdicts_done' })).catch(() => {});
    await sleep(8000);
    for (const p of pages) await p.evaluate(() => { try { closeGrand(); } catch (e) {} });
    await sleep(600);
    await check(guest, 'game over (guest)', report); await check(host, 'game over (host)', report);
  } catch (e) { errors.push('run: ' + e.message); }
  await browser.close(); srv.kill();

  let bad = 0;
  for (const r of report) {
    const issues = r.axe.length + r.small.length + r.tiny.length + (r.overflow ? 1 : 0);
    bad += issues;
    console.log(`${issues ? '✗' : '✓'} ${r.label}`);
    for (const v of r.axe) console.log(`    axe ${v.id} (${v.impact}) ×${v.n}: ${v.where.join(' | ')}`);
    if (r.small.length) console.log(`    under 44 px: ${r.small.join(' | ')}`);
    if (r.tiny.length) console.log(`    under 12 px: ${r.tiny.join(' | ')}`);
    if (r.overflow) console.log(`    sideways scroll: ${r.overflow}px`);
  }
  for (const e of errors) console.log('  page error:', e);
  console.log(bad || errors.length ? `\n${bad} issue(s), ${errors.length} error(s)` : '\nAll clear.');
  process.exit(bad || errors.length ? 1 : 0);
})();
