# Closed Caption — daily cartoon batch (runbook)

Nick's decisions (Oct 19 2026): the whole old deck (ids ≤ 112) and every old Gallery frame are retired for good. The new
deck is built from scratch toward **1,000 cartoons**, using ONLY the five styles Nick approved — read `CARTOON_STYLES.md`
first; it is the art direction and overrides anything else. Claude drives **Nick's own signed-in ChatGPT** in the
built-in browser of the Claude desktop app on his computer (no API key), every day, **as many as ChatGPT allows**.
He must **never see any real caption** — never print, quote or summarise one in any message to him.

Progress lives in `CARTOON_PROGRESS.md` (one line per item). Read it first; append to it as you go.

## Each run
1. Clone the repo; read `CARTOON_STYLES.md`, this file, `CARTOON_PROGRESS.md`, and the BRAND section of `REVIEW.md`.
2. Reach the built-in browser (tools `mcp__remote-devices__Claude_Browser__*`; load them all with one ToolSearch).
   If it can't be reached: tell Nick in one line ("Today's cartoon batch couldn't run: your computer or the Claude app
   was off. It'll try again tomorrow.") and stop. Fall back to Claude in Chrome only if the built-in browser is
   unavailable and Chrome is signed in to ChatGPT.
3. Open https://chatgpt.com. If it isn't signed in, or asks for a password, verification, CAPTCHA or payment: stop and
   tell Nick in one line. Never type a password, never solve a CAPTCHA, never change ChatGPT settings.
4. Write the scene list for today yourself: new premises, never a setup already in `CARTOON_PROGRESS.md` (keep a one-line
   premise there for every card). One odd situation, someone reacting with a straight face, room for many captions,
   nobody obviously talking. Mix ~40% Family, 35% Standard, 25% After Dark (PG-13: a little risqué or bathroom humour,
   varied; never sexual, never minors). About 1 in 10 with a sign that IS the setup. No real people, brands, logos or
   characters. Rotate the five styles evenly. Follow the background rule in `CARTOON_STYLES.md` (almost always bare;
   style 2 is the barest; a little ink adds a lot; ~1 in 8 a nice background).
5. One prompt per **new chat** (open https://chatgpt.com fresh each time), using the template in `CARTOON_STYLES.md`.
   Keep going until ChatGPT says the image limit is reached (note the time it gives in the progress file) or 40 images.
6. Getting the picture out (ChatGPT's page can't send files anywhere, so it hands them to the game's private drop-box):
   run this in the page with javascript_tool once the image is finished — it waits for it, then opens the drop-box page:
   ```js
   let im=null; for (let i=0;i<45;i++){ const imgs=[...document.querySelectorAll('img')].filter(x=>x.naturalWidth>500 && /Generated image/.test(x.alt)); const busy=/One last tweak|Creating image|Thinking/.test(document.body.innerText); if (imgs.length && !busy){ im=imgs[imgs.length-1]; break;} await new Promise(r=>setTimeout(r,1000)); }
   if(!im) 'not ready'; else { const b=await (await fetch(im.src,{credentials:'include'})).blob(); const bm=await createImageBitmap(b); const c=document.createElement('canvas'); c.width=bm.width; c.height=bm.height; c.getContext('2d').drawImage(bm,0,0); const d=c.toDataURL('image/jpeg',0.92); setTimeout(()=>{ location.href='https://closed-caption.onrender.com/intake.html#k=KEY&n=NAME&d='+encodeURIComponent(d); }, 50); 'sending '+d.length }
   ```
   KEY is the drop-box key given in the scheduled task's instructions (never write it into the repo). NAME = c<id>.
   Then collect it from the workspace: `curl -s -o pic.jpg "https://closed-caption.onrender.com/intake/get?k=KEY&name=NAME"`
   and empty it: `curl -s "https://closed-caption.onrender.com/intake/clear?k=KEY&name=NAME"`.
7. Check every picture yourself (open it with Read) before it goes in: one of the five styles and nothing else; black
   and white; bare background (unless it's a deliberate nice-background one); no caption, bubbles or stray words; matches
   the premise; hands and faces not mangled; no logos or recognisable characters. One retry in the same chat with a short
   correction ("Redraw: less background, no grey"). Still wrong → log it as `skipped` with the reason.
8. Add it: `python3 tools/add_cartoon.py --image pic.jpg --id N --title "..." --rating family|standard|afterdark --caption "..." --level easy|medium|hard` (next free id: one above the highest in CARTOONS; 237 and up after Oct 19 2026). Level (hidden from players; it orders the deal): easy = a visual gag or a sign, gettable in seconds; medium = needs a moment; hard = subtle, you have to think. Aim for roughly 30% easy, 45% medium, 25% hard. Write the real caption the way the deck's captions are written: short, specific, dry,
   trusts the reader; the line that makes the picture land. Vary length (mostly 4–10 words, ~15% at 11–16), shape and
   speaker; at most 1 in 10 uses a name or "Sir/Ma'am". Clearly better than an average player's caption but not so
   polished it gives itself away. Never show it to Nick.
9. After the batch: run the server once (`node server.js`, check it starts with no errors), commit
   ("Cartoon batch: N new"), and push with `./safe_push.sh` (it waits until nobody is playing).
10. Tell Nick in two lines: how many were added today, the deck's total, how many to go to 1,000. No captions.

## Counting toward 1,000
Count the cards in `CARTOONS` (game.js) with id 113 and up.

## Standing direction (Nick, Oct 19 2026, evening)
"Keep going until 1000 made. Keep cycling in new agents with great senses of humor. Need slightly different voices and
drawings to keep it fresh but familiar."
- Every round of ~120 premises comes from a NEW set of 4 premise-writer voices (never reuse a voice two rounds running).
  Voices used so far: absurdist, naturalist, minimalist, satirist · sitcom (work/family), animals, well-read winks, sight
  gags · dry understatement, late-night monologue, small-town/outdoors, surreal deadpan.
  Ideas for later rounds: retired cop, kindergarten teacher, sportswriter, ER nurse, wedding DJ, Borscht-belt comic,
  tech-support lifer, art-school dropout, food critic, flight attendant, Little League coach, historian.
- Fresh drawings, same five styles: every premise also carries a "composition" (wide shot / close-up / from above /
  from below / cutaway / silhouette / line-up / rare crowd / ~1 in 8 a nice background), so the deck doesn't settle
  into one medium-shot look. The five styles stay exactly as approved.
- Interleave voices in the queue so neighbours feel different; nods to news/sports/movies stay occasional.
- Every card added also gets its variety tags: `python3 tools/card_meta.py --id N --style S --voice V --title "..." --scene "..."`
  (S = 1–5 style number, V = the premise-writer voice). The deal uses them so no two cards in a row share a creator,
  a style, a setting or a subject (Nick: "always well shuffled ... no really similar in a row").
- When ChatGPT hits its daily image limit: ingest, commit, safe_push, and schedule a resume for when it resets.
