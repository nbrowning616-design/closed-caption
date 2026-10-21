# Odd details for "Need a nudge?" pencil circles

Closed Caption is a party game: players see a wordless New Yorker-style cartoon and write a funny caption for it.
When a stuck player taps "Need a nudge?", the game will draw a pencil circle around ONE odd or interesting thing in the
cartoon and show a short question beside it, to spark a caption idea. Each phone gets the details in a different order,
so the table spreads out over the whole picture instead of piling onto one joke.

Your job: for each card in your list, open the image with the Read tool (look at it; do not guess from the file name),
and pick 2 or 3 odd, funny or telling details that a caption could hang on. For each, write:
  - "q": a short, curious question in plain words, 4–12 words, that points at the detail without making the joke
    for the player. Good: "Why is the dog wearing a tie?", "What's in the box she's hiding?", "Who left the ladder there?"
    Bad: anything that states a punchline, anything that guesses at a caption, anything mean, anything technical.
    Vary the wording: not every question should start with "Why".
  - "x", "y": the CENTER of that detail as a percent of the image width and height (0 = left/top, 100 = right/bottom).
    Be accurate: the circle will be drawn there. Estimate carefully from the picture.
  - "r": the radius of a circle that comfortably contains the detail, as a percent of image width (between 6 and 30).
Pick details in different parts of the picture where you can, and never the single most obvious central figure alone
(the player already sees that); prefer the thing in the corner, the background, the prop, the bystander's reaction.
If a cartoon truly has only one thing going on, give 2 anyway and add "thin": true to that card.

Put them in the card's caps.json entry as "odd": [{"q": "...", "x": 72, "y": 18, "r": 10}, ...] (see drawing/ingest.py).
