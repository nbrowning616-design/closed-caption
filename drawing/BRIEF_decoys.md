# House captions (5 per new cartoon)

Closed Caption: players see a wordless New Yorker-style cartoon, write fake captions, and bet on which caption is real.
"House players" (virtual players) each add one pre-written fake caption so small tables play like six, and solo practice
mixes 3 house fakes with the player's fake and the real one. These fakes must be good enough to fool people, and all five
should sound like plausible REAL captions, not like five different comedians. Write them after the real caption, looking
at the picture.

Rules for every decoy:
- One short line in New Yorker caption style (usually 4–12 words), deadpan, a speaker's line or a dry observation; no puns for
  their own sake, no explaining the joke, no emoji, standard punctuation, American spelling.
- Five DIFFERENT angles from each other and from the real caption (use the picture's different odd details), so a table can't
  eliminate them as "the same joke". Never echo, paraphrase or reuse the real caption's key word or punchline.
- Roughly match the real caption's length and register; vary length a little among the five.
- No player names, no real people/brands; family-safe on Family and Standard cards; on After Dark cards match the card's
  edge, never explicit.
- Genuinely funny enough that someone might pick it as the real one.

Nick (Oct 20 2026): "For the practice version, the real one should be slightly superior or even with the next best
auto-generated." So the house fakes must be CLOSE to the real caption but never better than it. Score each one against the
real caption: 5 = as good as the real one (never better), 4 = slightly weaker, 3 = clearly weaker but plausible, 2 = weak.
Each card needs at least two at 4-5 and the rest at 3-4; nothing at 2 or below; if one is FUNNIER than the real caption,
rewrite it down or replace it.

In caps.json: "decoys": [{"t": "decoy text", "s": 4}, ... five items]  (see drawing/ingest.py).
