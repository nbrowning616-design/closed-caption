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

(Oct 29 2026: back to a simple game. Only the dealer moves the game on; every other phone says "Waiting for <dealer>".)

- One person taps "Host a game" and shares the 4-letter room code; everyone else taps "Join a game" (late arrivals can join mid-game). The host picks three things in the lobby: the writing timer, the game length and the cartoons (deck). Everything else is fixed
- Each round everyone, the dealer too, writes a fake caption for the same cartoon (tap the cartoon to zoom). Half the table can vote to skip a cartoon (plain, no animation)
- The game turns one caption face-down (the Closed Caption): usually a player's, the real one in about 15% of rounds
- The dealer reads the captions aloud and taps Next. Blind bets: everyone at once, in secret, 1 or 2 chips (Double Down); the chips drop together. The clock is at least 20 s, ends early when everyone's in, and anyone can add 20 s once
- The steal is forced: the dealer must tap one other player's chip ("Tap a chip to steal it"); nothing skips or rushes it. Then the steal show plays on every phone (public/steal.js and the films in public/steals/). No chip to steal: no steal
- The dealer flips the face-down caption; anyone with a chip left places it, everyone at once
- The reveal, one caption at a time at the dealer's pace: who wrote it, who fell for it, the real one last. Then the scores, and the dealer taps Next round
- Bravo! on every caption but your own, from the reading until the next deal. When most of the other players give a revealed fake a Bravo!, it is framed and hangs in The Gallery (menu, or the lobby)
- End of the game: the winner and final scores, each player's rating change with one line (public/verdicts.js), then tonight's framed captions (the six with the most Bravos) and the Caption of the Night vote (public/finale.js). The host taps through it
- If the dealer's phone has really been disconnected for 2 minutes, the host's phone (only) gets "Move on without <name>" and the game makes the dealer's choices. The host stays the host while their phone is locked or away (up to 15 minutes); a host who leaves passes it on and gets it back on return
- A phone that drops (Wi-Fi, a locked screen, a reload) goes straight back to its seat. Captions, bets, the steal and Bravos wait on the phone until the server confirms them, and go once, never twice. A server restart brings the room back from the phones' sealed copies
- Every caption, including the real ones, is tidied the same way (capitals, punctuation, apostrophes, quotes) so style never gives anything away. Likely typos get a "Fix the spelling?" before they go in
- Every in-game screen fits the phone without scrolling (360×640 up to 430×932, 3 to 8 players): the cartoon shrinks to fit, long lists go compact

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
tally: games started and finished, players per game, joins by QR code / invite link / typed code, Gallery shares,
by day. Counts only (no names, captions, room codes or addresses). Without the key the page doesn't exist (404). The tally
is a small file (in `DATA_DIR` if set, else the temp folder), so on a free plan it starts over when the server is redeployed.

## Files

- `server.js` — Express + WebSocket server
- `game.js` — All game rules, phases, scoring, and the cartoon deck (627 cartoons)
- `polish.js` — Caption tidying (punctuation, common grammar slips) and spelling suggestions
- `words.txt` — English word list used for spelling suggestions (from the wordfreq project)
- `rating.js` — The chess-style rating: Elo over every pair at the table, and the verdict lines (server side)
- `store.js` — Saves The Gallery
- `stats.js` — The private tally behind `/stats` (counts only)
- `public/index.html` — The page: networking, the lobby, the rules, the Gallery, the rating
- `public/play.js`, `public/play.css` — Every in-game screen, from the first cartoon to Caption of the Night
- `public/howto.js` — The self-playing How to play demo
- `public/verdicts.js` — The pool of verdict lines (shared by the server and the phones)
- `public/finale.js` — Caption of the Night: the ceremony on every phone
- `public/gallery.js` — The Gallery wall and its zoom
- `public/hof.js` — Draws the Gallery share print
- `public/moments.js` — Keeps big moments in sync across phones; one phone plays the big sounds
- `public/fx.js` — Reduced-motion check shared by the effects (window.ccReducedMotion)
- `public/steal.js` — The steal on every phone: drives the show from the server's beat; the painted chip a stolen chip leaves
- `public/steals/` — The steal films, one per file, loaded while the dealer chooses
- `public/thieves.js` — The hand-drawn steal engine (CCSteal)
- `public/qrcode.js` — QR code maker (MIT, Kazuhiko Arase)
- `public/images/` — Cartoon card images
