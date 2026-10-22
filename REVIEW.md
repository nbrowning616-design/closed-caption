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
  one chip); stale/closed seats, invite to another room, limits vs reconnects; tally counts. 45 checks, all pass.

## STATUS (Oct 21 2026) — both branches merged into main (not pushed)
- Screens branch (lobby, home, invites, sharing, recap reasons, accessibility, plain words) + rules/dropped-phones branch
  (bets at once, steal before the flip, new payouts, The Late Edition, first to N, rating scaling, bug fixes, reconnects,
  private tally) are both on main. Conflicts kept both sides: the new bet flow with the plain words (First bets / Last
  bets, "1 chip" / "Both chips — double"), the calm/red/teal connection banner in the contrast-safe colours, the warm
  invite text counted as via=link (lobby QR via=qr), /room/CODE and /stats side by side, recap steal line + Late Edition
  line, new point defaults in "Reset to defaults". After the merge: read-aloud stage lines, the flip hint ("One at a
  time, from the dealer's left") and the betting dealer's lines no longer describe the old turn-by-turn first bets.
- Tested on the merged build (Playwright, 390x844): full games with 3 phones (2 times around, Late Edition rounds 4-6),
  4 phones (dealer bets and steals, Late Edition 5-8), 5 phones (first to 20, a phone closed for 26 s and back with
  "Cal's back.", a reload mid-bet, never through Home, bet landed once; trip finished before the crown) and 8 phones;
  every round: all bettors at once, no chip visible before the drop, one drop moment, the steal before the flip with the
  face-down caption not yet sent, flip after the steal show, last chips one at a time, every recap row's reasons add up
  to its points; "I'm in for another" -> "2 of N want another" -> Deal again -> lobby. tools/a11y_check.js (updated for
  the new order): all clear. The rules branch's e2e (33) and edges (12) on the merged build: all pass.

## ROUND 2 — Nick's decisions (Oct 20 2026) — read first in a new chat
YES: R1 rejection slips · R2 the trophy = THE REMOTE (replaces every Grand Poobah mention) · R3 "Previously on…" (plus a few more continuity touches) ·
R5 the monkey · R8 odds lines · R10 table vs. the cartoonist · R11 called shot (needs much better hit/miss lines) ·
R15 pencil-circle nudges (circle one odd detail per tap, shuffled per phone; data = card_meta "odd") ·
R16 "The kids are in bed" / "One came back down" deck switch · R17 framed lines get published in the Daily (after the Daily exists; writer opts in once) ·
R18 sealed scores for the Late Edition, standings read last to first · R28 "Heading out": early leaver sees own credit, read later "in absentia" ·
R30 LAST CALL only (no finish-time estimate).
R22 CHANGED by Nick — Editor's-note rounds: (a) exact word count = real caption's length, one cartoon every 6–8 turns;
(b) "Must use the word: ___" (a concrete word from the real caption; card_meta "word"), about 1 in 10–12 cartoons. Never both on one card.
NO: R4, R6, R7, R9 (no envelope, no superlatives: "too corny, too gimmicky"), R12, R13 cross-examination, R14 footnotes, R19 private tells, R20 ledger,
R21 reading voices, R23 journal-article recap, R24 passing the reading around, R25 acceptance speech, R26 sitcom night titles, R27 house laws, R29 humor matches.
Round 3 of ideas requested (Oct 20); same rule: only ideas most of 5 judges call award-worthy.

## STATUS (Oct 21 2026) — build-round: the ROUND items (branch build-round, not merged, not pushed)
Everything from writing to the scoreboard. The END OF NIGHT (finale, awards, credits, trophy, verdicts) is another branch.
- #39 lines: `public/lines.js` (122 pools, ~590 lines: the comedy pass's stock lines by situation plus the Round 2 pools).
  The server picks every line (game.js `pickLine`), every phone shows the same one, and nothing repeats in a night until
  its pool is used up. Gloats about the steal come only after the reveal; during the steal, nothing hints whether the chip
  was on the real caption. Rebuilt by scratchpad `rb/build_lines.py`.
- #18 the flip: a held second, then the face-down card turns on every phone at once (server-timed), one card-flip sound,
  the blind chips on it light up. #6: the flip moves on by itself after ~6.5 s, and the reveal reel moves on by itself
  (~3-5 s a caption, ~5 s for the real one). The dealer can hold, go back, or skip to the recap; if the dealer is away
  the host can. The red "You stole…" banner is gone.
- #5 Frame It: a small frame button on each caption once it's been shown on the reveal (no separate screen, no limit,
  same majority rule). The night's first frame gets the full framing moment on every phone (the recap's Scoreboard
  button waits for it); later frames get a ~3 s plaque.
