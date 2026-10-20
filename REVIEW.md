# Closed Caption — critical review (Oct 18 2026)

## Nick's decisions (Oct 18 2026)
- Do EVERYTHING, in 3 passes: all Must-fixes, then all Should-fixes, then Nice-to-haves. Test each pass, push between passes (never on a game night).
- Hosting: a free uptime pinger first (no paid plan yet).
- #30 steal +6: KEEP STACKING (his rule stands; do not change).

Six reviewers, each on one area: rules and server, phone screens, animations and sound, first-time player, cartoons and captions, launch-readiness. Items marked "tested" were reproduced. Test scripts were in the session scratchpad (not kept).

## MUST FIX — broken, unfair, or embarrassing

1. **Double-tapping the dealer's button skips whole stages** (server.js ~336–374). The advance message has no stage, so a late second tap lands on the next screen: skipped betting, a free +4 for the dealer, Frame It counted with 0 picks. Fix: the phone sends the stage and round with every advance and the server ignores mismatches; the button locks after one tap. Tested.
2. **Anyone can hijack another player's seat** (server.js 123, 150–156; every phone receives every player id at game.js ~1270). The intruder sees that player's caption and bets. Fix: a private seat key known only to that phone, and a separate public id for everyone else. Tested.
3. **Expert Mode leaks the real answers** (game.js ~490–497, 1301; server.js 224). The lobby Gazette sends Gallery captions, which are the real answers in Expert Mode, and phones can inject captions that then get dealt. Fix: hide dealable cartoons' Gallery captions during Expert games, and never deal phone-supplied captions. Tested.
4. **A phone that moves to a new room leaves a ghost that freezes the old game, and those rooms are never cleaned up** (server.js 120–148, 453). Betting waited on a ghost forever; 20k creates took memory to 317 MB on a 512 MB plan. Fix: mark the old seat disconnected, one room per phone, rate-limit creates, expire idle rooms. Tested.
5. **Any server error kills every game on the site** (server.js `later()` has no error guard and there is no catch-all). Fix: guard the delayed steps, keep the server alive on error, and add free error alerts (Sentry).
6. **A restart or update wipes every game, with a misleading message** ("That room doesn't exist"). Every push to main restarts the server. Fix: never push during game nights, and let the host's phone restore the room. At minimum, show "The server restarted — sorry."
7. **Free-plan cold start: a 30–60 s blank Render screen for the first person at the party.** Fix: Render Starter ($7/month), or a free uptime pinger hitting /healthz every 10 minutes.
8. **Silent on iPhones with the ringer switch off** (most people at a party). Fix: set `navigator.audioSession.type = 'playback'` on the first tap, and resume audio after the phone locks.
9. **The headshot sheet pops up by itself, covers the QR code, and stays open into round 1 over the cartoon** (selfie.js ~138; nothing closes #sheet on a phase change). Fix: never auto-open it; close sheets on every phase change; offer the headshot after the player's first round win.
10. **The zap heists strobe the whole screen at 4–6 flashes a second** (heists.js 486–491, 606; UFO, Magnet, Mosquito). This is a seizure risk. Fix: one flash only, and flicker the chip instead of the screen.
11. **Reduce Motion is ignored by the script-driven moments**: face gags, confetti, flashes, Poobah. Fix: one shared check that falls back to a fade plus the banner.
12. **The steal show is 7.6 s every round; the short version is never used** (index.html 2072, steal.js 286, server.js 253). That is about 75 s of thieves per night. Fix: the full heist for the first steal (or a steal off the real caption), ~2.5 s after that; the server lock matches.
13. **A first-game tip states the wrong steal rule** (guide.js 17 says "+1"; the real rule is the chip's points). Fix the text.
14. **Badge pop-up covers the real caption at the punchline** (popBadgesFor ~2218). Fix: show it 2–3 s later, or as a strip under the card.
15. **The deck is far too small outside After Dark**: family 9 and standard 14 cartoons, so the second game repeats. Several are mis-rated: 82–85, 67, 68 and 81 should be family; 56 → adult; 70 → spicy. Re-rating takes family to 16 and standard to ~18. Growing the deck is the real launch blocker. The home and How to Play demos also show deck cartoons (47, 50, 51, 54) — use cartoons made only for the demo.
16. **The real captions share one house voice.** All are 4–9 words, ~11 use a two-beat "setup. Punch." shape, and many address someone by name or "Sir/Ma'am". Regulars will learn to spot it. Fix: vary the length (~15% at 11–16 words), shape and speaker; at most 1 in 10 uses a name.
17. **Weak or confusing real captions — suggested rewrites:**
    - 73: "The four is from her husband."
    - 76: "We should have started this club in 1958."
    - 77: "Relax. He's never needed more than three."
    - 62: "I did say I was looking for something long-term."
    - 59: "Skip ahead, dear. We don't have that kind of time."
    - 83: "It says here you were a seven handicap."
    - 53: "This is why I drive."
    - 54: "Shoes are four dollars. Per pair."
    - 71: "You only had to take off the shoes."
18. **No privacy notice, but the game takes selfies, including of kids.** No /privacy page, and the sheet says nothing about where photos go. Required before any listing (and US children's privacy law, COPPA). Fix: a one-paragraph privacy page, one reassuring line on the selfie sheet, and a "Delete my photo" button.
19. **The pitch reads as "Fibbage with cartoons".** The one-line explanation is screen-reader-only. The home loop never shows chips, the face-down card, the steal or Frame It — the things that make this game different. Fix: put the line on screen; add a chips → flip → stamp beat to the home loop; lead with "a bluffing game, not a joke contest."
20. **Voice call has no TURN relay** (voice.js 15, STUN only). It fails on many mobile and hotel networks — "works at home, fails at Grandma's." Fix: Cloudflare or Metered free-tier TURN before pitching remote play. Also label it "Playing apart?" and warn about feedback when players share a room.

## SHOULD FIX — polish that judges notice

21. **The end of the night runs about a minute of watching.** Fix: Poobah build-up to ~4 s, the gap to ~2 s, misprint landing by ~6 s into the press show. Also block the Gallery button until the Poobah finishes (scheduleGrandPoobah doesn't check state.finale), and show tied Poobahs side by side.
22. **The Poobah's gong hits an empty stage**; the throne arrives 3.3 s later. Fix: bring the throne in during the drumroll so the hat lands on the gong.
23. **The round-winner face gag plays every round and the 25 feel alike.** Fix: play it only when the lead changes, on a +4 round, or on the last round; otherwise a 1 s stamp.
24. **The 8-player answer reel takes 10 dealer taps.** Fix: group the "Nobody bit" captions into one step.
25. **Losing your turn after 10 s offline (switching to Messages, phone locks) — and the host role silently moves after 60 s.** Fix: 30–45 s, plus "Waiting for Lilah's phone…" and a note to the returning player.
26. **Typing someone's name takes their offline seat** (prank risk). Fix: ask the table, or require 30 s offline, and announce it.
27. **Two tabs on one seat kick each other forever** (11 swaps in 6 s). Fix: on close code 4000, stop reconnecting and show "Playing on another device." Tested.
28. **The steal can get stuck if the dealer is idle.** Fix: let the host pass for the dealer; auto-pass after 45 s. Tested.
29. **Unfair deal when someone leaves mid-game** (the host can deal twice). Fix: end the game or skip anyone who has already dealt. Tested.
30. ~~DECIDED: keep~~ **The dealer can earn +6 from one steal** (the chip's points plus the +4 revenge, because the steal emptied the real caption). This conflicts with Nick's stated "keep it stacking" choice for the revenge, so it needs Nick's decision.
31. **A player can type the real caption word for word** (regulars will remember). Fix: reject near-matches with "Too close to the real one."
32. **Finale updates may not reach phones for 7 days** — the cache version list in server.js 33 is typed by hand and leaves out finale.js and heads-spots.js. Fix: build the version from every public/*.js.
33. **Caption tidy errors**: "Who I am is none of your business." gets a "?"; "How about no." becomes a question; ALL-CAPS captions lose capitals on names (polish.js 65).
34. **One-caption round gives away the answer.** Fix: require at least 2 captions before writing can end early.
35. **Wrong room code bounces you home and wipes your typing**; the home screen then greets a stranger by name. Fix: stay on Join with an inline error.
36. **Guests in the lobby are never pushed to the 1-minute demo.** Fix: a big "Watch the demo while you wait" card for first-timers; show the host "3 of 5 watched."
37. **Full rules page is ~840 words and introduces 17 named concepts.** Fix: 6 steps plus the scoring card, with "Extras you'll discover" folded away.
38. **Tips and banners cover what matters**: the betting buttons, the steal line, and the late writer's timer. Fix: never show a tip over the action bar; let tips fade on their own.
39. **Long names cut mid-word and wrap** (20-character limit). Fix: ~12 characters with a counter; show the first name in banners.
40. **8 players: the captions start below the fold on the betting screen.** Fix: one scrolling row for the bettor order; drop the separate "Your chips" rack.
41. **Mixed terms**: "The reveal" is used for two moments; "votes" and "chips" are both used; "flags/Hall of Fame" still shows up in places. Fix: one term each.
42. **Steal instructions are 5 lines long.** Fix: "Tap a chip to steal it. Off the real one = their points become yours."
43. **The "biggest bluff" shout-out fires for 1-chip, four-way ties.** Fix: only at 2+ chips and at most 2 names.
44. **Frame It: the real caption is tiny grey text; the list scrolls with no hint.** Fix: show the real caption as its own bold card, and fade the bottom edge of the list.
45. **Heists are drawn with emoji, which look cheap and differ by phone brand.** Fix: draw the most-used thieves and the fire flames in the house ink style.
46. **The fire mulligan reads as a black rectangle.**
47. **No master volume or limiter; the Poobah reveal clips** (peak 1.1, ~80× a tap). Fix: one shared limiter, Poobah −6 dB.
48. **Huge invisible effect layers (2200 px spotlights and rays) strain 2–3 GB iPhones.**
49. **Four heists say the same line twice** (T. rex, Seagull, Bee, Unicorn).
50. **The first load is heavy**: 1.36 MB, ~27 s on a weak signal; 20 scripts block the page. Fix: defer the scripts and lazy-load the show scripts and fonts.
51. **Room codes are guessable**: 100k guesses in 3.8 s, so strangers can walk in. Fix: limit wrong codes, add a host "lock room" option, allow kicking mid-game. Tested.
52. **Texted invite shows a bare link; home-screen icon is a blurry screenshot.** Fix: og: preview tags, manifest.json, apple-touch-icon.
53. **Same-setup overload**: six clinic cartoons, about seven "schlubby husband" cartoons, four "old people and sex", four weddings. Pause these categories. Also: 82's sign is unreadable on a phone, and the family set is all grey pencil while After Dark is colour, so the style gives away the rating.
54. **The home screen gives away 4 of the 9 family cartoons.**
55. **Voice/joke copy**: "Beep boop. Get rekt." is off-voice, "Finders keepers" appears twice, and all five Poobah slogans tell the same joke.

## NICE TO HAVE

56. A 2-player variant (a house-written decoy caption), or make "3–8 players" obvious.
57. Host screen: just a pre-filled name and "Create the room" (the timer belongs in the lobby).
58. Toast when a late joiner adds a round.
59. Accessibility: allow pinch-zoom, keyboard and Enter on caption cards, aria-live on "Your turn", and 44 px tap targets.
60. Load the Gallery serif font up front; keep the picked music going after reveals; sync the award slides from the server clock.
61. Cartoon images → WebP (~half the size), with a version in their URLs.
62. Before building any permanent online Hall of Fame: keep households separate (strangers' names would otherwise show).
63. A simple usage counter and a landing page; a custom domain (~$15/year). Google Play $25 once via PWA; Apple $99/year and likely to reject a web wrapper.
64. Remove dead settings and code (pointsStealCorrect, pointsClosedLate, crowns, uuid, and others).

## Costs in one place

| Item | Cost |
|---|---|
| Render Starter (no sleep) | $7/month — or a free pinger |
| TURN relay for voice | free tier |
| Error alerts (Sentry) | free tier |
| Domain | ~$15/year |
| Google Play | $25 once |
| Apple App Store | $99/year |

## STATUS (Oct 18 2026, evening) — read this first in a new chat
- LIVE on main: Pass 1 #8 #9 #10 #11 #12(phone) #13 #14 #15 #16 #17 #18 #19 #20(best effort) and #1 (double tap), #5 (crash guard), 45 s away grace (#25 part), every public/*.js busts the cache (#32), /status endpoint.
- 27 new cartoons added (ids 86–112, faces in heads-spots.js). Real captions are hidden from Nick — never show them to him.
- Lobby deck choice: Family / Standard / Everything.
- DEPLOY RULE: never push to main while anyone is playing. Use ./safe_push.sh (waits for /status phones = 0 twice, 60 s apart). Nick said: auto-check and update in real time, no need to ask.
- Still open: Pass 1 #2 #3 #4 #6 #7 (server worker branch, not merged yet); Pass 2 in progress (screens, animations, load/icons); Pass 3 after.
- Rejected cartoon: the superhero garage sale (real Marvel/DC logos) — redo prompt with invented gear was given to Nick.

## BRAND (Nick, Oct 18 2026) — every word, sound and moment must fit this
Sneaky clever, never trying too hard. For people who like a little intellectual challenge, a little creativity or humor, and friendly competition; banter and teasing expected. Tongue in cheek but never on the nose, cheap or sloppy; never so eager it gets annoying. Think The Office: the joke is slipped in, never announced. The model for everything is the perfect caption — short, specific, dry, trusts the reader. Not for everyone, and that's good.
Working rules: no winking (no LOL, exclamation-mark pileups, emoji doing the joke's job); understatement over volume; big moments (steal, Poobah, the presses) earn their size, everything else stays quiet; the phone is the straight man — the people at the table are the comedy.

## STATUS UPDATE (Oct 19 2026, early) — read first in a new chat
- LIVE (main): everything listed above plus: Pass 2 screens/animations/loading, new settings (timer 2-min/custom/none; dealer Steal/No steal/Kitchen sink; once/2x/3x around/first to 20), name remembered (cookie) + "Join as X", brand copy pass (133 lines), tone pass (quiet reveals, ink thieves/gags, 8 new heists + 8 new face gags, short steal stamp, callbacks, Poobah plaque), steal cost (+1 to owner of a chip stolen off a FAKE), Frame It majority of other players (the one-frame-per-game limit was REMOVED Oct 19 — see below), 12 real captions tightened (≤12 words).
- STILL OPEN: REVIEW #2 seat keys, #3 Expert Mode leak, #4 ghost rooms/room expiry/rate limits, #6 restore after restart, #7 keep-awake GitHub Action, plus #24 server (group "Nobody bit"), #36 server (demo_watched), #26–29, #31, #33(partly done in tone pass), #34, #51, #56, #62–64, gzip compression. A cancelled worker left UNTESTED WIP on branch server-fixes-wip (based on old main) — use as reference only; redo on current main.
- CARTOONS: Nick wants ~1000 total, all in ONE house style (black ink + soft grey wash, New Yorker), ~1 in 5 with a readable sign as an easier foothold. Prompts: CARTOON_REDRAW.md (62 redraws) and CARTOON_NEW.md (60 new). Nick chose: drive HIS ChatGPT in his browser (no API key), as a daily scheduled batch; he must never see real captions. Chrome extension/built-in browser were not reachable from the old chat.

## STATUS UPDATE (Oct 19 2026, morning) — read first in a new chat
- DONE (server fixes, tested with a scripted 3-phone game, a restart test and headless phones): #2 private seat keys; #3 Expert Mode (Gazette hides dealable answers; only server-stamped frames are dealt, frames from before Oct 19 16:00 UTC grandfathered); #4 old seat goes offline when a phone moves, lobby rooms close after 10 min empty, any room after 8 h idle, 6 new rooms/min per address, 1,500-room cap; #6 every phone keeps a sealed (encrypted) copy and a restarted server gets the room back exactly where it was; #7 GitHub Action pings /healthz every 10 min; #24 "Nobody bit" grouped into one step; #26 name takeover only after 30 s offline, never in a locked room, table is told; #27 second device: first one stops reconnecting; #28 host can skip a stuck steal, auto-pass after 45 s; #29 nobody deals twice when someone leaves; #31 real caption typed out is refused (strict match); #34 writing needs 2 captions (timer gives 30 s twice, then goes on); #36 host sees "N of M watched the demo"; #51 12 wrong codes per 5 min then a 2-min wait, host "Lock the room"; gzip.
- FIXED BUG: 12 real captions had a stray word-count tag like "(8)" left at the end (a giveaway). Removed.
- Optional: set Render env vars GALLERY_KEY and RESTORE_KEY to long random strings (the repo is public, so the built-in fallbacks are guessable). Not urgent for family play.
- NOT DONE: mid-game kick (#51 part), #56, #62–64.

## STATUS UPDATE (Oct 19 2026, afternoon) — Gallery in the lobby, no frame limit
- Nick: "There can't be any limit on framing. If they are good, they are good." The one-frame-per-player-per-game limit is GONE (game.js frameSpent/frameUsed, myFrameSpent, the "You've used your one frame" line, rules/guide/README copy). Still true: one pick per player per round, never your own caption, never the real one, and a caption is framed when a majority of the other players pick it (inductNeed). Tested: a 3-phone game where the same player framed in round 1 and round 2 and both were framed.
- Nick: "You should be able to view your gallery in lobby, and when clicking on them they zoom." The lobby (host and guests) has a Gallery strip: framed thumbnails (this phone's cc_gallery plus the room's deck), "See all" opens the full wall. Tap any thumbnail (strip or wall) and it zooms to a big framed card (cartoon + caption + plaque: author, month, framed by). Tap, X, Esc or swipe down to go back; swipe sideways for the next. Reduce Motion: fades only. Code: gallery.js Gallery.zoom/zoomAt, index.html lobbyGalleryHtml/galleryList.
- Expert Mode: the server sends state.galleryHidden (every Gallery cartoon that could still be dealt, plus the one on the table until its answer is out). The lobby strip, the wall and the menu count leave those out ("N captions under a sheet until their cartoons are dealt").

## STATUS UPDATE (Oct 19 2026) — photos removed (Nick: "taking the selfie and the gallery misprint — it just doesn't work. Remove all that.")
- The game takes no photos. Gone: the headshot sheet (selfie.js), the face detector (vendor/face-api.js, models/), `set_face`, `/face/CODE/ID`, game.faces, the round-winner face gags (heads.js, heads-pack1/2.js, winAct), the Caption of the Night misprint ("To the presses", 20 misprints, the misprint picture), heads-spots.js and its start-up warning. Old phones forget any saved headshot (cc_face) on load. Privacy page says no photos.
- After a round: the scoreboard's quiet stamp (winner's chip + name, "Again." callback), ~1 s, no gag.
- Grand Poobah: a throne with a blank brass nameplate is carried in under the drumroll; on the gong the hat drops and the name goes on the plate. Ties: two/three hats over chips, as before.
- Caption of the Night (~4 s): the framed card is hung on its wire, the rosette pinned, the brass plaque engraved "Caption by NAME · Caption of the Night · Month Year", then "In The Gallery. For good." One button: Save the card. The server field is `finale.showAt` (was `pressAt`); `finale.act` is gone.
- maxPayload is 32 KB (was 64 KB for headshots). Phones send their Gallery in pieces under ~24 KB (a full 300-entry Gallery was ~76 KB in one message, over even the old limit). A too-big message now just closes that socket (ws 'error' handler) instead of reaching the uncaught-exception handler.
- Adding a cartoon: no heads to mark; tools/add_cartoon.py no longer needs --spots (ignored if passed).
## STEAL SHOW REWORK (Oct 19 2026) — Nick: "a little fast to pay off, and look low quality"
- Cut from 31 heists to 11, all redrawn as inline SVG in the house style (black ink line + grey wash on white; the chips are the only colour): The Claw, The Butler, The Magician, Grandma, The Cat, The Auctioneer, The Raccoon, The Accountant, The Mime, The Frog, The Octopus. game.js HEISTS = heists.js ACTS, same order; the deck still deals without repeats (and drops stale indices from a restored older room).
- Beats (full, 9.6 s): panel + the doomed chip circled in pencil → the thief arrives and stops, a look → the grab → made the dealer's own → set back → held: chip circled again, "Lilah's chip. Margaret's now." → the gloat line, given ~2 s to land. Short stamp 3.5 s. server.js lock: full 9600+1200, short 3500+400. No screen flashes or shakes; Reduce Motion = still panel + cross-fades on the same beats.
- #10, #11, #45, #48 (layers are panel-sized), #49 (22 gloat lines, all unique, no exclamation marks) addressed for the steal.

- Steal (Oct 19 2026): both shows hold two still beats — "Lilah's chip." before the grab, "Margaret's now." after. Full 12.4 s, short 6 s; server hold matches.
## RATING (Oct 19 2026) — Nick: replace the military ranks with a chess-style rating
- Gone: Cadet/Captain/Commodore/Admiral, rockets-as-rank, promotions (state.promotion, the rank broadcast, insignia, the promotion overlay, rules/README copy). Badges are awarded exactly as before.
- The rating: every phone starts at 1,200; first 3 games provisional (K 48), then K 24. At game over the server (rating.js) treats every pair at the table as a match (higher final score wins, equal = draw), Elo expected score from the ratings the phones reported at the start, change = K/(n−1) × Σ(S−E). Everyone seated when round 1 was dealt is rated; someone who left counts on the score they left with (leaving = resigning); late joiners are not rated that game. Deterministic. Sums to ~0 among settled players; provisional players move faster, so the table's sum drifts a little while someone is new.
- Phones keep it in cc_career (rating, games, hist, lines, applied); old careers migrate (badges kept, start at 1,200). Each phone applies its own row once, keyed by room + game number (reload-safe).
- Titles: Candidate 1,400 · Master 1,600 · Senior Master 1,800 · Grandmaster 2,000 (shown once the 3 provisional games are played).
- Verdict lines: public/verdicts.js (shared by server + browser; PLACEHOLDER lines until the real pool lands — any count per key works). The server picks every line so all phones match: never one that phone has seen (phones send 6-char hashes of seen lines, max 1,500 ≈ 13 KB, under the 32 KB limit), never two the same at one table; all seen → least recently seen. Opener/favorite/underdog use the table's combined seen lists.
- Where: an opening card (~3.5 s, round 1 only; the writing clock is given the time back); "The ratings" screen after the awards and the winner, before the Grand Poobah — the dealer/host taps on (verdicts_done; the Poobah is timed from that tap); the lobby "Your rating" card (sparkline, badges) → sheet (how it works, titles, every badge; also menu → My rating and badges); ratings next to names in the lobby; home + How to Play pitch "Think you’re clever? Prove it. / Ranked like chess, but judged by friends."

## IMPROVEMENT REVIEW — Nick's decisions (Oct 20 2026) — read first in a new chat
Six fresh reviewers (party-game designer, first-time player, comedy editor, growth, reliability/accessibility, awards
juror) played it and proposed 41 changes; Nick answered each. Full list with sources: scratchpad review/consolidated.json.
YES (build all): 1 steal show never hints at the answer (full heist on the night's first steal, then ~1 in 4 at
random; never show the caption) · 2 dropped phones (straight back into the game, heartbeat + auto-reconnect, save on
every caption/bet, reconnects never count against the Wi-Fi limit) · 4 cartoon pinned large while reading/betting/
reveal, small copy above the text box while typing, real caption revealed under the full-size cartoon · 5 Frame It
becomes a frame button on captions during the reveal (no separate screen; full show for the night's first frame,
quick plaque after; still no limit) · 6 flip and reveal auto-advance (dealer can pause/back); cut the repeat 'You
stole' banner · 7 blind bets placed simultaneously, chips drop together; late chip stays turn by turn · 8 steal moves
to right after the blind bets, before the flip · 9 2 points per person fooled; first-place tie broken by most fooled
· 10 face-down card pays 5 per blind chip (Shoot the Moon 10); rules say it's real ~1 round in 7 · 11 last trip around
= 'The Late Edition', double points; ties broken by fooled, then framed · 12 trimmed finale: winner, one awards slide,
Caption of the Night; the Grand Poobah is folded into the awards as 'Best Liar' (Nick's choice) · 13 END CREDITS (see
below) · 14 verdicts shown one player at a time, read aloud by the dealer; thin overused props, refresh dated sports refs
· 15 plain words (1 chip / Both chips — double; 'Skip this cartoon?' with confirm; four stage words Write · Bet · Flip ·
Score in one colour) · 16 lobby = code/QR, names, pinned Start ('Start the game · 4 here'), rest behind 'Room options';
guests get 'You're in, X'; rating card + round-1 rating intro only after a finished game · 17 one visual style
everywhere (serif for moments/captions, one UI font, one paper colour, ink, one accent, gold only for the plaque;
badges and big moments redrawn in ink) · 18 the flip is the hero beat (held silence, card turns on every phone at once,
one sound, blind chips light up; first in the home demo) · 19 AUDIENCE ONLY for players 9–12 (no pairs): watch, bet one
chip a round on a side scoreboard · 20 TV screen ('Show on TV', read-only big screen) · 21 Holiday Table deck (30–40
family-safe) + home banner mid-Nov; next drawing batches steered there · 22 home page: 'Free. No app, no sign-up.' and
a hook headline instead of 'Think you're clever? Prove it.'; demo cartoon redrawn in house style · 23 warm invite
landing ('Join Nick's table — 3 here', pitch, code ticked, name focused; ended game → 'Host your own' / demo) · 24
recap and Gallery pictures carry the address + small QR; share text includes the link · 25 CARTOON QUALITY (see below)
· 26 'Ha' / 'Groan' reactions on captions during the reveal (no points) → 'Most Groans' award · 27 quoted awards 'Best
Lie' and 'Nobody Bit' replace two stat awards · 28 recap gives the reason for every point · 29 accessibility pass (15 px
min for instructions, 44 px targets, contrast, colour-blind-safe seat colours + second cue, emoji-safe chip letters,
tips never cover content, screen-reader focus kept + stage announcements, automatic axe check) · 30 bug bundle (double
Next skip, 'someone new joined' for returners, same-name seat takeover, host handoff notice/return, long-word overflow,
'Most Framed' one-person tie wording, double period) · 31 REAL RECORDED SOUNDS (~12 effects + one brushed-jazz loop,
royalty-free, <400 KB) · 32 press page + page title + new link-preview image; NO custom domain for now · 33 solo
'Cartoon of the Day' with its own daily cartoons · 34 come-back hooks (new-cartoon count, 'Same table next week?'
calendar invite, rating restore code) · 35 'I'm in for another' + host sees '3 of 4 want another' · 36 small tables
(3–4): one house decoy caption per round, default twice around · 37 'first to N' finishes the trip around the table;
round counts only whole trips · 38 short games move the rating less · 39 situation-aware round-end lines, 4–5 gloats per
thief — and Nick: "do even more" (bigger pools everywhere) · 40 FaceTime/Zoom play stated up front; host picks 'Already
on a call' vs the game's voice · 41 private stats tally (no names/captions) + privacy line.
NO: 3 (keep-awake service or paid plan — leave as is).

STEAL REDO (Nick, unprompted): "the steal doesn't work." Redo it in the cartoons' own language: a funny little loose,
hand-drawn line-cartoon character (playful, wobbly pen, original) that interacts with another line drawing to steal the
chip. The text/caption at the end of the steal goes by too fast to read: hold a real beat on a genuinely funny caption.

END CREDITS (Nick: "the actual payoff"): the night ends like Animal House's closing credits — a freeze-frame per player
and an epilogue earned from how they played. Rule from Nick's scoring of 10 samples: OPEN WITH WHAT THEY DID TONIGHT
("After fooling Bob four times tonight, Dottie went on to sell Bob the Brooklyn Bridge. Twice. They still exchange
Christmas cards."), then one simple picturable future, then a short concrete kicker as the last beat. Misses: multi-step
logic, niche sports metaphors, no link to tonight. Approved samples are in scratchpad credits/scores.json.

CARTOON QUALITY (Nick): players say the drawings are a little too plain. Keep the pencil, bare-bones look Nick prefers,
but every cartoon needs 2–3 odd/interesting things so a table can go in more than one direction; a cartoon with only one
possible joke line is out (audit the deck: redraw or cut). Queued premises get reworked to this bar before drawing.

## STATUS (Oct 20 2026) — #2 dropped phones and #41 private stats: DONE (branch, not merged)
- #2: a phone with a seat goes straight back to the table on load ("Back to the table…"; Home never shows for a seat from
  the last 2 h; an older seat waits on Home behind a full-width "Back to the game" while the phone checks the table).
  Heartbeat: server pings every 10 s (dead sockets dropped within ~20 s); a phone that hears nothing for 20 s reconnects
  at once (calm paper "Reconnecting…" banner, then "Back at the table"). Captions, bets/undo, the steal and frame picks
  carry a cid and wait in a phone outbox (kept across reloads) until the server acks; the room keeps its recent cids in
  the sealed copy, so nothing lands twice, even across a restart (after a restart the phones re-send the last 3 minutes).
  The sealed copy is refreshed on every caption/bet/steal/frame pick. Reconnect/restore never count toward or get
  blocked by the per-address limits (only wrong codes typed on Join: 40 per 5 min). A refused seat: red "Can't reach
  the table, retrying", a retry every 4 s (up to 3 min after a restart, while another phone brings the room back).
  Address = first public x-forwarded-for entry (the last can be Render's own hop, which would lump every phone together).
- #41: stats.js + /stats?k=STATS_KEY (404 otherwise). Set STATS_KEY on Render to use it. Resets on redeploy unless
  DATA_DIR is a disk. QR codes carry via=qr, invite links via=link. One sentence on privacy.html.
- Tested (Playwright, phone size, host + 3 phones, scratchpad drop/e2e.js + edges.js): full game with a steal; a phone
  black-holed mid-round with a pending 2-chip bet (calm banner at ~20 s, server marks it offline, back 0.3 s after the
  network returns, bet landed once); server restart mid-round with the host's copy gone (red banner, retried, everyone
  back in ~3 s, the bet placed while the server was down landed once, re-sent bets answered as repeats); a reload with
  a pending bet (never passed through Home, bet landed once); a lost ack on a late chip (re-sent, answered as a repeat,
  one chip); stale/closed seats, invite to another room, limits vs reconnects; tally counts. 44 checks, all pass.
