# Nightly drawing — queue mode (from Oct 21 2026)

The premises are already written, judged and ordered: `drawing/queue.json` (610 new cartoons + 64 redraws of thin
early cards, as of Oct 21). A nightly run does NOT write premises; it draws the next items in order.
`CARTOON_STYLES.md` is still the art direction for judging every picture. Everything in `CARTOON_BATCH.md` about
safety, checking pictures, captions and pushing still applies; this file replaces its steps 4, 5 and 8.

## Rules that never bend
- Nick must never see any real caption: never print, quote or summarise one in any message to him.
- The ChatGPT account is shared with Nick's wife (Adrienne). Only open and use chats in the **Cartoons** project.
  Never open, move, rename or delete any other chat. Never change settings. Never type a password, never solve a
  CAPTCHA, never buy anything (no upgrade, no Pro), never create accounts.
- The drop-box key is in the scheduled task's instructions. Never write it into this repo or any file in it.
- Draw only at night (the task fires about 1 am ET) so Adrienne's daytime image allowance is untouched.
- Push only with `./safe_push.sh` (waits until nobody is playing), never while an image is in flight.

## Each night
1. `python3 drawing/next.py --count` → how many are left. `python3 drawing/next.py` → next name + prompt.
2. In the built-in browser, open the Cartoons project page:
   https://chatgpt.com/g/g-p-6ad8d6b462f48191b6ef0d26cedb4729/project (composer reads "New chat in Cartoons").
   Every image is a NEW chat started from that page, so it lands inside the project.
3. Run this with javascript_tool (fill NAME, PROMPT, KEY). It returns at once; the page keeps working, then hands
   the finished picture to the game's drop-box page:
   ```js
   (async()=>{const N='NAME'; const t=PROMPT_AS_JSON_STRING;
   for(let i=0;i<20 && !document.querySelector('[contenteditable="true"]');i++) await new Promise(r=>setTimeout(r,500));
   const ed=document.querySelector('[contenteditable="true"]'); ed.focus(); document.execCommand('insertText',false,t); await new Promise(r=>setTimeout(r,1000));
   document.querySelector('[data-testid="send-button"],button[aria-label*="Send"]').click();
   await new Promise(r=>setTimeout(r,4000)); let im=null; for (let i=0;i<260;i++){ const imgs=[...document.querySelectorAll('img')].filter(x=>x.naturalWidth>500 && /Generated image/.test(x.alt)); const busy=/One last tweak|Creating image|Thinking/.test(document.body.innerText); if (imgs.length && !busy){ im=imgs[imgs.length-1]; break;} await new Promise(r=>setTimeout(r,1000)); } if(!im) return; const b=await (await fetch(im.src,{credentials:'include'})).blob(); const bm=await createImageBitmap(b); const c=document.createElement('canvas'); c.width=bm.width; c.height=bm.height; c.getContext('2d').drawImage(bm,0,0); const d=c.toDataURL('image/jpeg',0.92); location.href='https://closed-caption.onrender.com/intake.html#k=KEY&n='+N+'&d='+encodeURIComponent(d); })(); 'started'
   ```
   Before running it, check the page URL contains `g-p-6ad8d6b462f48191b6ef0d26cedb4729` (the Cartoons project).
4. `CC_KEY=KEY drawing/get.sh NAME` (waits up to ~5 min). If it times out, look at the ChatGPT page: if it says the
   image limit is reached, stop drawing for the night (note the time it gives) and go to step 7.
5. Look at `drawing/work/NAME_s.jpg` with Read (and the full `NAME.jpg` if needed). Judge it against
   `CARTOON_STYLES.md`: one of the five styles; black and white; 2–3 odd details; no text, bubbles or signature;
   matches the premise; faces and hands fine; nothing that looks like a famous character, flag, logo or brand;
   no nudity of any kind (Family and Standard cards especially); nothing that reads as a memorial or tragedy.
   One retry at most (new chat from the project page, prompt plus one short correction; save as NAME + "b", e.g.
   `c539b`, and use `"src": "c539b.jpg"` below). Still wrong → `{"NAME": {"skip": "reason"}}`.
6. For each good picture, write its entry in `drawing/work/caps.json` (format at the top of `drawing/ingest.py`):
   - **caption** (new cards only): the real caption, the way the deck's captions are written — short, specific, dry,
     trusts the reader; mostly 4–10 words, ~15% 11–16; at most 1 in 10 uses a name or "Sir/Ma'am"; clearly better than
     an average player's but not so polished it gives itself away. Never shown to Nick.
   - **odd** (every picture, redraws too): 2–3 "Need a nudge?" pencil circles — see `drawing/BRIEF_odd.md`.
   - **decoys** (new cards only): 5 house fakes rated 2–5 — see `drawing/BRIEF_decoys.md`. Never better than the real.
   - **word** (new cards, about 1 in 11): a plain concrete noun that appears in the real caption (turkey, mailbox) —
     the round's "must use this word" card.
   Ingest every ~8 pictures: `python3 drawing/ingest.py drawing/work/caps.json`, fix anything it reports as NOT
   ADDED, then start a fresh caps.json.
7. When done (limit reached, or 40+ drawn): `node server.js` boot check in UPLOAD-THIS-TO-GITHUB, commit
   ("Cartoon batch: N new, M redrawn") including `drawing/handled.txt`, `./safe_push.sh`.
8. Tell Nick in two short lines: how many added tonight, the deck total (cards in CARTOONS with id ≥ 113), how many
   to go to 1,000. No captions.
