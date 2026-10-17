// polish.js — makes every caption look like it came from the same careful writer.
//
// Players' captions and the real captions both go through polish(), so a missing apostrophe,
// a lowercase start, a missing period or a stray emoji can't give anyone away.
// Mechanical fixes (punctuation, capitals, apostrophes, spacing, quotes) are always applied.
// Spelling is only SUGGESTED — the writer picks "use the fix" or "keep mine" — so names,
// slang and deliberate misspellings ("arrrrgument") are never changed against their will.
// Grammar is left alone.

const fs = require('fs');
const path = require('path');

// word -> frequency score (zipf × 10; 70+ = very common, 30 = rare). Built from the wordfreq project.
const FREQ = new Map();
try {
  for (const line of fs.readFileSync(path.join(__dirname, 'words.txt'), 'utf8').split('\n')) {
    const sp = line.lastIndexOf(' ');
    if (sp > 0) FREQ.set(line.slice(0, sp), Number(line.slice(sp + 1)));
  }
} catch (e) { console.warn('words.txt missing — spelling suggestions are off'); }

// Contractions typed without the apostrophe. Words that are also real words on their own
// (ill, id, its, lets, were, well, hell, shell, wed) are deliberately left out.
const CONTRACTIONS = {
  dont: "don't", doesnt: "doesn't", didnt: "didn't", isnt: "isn't", wasnt: "wasn't", arent: "aren't", werent: "weren't",
  hasnt: "hasn't", havent: "haven't", hadnt: "hadn't", couldnt: "couldn't", shouldnt: "shouldn't", wouldnt: "wouldn't",
  mustnt: "mustn't", neednt: "needn't", cant: "can't", wont: "won't", aint: "ain't", im: "I'm", ive: "I've",
  youre: "you're", theyre: "they're", youve: "you've", weve: "we've", theyve: "they've", youll: "you'll", theyll: "they'll",
  itll: "it'll", thatll: "that'll", youd: "you'd", theyd: "they'd", hes: "he's", shes: "she's", thats: "that's",
  whats: "what's", theres: "there's", heres: "here's", wheres: "where's", whos: "who's", hows: "how's", whens: "when's",
  wouldve: "would've", couldve: "could've", shouldve: "should've", mightve: "might've", mustve: "must've",
  yall: "y'all",
};

const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}️‍⃣]/gu;

function matchCase(src, word) {
  if (src.length > 1 && src === src.toUpperCase() && /[A-Z]/.test(src)) return word.toUpperCase();
  if (/^[A-Z]/.test(src)) return word[0].toUpperCase() + word.slice(1);
  return word;
}

