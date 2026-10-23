// dyk.js — the words for "Did you know?", the intermission between games (server only; night.js picks them, so
// every phone shows the same). Nick, Oct 21 2026: like the facts between innings at a ballgame, styled as an
// old-school 1980s public-service announcement (our own look and sound). 2–3 facts about tonight's players, from
// how they actually played. The title card says "Did you know?"; the lines never repeat it.
//
// Tone (Nick's ratings): LOVE the absurd consequence of real play, the fake study, the backhand for the leader,
// career advice from a real stat, the fake record, the dry non-sequitur; GOOD a roast for last place with grace.
// NO plain sports-stat jabs, no compliment-then-sting about anyone's captions, no cartoonist as a character.
// Rules for every line: short and dry, about game behavior only (never anything personal), PG, no pronouns for the
// players (names, "their"), never a caption's words.
//
// Each line names the fact it needs (`need`, worked out in night.js dykStats from the game's records). Placeholders:
//   {name} the player · {other} the other player in it · {n} the count, written out ("{n} times" -> once / twice /
//   three times; "{n} chips" -> one chip / two chips; "{n} rounds" ...) · {pct} a whole percentage · {r} a round
//   ("round two"; only lines that use it need a game of 3+ rounds)
// Lines are remembered by a short hash of the text (rating.js lineKey): editing a line makes it a new line.
'use strict';

/* The facts a line can need (night.js dykStats works each out per player; the conditions live there):
   liar        their fakes were believed {n} times (2+)
   liarVictim  fooled {other} {n} times (2+)
   bigLiar     fooled {other} {n} times (3+)
   allBelieved every fake they wrote drew a chip ({n} fakes, 3+)
   liePct      {pct}% of their fakes drew a chip (50%+, 2+ fakes)
   gullible    put {n} chips on fakes (2+)
   gullBig     put {n} chips on fakes (3+)
   gullPct     backed a fake in {pct}% of the rounds they bet (50%+, 2+ rounds)
   sameRun     fell for {other} {n} rounds in a row (2+)
   sharp       found the real caption {n} times (2+)
   sharpPct    found it {pct}% of the rounds they bet (60%+, 2+ rounds)
   allFound    found it every round they bet ({n}, 3+)
   dullPct     found it {pct}% of the rounds they bet (34% or less, 3+ rounds)
   betOwn      bet on their own caption {n} times (1+) · betOwn2 (2+)
   blind       bet blind on the face-down caption {n} times (2+) · blindPct {pct}% of rounds (50%+)
   thief       stole {n} chips as the dealer (1+) · stealPct on {pct}% of their deals (50%+, 2+ deals)
   robbedSame  stole from {other} {n} times (2+)
   robbed      was robbed {n} times (1+) · robbed2 (2+)
   framer      framed {n} of other people's captions (2+) · framer3 (3+)
   haGiven     pressed Ha {n} times (4+) · haBig (6+)
   noHa        never pressed Ha, while the table pressed it plenty (3+ rounds)
   groaner     pressed Groan {n} times (2+) · groanBig (3+)
   firstIn     handed in first {n} times (2+) · firstBig (3+) · firstPct {pct}% (50%+)
   lastIn      handed in at the buzzer {n} times (2+) · lastPct {pct}% (50%+)
   skipper     voted to skip {n} cartoons (1+) · skipper2 (2+)
   winner      won the game (alone) · margin: won by {n} points (1+) · streak: the Remote {n} games straight (2+)
   last        finished last, alone, at a table of 3+
   any         anyone who played (the non-sequiturs) */

