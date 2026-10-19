#!/usr/bin/env python3
"""Add or redraw one Closed Caption cartoon.

  python3 tools/add_cartoon.py --image pic.jpg|pic.b64 --id 113 --title "The Neighbors" \
      --rating family|standard|afterdark --caption "..." --spots '[[0.4,0.3,0.08],[0.7,0.35,0.07]]'

  Redraw of an existing card: pass --id of that card and --redraw (keeps its title, rating and caption
  unless you pass new ones). Writes public/images/card_N.jpg (720x720 JPEG), the CARTOONS line in game.js
  and the heads line in public/heads-spots.js. Also writes a check picture with the head circles to
  --check (default /tmp/check_N.jpg) so you can look at it.
Never print the caption anywhere Nick can see it.
"""
import argparse, base64, io, json, os, re, sys
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'UPLOAD-THIS-TO-GITHUB')
GAME = os.path.join(ROOT, 'game.js')
SPOTS = os.path.join(ROOT, 'public', 'heads-spots.js')
IMAGES = os.path.join(ROOT, 'public', 'images')
FLAGS = {'family': '', 'standard': 'adult: true, ', 'afterdark': 'spicy: true, '}

def load_image(path):
    raw = open(path, 'rb').read()
    if path.endswith('.b64') or raw[:5] == b'data:':
        txt = raw.decode().strip()
        if txt.startswith('data:'): txt = txt.split(',', 1)[1]
        raw = base64.b64decode(txt)
    im = Image.open(io.BytesIO(raw)).convert('RGB')
    w, h = im.size; s = min(w, h)
    im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
    return im.resize((720, 720), Image.LANCZOS)

def js_str(s): return json.dumps(s, ensure_ascii=False)

def main():
    a = argparse.ArgumentParser()
    a.add_argument('--image', required=True); a.add_argument('--id', type=int, required=True)
    a.add_argument('--title'); a.add_argument('--rating', choices=FLAGS.keys()); a.add_argument('--caption')
    a.add_argument('--spots', required=True); a.add_argument('--redraw', action='store_true'); a.add_argument('--check')
    o = a.parse_args()
    spots = json.loads(o.spots)
    assert isinstance(spots, list) and 1 <= len(spots) <= 4 and all(len(x) == 3 and all(0 <= v <= 1 for v in x) for x in spots), 'spots: 1-4 [x,y,r] fractions'
    game = open(GAME, encoding='utf8').read()
    line_re = re.compile(r'^  \{ id: %d, .*\},\n' % o.id, re.M)
    m = line_re.search(game)
    if o.redraw and not m: sys.exit('no card %d to redraw' % o.id)
    if not o.redraw and m: sys.exit('card %d already exists (use --redraw)' % o.id)
    img = 'card_%d.jpg' % o.id
    if m:
        old = m.group(0)
        title = o.title or re.search(r'title: ("(?:[^"\\]|\\.)*")', old).group(1)
        title = js_str(o.title) if o.title else title
        cap = js_str(o.caption) if o.caption else re.search(r'correct: ("(?:[^"\\]|\\.)*")', old).group(1)
        flags = FLAGS[o.rating] if o.rating else ''.join(f for f in ('adult: true, ', 'spicy: true, ') if f in old)
        game = game.replace(old, '  { id: %d, %stitle: %s, image: "%s", correct: %s },\n' % (o.id, flags, title, img, cap))
    else:
        assert o.title and o.rating and o.caption, 'new card needs --title --rating --caption'
        end = game.index('\n];\n', game.index('const CARTOONS'))
        game = game[:end] + '\n  { id: %d, %stitle: %s, image: "%s", correct: %s },' % (o.id, FLAGS[o.rating], js_str(o.title), img, js_str(o.caption)) + game[end:]
    im = load_image(o.image)
    im.save(os.path.join(IMAGES, img), 'JPEG', quality=84, optimize=True, progressive=True)
    open(GAME, 'w', encoding='utf8').write(game)
    sp = open(SPOTS, encoding='utf8').read()
    entry = '  "%s": %s,' % (img, json.dumps([[round(v, 3) for v in x] for x in spots], separators=(',', ':')))
    sp, n = re.subn(r'^  "%s": .*,$' % re.escape(img), entry, sp, flags=re.M)
    if not n:
        i = sp.rindex('};'); sp = sp[:i].rstrip() + '\n' + entry + '\n' + sp[i:]
    open(SPOTS, 'w', encoding='utf8').write(sp)
    chk = im.copy(); d = ImageDraw.Draw(chk)
    for k, (x, y, r) in enumerate(spots):
        d.ellipse([(x - r) * 720, y * 720 - r * 720, (x + r) * 720, y * 720 + r * 720], outline=(255, 0, 0) if k == 0 else (0, 120, 255), width=4)
    chk.save(o.check or '/tmp/check_%d.jpg' % o.id)
    print('saved', img, '(redraw)' if m else '(new)', 'check picture:', o.check or '/tmp/check_%d.jpg' % o.id)

if __name__ == '__main__': main()