// Turn straight quotes into proper typographic ones. Captions are shown inside “ ”,
// so quotes *inside* a caption become single quotes: He said ‘no.’
function curlQuotes(s) {
  s = s.replace(/"/g, (m, i) => (i === 0 || /[\s([{\-—–]/.test(s[i - 1]) ? '‘' : '’'));
  s = s.replace(/'/g, (m, i) => {
    const prev = s[i - 1], next = s[i + 1];
    if (i === 0 || /[\s([{\-—–]/.test(prev)) return /\d/.test(next || '') && /\d\d/.test(s.slice(i + 1, i + 3)) ? '’' : '‘'; // '90s stays an apostrophe
    return '’';
  });
  return s;
}

// Does a sentence opening with these two words read as a question? Deliberately cautious:
// a missed question just keeps its full stop, but a wrong "?" would stand out.
const WH_AUX = new Set("is are am was were do does did can could would should will won't have has had isn't aren't wasn't weren't don't doesn't didn't can't couldn't wouldn't shouldn't haven't hasn't".split(' '));
const PEOPLE = "i you u ya we they he she y'all anyone anybody someone somebody everyone everybody people";
const SUBJECT = new Set((PEOPLE + ' it this that these those there nobody my your his her our their').split(' '));
const DOER = new Set(PEOPLE.split(' '));                               // after "Do"/"Have": not "Do it again." / "Do your homework."
function isQuestion(w1, w2raw) {
  const w2 = w2raw.toLowerCase();
  const wh = w1.replace(/'s$/, '');
  if (/^(who|what|when|where|why|how)$/.test(wh)) {
    if (w1 !== wh || /^(why|who)$/.test(w1)) return !!w2 || w1 !== wh; // what's, who's, how's… and "Why …" / "Who …"
    if (WH_AUX.has(w2) || (w1 === 'what' && /^(if|now|happened|else|gives)$/.test(w2)) || (w1 === 'where' && w2 === 'to')) return true;
    return w1 === 'how' && /^(many|much|about|come|long|far|old|often|so)$/.test(w2); // not "What a day." / "When I was young."
  }
  if (w1 === 'any') return /^(questions?|takers|requests|luck|ideas?|news|thoughts|last|volunteers|objections|comments|chance|suggestions|survivors|regrets|more|other|plans|word)$/.test(w2); // not "Any friend of yours…"
  if (w1 === 'do' || w1 === 'have') return DOER.has(w2);
  if (/^(is|are|am|was|were|does|did|has|can|could|would|should|will|won't)$/.test(w1)) return SUBJECT.has(w2) || (w1 !== 'will' && /^[A-Z][a-z]/.test(w2raw)); // a name: "Is Gary here." (but "Will Smith…")
  return false;
}

// Mechanical clean-up. Never changes the words themselves, only how they're dressed.
function tidy(input) {
  let s = String(input || '').normalize('NFC');
  s = s.replace(/[‘’‚‛′`]/g, "'").replace(/[“”„‟″«»]/g, '"');
  s = s.replace(EMOJI, ' ').replace(/[\u0000-\u001F\u007F]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();

  // Quotes wrapped around the whole caption (the game adds its own)
  for (let k = 0; k < 3; k++) {
    const m = s.match(/^(["'])(.*)\1([.!?…]*)$/);
    if (m && !m[2].includes(m[1])) s = (m[2] + m[3]).trim(); else break;
  }

  s = s.replace(/\.{2,}/g, '…').replace(/\s*…\s*(?=[^\s,.!?…])/g, '… ').replace(/\s+…/g, '…');
  s = s.replace(/[?!]{2,}/g, m => (m.includes('?') && m.includes('!') ? '?!' : m[0]));
  s = s.replace(/,{2,}/g, ',');
  s = s.replace(/\s+([,.!?;:…)])/g, '$1');                 // no space before punctuation
  s = s.replace(/([,;!?])(?=[A-Za-z])/g, '$1 ');                 // space after it
  s = s.replace(/([a-z]{2})\.(?=[A-Z][a-z])/g, '$1. ');          // "end.Next" -> "end. Next"
  s = s.replace(/([(])\s+/g, '$1');
  s = s.replace(/\s*[-–]{2,}\s*|\s+[–—]\s+/g, '—');         // dashes

  // Apostrophe-less contractions, and the lone lowercase "i"
  s = s.replace(/\b[A-Za-z]+\b/g, (w, i) => {
    const lw = w.toLowerCase();
    if (s[i + w.length] === "'" || s[i - 1] === "'") return w;
    if (CONTRACTIONS[lw]) return lw === 'im' || lw === 'ive' ? CONTRACTIONS[lw] : matchCase(w, CONTRACTIONS[lw]);
    return w;
  });
  s = s.replace(/\bi\b(?!\.e\.)/g, 'I').replace(/\bI'(m|ve|ll|d)\b/gi, (m, t) => "I'" + t.toLowerCase());

  // Common word mix-ups, fixed only next to a word that settles it ("your welcome", "its a trap",
  // "better then", "could of"). A hyphen after the next word ("your going-away party") means no match.
  // A capital "A" after a lowercase word is a grade or a name ("your A game"), so it doesn't count.
  const shout = (w) => w.length > 1 && w === w.toUpperCase();
  const mixUp = (re, fix) => { s = s.replace(re, (m, w, sp, nx) => (nx === 'A' && !shout(w) ? m : fix(w, sp, nx))); };
  mixUp(/\b(?<!')(your)( +)(welcome|going|a|an|the|not|so|never|always|being|kidding|fired|right|wrong)\b(?![-'])(?!(?<=right|wrong) +(?:hand|hands|arm|arms|leg|legs|foot|feet|eye|eyes|ear|ears|side|shoe|wing|turn|answer|number|way|place|choice|size|one|of)\b)/gi,
    (w, sp, nx) => matchCase(w, "you're") + sp + nx);                // "your right hand" is left alone
  mixUp(/\b(?<!')(its)( +)(a|an|the|not|been|so|just|all|time|over|fine|ok|okay|like|about|going|getting|clearly|really|always|never)\b(?![-'])/gi,
    (w, sp, nx) => matchCase(w, "it's") + sp + nx);
  mixUp(/\b(better|more|less|worse|rather|bigger|smaller|older|younger|faster|longer|other)( +)(then)\b(?![-'])/gi,
    (w, sp, t) => w + sp + matchCase(t, 'than'));
  mixUp(/\b(could|would|should|must)( +)(of)\b(?![-'])(?! +course\b)/gi,   // "could of course" is left alone
    (w, sp) => w + sp + (shout(w) ? 'HAVE' : 'have'));
  s = s.replace(/\b(?<!')alot\b(?!')/gi, w => matchCase(w, 'a lot'));     // "ALOT" -> "A LOT", "Alot" -> "A lot"

  // A caption typed in ALL CAPS gets normal sentence case
  const letters = s.replace(/[^A-Za-z]/g, '');
  if (letters.length > 6 && letters === letters.toUpperCase() && s.split(' ').length > 1) s = s.toLowerCase().replace(/\bi\b/g, 'I').replace(/\bi'/g, "I'");

  // Capital at the start of the caption and of each new sentence
  s = s.replace(/^([^A-Za-z]*)([a-z])/, (m, a, b) => a + b.toUpperCase());
  s = s.replace(/([.!?]\s+["']?)([a-z])/g, (m, a, b, i) => (/\b[a-z]\.[a-z]\.\s*$/i.test(s.slice(0, i + 2)) ? a + b : a + b.toUpperCase()));

  // End with proper punctuation
  s = s.replace(/[\s,;:\-—–]+$/, '');
  if (/[A-Za-z0-9)%]$/.test(s)) s += '.';
  else if (/[A-Za-z0-9]["']$/.test(s)) s = s.slice(0, -1) + '.' + s.slice(-1);

  // A last sentence that is plainly a question gets "?" instead of "." ("Who did this." -> "Who did this?").
  // Only the caption's final full stop changes, and only when the opening words leave no doubt:
  // "What a day." / "When I was young…" / "Do it again." / "Could be worse." all stay statements.
  if (/[^.]\.$/.test(s)) {
    const last = s.slice(0, -1).split(/[.!?…]\s+/).pop();
    const m = last.match(/^["']?([A-Za-z]+(?:'[A-Za-z]+)?)(,?)(?:\s+([A-Za-z]+(?:'[A-Za-z]+)?))?/);
    if (m && !m[2] && isQuestion(m[1].toLowerCase(), m[3] || '')) s = s.slice(0, -1) + '?'; // a comma ("Why, thank you.") rules it out
  }

  return curlQuotes(s.replace(/\s+/g, ' ').trim());
}

/* ── Spelling suggestions ── */
const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
function edits1(w) {
  const out = new Set();
  for (let i = 0; i <= w.length; i++) {
    const a = w.slice(0, i), b = w.slice(i);
    if (b) out.add(a + b.slice(1));                                   // delete
    if (b.length > 1) out.add(a + b[1] + b[0] + b.slice(2));          // swap
    for (const c of ALPHA) { if (b) out.add(a + c + b.slice(1)); out.add(a + c + b); } // replace, insert
  }
  out.delete(w);
  return out;
}
function best(cands, first) {
  let top = null, topScore = -1;
  for (const c of cands) {
    const f = FREQ.get(c);
    if (!f) continue;
    const score = f + (c[0] === first ? 5 : 0);
    if (score > topScore) { top = c; topScore = score; }
  }
  return top ? { word: top, freq: FREQ.get(top) } : null;
}
// Classic misspellings common enough to sit in the word list themselves
const COMMON_TYPOS = {
  teh: 'the', adn: 'and', taht: 'that', hte: 'the', alot: 'a lot', noone: 'no one', recieve: 'receive', recieved: 'received',
  wierd: 'weird', seperate: 'separate', definately: 'definitely', definitly: 'definitely', untill: 'until', thier: 'their',
  freind: 'friend', freinds: 'friends', beleive: 'believe', occured: 'occurred', tommorow: 'tomorrow', tomorow: 'tomorrow',
  accomodate: 'accommodate', embarass: 'embarrass', embarassing: 'embarrassing', goverment: 'government', wich: 'which',
  becuase: 'because', beacuse: 'because', realy: 'really', finaly: 'finally', truely: 'truly', arguement: 'argument',
  calender: 'calendar', existance: 'existence', publically: 'publicly', neccessary: 'necessary', necesary: 'necessary',
  begining: 'beginning', wether: 'whether', acheive: 'achieve', basicly: 'basically', concious: 'conscious',
  enviroment: 'environment', familar: 'familiar', foriegn: 'foreign', gaurd: 'guard', happend: 'happened', knowlege: 'knowledge',
  liason: 'liaison', mispell: 'misspell', occassion: 'occasion', persue: 'pursue', posession: 'possession', prefered: 'preferred',
  probly: 'probably', reccomend: 'recommend', recomend: 'recommend', rythm: 'rhythm', sieze: 'seize', suprise: 'surprise',
  supprise: 'surprise', tounge: 'tongue', truley: 'truly', vaccum: 'vacuum', wieght: 'weight', yeild: 'yield', youself: 'yourself',
};
const PREFIXES = ['re', 'un', 'pre', 'mis', 'over', 'out', 'under', 'non', 'dis', 'super', 'mega', 'anti'];
const SUFFIXES = [['s', ''], ['es', ''], ['ed', ''], ['ed', 'e'], ['ing', ''], ['ing', 'e'], ['er', ''], ['er', 'e'], ['ers', ''], ['ly', ''], ['ness', ''], ['ish', ''], ['y', ''], ['ies', 'y'], ['ied', 'y'], ['est', '']];
// A word made from a known word plus a common prefix or ending ("recalculating", "pigeonish") is fine
function looksBuilt(lw) {
  const isWord = (x) => x.length >= 3 && FREQ.has(x);
  for (const p of PREFIXES) if (lw.startsWith(p) && (isWord(lw.slice(p.length)) || builtFromSuffix(lw.slice(p.length)))) return true;
  return builtFromSuffix(lw);
  function builtFromSuffix(w) {
    for (const [suf, add] of SUFFIXES) if (w.endsWith(suf)) { const stem = w.slice(0, -suf.length); if (isWord(stem + add) || (stem.length > 3 && stem[stem.length - 1] === stem[stem.length - 2] && isWord(stem.slice(0, -1)))) return true; }
    return false;
  }
}
function suggestFor(word) {
  const lw = word.toLowerCase();
  if (COMMON_TYPOS[lw]) return COMMON_TYPOS[lw];
  const known = FREQ.get(lw) || 0;
  if (known) {
    // A real but very rare word right next to a very common one ("hed" / "head") is probably a slip
    if (known < 28 && lw.length >= 3) { const c = best([...edits1(lw)].filter(x => x.length >= lw.length), lw[0]); if (c && c.freq >= 50 && c.freq >= known + 22 && c.word[0] === lw[0]) return c.word; }
    return null;                                                       // otherwise a real word: never touched
  }
  if (looksBuilt(lw)) return null;
  let c = best(edits1(lw), lw[0]);
  if (c && c.freq < 25) c = null;
  if (!c && lw.length >= 6) {
    const two = new Set(); for (const e of edits1(lw)) for (const e2 of edits1(e)) two.add(e2);
    c = best(two, lw[0]);
    if (c && c.freq < 35) c = null;
  }
  return c ? c.word : null;
}

function findTypos(s) {
  if (!FREQ.size) return [];
  const typos = [];
  const re = /[A-Za-z]+(?:’[A-Za-z]+)?/g;
  let m;
  while ((m = re.exec(s))) {
    const w = m[0], at = m.index;
    if (w.includes('’')) continue;                                // contractions & possessives: leave
    if (w.length < 3) continue;
    if (/(.)\1\1/i.test(w)) continue;                                   // stretched on purpose: "arrrrgh"
    if (w.length <= 5 && w === w.toUpperCase()) continue;               // acronyms
    const sentenceStart = at === 0 || /[.!?…]\s*[‘’"]?\s*$/.test(s.slice(0, at)) || /^[^A-Za-z]*$/.test(s.slice(0, at));
    if (/^[A-Z]/.test(w) && !sentenceStart) continue;                   // names
    const fix = suggestFor(w);
    if (fix) typos.push({ at, word: w, fix: matchCase(w, fix) });
  }
  return typos;
}

function applyTypos(s, typos) {
  let out = s;
  for (const t of [...typos].sort((a, b) => b.at - a.at)) out = out.slice(0, t.at) + t.fix + out.slice(t.at + t.word.length);
  return out;
}

// { text: tidied caption, typos: [{word, fix}], fixed: tidied caption with spelling fixes }
function polish(input) {
  const text = tidy(input);
  const typos = findTypos(text);
  return { text, typos: typos.map(t => ({ word: t.word, fix: t.fix })), fixed: typos.length ? tidy(applyTypos(text, typos)) : text };
}

module.exports = { polish, tidy };
