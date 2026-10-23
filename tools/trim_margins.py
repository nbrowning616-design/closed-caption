"""Trim wide empty paper margins from deck cartoons so the drawing fills the frame (QA: 68 cards drew in <50% of it).

usage: python3 tools/trim_margins.py [--apply] [ids...]
Crops each card to its ink box plus a small margin (aspect kept between 4:3 wide and 2:3 tall), saves it back at
<=720 px wide, and moves its "Need a nudge?" circles (card_meta.json) to the same spots. Cards already tight are left.
"""
import sys, os, json
import numpy as np
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); G = os.path.join(R, 'UPLOAD-THIS-TO-GITHUB')
IMG = os.path.join(G, 'public', 'images'); MP = os.path.join(G, 'card_meta.json')
apply = '--apply' in sys.argv; only = [int(a) for a in sys.argv[1:] if a.isdigit()]
meta = json.load(open(MP))
import re
imgs = {int(a): b for a, b in re.findall(r'\{ id: (\d+),[^}]*?image: "([^"]+)"', open(os.path.join(G, 'game.js')).read())}
ids = list(imgs)
done = 0
for cid in (only or ids):
    if cid not in imgs: continue
    p = os.path.join(IMG, imgs[cid])
    if cid < 113 or not os.path.exists(p): continue
    im = Image.open(p).convert('L'); W, H = im.size; a = np.array(im)
    ink = a < 200
    # ignore specks: a row/column counts only with a few inked pixels
    rows = np.where(ink.sum(1) > 2)[0]; cols = np.where(ink.sum(0) > 2)[0]
    if not len(rows) or not len(cols): continue
    y0, y1, x0, x1 = rows[0], rows[-1], cols[0], cols[-1]
    m = int(0.045 * max(x1 - x0, y1 - y0))
    x0, y0, x1, y1 = max(0, x0 - m), max(0, y0 - m), min(W, x1 + m), min(H, y1 + m)
    w, h = x1 - x0, y1 - y0
    if w / h > 4 / 3:   # too wide: give it height back (centred on the drawing, inside the image)
        nh = min(H, int(w * 3 / 4)); cy = (y0 + y1) // 2; y0 = max(0, min(H - nh, cy - nh // 2)); y1 = y0 + nh
    elif h / w > 1.5:
        nw = min(W, int(h / 1.5)); cx = (x0 + x1) // 2; x0 = max(0, min(W - nw, cx - nw // 2)); x1 = x0 + nw
    w, h = x1 - x0, y1 - y0
    gain = max(W / w, H / h) if False else min(W / w, H / h)
    area = (w * h) / (W * H)
    if area > 0.80 or w > 0.88 * W: continue   # already fills the frame, or already full width (on a phone width is what counts)
    done += 1
    print('%d: %dx%d -> box %d,%d %dx%d (%.0f%% of the frame)' % (cid, W, H, x0, y0, w, h, 100 * area))
    if not apply: continue
    out = Image.open(p).convert('RGB').crop((x0, y0, x1, y1))
    if out.width != 720: out = out.resize((720, round(720 * out.height / out.width)), Image.LANCZOS)
    out.save(p, quality=88, optimize=True, progressive=True)
    md = meta.get(str(cid))
    if md and md.get('odd'):
        for d in md['odd']:
            px, py = d['x'] / 100 * W, d['y'] / 100 * H
            d['x'] = round(max(0, min(100, (px - x0) / w * 100)), 1); d['y'] = round(max(0, min(100, (py - y0) / h * 100)), 1)
            d['r'] = round(min(30, max(6, d['r'] * W / w)), 1)
if apply: json.dump(meta, open(MP, 'w'), ensure_ascii=False, indent=1)
print(done, 'cards', 'trimmed' if apply else 'would be trimmed')
