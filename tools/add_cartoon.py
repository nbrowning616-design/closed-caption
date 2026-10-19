#!/usr/bin/env python3
"""Add or redraw one Closed Caption cartoon.

  python3 tools/add_cartoon.py --image pic.jpg|pic.b64 --id 113 --title "The Neighbors" \
      --rating family|standard|afterdark --caption "..." --level easy|medium|hard

  Every id below 113 is retired for good (Nick, Oct 19 2026): new cards start at 113.
  Redraw of an existing card: pass --id of that card and --redraw (keeps its title, rating and caption
  unless you pass new ones). Writes public/images/card_N.jpg (720x720 JPEG) and the CARTOONS line in game.js.
  (--spots and --check are still accepted from old commands but ignored: no heads are marked any more.)
Never print the caption anywhere Nick can see it.
"""
import argparse, base64, io, json, os, re, sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'UPLOAD-THIS-TO-GITHUB')
GAME = os.path.join(ROOT, 'game.js')
IMAGES = os.path.join(ROOT, 'public', 'images')
FIRST_LIVE_ID = 113   # matches store.js: everything below was retired
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
    a.add_argument('--level', choices=('easy', 'medium', 'hard'), help='hidden from players; orders the deal')
    a.add_argument('--spots', help='ignored (kept so old commands still run)'); a.add_argument('--redraw', action='store_true'); a.add_argument('--check')
    o = a.parse_args()
    if o.id < FIRST_LIVE_ID: sys.exit('ids below %d are retired for good; new cards start at %d' % (FIRST_LIVE_ID, FIRST_LIVE_ID))
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
        lm = re.search(r'level: "(\w+)"', old); level = o.level or (lm.group(1) if lm else 'medium')
        game = game.replace(old, '  { id: %d, %slevel: "%s", title: %s, image: "%s", correct: %s },\n' % (o.id, flags, level, title, img, cap))
    else:
        assert o.title and o.rating and o.caption and o.level, 'new card needs --title --rating --caption --level'
        end = game.index('\n];\n', game.index('const CARTOONS'))
        game = game[:end] + '\n  { id: %d, %slevel: "%s", title: %s, image: "%s", correct: %s },' % (o.id, FLAGS[o.rating], o.level, js_str(o.title), img, js_str(o.caption)) + game[end:]
    im = load_image(o.image)
    im.save(os.path.join(IMAGES, img), 'JPEG', quality=84, optimize=True, progressive=True)
    open(GAME, 'w', encoding='utf8').write(game)
    print('saved', img, '(redraw)' if m else '(new)')

if __name__ == '__main__': main()
