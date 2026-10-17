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
- Everyone gets one Hall of Fame flag per game. Two flags on a caption inducts it, with a shareable magazine-style card. End-of-game awards play before the final scores
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

## Files

- `server.js` — Express + WebSocket server
- `game.js` — All game rules, phases, scoring logic
- `polish.js` — Caption tidying (punctuation, common grammar slips) and spelling suggestions
- `words.txt` — English word list used for spelling suggestions (from the wordfreq project)
- `public/index.html` — The entire frontend (mobile-first)
- `public/fx.js` — The mulligan "executions"
- `public/hof.js` — Draws the Hall of Fame share card
- `public/images/` — Cartoon card images