const LINES = {
  // (1) The absurd consequence of real play
  consequence: [
    { need: 'liarVictim', text: "Based on tonight’s lying, {name} could sell you the Brooklyn Bridge. Already sold {other} {n} times." },
    { need: 'liar', text: "On the strength of tonight’s lying, {name} has been offered a used car lot. Two, actually." },
    { need: 'liar', text: "After tonight, {name} may no longer describe the weather without a witness present." },
    { need: 'liar', text: "Given tonight, {name} will be asked to swear on something heavier at the next family reunion." },
    { need: 'gullible', text: "{name} put {n} chips on fakes tonight. A timeshare salesman is already on the way." },
    { need: 'gullible', text: "After tonight, {name} should not answer the phone. Or the door. Or a carefully worded email." },
    { need: 'sameRun', text: "{name} fell for {other} {n} rounds in a row. {other} is now pricing a bridge for {name}." },
    { need: 'thief', text: "Because of tonight’s thievery, every purse in the room has quietly moved to the far end of the couch. Thanks, {name}." },
    { need: 'robbed', text: "{name} was robbed {n} times tonight and is now legally allowed to keep chips in a sock." },
    { need: 'lastIn', text: "{name} beat the clock by seconds {n} times tonight. Every gate agent in America just felt a chill." },
    { need: 'firstIn', text: "{name} was first in {n} times tonight. Somewhere, an empty parking lot is expecting {name} at 6 a.m." },
    { need: 'betOwn', text: "{name} bet on their own caption {n} times tonight. Next week: a horse race {name} is personally running in." },
    { need: 'framer', text: "{name} helped frame {n} captions tonight. The hardware store is out of nails." },
    { need: 'haGiven', text: "{name} hit Love It {n} times tonight. Three local comedians have asked for {name}’s schedule." },
    { need: 'skipper', text: "{name} voted to skip {n} cartoons tonight. The TV at {name}’s house is reportedly nervous." },
    { need: 'blind', text: "{name} bet blind on the face-down caption {n} times. {name}’s mechanic has stopped explaining things." },
    { need: 'groaner', text: "{name} groaned {n} times tonight. The pun industry has filed a formal complaint." },
  ],
  // (2) The fake study, tied to a real behavior and its count
  study: [
    { need: 'betOwn', text: "Studies show people who bet on their own caption also clap when the plane lands. {name}, {n} times tonight." },
    { need: 'blind', text: "Studies show people who bet on the face-down caption also buy melons without knocking. {name}, {n} times tonight." },
    { need: 'lastIn', text: "Studies show people who hand in at the buzzer also board during final call. {name}, {n} times tonight." },
    { need: 'firstIn', text: "Studies show people who hand in first also get to the airport four hours early. {name}, {n} times tonight." },
    { need: 'gullible', text: "Studies show people who back a fake also read the terms and conditions, then agree anyway. {name}, {n} chips tonight." },
    { need: 'haGiven', text: "Studies show people who hit Love It a lot also laugh at the dentist’s jokes. Mid-procedure. {name}, {n} times tonight." },
    { need: 'groaner', text: "Studies show people who groan at a pun are usually hiding a few of their own. {name}, {n} groans tonight." },
    { need: 'thief', text: "Studies show people who steal a chip also take the last cookie and say nothing. {name}, {n} times tonight." },
    { need: 'robbed', text: "Studies show people who get robbed at cards also leave the car unlocked ’for just a minute.’ {name}, {n} times tonight." },
    { need: 'framer', text: "Studies show people who help frame other people’s captions also keep every birthday card. {name}, {n} tonight." },
    { need: 'skipper', text: "Studies show people who skip a cartoon also skip the trailers. And the toast. {name}, {n} times tonight." },
    { need: 'liar', text: "Studies show people who bluff well also have a perfectly good explanation for the dent in the car. {name}, {n} times tonight." },
    { need: 'sharp', text: "Studies show people who spot the real caption also find the remote on the first try. {name}, {n} times tonight." },
    { need: 'noHa', text: "Studies show people who never hit Love It also tip exactly fifteen percent. {name}, not once tonight." },
    { need: 'sameRun', text: "Studies show people who fall for the same person twice also go back for the second free sample. {name}, {n} rounds running." },
  ],
  // (3) The backhand for the leader
  leader: [
    { need: 'winner', text: "{name} won. {name}’s family has been informed and is taking it well." },
    { need: 'winner', text: "{name} won. Please do not ask {name} about it. {name} will tell you anyway." },
    { need: 'winner', text: "{name} won. A small, dignified parade is being considered. Very small." },
    { need: 'winner', text: "{name} won tonight. Experts agree it could have happened to anyone. It happened to {name}." },
    { need: 'winner', text: "{name} won and is being very gracious about it, which somehow makes it worse." },
    { need: 'winner', text: "{name} won. Neighbors should expect a slightly louder driveway this evening." },
    { need: 'winner', text: "{name} won. Congratulations have been written, signed, and are being reconsidered." },
    { need: 'winner', text: "{name} won and would like everyone to know {name} never doubted it. Everyone else did." },
    { need: 'winner', text: "{name} won. A plaque was discussed. A sticky note was approved." },
    { need: 'winner', text: "{name} won. The Remote has been notified and asked for a moment alone." },
    { need: 'margin', text: "{name} won by {n} points, which {name} has already rounded up to ’easily.’" },
    { need: 'margin', text: "{name} won by {n} points. {name} would like it entered into the minutes. There are no minutes." },
    { need: 'streak', text: "{name} has held the Remote {n} games straight. The batteries have asked to meet someone new." },
    { need: 'streak', text: "{name} has won {n} games straight. The rest of the table has started a support group. Tuesdays." },
  ],
  // (4) Career advice from a real stat
  career: [
    { need: 'liePct', text: "With a lying rate of {pct}%, {name} now qualifies for a career in real estate." },
    { need: 'liePct', text: "A lying rate of {pct}% tonight. {name} is now overqualified for used cars." },
    { need: 'liePct', text: "With {pct}% of fakes believed, {name} is cleared to write restaurant menus. ’Hand-picked.’ ’Locally sourced.’" },
    { need: 'liePct', text: "With a lying rate of {pct}%, {name} can now write the backs of cereal boxes professionally." },
    { need: 'sharpPct', text: "{name} found the real caption {pct}% of the time and now qualifies for a career in airport security." },
    { need: 'sharpPct', text: "With a {pct}% eye for the real thing, {name} is ready to appraise antiques on public television." },
    { need: 'sharpPct', text: "{name} spotted the real one {pct}% of the time. The bank would like {name} to look at some twenties." },
    { need: 'dullPct', text: "With a {pct}% hit rate on the real caption, {name} now qualifies for a career in weather forecasting." },
    { need: 'dullPct', text: "{name} found the real one {pct}% of the time, which is exactly the rate a psychic needs to stay in business." },
    { need: 'gullPct', text: "{name} backed a fake {pct}% of the time and is now eligible to buy timeshares wholesale." },
    { need: 'blindPct', text: "{name} bet blind {pct}% of the time and now qualifies as a skydiving instructor. Please don’t ask about the parachute." },
    { need: 'lastPct', text: "{name} handed in at the buzzer {pct}% of the time and now qualifies for tax preparation. April 14th, mostly." },
    { need: 'firstPct', text: "{name} handed in first {pct}% of the time and now qualifies to open the bakery at 4 a.m." },
    { need: 'stealPct', text: "{name} stole on {pct}% of their deals and now qualifies for a career in parking enforcement." },
  ],
  // (5) The fake record
  record: [
    { need: 'sameRun', text: "Before tonight, nobody had ever fallen for the same person {n} rounds in a row. Thank you, {name}." },
    { need: 'robbedSame', text: "Before tonight, nobody had ever robbed the same person {n} times in one game. Thank you, {name}." },
    { need: 'robbed2', text: "Before tonight, nobody had been robbed {n} times in one game and kept smiling. Thank you, {name}." },
    { need: 'betOwn2', text: "Before tonight, nobody had bet on their own caption {n} times and called it strategy. Thank you, {name}." },
    { need: 'lastIn', text: "Before tonight, nobody had beaten the clock by a hair {n} times in one game. Thank you, {name}." },
    { need: 'gullBig', text: "Before tonight, nobody had put {n} chips on fakes and stayed this calm about it. Thank you, {name}." },
    { need: 'blind', text: "Before tonight, nobody had bet blind on the face-down caption {n} times without looking. Thank you, {name}." },
    { need: 'framer3', text: "Before tonight, nobody had helped frame {n} captions in a single game. The Gallery thanks you, {name}." },
    { need: 'allBelieved', text: "Before tonight, nobody had gotten every single fake believed. Thank you, {name}. Please stay away from our parents." },
    { need: 'allFound', text: "Before tonight, nobody had found the real caption every round they bet. Thank you, {name}. Unsettling, but thank you." },
    { need: 'haBig', text: "Before tonight, nobody had hit Love It {n} times in one game. Thank you, {name}. Your thumb has asked for the weekend." },
    { need: 'skipper2', text: "Before tonight, nobody had voted to skip {n} cartoons in one sitting. Thank you, {name}." },
    { need: 'firstBig', text: "Before tonight, nobody had handed in first {n} times in one game. Thank you, {name}. You can slow down now." },
    { need: 'bigLiar', text: "Before tonight, nobody had fooled {other} {n} times in one evening. Thank you, {name}. Sorry, {other}." },
    { need: 'groanBig', text: "Before tonight, nobody had groaned {n} times in one game and meant every one. Thank you, {name}." },
  ],
  // (6) The dry non-sequitur: deadpan, about nothing in the stats
  nonsequitur: [
    { need: 'any', text: "{name} hasn’t blinked since {r}. We’re choosing not to ask." },
    { need: 'any', text: "{name} has been sitting very still since {r}. Possibly a strategy. Possibly a nap." },
    { need: 'any', text: "{name} has asked that this fact not be read aloud. Noted." },
    { need: 'any', text: "{name} has been humming the same four notes since {r}. We’ve stopped trying to name it." },
    { need: 'any', text: "{name} keeps glancing at the door. There’s nobody there. We checked." },
    { need: 'any', text: "{name} brought a pen tonight. It hasn’t been used. It’s not about the pen." },
    { need: 'any', text: "{name} has been sitting at a slight angle since {r}. It seems to be working, so nobody’s saying anything." },
    { need: 'any', text: "{name} nodded at something in {r}. Nobody had said anything." },
    { need: 'any', text: "{name} has said ’interesting’ four times tonight. Each time, it was." },
    { need: 'any', text: "{name}’s phone has been face down all night. The phone is fine with this." },
    { need: 'any', text: "{name} is the only one here who knows where the spare batteries are. {name} isn’t saying." },
    { need: 'any', text: "{name} said ’oh, I see’ during {r} and has not elaborated." },
    { need: 'any', text: "{name} has been very polite all evening. The table is waiting for the other shoe." },
    { need: 'any', text: "{name} once read the rules all the way through. Nobody has brought it up since." },
  ],
  // (7) The roast for last place, with grace
  last: [
    { need: 'last', text: "{name} finished last, but {name} finished last with real conviction." },
    { need: 'last', text: "{name} finished last, which takes a kind of commitment most people never find." },
    { need: 'last', text: "{name} came in last tonight. Somebody had to hold the door for everyone else." },
    { need: 'last', text: "{name} finished last and handled it the way you’d want a pilot to handle turbulence." },
    { need: 'last', text: "{name} is in last place, which, historically, is where the comeback stories start." },
    { need: 'last', text: "{name} finished last. It’s a good view from back there. You can see everybody." },
    { need: 'last', text: "{name} came in last and did it with excellent posture." },
  ],
};

// The kinds that open with real play (the first fact is always one of these), and the ones that close
const PLAY_KINDS = ['consequence', 'study', 'career', 'record'];
const CLOSE_KINDS = ['leader', 'nonsequitur', 'last'];

module.exports = { LINES, PLAY_KINDS, CLOSE_KINDS };
