# Closed Caption — next build plan (decided with Nick, Oct 16 2026)

Live: closed-caption.onrender.com (Render free plan, auto-deploys from `main`).
Code: `UPLOAD-THIS-TO-GITHUB/` — `game.js` (rules), `server.js` (WebSocket server), `polish.js` (caption tidy + spelling), `words.txt` (word list), `public/index.html` (whole phone UI).
Current version (commit d83e248) is working and was tested: everyone writes, the app picks the Closed Caption, the dealer steals, mulligan vote, typing never wiped, zoom viewer, 20-second warning, spelling "Did you mean…?".

Nick's feedback after playing: "The game is fantastic… the bones and mechanics are really great, now it's just really trying to get perfect." Tone to aim for: strategy, wit, humor, entertainment, a touch of competition — beautifully simple, clearly made by someone clever who plays games.

## Build all of these in one pass

1. **Biggest bluff shout-out.** On the answer screen, the fake caption with the most chips glows gold, with a line like "Lilah fooled 3 people." Ties: share it.
2. **More time on the answer screen.** No auto-advance; only the dealer (or host, or a stand-in if the dealer is offline) moves to the scoreboard. Add a clear "who fooled whom" summary.
3. **No repeat cartoons across games.** The host's phone keeps the seen cartoon ids in localStorage and sends them when creating a game; the server skips them until the whole deck has been played, then starts over. Rooms reset on server restart, so this must live on the phone.
4. **Choosable seating order.** In the lobby the host arranges the seats (up/down or drag) and picks a direction (left or right). The deal and betting order follow it.
5. **Mulligan = cartoon violence.** Random "executions" of the rejected cartoon: punched across the screen, torn in half, set on fire, flushed, stomped, put through a shredder. Synth sound effects and vibration. Keep the "MULLIGAN!" word and the quip.
6. **Steal = big dramatic moment.** After the dealer picks, every phone plays a 5–7 second sequence: screen dims, drum roll plus suspense music, a cartoon hand hovers and fakes grabs over several chips, then snatches the chosen one. Gloat line, e.g. "Got you, buddy. It's mine now." (rotate several). The victim's phone shakes and vibrates. The dealer's own screen shows the same show.
7. **Steal scoring (Nick's rule):** if the dealer steals a chip that was on the **correct** caption, the dealer gets **+1**. A chip stolen from a wrong caption scores nothing. The victim loses that chip's points as now. The dealer's revenge (+4 when no chip is left on the real caption) stays. Update the rules screen and the scoring settings.
8. **Real caption face-down: planned 15%, no streaks.** At game start, plan which rounds have the real caption face-down: about 15% of the planned rounds (round to nearest, at least 0), never two rounds in a row, positions shuffled. For "first to X" games, plan in blocks of 7 rounds (1 per block on average). Mulligans keep the round's plan. Keep the lobby setting (10/15/20/30%) feeding this.
9. **Caption scrub — built-in rules only (Nick chose no AI or outside service).** Extend `polish.js` mechanical fixes so grammar never gives the real one away:
   - your/you're: "your welcome/going/a/an/the/not/so/never/always/being/kidding/fired/right/wrong" → "you're …"
   - its/it's: "its a/an/the/not/been/so/just/all/time/over/fine/ok/okay/like/about/going/getting/clearly/really/always/never" → "it's …"
   - then/than after comparatives ("better/more/less/worse/rather/bigger/smaller/older/younger/faster/longer/other then") → "than"
   - could/would/should/must of → have; alot → a lot; "who's" possessive misuse left alone
   - Question mark: if the caption (or its last sentence) starts with who/what/when/where/why/how/is/are/am/was/were/do/does/did/can/could/would/should/will/won't/have/has/any and ends in ".", change to "?"
   - Keep spelling as a "Did you mean…?" suggestion (unchanged). Grammar beyond these rules is left alone.
   - Run every real caption through the same rules and confirm none change unexpectedly.
10. **Hall of Fame flags.** *(Superseded: now Frame It; Nick, Oct 19 2026: no limit per game — one pick per round, framed by a majority of the other players.)* Each player gets **one flag per game**. Plant it on any caption except your own, during the answer screen or the scoreboard. **One flag = a "tip of the hat"** (the writer gets a gold flag next to the caption and a small moment on screen). **Two or more flags = inducted into the Hall of Fame**: gold frame, confetti, every phone celebrates. **No points** — honor only, so it stays sincere. Flags can be planted on the real caption too.
11. **Hall of Fame card.** For an inducted caption, generate a polished magazine-style image: the cartoon, the caption set underneath in a classic serif, the credit line "Caption by Lilah · Inducted October 2026 · Closed Caption Hall of Fame". A share/save button (Web Share API, falling back to download). Also list the night's inductees at the end of the game.
12. **End-of-game awards (quick slides before final scores):** Best Liar (most chips fooled), Sharpest Eye (most correct chips), Moon Shooter, Most Robbed (most chips stolen), Caption of the Night (most flags).
13. **Small touches:** when the real caption gets zero chips, a deadpan "The truth had no friends." A gentle length meter while writing ("The real ones are short") plus the hint "The real ones are short and dry."

## Later (not this pass)
- Permanent online Hall of Fame across games: needs a small database (the free Render plan forgets everything when it sleeps). Options: a paid Render plan with a disk, or a free hosted database. Decide with Nick.
- TV mode (one shared screen shows the cartoon and chips; phones stay private).
- More cartoons — 37 is small, so regulars will start remembering real captions. Nick makes the images in ChatGPT; captions are chosen one card at a time with tap-to-answer options.

## How to work
- Nick knows almost nothing about computers: plain words, no jargon. Tap-to-answer questions with an "Other" option.
- Test before pushing: the multi-player WebSocket simulation and phone-size Playwright screenshots (390×844) of every screen; check typing is never wiped.
- Commit as Claude <noreply@anthropic.com>, push to `main`, wait ~3 minutes, confirm the live site shows the change.


## Adding a cartoon — every time, no exceptions (Nick, Oct 18 2026)
The deck is headed for ~400 cartoons. Every new cartoon gets this in the same update:
1. The image in `public/images/card_N.jpg` and its line in `CARTOONS` (game.js) with a Claude-written real caption.
2. Or in one step: `python3 tools/add_cartoon.py --image pic.jpg --id N --title "..." --rating family|standard|afterdark --caption "..."`
   (writes the image and the CARTOONS line). No heads to mark: the game takes no photos (Nick, Oct 19 2026).

## The finale (built Oct 18 2026)
Winner (and the Remote) → one awards slide → **end credits** → **Tonight's Gallery** (the dealer's tap on the cast list opens it). Every caption framed
tonight (they all beat the real one). 2+ frames: everyone votes, never for their own; ties → more frames, then a coin flip.
The winner is **Caption of the Night**: a short, quiet moment on every phone at once (~5 s) — the framed card lands,
the rosette is pinned on, the brass plaque is engraved ("Caption by NAME · Caption of the Night · Month Year"), and it is
hung in The Gallery for good on the clean, untouched cartoon. One save button (the framed card), which opens the phone's
share sheet to text. No photos, no misprint (removed Oct 19 2026 — Nick: "it just doesn't work").
Code: finale.js (show, vote screen, memorial), game.js openFinale/voteFinale/resolveFinale.