- #26 Ha / Groan on every caption while it's read and revealed. No points. Counts appear only after the answer.
  Kept per caption in the game record.
- New steal (6 hand-drawn thieves, `public/thieves.js`, built from scratchpad anim/src): the full show (~6.5 s) for the
  night's first steal, then about 1 in 4 at random (never because of where the chip was), else ~2 s. The closing
  caption is held ~2.5 s. The old heists (heists.js) are deleted. Skip gags: 50 hand-drawn gags (`public/skips.js`,
  ~440 KB, fetched once a phone has a seat). The server deals the gag so every phone plays the same one on the same beat.
- R1 rejection slips: a fake caption with no chips and 3+ Groans. A slip "from The Editors" goes to its writer's phone
  (25 form lines), plus a Rejections drawer in the menu with a running count (localStorage cc_rejections).
- R8 odds: one line, only for events rarer than 1 in 20 (true odds from the rules and the table size), at most once a game.
- R10 table vs. the cartoonist: blind Ha taps (before the answer) decide each round, one line on the reveal, the tally
  ("The table 6, the cartoonist 3.") on the recap and in the record. Each phone keeps the table's best game
  (localStorage cc_table_best).
- R11 call your shot: after locking in, secretly name one person. +3 (doubled in the Late Edition) if they bet on your
  caption; 16 hit and 16 miss lines (sharper set, Oct 21).
- R15 nudges: the first taps on "Need a nudge?" circle an odd detail in pencil, with its question (card_meta "odd",
  shuffled per phone). Then the general tips. Cards without "odd" go straight to the tips.
