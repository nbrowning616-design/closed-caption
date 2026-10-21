"""Add a batch of finished drawings to the deck in one step.

usage: python3 drawing/ingest.py drawing/work/caps.json

caps.json (lives in drawing/work/, which git ignores; delete it after ingest) is keyed by queue name:
  {
   "c539": {"caption": "...", "level": "medium",            # level optional (queue has a default)
            "src": "c539b.jpg",                              # optional: a second try's file in drawing/work/
            "odd": [{"q": "Who left the ladder there?", "x": 72, "y": 18, "r": 10}, ...],   # 2-3 circles
            "decoys": [{"t": "...", "s": 4}, ... 5 items],   # house fakes, s 2-5, never better than the real one
            "word": "mailbox"},                               # optional, ~1 card in 11: a word IN the real caption
   "r275": {"odd": [...]}                                    # a redraw keeps its title, rating, caption and decoys
  }
  Skipped items: {"c812": {"skip": "why"}} -> marked handled, nothing added.

For each item: grayscale -> tools/add_cartoon.py -> tools/card_meta.py -> odd/decoys/word into card_meta.json ->
one premise line in CARTOON_PROGRESS.md (never the caption) -> name appended to drawing/handled.txt.
"""
import json, os, re, subprocess, sys
from PIL import Image

D = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(D); W = os.path.join(D, 'work')
META = os.path.join(R, 'UPLOAD-THIS-TO-GITHUB', 'card_meta.json')
q = {i['name']: i for i in json.load(open(os.path.join(D, 'queue.json')))}
todo = json.load(open(sys.argv[1]))
lines, handled, problems = [], [], []


def check(name, v, it):
    p = []
    odd = v.get('odd') or []
    if not 2 <= len(odd) <= 3: p.append('needs 2-3 odd circles')
    for o in odd:
        if not (isinstance(o.get('q'), str) and all(isinstance(o.get(k), (int, float)) for k in 'xyr')): p.append('odd item malformed')
        elif not (0 <= o['x'] <= 100 and 0 <= o['y'] <= 100 and 6 <= o['r'] <= 30): p.append('odd x/y 0-100, r 6-30')
    if it['kind'] == 'new':
        if not (v.get('caption') or '').strip(): p.append('no caption')
        dec = v.get('decoys') or []
        if len(dec) != 5: p.append('needs 5 decoys')
        if any(not isinstance(d.get('t'), str) or d.get('s') not in (2, 3, 4, 5) for d in dec): p.append('decoy s must be 2-5')
        if sum(1 for d in dec if d.get('s') in (4, 5)) < 2: p.append('at least two decoys at 4-5')
        w = v.get('word')
        if w and not re.search(r'\b%s\b' % re.escape(w), v['caption'], re.I): p.append('word not in caption')
    return p


for name, v in todo.items():
    it = q.get(name)
    if not it: problems.append(name + ': not in queue'); continue
    if v.get('skip'):
        handled.append(name); lines.append('- %d · SKIPPED (%s) · %s' % (it['id'], v['skip'], it['scene'][:90])); continue
    p = check(name, v, it)
    if p: problems.append(name + ': ' + '; '.join(sorted(set(p)))); continue
    src = os.path.join(W, v.get('src') or name + '.jpg'); g = os.path.join(W, 'g_' + name + '.jpg')
    Image.open(src).convert('L').convert('RGB').save(g, quality=92)
    i = it['id']
    if it['kind'] == 'redraw':
        args = ['python3', os.path.join(R, 'tools/add_cartoon.py'), '--image', g, '--id', str(i), '--redraw']
        if v.get('level'): args += ['--level', v['level']]
    else:
        args = ['python3', os.path.join(R, 'tools/add_cartoon.py'), '--image', g, '--id', str(i), '--title', it['title'],
                '--rating', it['rating'], '--caption', v['caption'], '--level', v.get('level') or it['level']]
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode: problems.append(name + ': add_cartoon failed: ' + r.stderr[-200:]); continue
    meta = json.load(open(META)); voice = meta.get(str(i), {}).get('voice') or it.get('voice') or 'house'
    subprocess.run(['python3', os.path.join(R, 'tools/card_meta.py'), '--id', str(i), '--style', str(it['style']),
                    '--voice', voice, '--title', it.get('title', ''), '--scene', it['scene']], capture_output=True)
    meta = json.load(open(META)); m = meta.setdefault(str(i), {})
    m['odd'] = v['odd']
    if it['kind'] == 'new':
        m['decoys'] = v['decoys']
        if v.get('word'): m['word'] = v['word'].lower()
        if it.get('holiday'): m['holiday'] = True
    json.dump(dict(sorted(meta.items(), key=lambda kv: int(kv[0]))), open(META, 'w'), indent=0, separators=(',', ':'))
    handled.append(name)
    if it['kind'] == 'new':
        lines.append('- %d · %s · style %s · %s · %s · %s' % (i, it['title'], it['style'], v.get('level') or it['level'], it['rating'], it['scene']))
    else:
        lines.append('- %d · REDRAWN (fuller picture) · style %s · %s' % (i, it['style'], it['scene']))

if lines: open(os.path.join(R, 'CARTOON_PROGRESS.md'), 'a').write('\n'.join(lines) + '\n')
if handled: open(os.path.join(D, 'handled.txt'), 'a').write('\n'.join(handled) + '\n')
print('added/handled', len(handled))
for p in problems: print('NOT ADDED', p)
