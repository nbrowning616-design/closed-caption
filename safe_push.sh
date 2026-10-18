#!/bin/bash
# Push the current branch to main only when nobody is playing.
# Waits until the live game reports 0 connected phones on two checks 60 s apart.
# Usage: ./safe_push.sh [max_wait_minutes]
URL=https://closed-caption.onrender.com/status
MAX=${1:-240}
start=$(date +%s); quiet=0
while :; do
  body=$(curl -s --max-time 60 "$URL")
  phones=$(echo "$body" | python3 -c "import sys,json; print(json.load(sys.stdin)['phones'])" 2>/dev/null)
  now=$(date +%s); mins=$(( (now-start)/60 ))
  if [ -z "$phones" ]; then echo "$(date +%T) status unreadable: $body"; quiet=0
  elif [ "$phones" = "0" ]; then quiet=$((quiet+1)); echo "$(date +%T) nobody playing ($quiet/2)"
  else quiet=0; echo "$(date +%T) $phones phone(s) connected — holding"; fi
  if [ "$quiet" -ge 2 ]; then
    cd "$(dirname "$0")" && git fetch -q origin main && git merge-base --is-ancestor origin/main HEAD && git push -q origin HEAD:main && echo "PUSHED $(git rev-parse --short HEAD)" && exit 0
    echo "push failed"; exit 1
  fi
  [ "$mins" -ge "$MAX" ] && { echo "gave up after $MAX min"; exit 3; }
  sleep 60
done