- R22 Editor's notes: "Exactly N words." (N = the real caption's length) every 6-8 turns; "Must use the word: X." about
  1 in 10-12 (only if card_meta "word" is really in that card's caption). Never both, never on the first two cards of a
  night. The caption box shows whether yours fits, and one that doesn't can't be locked in. Word count: split on spaces,
  punctuation stripped, hyphenated = one word.
- R16 "The kids are in bed" (host menu, only for games started on Family): the full deck from the next deal (family
  off, spicy on), with one quiet card on every phone. "One came back down": Family again at once, and a grown-up cartoon
  nobody has written for yet is swapped. The setting carries into the next game in the room.
- Card data: "odd" and "word" go to phones only for the card being written (never before it's dealt, never the list).
  No house decoys exist yet, so the note's decoy rule has nothing to apply to.
- No TV screen exists on this branch. The flip/reel timing is in the room state, ready for one.
- For the end of night: `game.record` = { captions: [{round, target, writerId, writer, caption, ha, groan, haBlind,
  chips, framed}], real: [{round, ha, groan, haBlind}], table: {table, cartoonist, draws}, rejections: [...],
  calls: [{round, callerId, calledId, hit, pts}], odds }. Also each history entry: reacts, calls, tvc, odds, slips, frames.
  Sent to phones from the answer on.
- Tested (Playwright, 390x844, full games): 3 phones (Family, kids to bed and back down), 5 phones (a skip gag, a
  rejection slip on its writer's phone only), 8 phones (a rejection slip, an Editor's note round). All pass (41-42
  checks a run): the flip and reel move on by themselves
  and holds work, no Ha/Groan counts before the answer, the thief on stage, the flip waits for the show, frames on the
  reveal (full, then a plaque), called-shot lines, pencil circles, lines from the server, recap reasons add up, no page
  errors, clean server log. Rounds at 5 phones take ~70-90 s. Unit checks (rules, lines, notes, kids, odd data): all pass.
  tools/a11y_check.js: all clear.

## STATUS (Oct 21 2026) — END OF THE NIGHT: branch build-night (not merged, not pushed)
- #12 trimmed finale, one overlay every phone plays together from the server clock (night.js works it out once at game
  over; public/ending.js draws it): the WINNER (each player's rating change on one line, the Remote changing hands) →
  ONE AWARDS SLIDE → END CREDITS → the CAST LIST → Caption of the Night. ~players × 6.5 s + ~15 s. The dealer/host
  taps on (or it moves by itself); the cast list's tap opens Caption of the Night. "Watch the credits again" and
  "Save your credit" on the final page. The verdicts screen is gone: each verdict line is the pull quote on its credit (#14).
- END CREDITS: a freeze-frame per player (their best caption tonight on its cartoon, the name in a closed-caption box),
  the epilogue (credits.js: Nick's 9–10 samples given the opening clause his rule asks for + the 150-line pool, 25
  triggers), the verdict as a pull quote. Every trigger is computed from the game record (submission order and skip
  votes are logged by night.js); each player gets their most distinctive trigger, no two alike when it can be helped;
  Family games use family lines only; no line comes back for any phone at the table (seen-line hashes, like verdicts).
  Credits roll from last place up; the winner's is last. THE MONKEY: a seeded random bettor every round, same chip
  rules; if anyone found the real caption fewer times than it did (over the same rounds), one line + an ink chimp with
  a dart under the cast list, and "The monkey ... Himself" in the cast.
- #27 the one awards slide: Best Lie (quoted, who fell for it), Best Liar (what the hat measured), Nobody Bit (quoted,
  gently: framed ones first), Most Groans (only with groan tallies), Sharpest Eye if there's room; max 4.
- THE REMOTE replaces the Grand Poobah everywhere (screens, copy, sound, badge art, rules, demo note, recap picture:
  its second card is Best Liar now). Inline ink drawing: a boxy 1980s remote, one CC button, masking tape on the battery
  cover. Lobby: "Dottie has the Remote." (+ "Two straight." / "…isn't here to defend it."); tap to read the tape (every
  winner's name and date). Winner beat: "First game at this table. The remote goes to…", "Bob, hand over the remote.",
  "Retained. Nobody touches the remote.", joint custody for ties. Each phone keeps cc_tables (holder, tape, first
  cartoon, games, a short summary of the last game); a table = most of tonight's names played its last game; phones send
  the records that fit, the most recent wins; the room also keeps its own after "Deal again".
- R3 PREVIOUSLY ON CLOSED CAPTION (round 1, a returning table, instead of the rating card; writers get the 10 s back):
  last time's winner, last time's Caption of the Night small under its cartoon (left out in Expert games), one grudge
  (22 templates from the last game's facts, only about people here tonight), "And now, the rematch." Extra continuity:
  the table's anniversary shows its first cartoon ("It has not gotten easier."), once a year; the Remote's streak.
- R10 read from the round branch: the cast list says "The table 6, the cartoonist 3." and keeps the table's best night.
- R18 SEALED SCORES: from the Late Edition's first deal, phones get the totals as they stood when it began; the
  scoreboard says "Scores are sealed until the end." + your own points with reasons (the recap still lists everyone's
  points with reasons). The ending then opens with the standings read from last place up, one name a beat (2.8 s), then
  the top two held together (3.6 s) before the winner. (No TV screen exists on this branch; the view carries `sealed`.)
- R28 HEADING OUT (menu, with a confirm): your own credit plays now from your play so far, with Save the card (a
  1080×1350 picture); the table hears "Bob has left the building."; the seat leaves the turn order at once (past the
  45 s grace; host passes on); at the end the credit is read with everyone else's, "in absentia" (cast list too).
- R30 LAST CALL (host's menu, with a confirm): the next trip around the table is the last one — the Late Edition,
  sealed — then the winner and the credits. Every phone shows "Last call. One more trip around."
- Tested (Playwright, 390×844): full games, then a second game at the same table: 3 phones Standard, 3 phones Family
  twice around, 5 phones Family, 5 phones After Dark twice around, 8 phones After Dark (54–79 checks each, all pass:
  beats, one awards slide, a credit per player, no repeated trigger or line, family lines only, no line back from the
  first game, the cast list's tap → Caption of the Night, the lobby Remote and its tape, the cold open on every phone
  with the time given back, retained/handover lines, axe on the lobby, the Remote sheet and the cold open). Edges: the
  newest table record wins, the anniversary, a late joiner's credit, a phone reloaded mid-credits (same beat), a server
  restart mid-credits (back in the ending), the table record after (8/8). Late game: Last Call, heading out (own credit,
  saved card, "left the building", Done → Home), sealed scoreboards, standings from the bottom, in absentia, axe on all
  of them (19/19). tools/a11y_check.js plays to game over now and checks the winner, awards, a credit and the cast: all clear.
- MERGING WITH build-round (dry run, nothing touched): 12 small conflicts. game.js: scoresAt line (keep their
  scoreLines call, drop the Poobah comment), awardBadges (keep their badge lines, drop the Poobah comment), exports (no
  closeVerdicts; they dropped moveToFraming). server.js: the seal tag (theirs + `game.ending` step/done, lastCall,
  departed count). index.html: the verdicts CSS (drop it, keep their round CSS), render()'s scores cleanup and
  afterRender's game-over line (take night's Ending calls, keep their additions), renderFinal (night's). guide.js
  blocked(): union (their #boom.on, #rd-slip.on + #ending.on, #prev.on; no #awards/#poobah). fx.js: keep night's
  comment. a11y_check.js: their round steps + night's play-to-game-over ending checks. After merging, check: their
  round stamp stays off a sealed scoreboard, and Most Groans / Nobody Bit read history[r].reacts.

## STATUS — merged build (Oct 21 2026): branch merge-all = main + build-round + build-night (not pushed)
- IN: everything in the two sections above. The round: auto flip and reel, Ha/Groan, frames on the reveal, called
  shots, rejection slips, odds lines, the table vs. the cartoonist, the hand-drawn steal, 50 skip gags, pencil-circle
  nudges, Editor's notes, "The kids are in bed". The end of the night: the winner, one awards slide, end credits, the
  cast, the monkey, Caption of the Night, the Remote (no Grand Poobah text left anywhere), Previously on, sealed Late
  Edition with standings read last to first, Heading out, Last Call. Plus sharper called-shot lines (16 hit, 16 miss).
- MERGE: the 12 conflicts went as night's guide said, both sides kept. a11y_check.js plays the new round, then to
  game over through the ending.
- FIXED ON THE MERGED BUILD:
  - Sealed Late Edition leaks: the round winner's stamp line ("Takes the lead") still reached every phone in the
    sealed view, and the last writer's line could say "has a lead to protect" from the live totals. Both are kept out
    while sealed. The sealed board also keeps the round's slip notes and the next-dealer line.
  - The last round's rejection slip popped over the standings/winner at game over. It is filed at once and slides in
    after the ending (and after Caption of the Night's show).
  - Last Call: the Late Edition card showed the round's stock banner instead of "Last call."
  - A second game at the same table skipped the steal show, the flip's beats, the Late Edition card and (with the
    same caption) the slip, wherever game 1 had one: the phones keyed "already played" by room + round. The view now
    carries gameNo and those keys include it. (This was already true before the merge.)
  - First-game tips also wait for the own-credit, Last Call and kids cards. README: the end of the night.
- CHECKED: Most Groans and the credits read the round's own record (history[r].reacts): each player's groans in the
  credits = the record's, Ha counts on the freeze-frames = the record's, framed captions agree, Most Groans goes to
  the most-groaned writer with the right count. No repeats in a night: credit lines, Previously-on grudges (4 games at
  one table), called-shot lines (none until a pool of 16 is used up; a room dealt from the old 10-line pools starts a
  fresh deck; the deck survives a restart).
- TESTED (Playwright, 390x844, through the real buttons; test scripts in the session scratchpad merge/, not kept):
  3 phones Family twice around, 2 games (kids to bed and back down, sealed Late Edition, a reload mid-reel, a reload
  mid-credits, Previously on, Caption of the Night): 108/108. 4 phones Standard (Last Call after round 1, Dee heads out
  in round 2 with her credit saved, a reload mid-reel, a server restart mid-reveal, sealed scoreboards, standings from
  the bottom, in absentia): 65/65. 5 phones After Dark twice around (a skip gag, a slip, a phone closed 26 s and
  back, a reload mid-bet, a server restart mid-reveal, sealed Late Edition): 66/66. 8 phones After Dark, 2 games
  (both Editor's notes, word count and must-use word, Lock it in waits until it fits; called shots; a slip in each
  game; reloads mid-reel and mid-credits; Previously on): 101/101 (an earlier 8-phone Standard run found the game-2
  slip bug above). Every run: the ending through Caption of the Night, Most Groans checked against the record.
  Bot runs: end of the night at 3/5/8 phones x 2 games (63, 69, 81 checks), Last Call/heading out/sealed (21), edges
  (anniversary, newest table record, late joiner's credit, reload and restart mid-credits: 8), the last round's slip
  (7). Unit checks: round rules (37+44), call lines (13), end-of-night record/sealed/no-repeat (150-950 per run).
  tools/a11y_check.js: all clear. Zero page errors, clean server logs.
- NOT DONE / NOTES: no TV screen yet (the flip/reel timing and `sealed` are in the view, ready for one). The night's
  first frame gets the full ceremony once a night, so game 2's frames get the plaque (by design). Editor's notes can
  land on round 1 of a second game (the "not the first two cards" rule counts the night). Not pushed.

## "TOO CUTE?" REVIEW — Nick's decisions (Oct 21 2026, 7am) — read first in a new chat
Four reviewers (tough editor, weekly regular, first-timer, pacing designer) played the merged build; reports in scratchpad
cute/*.md. Consensus: the game talks too much (~21 game lines a round, 100+ a game), the reveal is the busiest screen, rounds
run ~4.7 min at 5 players, the full ending plays after every game. Nick approved ALL eight cuts:
1 REVEAL: each card = caption, "Written by X", who fell for it (one fixed label "Fell for it"); at most one line under the
  real caption; called-shot results, badges, table-vs-cartoonist move to the round recap; real caption waits for the dealer's tap.
2 WISECRACKS: cut ~2/3 of round patter; fixed plain labels for instructions ("Bets are closed." "Turning it over…"); locked-in
  stamp alone; waiting quips 1 round in 3; no winking parentheticals; target ≤8 game lines a round. KEEP: awards slide, the
  Remote, the monkey, odds lines, Editor's notes, Previously-on grudges, kids-in-bed / Last Call / "left the building".
3 LAST CHIPS: everyone at once, in secret, 15 s clock, one shared drop (reverses decision #7's turn-by-turn late chip).
4 WRITING CLOCK: default 90 s; dealer can add 30 s.
5 ENDING ONCE A NIGHT: full credits + cast list + Caption of the Night only after the night's last game (Last Call / "Call it
  a night"); earlier games get winner + awards (~15 s). Credits 5 s each, epilogues ~20 words, no rating line on credits.
  "Previously on" only when the table returns on a later day (>6 h gap).
6 CALLED SHOTS: plain facts ("Ann called Ben. Ben bit. +3" / "Ann called Ben. Missed."); off during a phone's first game.
7 STEAL: keep the hand-drawn thief + its one closing caption; cut waiting patter, gloats, receipts; full show night's first
  steal, then at most once a game (2 s short version otherwise).
8 NEWCOMERS: in a phone's first game no called shots, no rejection slips, ending shows winner + scores only (no rating/Remote
  talk); coach tips <12 words; rejection slips private (no public scoreboard line); Ha/Groan on the reveal only; table vs. the
  cartoonist shown once a night.
Nick then asked to hear all 32 round-3 ideas anyway (answers recorded in scratchpad round3/round3_list.json).

## ROUND 3 — Nick's decisions (Oct 21 2026, 7am; full texts in scratchpad round3/round3_list.json)
YES: R3-1 freeze-frame on your best lie (credit opens on the cartoon where you fooled the most, your fake printed under it) ·
R3-2 Corrections line at the end of Previously on · R3-5 sequel cartoons "Later that evening." (drawn in pairs; second comes back
in the Late Edition) · R3-7 the Monkey bets one chip for someone who stepped away · R3-9 public steal (pencil circle follows
the dealer's finger) · R3-10 "Don't smile." (private, ≤1 a round) · R3-11 late arrivals start level with last place · R3-12
Previously-on payoff (one storyline, one word at the reveal) · R3-15 credit sagas (~1 credit in 3 continues last time's story) · R3-19 the page tilts when the
whole table bites (rare, 2 s) · R3-26 banned-word Editor's note · R3-27 "Salted" (calm note instead of the red warning when you
bet on your own fake; stamped when someone followed) · R3-30 invite warm-up puzzle · R3-31 caption shown "in print" while
typing · R3-32 40-second wordless how-to short.
R3-8 STICKY NOTE — NO (Nick, after seeing the demo: "Too distracting for purists.").
NO: R3-14 The Regular / fern man (Nick: "great ideas, but just too much for now"), R3-3 sound captions, R3-4 pencil margin notes, R3-6 & R3-22 player names in captions/drawings (nicknames won't translate),
R3-13 Stand By, R3-16 Next time on, R3-17 Not out loud, R3-18 Don't get it, R3-20 channel flip, R3-21 practice hand, R3-23
no-show credit, R3-24 the squeeze, R3-25 late lights, R3-28 remote grab (no preference → not added), R3-29 shared phone.
Build order: the eight cuts first (build-cuts), then the round-3 YES items on top, measured against the cut targets.

## DIRECTION (Nick, Oct 21 2026, morning) — CORE FIRST
"Forget sequels for now. The bones, mechanics and UI of the program need to be perfect first. Then we can look to maybe add a
few of these great ideas." → ALL new features are PARKED: round-3 items, sequels, The Regular, sticky note, TV screen, Daily,
come-back hooks, holiday deck, small-table decoys, press page. Cartoons keep coming.
PAYOFF BEATS (Nick: "sometimes a funny comment needs another few beats to pay off. Some screens seemed too quick to pay off."
He named: the real-caption reveal (and who fell for what), the steal and skip-gag endings, and the end of night — awards,
credits, Caption of the Night). Rule for the cuts: CUT TALK, NOT PAYOFF TIME. Every line that stays gets its reading time
(words ÷ 3 s) plus a held beat of 1.5–2 s of stillness before anything moves; never stack a second line on a first that
hasn't landed; the big payoffs (the real caption, each end credit, Caption of the Night) advance on the dealer's tap with a
generous fallback (8–12 s). Time is saved from dead time instead (simultaneous last chips, 90 s clock, fewer lines,
scoreboard merged into recap, quicker transitions), never from the payoff holds.
Plan: (1) finish the eight cuts on build-cuts with this rule; (2) a fresh panel plays it hunting only for bugs, confusing
screens and bad timing; Nick approves fixes as taps.

## HOUSE PLAYERS + SOLO PRACTICE (Nick, Oct 21 2026) — build right after the cuts
Nick: "Can someone play alone against all computer captions to practice? Also a computer fill-in when only 2 or 3 players? Add
some virtual players any time just to make the game better (6 players is ideal)." Decisions:
- HOUSE PLAYERS (virtual, named, dry: e.g. Aunt Judy, The Intern): WRITE ONLY — each adds one pre-written fake caption to bluff
  among; they never bet, never score, and fooling one earns nothing. HOST PICKS 0–5 in the lobby. Lets 2 real people play.
- SOLO PRACTICE from the home page: you write a fake for each cartoon, then spot the real one among 5 captions (yours, the
  real one, 3 house fakes); score = how often you find the real one; no rating change.
- Needs a bank of ~5 good house fakes per cartoon, written ahead by writers (never generated live). Bank: card_meta "decoys".
- Nick: "For the practice version, the real one should be slightly superior or even with the next best auto-generated." The
  bank rates every house fake 2–5 against the real caption (5 = as good, never better); solo practice deals fakes rated 4–5 so
  the real one is the best or tied, never outshone; house players at the table use the same bank.

## POLISH AUDIT (Oct 21 2026) — reports in scratchpad polish/ (ui.md, mechanics.md, realworld.md)
Three auditors (visual UI, rules/edge cases, real-world phones and Wi-Fi) played the live build. Plain bugs get fixed without
asking, on top of the cuts (build-cuts), then retested with 3–8 phones. Headline bugs: game over can be undone (a joiner during
the credits, or the next dealer away 45 s); Last Call adds a whole extra trip in an "everyone deals once" game; a locked phone
can make someone deal twice and another seat never deal; the table freezes behind "3 of 3 captions in" when a phone dies
mid-writing; a Join tapped before the socket is up is lost; the pinned cartoon crowds out captions on small phones and in
landscape; overlays land on each other (skip gag under the opening/Late Edition/kids cards, nudge over the menu, slip over the
scoreboard); stamps start at scale(3) and widen the page sideways.
SERVER SLEEP (reverses #3): Nick chose a FREE OUTSIDE PINGER — he creates a free UptimeRobot (or cron-job.org) monitor on
https://closed-caption.onrender.com/status every 5 minutes. The GitHub keep-awake action ran only 12 times in ~50 h.

## STATUS (Oct 21 2026, evening) — SOFT LAUNCH build live (branch launch → main)
All eight "too cute" cuts plus the polish-audit fixes, built in two halves (rules / screens), merged, then integration-fixed
(table vs. the cartoonist counts Ha taps on fakes before the real one turns; Last Call band no longer covers Deal; "Call it a
night" note; away-last-dealer scoreboard; ending after an end-from-scoreboard). Tested: unit 88/88; Playwright through the real
buttons 3 (360x640), 4, 5 (reload mid-bet, phone closed mid-writing), 8 phones x2 games incl. Last Call and Call it a night;
a11y all clear; zero page errors. Deck checked: 389 cards, every image and card_meta entry present.
Left: credit epilogues are 17–32 words (target ~20; copy work); the night's first framing ceremony covers the reel buttons
~5–10 s (closes itself); scoreboard not merged into the recap.

## END OF THE NIGHT: CREDITS SCRAPPED → "DID YOU KNOW?" (Nick, Oct 21 2026, night)
- Scrap the end credits and the cast list. The night ends with Caption of the Night.
- New: a brief intermission "Did you know?", like the between-innings facts at a ballgame, styled as an old-school 1980s
  TV public-service announcement (our own look and sound; no real network's slogan, star or jingle). Plays BETWEEN GAMES:
  once after each game, 2–3 facts about the players, ~15 s (dealer tap to move on). At the night's end it plays where the
  credits were, then Caption of the Night.
- Tone (Nick rated 10 samples):
  LOVE — absurd consequence of real play ("Based on tonight's lying, John could sell you the Brooklyn Bridge. He already
  sold Dottie two."); fake study ("Studies show people who bet on their own caption also clap when the plane lands. Bob,
  three times tonight."); backhand for the leader ("Nick is winning. His family has been informed and is taking it well.");
  career advice from a stat ("With a lying rate of 64%, John now qualifies for a career in real estate."); fake record
  ("Before tonight, nobody had ever fallen for the same person three rounds in a row. Thank you, Margaret."); dry
  non-sequitur ("Dottie hasn't blinked since round two. We're choosing not to ask.").
  GOOD — roast for last place ("Bob is in last place, but he's in last place with real conviction.").
  NO — a plain sports stat jab ("found the real caption zero times. A club record."); compliment-then-sting about
  captions ("funniest captions… nobody believed one"); the cartoonist as a character ("has asked for privacy").

## STEAL → FLIP BOOK (Nick, Oct 21 2026, night)
The old steal shows ended too abruptly ("you don't really know what the heck happened"). New direction: an old-school
pencil flip book (pages thumbed, line boil), structure SETUP ("Nick is stealing…", ~1 s) → the BIT (3–4 s) → PAYOFF held
~2 s ("Bob's chip → Nick." + one dry line). Samples rated: B Gone Fishing (victim jumps for it, just short; "He'll say it
was bigger.") LOVE · C The Magician ("Is this your chip?" / "It was.") LOVE · A The Sneak (IOU note) GOOD.
Wants drama, sportsmanship and razzing; a funny little bit, not long enough to annoy. Did you know? shipped (ac56b43).
- (later) Nick: the flip-book steals (branch flipsteal, 8 gags) are "awful — cheap, not funny, end too quick". NOT shipped.
  New direction: ULTRA-VIOLENT comedy gore, cartoon-show style (a tame, nerdy game where a steal is a Viking warrior
  moment): the round's own pencil cartoon animates and something absurdly violent happens, apropos of nothing; red is the
  only color and it goes everywhere; the other characters stay deadpan. Every payoff needs a couple of seconds of
  stillness to digest and laugh. 5 samples (scratchpad gore/: cork 118, pop 238, anvil 133, saw 327, monster 152) sent
  for rating; payoff hold extended to ~4.5 s.

## STEAL → THE CLAW IS BACK (Nick, Oct 22 2026)
Samples Nick turned down today: cartoon gore on the round's cartoon ("doesn't make sense": the steal itself must be
shown), paint can / rubber stamp ("right idea but how is this clever"), coin flip / disguise ("too simple"), The Heist
stick figures (too sloppy, then "no way" for the elegant cut). The rule he set: the dealer spots the chip, it becomes
the dealer's chip ON THE SAME CAPTION (scoring already does this). His pick: the original Oct 17 Claw ("logical,
straightforward, and kind of fun"), plus: "occasionally pick up the wrong chip, fumble it, let it drop, then grab the
right one … creative, funny, whimsical."
Built: public/steal.js = the Oct 17 Claw (c0b5b16), full show 9 s (gloat card from 6.25 s held to the end), short 3.5 s;
about 2 full shows in 5 it grabs the decoy, lifts it, fumbles and drops it (seeded; state.steal.fumble overrides).
game.js deals one act, The Claw (thief.claw.* lines in lines.js); thieves.js no longer loaded.
