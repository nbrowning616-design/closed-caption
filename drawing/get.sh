#!/bin/bash
# usage: CC_KEY=<drop-box key> drawing/get.sh NAME
# Waits (up to ~5 min) for picture NAME in the game's private drop-box, saves it to drawing/work/NAME.jpg,
# empties the drop-box slot, and makes a small preview drawing/work/NAME_s.jpg to look at.
# The key comes from the scheduled task's instructions. NEVER write it into this repo.
[ -z "$CC_KEY" ] && { echo "set CC_KEY"; exit 1; }
D="$(cd "$(dirname "$0")" && pwd)/work"; mkdir -p "$D"
for i in $(seq 1 100); do
  c=$(curl -s -o "$D/$1.jpg" -w "%{http_code}" "https://closed-caption.onrender.com/intake/get?k=$CC_KEY&name=$1")
  [ "$c" = 200 ] && break; sleep 3
done
echo "$c $(stat -c %s "$D/$1.jpg" 2>/dev/null)"
[ "$c" = 200 ] && curl -s -o /dev/null "https://closed-caption.onrender.com/intake/clear?k=$CC_KEY&name=$1"
python3 -c "from PIL import Image; Image.open('$D/$1.jpg').convert('RGB').resize((540,540)).save('$D/$1_s.jpg',quality=80)" 2>/dev/null
