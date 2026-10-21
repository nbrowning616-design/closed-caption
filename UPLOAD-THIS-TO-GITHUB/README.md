# Closed Caption — The Caption-Writing Party Game

A web-based multiplayer party game. One person creates a game, shares a 4-letter room code, and everyone joins on their phone browser.

## Quick Start

1. Make sure you have Node.js installed (download from https://nodejs.org)
2. Open Terminal (Mac) or Command Prompt (Windows)
3. Navigate to this folder: `cd closed-caption`
4. Install dependencies: `npm install`
5. Start the server: `node server.js`
6. Open http://localhost:3000 on your phone (your computer and phone must be on the same WiFi network — use your computer's local IP address, e.g. http://192.168.1.100:3000)

## How to Play

- One person taps "Host a game" and shares the 4-letter room code; everyone else taps "Join with a code" (late arrivals can join mid-game)
- Each round everyone — the dealer too — writes a caption for the same cartoon. Half the table can vote to mulligan a bad cartoon
- The game secretly turns one caption face-down (the Closed Caption). Usually it's a player's; sometimes it's the real one
- Blind bets go one at a time from the dealer's left (the dealer doesn't bet), the Closed Caption is revealed, last chips go down (anywhere, even on the same caption), then the dealer may steal one chip
- The real caption is revealed and points are paid. Full rules are on the app's "How to play" screen
- The host lines up the seats in the lobby and picks which way the deal passes (left or right)
- Stealing a chip that was on the real caption scores the dealer +1; the real caption is face-down in about 15% of rounds, never two in a row
- The flip: every phone turns the face-down card at the same moment, then the round moves on by itself after a few seconds (the dealer can hold it)
- The answer is a reveal reel, one caption at a time, that moves on by itself every few seconds (the dealer can hold it, go back, or skip to the recap; if the dealer is away the host can take over). Each card is just the caption, who wrote it and who fell for it; at most one line under the real one. The dealer turns over the real one and moves on from it (10 s if nobody taps). Called shots, badges and the table vs. the cartoonist are on the round recap
- Ha and Groan: two small buttons on every caption on the reveal. No points; the counts appear only once the answer is out. Ha taps made before the answer are "blind", and they decide each round of the table vs. the cartoonist ("The table 6, the cartoonist 3"); each phone keeps the table's best game
- Call your shot: after locking in a caption you may secretly name one person. If they put a chip on your caption, +3
- A caption with no chips and three or more Groans gets a rejection slip from The Editors, on its writer's phone only, under their own scoreboard (their drawer of slips is in the menu: Rejections)
- Editor's notes: now and then (never in the first two cards) a round comes with a rule for the captions: "Exactly N words." or "Must use the word: X." The caption box shows whether yours fits; one that doesn't can't be locked in
- Need a nudge? The first taps circle an odd detail of the cartoon in pencil, with a question beside it (card_meta.json "odd"); then general tips
- The kids are in bed (host menu, family games only): the full deck from the next deal. One came back down: family cards again at once
- The dealer's steal plays as a hand-drawn caper with one of six thieves (the server says full or short: `stealShow`; the full show ends on the thief's one closing caption, the 2-second short one on no line at all), the same frame on every phone; a skip vote plays one of 50 hand-drawn gags
- Full-screen moments take turns: the skip gag, the steal, the opening / Late Edition / kids cards wait for each other, and the last writer's nudge, a game-over slip or a badge wait until the screen (and the menu) is clear
- Most lines the game says (warnings, waits, reveal lines, gloats after the reveal) come from public/lines.js, picked by the server so a night never repeats one
- Each phone keeps a chess-style rating (starts at 1,200; titles from Candidate to Grandmaster) and its badges across game nights
- Invite friends with the lobby QR code or the invite link (it fills in the room code)
- Frame It: on the reveal, each caption has a small frame button once it's been shown (never your own, never the real one). No limit per game. When most of the other players (2 of 2, 2 of 3, 3 of 4…) frame the same caption, it's hung in The Gallery with a shareable print: the night's first frame gets the full framing moment on every phone, later ones a quick plaque. Gallery games use framed captions as the real answers.
- The Gallery lives on the phones: each phone saves every caption it sees framed and brings its collection to every game it joins, so it survives server restarts at no cost. Rooms never see each other's captions. (Optional: set DATA_DIR on a Render disk to also keep a server copy.)
- The end of the night plays on every phone at once, over the final scores: the winner (and who has the Remote now), one awards slide (Best Lie, Best Liar, Nobody Bit, Most Groans from the night's real Groan counts), an end credit per player (a freeze-frame of their best caption and an epilogue earned from how they played tonight; nothing repeats at a table), the cast list, then Caption of the Night
- The Remote is the table's trophy: the lobby says who has it, and its masking tape lists every winner. Each phone keeps the tables it has played at
- Previously on Closed Caption: a returning table's first round opens with last time's winner, last time's Caption of the Night and one grudge (the writers get the time back)
- The Late Edition's scores are sealed: each phone sees only its own points (with reasons) until the end, where the standings are read from last place up
- Heading out (menu): your end credit plays now and the table carries on without you; it's read again at the end, in absentia. Last Call (host menu): the next trip around the table is the last
- A phone that drops (Wi-Fi, a locked screen, a reload) goes straight back to its seat. Captions, bets, the steal and frame picks wait on the phone until the server confirms them, and go once, never twice
- Every caption, including the real ones, is tidied the same way (capitals, punctuation, apostrophes, quotes) so style never gives anything away. Likely typos get a "Did you mean…?" before locking in

## Deploying Online

To make it accessible without being on the same WiFi:

**Railway (easiest):**
1. Push this folder to a GitHub repo
2. Go to railway.app, connect your GitHub
3. Deploy — it auto-detects Node.js
4. You'll get a public URL like closed-caption.up.railway.app

**Render:**
1. Push to GitHub
2. Go to render.com, create a Web Service
3. Point to your repo, it deploys automatically

Both have free tiers that work fine for game nights.

**Private stats (optional):** set an env var `STATS_KEY` to a long random string, then open `/stats?k=<that string>` for a
tally: games started and finished, players per game, joins by QR code / invite link / typed code, recap and Gallery shares,
by day. Counts only (no names, captions, room codes or addresses). Without the key the page doesn't exist (404). The tally
is a small file (in `DATA_DIR` if set, else the temp folder), so on a free plan it starts over when the server is redeployed.

## Files

- `server.js` — Express + WebSocket server
- `game.js` — All game rules, phases, scoring logic
- `polish.js` — Caption tidying (punctuation, common grammar slips) and spelling suggestions
- `words.txt` — English word list used for spelling suggestions (from the wordfreq project)
- `public/index.html` — The entire frontend (mobile-first)
- `public/fx.js` — Reduced-motion check shared by the effects (window.ccReducedMotion)
- `public/hof.js` — Draws the Gallery share print
- `public/gallery.js` — The framing moment and the Gallery wall
- `store.js` — Saves The Gallery
- `stats.js` — The private tally behind `/stats` (counts only)
- `public/badges.js` — Badge artwork, badge pops, badge case
- `rating.js` — The chess-style rating: Elo over every pair at the table, the opening card and the verdict lines (server side)
- `public/verdicts.js` — The pool of verdict lines (shared by the server and the phones)
- `night.js` — The end of the night (server side): the end credits, the one awards slide, the monkey, the Remote and its tape, "Previously on Closed Caption"
- `credits.js` — The words for it: the end-credit lines (by what the player did tonight), the grudges, the awards and the Remote's lines
- `public/ending.js` — The end of the night on the phones: the winner, the awards, the credits, the cast; the Remote; the cold open; the tables each phone keeps
- `public/home.js` — The opening screen
- `public/moments.js` — Keeps big moments in sync across phones; one phone plays the big sounds
- `public/steal.js` — The steal on every phone: lays out the table and drives the hand-drawn show from the server's beat; the painted chip a stolen chip leaves
- `public/thieves.js` — The hand-drawn steal engine and its six thieves (CCSteal), loaded after the first screen
- `public/skips.js` — The 50 hand-drawn skip gags (CCMulligan), about 440 KB, fetched only once a phone has a seat
- `public/lines.js` — The game's lines for the round (shared by the server and the phones; the server picks, a night never repeats one)
- `public/recap.js` — The night recap picture
- `public/guide.js` — First-game tips and the "Waiting on…" banner
- `public/qrcode.js` — QR code maker (MIT, Kazuhiko Arase)
- `public/images/` — Cartoon card images
