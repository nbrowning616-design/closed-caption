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

- One person taps "Create Game" and shares the room code
- Everyone else taps "Join Game" and enters the code + their name
- The host starts the game when everyone's in
- Each round: a cartoon appears, everyone writes a caption, the dealer seals one caption in the Closed Caption, bets are placed in turn (starting on the dealer's left, everyone sees every bet), the envelope is opened, second bets go down, the answer is revealed
- The app handles everything: cartoons, timer, submissions, the betting table (chips), and scoring
- Full rules, including Half-Moon, Shoot the Moon and the dealer bonus, are in `Closed_Caption_Rules_v3.docx` and on the app's "How to play" screen

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
- `public/index.html` — The entire frontend (mobile-first)
- `public/images/` — Cartoon card images
