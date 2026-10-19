# Closed Caption — daily cartoon batch (runbook)

Nick's decision (Oct 18 2026): grow the deck to **1,000 cartoons**, all in ONE house style, by having Claude drive
**his own signed-in ChatGPT** in the browser on his computer (no API key), as a daily scheduled batch.
He must **never see any real caption** — never print, quote or summarise one in any message to him.

Progress lives in `CARTOON_PROGRESS.md` (one line per item). Read it first; append to it as you go.

## Each run
1. Clone the repo, read this file, `CARTOON_PROGRESS.md`, the BRAND section of `REVIEW.md`, and the top of
   `CARTOON_REDRAW.md` / `CARTOON_NEW.md` (house style, sign rule, setups to avoid, paused categories).
2. Reach the browser on Nick's computer: the built-in browser (Claude desktop app) first, else Claude in Chrome.
   If neither can be reached: tell Nick in one line ("Today's cartoon batch couldn't run: your computer or the Claude app
   was off. It'll try again tomorrow.") and stop.
3. Open https://chatgpt.com in a new tab. If it isn't signed in, or asks for a password, verification, CAPTCHA or
   payment: stop and tell Nick in one line. Never type a password or solve a CAPTCHA.
4. Work through the queue, **one prompt per new ChatGPT chat**, up to **20 images a run**. Stop early when ChatGPT says
   the image limit is reached (note the time it gives in the progress file).
5. Queue order:
   a. `CARTOON_REDRAW.md` Part 1, then Part 2 (redraws keep their card number and real caption).
   b. `CARTOON_NEW.md` (60 new).
   c. Then Claude writes NEW premises itself, following CARTOON_NEW.md's rules: one odd situation, someone reacting
      with a straight face, room for many captions, nobody obviously talking. Mix ~40% Family, 35% Standard,
      25% After Dark; ~1 in 5 with a large readable sign as a foothold. Never repeat a setup already in the deck or
      in `CARTOON_PROGRESS.md` (keep the one-line premise there). Keep the paused categories paused. No real people,
      brands, logos, characters or copyrighted designs. After Dark = PG-13: a little risqué or bathroom humour, varied
      (office, dating, divorce, hangovers, HR, bad decisions); never sexual content, never minors.
   Every prompt ends with the house-style sentence used in those files.
6. Getting the picture out: when the image has finished (not the blurry preview), run JavaScript in the page that
   finds the newest generated `<img>` in the last assistant message, draws it on a canvas at 900×900 (centre crop),
   and returns `canvas.toDataURL('image/jpeg', 0.85)` in chunks of 90,000 characters (call once for the length, then
   once per chunk). Join the chunks into a `.b64` file in the workspace. Don't download through the browser.
7. Check every picture yourself (open it with Read) before it goes in:
   - house style: black ink line + soft grey wash on white, no colour, not comic/3D/photo/painterly;
   - no caption, no speech or thought bubbles, no stray words (a sign only when the prompt asks for one, readable);
   - matches the premise; faces and hands not mangled; no real logos or recognisable characters.
   One retry in the same chat with a short correction ("Redraw: no colour" etc.). Still wrong → log it as `skipped`
   with the reason and move on.
8. Add it: `python3 tools/add_cartoon.py ...` (see the script's header). New cards take the next free id.
   For a new card write the real caption the way the deck's captions are written: short, specific, dry, trusts the
   reader; the line that makes the picture land. Vary it (REVIEW #16): mostly 4–10 words, ~15% at 11–16; different
   shapes and speakers; at most 1 in 10 uses a name or "Sir/Ma'am". It must be clearly better than an average
   player's caption but not so polished it gives itself away. Never show it to Nick.
9. After the batch: run the server once (`node server.js`, check it starts with no errors), commit
   ("Cartoon batch: N redrawn, M new"), and push with `./safe_push.sh` (it waits until nobody is playing).
10. Tell Nick in two lines: how many were added or redrawn today, the deck's total, how many to go to 1,000.
    No captions. Mention anything he has to do (sign in, etc.).

## Counting toward 1,000
Count the active cards in `CARTOONS` (game.js) that are not retired (ids below 47 are retired and never dealt).
