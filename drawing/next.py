"""Print the next cartoon to draw from the queue.

usage: python3 drawing/next.py          -> name on line 1, the prompt (JSON string) on line 2
       python3 drawing/next.py --count  -> how many are left (new / redraw)
       python3 drawing/next.py --info c539 -> the queue entry for one name (no caption is stored here)

An item is finished once its name is in drawing/handled.txt (drawn and ingested, or skipped).
A new card whose id is already in game.js is treated as finished too.
"""
import json, os, re, sys

D = os.path.dirname(os.path.abspath(__file__))
R = os.path.dirname(D)
q = json.load(open(os.path.join(D, 'queue.json')))
hp = os.path.join(D, 'handled.txt')
done = set(open(hp).read().split()) if os.path.exists(hp) else set()
game = open(os.path.join(R, 'UPLOAD-THIS-TO-GITHUB', 'game.js')).read()
ingame = set(int(x) for x in re.findall(r'\bid:\s*(\d+)', game))


def left():
    for it in q:
        if it['name'] in done:
            continue
        if it['kind'] == 'new' and it['id'] in ingame:
            continue
        yield it


if '--count' in sys.argv:
    items = list(left())
    print(len(items), 'left:', sum(1 for i in items if i['kind'] == 'new'), 'new,',
          sum(1 for i in items if i['kind'] == 'redraw'), 'redraws')
elif '--info' in sys.argv:
    name = sys.argv[sys.argv.index('--info') + 1]
    print(json.dumps([i for i in q if i['name'] == name], indent=1, ensure_ascii=False))
else:
    for it in left():
        print(it['name'])
        print(json.dumps(it['prompt'], ensure_ascii=False))
        break
    else:
        print('QUEUE EMPTY')
