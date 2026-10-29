# The Overhaul (Oct 29 2026): back to a simple game

Nick played a real game today and it was "pretty bad": confusing UI, way too many buttons, way too much filler and
"extra cuteness". He wants it **"more like the older version, but with the frame, the steal, the new cartoons."**
The older version = commit `d83e248` (Oct 16 2026, the build his family loved: about 150 KB of code in total, against
over 2 MB now). Use it as the reference for *feel*: one clear thing to do on every screen, few words, big cartoon.
Do NOT literally revert to it: we keep today's robustness (reconnects, seat keys, restore after restart, heartbeat,
keep-awake), today's deck plumbing and the features listed under KEEP.

Nick knows almost nothing about computers. He judges by playing on his phone at a real table.

## Nick's words today (verbatim, the source of truth)
- "Some of the captions said must be 8 words or 11 words or something like that. That needs to be all removed."
- "The opening screen where it shows something about framed or button framing … needs to be removed. The framing at the very end of the game should still stay."
- "The user interface is just way too confusing. It seems like anyone at the table can push a button and it forwards through, so if someone is a little bit slower reading, it doesn't work."
- "The betting on who guessed yours, remove all of that." (= Call your shot)
- "All the little in-between things other than the steal animation need to be removed. There's just way too much filler."
- "The tap to zoom doesn't work on the cartoon."
- "For the how to play, the cartoon is so small you can't even tell that it's a cartoon or what the cartoon is about, so the captions don't make any sense."
- "At some point, it said that I was no longer the dealer or no longer hosting the game and someone else popped it up."
- "There's just way too many buttons. We don't need who guessed who's guessed whatever."
- "The steal a chip was either too fast or it was hidden on my screen, so I wasn't able to do it. The screen then flipped through quickly. I don't know if it's the size of my phone, but some things seem to be overlapped."
- "On the opening screen for whoever's hosting the game and setting the options, it's just way too much words. It needs to be just simple buttons."
- "You should always be forced to just steal a chip. No one's going to say no. So remove that part."

