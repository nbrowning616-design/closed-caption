"""Fit a tall (2:3) redraw of a square card back onto the deck.

usage: python3 tools/tall_fit.py ID TALL.jpg [--apply]
Finds where the original square drawing sits inside the tall redraw (template match at the matching width),
reports the match score and vertical offset; with --apply writes public/images/card_ID.jpg as 720x1080 greyscale and
moves the card's "Need a nudge?" circles (card_meta.json odd x/y) to the same spots in the tall picture.
"""
import sys, json, os
import cv2, numpy as np
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G = os.path.join(R, 'UPLOAD-THIS-TO-GITHUB')
cid, tall = int(sys.argv[1]), sys.argv[2]
orig = os.path.join(G, 'public', 'images', 'card_%d.jpg' % cid)
T = Image.open(tall).convert('L')
tw = 720; th = int(round(T.height * tw / T.width)); T = T.resize((tw, th), Image.LANCZOS)
O = np.array(Image.open(orig).convert('L'))
if O.shape[0] != O.shape[1]: print('SKIP not square', O.shape); sys.exit(2)
t = np.array(T)
best = (-1, 0, 1.0)
for sc in (0.9, 0.94, 0.97, 1.0):   # the redraw may shrink the drawing a little to fit the new frame
    w = int(720 * sc); o = cv2.resize(O, (w, w), interpolation=cv2.INTER_AREA)
    if w > th: continue
    r = cv2.matchTemplate(t, o, cv2.TM_CCOEFF_NORMED); _, mx, _, loc = cv2.minMaxLoc(r)
    if mx > best[0]: best = (mx, loc, sc)
score, (x0, y0), sc = best
print('score %.3f offset x %d y %d scale %.2f tall %dx%d' % (score, x0, y0, sc, tw, th))
if '--apply' in sys.argv:
    out = T.resize((720, 1080), Image.LANCZOS) if abs(th - 1080) > 2 else T
    sy = 1080 / th
    out.convert('RGB').save(orig, quality=88, optimize=True, progressive=True)
    mp = os.path.join(G, 'card_meta.json'); meta = json.load(open(mp))
    m = meta.get(str(cid)) or {}
    odd = m.get('odd') or []
    for d in odd:
        px = x0 + d['x'] / 100 * 720 * sc; py = (y0 + d['y'] / 100 * 720 * sc) * sy
        d['x'] = round(px / 720 * 100, 1); d['y'] = round(py / 1080 * 100, 1); d['r'] = round(d['r'] * sc, 1)
    if odd: meta[str(cid)]['odd'] = odd; json.dump(meta, open(mp, 'w'), ensure_ascii=False, indent=1)
    print('applied', len(odd), 'circles')