## Nick's answers (tap questions, today)
- Pacing: **only the dealer moves the game forward.** One Next button, on the dealer's phone only; every other phone says "Waiting for Nick" (the dealer's name). Nobody else can skip or advance anything.
- Betting: **keep everyone betting at once in secret, chips drop together** (today's rule).
- Extras that STAY: **chess rating + the one funny line per player after each game**, and **the skip-cartoon vote (without the gag animations)**.
- Extras that GO: **voice call**, **practice alone**.
- How to Play: **keep the self-playing demo, rebuilt around a big readable cartoon** and only the features that remain.

## KEEP — the core round
1. **Writing.** Same cartoon on every phone, BIG. Tap to zoom must actually work (fix it). Everyone writes a fake, the dealer too. Spelling/punctuation tidy-up (polish.js) stays. Writing timer per the lobby setting. Waiting phones see who's still writing. One small "Skip this cartoon" vote (≥50% → next cartoon with one plain line, no gag animation).
2. **Reading.** The captions plus the face-down one (the Closed Caption: usually a player's, the real one ~15% of rounds). The dealer reads aloud and taps Next; nobody else can move it on.
3. **Blind bets,** everyone at once, in secret, 1 or 2 chips (Double Down rules as today); the clock as today (≥20 s, ends early when everyone's in; the one-tap +20 s stays). Chips drop together.
4. **The steal — forced.** The dealer MUST steal one chip. No pass/skip/"no thanks" button, no auto-skip timer that rushes the dealer. The dealer's phone shows one plain instruction ("Tap a chip to steal it") with big tappable chips, fully in view on every phone size (no overlap, nothing hidden under other things, nothing that scrolls away). Other phones: "Nick is choosing a chip to steal". Then the steal animation plays on every phone (KEEP the current steal animation system as it is: steal.js / thieves.js and the films), and the result holds still long enough to see whose chip it was. If there's genuinely no chip the dealer can steal, skip the steal silently.
5. **The flip.** The dealer taps to flip the face-down caption. Then last chips, everyone at once (clock as today).
6. **The reveal.** Who wrote each caption and who fell for it, the real one last, points. **Dealer-paced:** the dealer taps Next for each step; no auto-advancing reel. Framing (see below) happens here.
7. **Scores.** Round scoreboard; the dealer taps "Next round"; the deal moves on.
- Scoring stays as today EXCEPT The Late Edition (double points) goes. Blind chip on the real one +2; blind on the face-down one when it's real +5; late chip +1; each chip on your fake +2 to you; Double Down ×2; steal off a fake = that chip's owner +1; off the real one its points go to the dealer; dealer's revenge +4.
- Dealer mode fixed at today's default ('both': the dealer bets 2 chips and then steals one of another player's chips). Remove the dealer-mode setting.

## KEEP — the frame
- The **Bravo!** button on every caption but your own (renamed today), from the reading until the next deal; a majority of the other players frames a revealed fake (never the real one). The framed moment on the reveal can stay but must be brief and not block the dealer.
- **The Gallery** (viewable from the lobby/menu, tap a card to zoom, share a framed card).
- **End of the game:** the winner and final scores, each player's rating change with their one funny line (verdicts), then tonight's framed captions and the Caption of the Night vote (finale.js). That's the whole ending.

## KEEP — everything else
- The new cartoon deck, unseen-first/no-repeat deal, difficulty order, deal variety, decks (Family / Standard / Everything).
- Robustness: reconnects, seat keys, outbox/acks, heartbeat, restore after a server restart, keep-awake, /status for safe pushes.
- Sound effects (simple). Rules page (rewritten to match). How to Play demo (rebuilt, see below).

## CUT (remove the code, the UI, the copy, the files where they're only for this)
- The Editor's note (word-count / must-use-word rounds).
- The opening Bravo/framing lesson before the first cartoon (frameDemo / #framedemo).
- Call your shot.
- First-game tips (guide.js) and the last-writer spotlight banner if it's a cutesy extra (a plain "Waiting for Sam" is fine).
- Pencil-circle nudges, rejection slips, odds lines, the table vs. the cartoonist, stock "cute" round lines that add screens or banners.
- The skip-cartoon gag animations (skips.js, 436 KB) — the vote stays, plain.
- The Late Edition (card and double points), the page tilt, the Monkey, Last Call, Heading out, The kids are in bed, house players, sealed scores.
- Between games / end of night extras: "Did you know?" (dyk.js), the awards slide, the Remote, badges, Previously on, credits, the Grand Poobah if any remains, the night recap image.
- The rating's opening card before the first cartoon (the rating stays only as the end-of-game line and a small number in the lobby).
- Voice call (voice.js) and Practice alone (practice.js client + server).
- Background music (procedural ambient); keep simple sound effects.
- Gallery *mode* as a setting (framed captions as real answers); keep the Gallery to look at.
- The Oct 24 "anyone can keep the game moving" fallback (commit 044b4a6, dealerAwayOf etc.) — **this is what let other phones push the game on and pop someone else up as dealer.**
- Lobby options other than: writing timer, game length, cartoons (deck). Seating order, dealer mode, face-down odds, house players, sound speaker choice etc. go to fixed defaults.

## FIX
- **Host never changes while the host is still in the game.** A locked/backgrounded phone keeps its seat (long grace, ≥15 min). The host only passes on if the host leaves or is gone for good.
- **Dealer never changes mid-round** because of another phone. If the dealer's phone is actually disconnected (socket closed, not just idle) for 2+ minutes, the HOST's phone (only) gets one button: "Move on without <name>" (the app makes the dealer's required choices, e.g. a random steal). That is the only fallback.
- Tap to zoom on the cartoon (writing, reading, everywhere the cartoon shows).
- **No overlapping anything** on any phone size: test 360×640, 375×667 (iPhone SE), 390×844, 430×932. Dealer buttons always in reach.
- The host's lobby: **"just simple buttons"**: big room code, the players, three rows of tap buttons (Timer: 1 min / 2 min / 3 min / No timer · Length: Once around / Twice around / First to 20 · Cartoons: Family / Standard / Everything), one Invite button, one Start button. Almost no words. Non-hosts: the code, the players, "Waiting for Nick to start".
- Home screen: name, one line, Host a game, Join a game, How to play. No animation show.
- How to Play: the cartoon must be big and readable the whole time the captions are shown (Nick: "the cartoon is so small you can't even tell that it's a cartoon"); scenes only for features that remain (write, face-down, bets at once, forced steal, flip, last chip, reveal, Bravo → frame, scores); remove "the winner takes the Remote". Betting screens keep today's slower, one-idea-per-screen pacing.

## Rules for whoever builds this
- Every screen: one obvious action, or a plain "Waiting for <name>". Few words. American spelling. Wording says "Closed Caption"/face-down, never envelope/sealed.
- Never show real captions to Nick in anything you hand him. Do not make or request any new cartoon drawings.
- Don't break the protocol between phones and server without updating both sides. Keep `UPLOAD-THIS-TO-GITHUB/` as the deploy root.
- Commit on your branch only. Never push to GitHub.

## Added later on Oct 29 (Nick)
- "Make sure all buttons are free of overlaps etc. there shouldn't be scrolling especially when submitting an answer. It needs to be clean and intuitive without scrolling other than setup screens."
  → Every in-game screen, plus home/create/join and the How to Play demo, fits one screen with **no page scrolling** at 360×640, 375×667, 390×844 and 430×932, with 3 to 8 players. Writing: the caption box and Send stay visible with the keyboard open. The cartoon shrinks to fit; long lists go compact rather than scroll. Only setup screens (lobby, rules, Gallery) may scroll; the host's Start button stays pinned in view.
