/* Closed Caption — ROUND LINES (lines.js)
   Every stock line said during a round, by situation: the waiting lines, the steal paperwork, the flip, the reveal
   reel, the round-end headline, the scoreboard stamp, Frame It on the reveal, and the Round 2 pools (rejection slips,
   called shots, table vs. the cartoonist, the odds). Shared: the server require()s this file and picks every line
   (game.js pickLine), so every phone shows the same one and nothing repeats within a night until its pool is used up;
   the browser loads it as a plain script (window.ccLines) for the few lines a phone picks for itself.
   {name}-style placeholders are filled by the server with first names and numbers.
   House rules (BRAND): dry, understated, American spelling, no exclamation pileups, no "X. Adverb." filler.
   During the steal nothing may hint whether the chip was on the real caption: the keyed gloats (heist.N.real /
   heist.N.fake, end.stoleReal / end.stoleFake) are only ever picked once the real caption is out.
   Generated from the comedy pass (scratchpad stocklines.json) plus the Round 2 pools; edit freely: the server
   forgets a night's place in a pool when the pool changes size. */
const ccLines = {
 "write.warn20": [
  "Wrap it up.",
  "Whatever you have, send it.",
  "Finish the sentence.",
  "Good enough is good enough.",
  "Last chance to fix it.",
  "Lock in your caption"
 ],
 "write.warn10": [
  "Send it.",
  "Now would be good.",
  "Send it now"
 ],
 "write.timesUp": [
  "Time’s up. Yours went in as it was.",
  "Time’s up. Sent as written.",
  "Sent. Whatever was in the box is now a caption.",
  "The buzzer took it. It’s in.",
  "Time’s up — your caption was sent"
 ],
 "write.lockedIn": [
  "It’s in. No changes now.",
  "Locked in. Keep a straight face from here.",
  "Now try not to look at anyone.",
  "Done. Don’t say which one is yours.",
  "In. Now act like you didn’t write anything.",
  "Sealed. The table will be the judge.",
  "Resist explaining it.",
  "Submitted. It reads better than you think.",
  "It’s out of your hands."
 ],
 "write.oneCaption": [
  "Only one caption so far. Thirty more seconds.",
  "One caption won’t do. Everyone gets thirty more seconds.",
  "A game needs at least two lies. Thirty more seconds.",
  "One caption isn’t a game. Thirty more seconds."
 ],
 "write.mulligan": [
  "Returned to sender.",
  "The cartoonist has been asked to try again.",
  "Not tonight.",
  "Rejected by a panel of experts.",
  "This cartoon will not be appearing in our pages.",
  "Pulled from the issue.",
  "Back to the drawing board, where it came from.",
  "We’ll be in touch. We won’t.",
  "Declined, with thanks.",
  "Spiked by the editors.",
  "Killed in edit.",
  "The table would like to see other cartoons.",
  "This one has been let go.",
  "Off to the archives, face-down.",
  "Never speak of it again.",
  "Thank you for your submission.",
  "The table has spoken.",
  "Noted, and declined.",
  "The cartoonist has been informed.",
  "Politely, firmly, no.",
  "Into the shredder it goes.",
  "Not even the artist liked that one.",
  "Cartoon fired. Security will walk it out."
 ],
 "write.mulligan2": [
  "And that one too.",
  "The table is being very particular tonight.",
  "Two in a row. The cartoonist is taking it personally."
 ],
 "wait.last": [
  "The table is reading the cartoon again. Out loud.",
  "Somebody is pretending to check their phone.",
  "Take your time. Everyone else did not.",
  "The other captions are getting cold.",
  "Someone just said “any minute now.”",
  "The ice in everyone’s drink is melting.",
  "The best captions take a while. So do the others.",
  "This had better be good.",
  "The cartoon isn’t going anywhere. Neither is anyone else.",
  "Rewriting it again, by the look of it.",
  "The table is now discussing {name}’s typing speed.",
  "Everyone is being very nice about this.",
  "The suspense is mostly for {name}.",
  "Last one in writes the best one. That’s the theory.",
  "One caption away from a full table.",
  "Every other phone is face-down on the table.",
  "A hush has fallen. Not a respectful one.",
  "The other writers are trying not to look over.",
  "The dealer is holding the round open with one hand.",
  "It’s either brilliant or deleted. We’ll know soon.",
  "Somewhere a backspace key is working very hard.",
  "{name} has gone quiet. That’s a good sign or a bad one.",
  "Everyone else is locked in.",
  "The table is being very patient.",
  "No pressure. (Some pressure.)",
  "Every chip is waiting."
 ],
 "wait.lastDealer": [
  "The dealer can’t start the round without the dealer.",
  "Even the dealer has to write one.",
  "The dealer is writing. The dealer is also the hold-up."
 ],
 "wait.lastLeader": [
  "First place, last in.",
  "{name} has a lead to protect."
 ],
 "wait.lastFirst": [
  "First cartoon of the night. Nobody wanted to go first. {name} wants to go last.",
  "It’s round one. Everyone’s being polite about it."
 ],
 "wait.lastLate": [
  "Double points. {name} is double-checking.",
  "It’s the Late Edition. {name} is writing for the record."
 ],
 "wait.lastNoTimer": [
  "No timer tonight. {name} noticed.",
  "There’s no clock. {name} is testing that."
 ],
 "wait.nudgeTitle": [
  "It’s down to you.",
  "Everyone else is in.",
  "You’re the last one.",
  "The table is waiting on you."
 ],
 "wait.nudgeSub": [
  "Everyone else is done. They’re being nice about it.",
  "Whatever you have is probably fine.",
  "Send it. You can be proud of it later.",
  "They’re reading your face for clues.",
  "The first draft is often the one.",
  "One more pass, then let it go.",
  "No rush. They’ve started talking about you."
 ],
 "late.banner": [
  "The Late Edition. Double points from here.",
  "Last time around. Everything counts twice.",
  "The Late Edition goes to press. Points doubled.",
  "Final trip around the table. Double points, same lies.",
  "Late Edition: whatever happens now happens twice.",
  "Double points. Pace yourselves."
 ],
 "read.sub": [
  "{n} in the open, one face-down. One is real. The rest are your friends.",
  "One of these is real. The others came from this table.",
  "{n} face-up, one face-down. One of them came from a magazine.",
  "One real caption. Everyone else’s best guess.",
  "Somewhere in here, one of them is printed.",
  "One is real. The rest are lying to your face."
 ],
 "read.hint": [
  "Don’t read the face-down one. You can’t.",
  "The face-down one waits.",
  "Read them straight. No editorializing.",
  "Read them all the same way. Especially yours.",
  "Same voice for every one. Yours included.",
  "The face-down one stays a mystery."
 ],
 "read.yours": [
  "Yours. Act surprised later.",
  "That’s yours under there. Say nothing.",
  "Yours is the face-down one. Look bored.",
  "Yours. Don’t look at it.",
  "Yours. Nobody knows. Keep it that way.",
  "It’s yours. Keep a straight face."
 ],
 "flip.yours": [
  "(Yours. Look as surprised as everyone else.)",
  "(Yours. Don’t react.)",
  "(Yours. Breathe normally.)",
  "(Yours. Poker face.)"
 ],
 "bet.dealer": [
  "Watch who hesitates.",
  "Remember who looks pleased with themselves.",
  "Note who bet fast. Note who didn’t.",
  "Your turn comes later. It’s the fun one.",
  "Watch the chips. Pick your victim.",
  "Watch closely. When the chips are down, you get to steal one."
 ],
 "bet.dealerNoSteal": [
  "If nobody finds the real one, you score. Root for confusion.",
  "Every wrong chip is good news for you.",
  "Nobody finds it, you score. Look supportive.",
  "Watch the table. If nobody finds the real one, you score."
 ],
 "bet.watch": [
  "Watch where they hesitate.",
  "Note who goes fast.",
  "Watch their face, not their phone.",
  "See who gets two chips out.",
  "Every chip down is a clue.",
  "Pay attention. It’s information.",
  "Watch the chips land."
 ],
 "bet.down": [
  "No more bets",
  "That’s everyone",
  "Hands off the chips",
  "Bets are closed",
  "All chips are down"
 ],
 "steal.waiting": [
  "Avoid eye contact.",
  "Look like a person whose chip is worth nothing.",
  "Now is a good time to compliment {dealer}.",
  "Sit very still. They hunt by movement.",
  "Every chip is in play. Some more than others.",
  "Act natural. Not that natural.",
  "Don’t touch your chips. It draws attention.",
  "If {dealer} smiles at you, that’s not good.",
  "This is the part where friendships are tested.",
  "Mention how much you’ve always liked {dealer}’s cooking.",
  "You can bribe the dealer. You can’t bribe the phone.",
  "Any chip on the table could go. Plead your case."
 ],
 "steal.receipt": [
  "Received from {name}. Signed for by the dealer.",
  "Collected from {name}. No forwarding address.",
  "Transferred from {name}. Paperwork to follow.",
  "From {name}, with no hard feelings on file.",
  "Formerly {name}’s. Ownership updated.",
  "Taken from {name}. Receipt available on request. Not this request.",
  "Reassigned from {name}, effective immediately.",
  "From {name}’s side of the table to the dealer’s.",
  "Removed from {name}. Reason: dealer’s discretion.",
  "Picked up from {name}. A note was left.",
  "{name}’s chip. Under new management.",
  "Out of {name}’s hands. Into better ones.",
  "Received from {name}. Condition: used.",
  "Received from {name}. No receipt.",
  "Transferred from {name}. Signed for.",
  "Formerly {name}’s. Condition: fair."
 ],
 "steal.again": [
  "{name}, back so soon.",
  "{name} again. Same table, same pocket.",
  "{name} is now a regular.",
  "{name} should really stop leaving chips there.",
  "Hello again, {name}. It’s still not personal.",
  "We meet again, {name}."
 ],
 "steal.again3": [
  "{name}, for the {ordinal} time.",
  "At this point {name} is a supplier.",
  "{name} has been robbed {count} times and keeps coming back.",
  "{name} keeps a chip out just for this."
 ],
 "steal.againShort": [
  "Received from {name}, a repeat customer.",
  "Another from {name}. Filed with the others.",
  "{name}’s account, debited once more.",
  "Received from {name}. Again."
 ],
 "steal.eyebrow": [
  "Change of hands",
  "Reassignment",
  "Property of the dealer",
  "Chip relocation",
  "A minor theft",
  "Transfer of ownership"
 ],
 "steal.closing": [
  "Is anyone going to do anything about that?",
  "And that’s why I keep mine in my shoe.",
  "This happens every time we play at their house.",
  "Nobody move. It might come back for more.",
  "Let’s all just keep eating.",
  "We used to be a quiet table.",
  "Should we tell the host, or is the host in on it?"
 ],
 "heist.0.closing": [
  "I told you not to sit under the claw.",
  "Twenty years, and it’s never done that for me.",
  "It’s rigged, but in a way I respect."
 ],
 "heist.0.tag": [
  "Works one time in a hundred.",
  "Coin-operated."
 ],
 "heist.0.any": [
  "Nobody wins on the claw. Except just now.",
  "Fifty cents well spent.",
  "Usually it drops it right before the chute.",
  "It’s mostly stuffed animals. Today, a chip.",
  "The owner sets the grip. The owner is the dealer.",
  "First try, too."
 ],
 "heist.0.real": [
  "Picked the one prize worth having.",
  "It never goes for the good one. It went for the good one."
 ],
 "heist.0.fake": [
  "Won the prize nobody wanted.",
  "Went for the shiny one. It was a fake."
 ],
 "heist.1.closing": [
  "We can’t fire him. He knows where everything is.",
  "He came with the house.",
  "It’ll turn up polished."
 ],
 "heist.1.tag": [
  "Removes what isn’t needed.",
  "Never seen leaving a room."
 ],
 "heist.1.any": [
  "I took the liberty.",
  "It’ll be in the study, should you wish to visit.",
  "You won’t be needing this, I think.",
  "Thirty years with the family. Things go missing.",
  "Pardon my reach.",
  "Will that be all?",
  "I’ve put it with the good silver."
 ],
 "heist.1.real": [
  "Only the good one. One has an eye.",
  "I only ever remove what’s valuable."
 ],
 "heist.1.fake": [
  "I’ll put it with the costume jewelry.",
  "A fake. I’ll have it polished anyway."
 ],
 "heist.2.closing": [
  "Do the one where he gives it back.",
  "He did my son’s birthday. The presents are still missing.",
  "Applause seems wrong, and yet."
 ],
 "heist.2.tag": [
  "No refunds after the trick.",
  "Nothing up the other sleeve either.",
  "Nothing up the sleeve."
 ],
 "heist.2.any": [
  "And for my next trick, I keep it.",
  "Pick a chip. Any chip. Too late.",
  "The trick is you don’t get it back.",
  "A magician never explains, and never returns.",
  "Watch closely. Closer. Gone.",
  "Is this your chip? Not anymore.",
  "No, you may not examine it."
 ],
 "heist.2.real": [
  "I knew which one was real. That’s the act.",
  "The real one. Of course it was the real one."
 ],
 "heist.2.fake": [
  "Made a fake disappear. Nobody’s complaining.",
  "Pulled a fake out of the hat. It happens."
 ],
 "heist.3.closing": [
  "She did the same thing with my Halloween candy.",
  "Once it’s in the purse, it’s gone.",
  "Nobody say anything. She’s our ride."
 ],
 "heist.3.tag": [
  "Has a drawer for this.",
  "Will not be discussing it.",
  "Sweetheart, that’s mine."
 ],
 "heist.3.any": [
  "It’s for your own good.",
  "It goes in the tin with the buttons.",
  "You’ll get it back in the will.",
  "When you’re older, you’ll understand.",
  "Don’t make that face. It’ll stick.",
  "You can visit it on holidays.",
  "I’ll keep it somewhere safe. You’ll never find it."
 ],
 "heist.3.real": [
  "Grandma always knows which one is real.",
  "I’ve been reading cartoons since before you were born, dear."
 ],
 "heist.3.fake": [
  "I knew it was a fake, dear. I took it to be nice.",
  "It’s not real, but it’s the thought that counts."
 ],
 "heist.4.closing": [
  "Don’t chase the cat. You’ll only make it a game.",
  "It’ll turn up in a shoe in about a month.",
  "We have three cats. We used to have chips."
 ],
 "heist.4.tag": [
  "Every table is the cat’s table.",
  "Not sorry.",
  "It was on the table."
 ],
 "heist.4.any": [
  "I’ll knock the rest off later.",
  "I’ll be under the sofa with it.",
  "You were done with it.",
  "I wanted it until I had it.",
  "Call me all you like. I won’t come.",
  "If I sat on it, it’s mine.",
  "Next time, don’t leave it out."
 ],
 "heist.4.real": [
  "I always take the one you want.",
  "I could tell it was the good one. You kept looking at it."
 ],
 "heist.4.fake": [
  "It was the wrong one. I’m still not giving it back.",
  "Worthless. Mine."
 ],
 "heist.5.closing": [
  "I was only raising my hand to ask a question.",
  "We came for the lamp.",
  "Nobody bid. That didn’t seem to matter."
 ],
 "heist.5.tag": [
  "Fast talker, faster hands.",
  "No reserve.",
  "Going once."
 ],
 "heist.5.any": [
  "Do I hear one? I hear one. Mine.",
  "All sales final. This one especially.",
  "Sold as is. No returns.",
  "Lot forty-two, to the dealer.",
  "The buyer’s premium is the whole chip.",
  "Sold, to the dealer.",
  "No other bids."
 ],
 "heist.5.real": [
  "Genuine article. Sold to the dealer.",
  "Sold well under value."
 ],
 "heist.5.fake": [
  "A reproduction. A good one.",
  "Sold as authentic. It was not."
 ],
 "heist.6.closing": [
  "We need to get a lid for this table.",
  "Don’t feed him. He’ll come back for the rest.",
  "Animal control says the dealer isn’t their department."
 ],
 "heist.6.tag": [
  "Comes at night. Takes what’s out.",
  "Small hands, big plans.",
  "Washes everything first."
 ],
 "heist.6.any": [
  "I’ll be in the bins if you need me.",
  "I have a family to feed. They eat chips.",
  "Left out overnight is fair game.",
  "Don’t look at me like that. You’d do the same.",
  "There’s a whole system. You wouldn’t understand it.",
  "Rinsed it. Mine now.",
  "Found it in the open. Basically garbage."
 ],
 "heist.6.real": [
  "Best thing I’ve found all week, and I’ve been through a lot of trash.",
  "Usually it’s half a sandwich. Today it was the good one."
 ],
 "heist.6.fake": [
  "Turns out it was garbage. Feels like home.",
  "Not the good one. Still better than the bins."
 ],
 "heist.7.closing": [
  "He does our taxes. We can’t say a word.",
  "Somehow we’ll end up owing him.",
  "He’s going to itemize that."
 ],
 "heist.7.tag": [
  "Everything balances eventually.",
  "Itemizes.",
  "Moves it to another column."
 ],
 "heist.7.any": [
  "I’ve reclassified it.",
  "It’s on my books now.",
  "You’ll get a form in January.",
  "It was always mine. The paperwork just caught up.",
  "Please don’t call me during tax season.",
  "For tax purposes, it’s mine.",
  "It balances now."
 ],
 "heist.7.real": [
  "A sound asset, acquired.",
  "Valued at full price. By me."
 ],
 "heist.7.fake": [
  "Written off as a loss. You’ll be reimbursed one point.",
  "Bad investment. I’ll still deduct it."
 ],
 "heist.8.closing": [
  "Somebody say something.",
  "Whatever you do, don’t clap.",
  "I think he took mine too. It’s hard to tell with him."
 ],
 "heist.8.tag": [
  "No comment.",
  "Strictly nonverbal.",
  "Says nothing. Takes everything."
 ],
 "heist.8.any": [
  "(Puts it in an invisible box. Locks the box.)",
  "(Walks against the wind, with your chip.)",
  "(Pretends to give it back. Does not.)",
  "(Hauls it in on an invisible rope.)",
  "(Takes a small bow. Leaves through a door that isn’t there.)",
  "(Pockets it. Says nothing.)",
  "(Points at you. Shrugs.)"
 ],
 "heist.8.real": [
  "(Taps nose. Points at the real one.)",
  "(Mimes being very, very clever.)"
 ],
 "heist.8.fake": [
  "(Mimes surprise. Keeps it anyway.)",
  "(Mimes reading the fake. Mimes laughing.)"
 ],
 "heist.9.closing": [
  "Well, nobody’s touching that chip now.",
  "And that’s why he’s not allowed at the buffet.",
  "We were told the pond was decorative."
 ],
 "heist.9.tag": [
  "Sits still for a living.",
  "Long tongue, short conversation.",
  "Patient. Then not."
 ],
 "heist.9.any": [
  "Sat on a lily pad an hour for this.",
  "Didn’t even have to get up.",
  "The tongue is faster than it looks.",
  "I’m not proud of the tongue, but it works.",
  "I’ll be in the pond.",
  "It looked like a fly. Still mine.",
  "It was moving slowly. That’s on you."
 ],
 "heist.9.real": [
  "Got the big one.",
  "Waited all night for the right one to land."
 ],
 "heist.9.fake": [
  "Wrong fly. Still lunch.",
  "It was a moth. I’m not fussy."
 ],
 "heist.10.closing": [
  "Who invited the octopus?",
  "He also took the bread basket.",
  "Check your pockets. All of them."
 ],
 "heist.10.tag": [
  "Reaches across the table.",
  "Never empty-handed.",
  "Has a hand in everything."
 ],
 "heist.10.any": [
  "I’d say sorry, but my hands are full.",
  "One arm for the chip. Seven for alibis.",
  "Seven left. Don’t tempt me.",
  "Ink first, questions later.",
  "I was reaching for the salt.",
  "I had seven free hands. Do the math."
 ],
 "heist.10.real": [
  "Eight arms, and every one went for the right chip.",
  "Felt around for the real one. Found it."
 ],
 "heist.10.fake": [
  "Wrong one. Seven more tries.",
  "One arm made a mistake. The others will hear about it."
 ],
 "flip.lead": [
  "Turning it over…",
  "And the face-down card says…",
  "Let’s see what was under there…",
  "Turning over the one nobody could read…",
  "Turning the Closed Caption over…"
 ],
 "flip.up": [
  "It says…",
  "Under the card…",
  "Face-up at last…",
  "The Closed Caption is…"
 ],
 "flip.none": [
  "Not one blind chip on it.",
  "The face-down card is on its own.",
  "Nobody bet blind on this one.",
  "No one trusted the card nobody could read.",
  "Every blind chip went somewhere else.",
  "Nobody is riding on the face-down one."
 ],
 "flip.riders": [
  "{riders} bet on it without reading it.",
  "{riders} are riding on this.",
  "{riders} took it on faith."
 ],
 "reel.real": [
  "As published.",
  "The printed one.",
  "Straight from the magazine.",
  "The cartoonist’s own.",
  "The one that ran.",
  "As printed."
 ],
 "reel.realAll": [
  "Everyone believed it.",
  "Unanimous, for once.",
  "The whole table found it.",
  "Not much of a secret."
 ],
 "reel.realMost": [
  "Most of the table found it.",
  "{k} of {n}. The rest were busy believing someone else.",
  "{k} of {n} saw through it all."
 ],
 "reel.realFew": [
  "{k} of {n}. A minority, and correct.",
  "Only {k} found it.",
  "{k} believers. The rest went elsewhere."
 ],
 "reel.realOne": [
  "{name} alone believed it.",
  "One believer: {name}.",
  "{name} found it. {name} will mention this."
 ],
 "reel.realNobody": [
  "Not one chip. It was right there.",
  "The real one, ignored by everyone.",
  "The real one sat alone the whole round.",
  "Unbelieved, and real.",
  "It was real. Nobody wanted it.",
  "Passed over by the entire table.",
  "Real, and ignored by all.",
  "The only caption nobody suspected of being real.",
  "The truth had no friends."
 ],
 "reel.realStolen": [
  "Found by {victim}, taken by {dealer}.",
  "Someone found it. The dealer found them.",
  "Found, and then not.",
  "It had one chip on it. Then it didn’t.",
  "Somebody was right, for a moment.",
  "Found. Then stolen."
 ],
 "reel.fakeNobody": [
  "No takers.",
  "Not one chip.",
  "The table passed.",
  "Admired from a distance.",
  "Nobody went near it.",
  "Read aloud, then forgotten.",
  "No chips. Maybe a laugh.",
  "A fine caption. No buyers.",
  "Nobody believed it, and that’s fine.",
  "It fooled nobody, but it was very sure of itself.",
  "Left on the table, untouched.",
  "Nobody bit."
 ],
 "reel.group": [
  "{k} captions nobody bet on",
  "{k} captions, read and released",
  "{k} captions, zero believers",
  "The ones the table let go",
  "{k} untouched",
  "{k} captions, not one chip"
 ],
 "reel.fell": [
  "Believed it",
  "Bought it",
  "Taken in",
  "Went for it",
  "Signed on",
  "Fell for it"
 ],
 "reel.fellAll": [
  "The whole table bought it"
 ],
 "reel.fellOne": [
  "One believer"
 ],
 "reel.noted": [
  "So noted.",
  "The table will remember.",
  "On the record.",
  "Entered into the record.",
  "We saw.",
  "Logged.",
  "Noted."
 ],
 "reel.lead": [
  "And the printed one is…",
  "Now, the real one…",
  "And the one that ran is…",
  "And the cartoonist wrote…",
  "And the real caption is…"
 ],
 "reel.hold": [
  "{dealer} moves on when the table’s done.",
  "Talk it over. {dealer} has the button.",
  "Discuss. {dealer} will move it along.",
  "Accusations welcome. {dealer} decides when to move on.",
  "Take a moment. {dealer} is in no hurry."
 ],
 "badge.moon": [
  "Both chips on a card nobody could read, and right.",
  "Didn’t read it. Didn’t need to.",
  "Two chips, face-down, real.",
  "Shot the moon — both chips, face-down, dead on."
 ],
 "badge.half": [
  "Both chips, before the flip, on the real one.",
  "Went double before anyone knew anything, and was right.",
  "Two chips on the truth, first try.",
  "Half-Moon — both chips blind on the real one."
 ],
 "badge.three": [
  "{names} each put both chips on it.",
  "{names} went all in on it, all of them.",
  "{names} were convinced. Both chips each.",
  "{names} all went both chips."
 ],
 "badge.sweep": [
  "Every other player bet on it.",
  "The whole table, fooled at once.",
  "Not one holdout.",
  "Every single player bet on it."
 ],
 "badge.minds": [
  "Two of you wrote the same caption. Separately, you say.",
  "Same idea, two phones.",
  "Two writers, one thought.",
  "Two of you wrote nearly the same thing."
 ],
 "badge.pickpocket": [
  "Took a chip off the real one. Knew where to look.",
  "Picked the one pocket worth picking.",
  "Went straight for the truth and took it.",
  "Stole a chip right off the real caption."
 ],
 "end.honest": [
  "Every chip found the real one. Every lie went home alone.",
  "A table of honest people. Unusual for this game.",
  "All that lying, and not one taker.",
  "The truth was popular. The fakes were not.",
  "{n} fakes written. None believed.",
  "The writers will be reviewing what went wrong.",
  "Nobody bought a thing. A sensible crowd.",
  "Nobody fooled anybody."
 ],
 "end.swept": [
  "{writer} told one lie and the whole table signed off on it.",
  "Everyone believed {writer}. {writer} would like that in writing.",
  "{writer} fooled the room. The room is taking it well.",
  "Unanimous, and wrong. {writer} wrote it.",
  "{writer} wrote it. Everyone else paid for it.",
  "The table agreed on something tonight. It was {writer}’s fake."
 ],
 "end.allFound": [
  "The real caption had a full house.",
  "Every player found it. Nobody is impressed with anybody.",
  "The real one was not hard to find, it turns out.",
  "A clean round for the truth.",
  "Everyone found it. The liars are regrouping."
 ],
 "end.revenge": [
  "Nobody found the real one. {dealer} found that delightful.",
  "The real caption sat there the whole round. Nobody visited.",
  "Not one chip on the truth. {dealer} collects.",
  "The real one was right there, wearing a name tag.",
  "Everyone was wrong in their own way. {dealer} takes {pts}.",
  "The truth went unclaimed, so {dealer} claimed it."
 ],
 "end.ccRealRiders": [
  "It was face-down the whole time. {riders} had a feeling.",
  "The real one was under the card, and {riders} bet on it blind.",
  "{riders} trusted the card nobody could read. Paid.",
  "Face-down and real. {riders} never needed to see it."
 ],
 "end.ccRealAlone": [
  "The real one was face-down. Nobody checked under the card.",
  "It was face-down all along. Not one chip went looking.",
  "The truth was in the one place nobody bet.",
  "It usually isn’t the face-down one. This time it was."
 ],
 "end.ccFakeRiders": [
  "The face-down card was {writer}’s. {riders} rode it anyway.",
  "{riders} bet blind on the face-down card. It was {writer} the whole time.",
  "{riders} trusted the face-down card. {writer} appreciates it."
 ],
 "end.stoleReal": [
  "{dealer} took a chip off the real one. Inside information, or a lucky hand.",
  "{dealer} stole the one chip that mattered.",
  "{dealer} picked the right pocket.",
  "{dealer} knew which chip to take. Draw your own conclusions.",
  "{victim} found the real one. {dealer} took the credit."
 ],
 "end.stoleFake": [
  "{dealer} stole off a fake. {victim} gets {pts} for the trouble.",
  "{dealer} took a chip that was going nowhere. +{pts} to {victim}.",
  "{dealer} stole a losing chip. {victim} is compensated: +{pts}.",
  "Wrong pocket, {dealer}. +{pts} to {victim}.",
  "{dealer} stole {victim}’s mistake. {victim} gets +{pts} for it."
 ],
 "end.peace": [
  "{dealer} stole nothing. Everyone is suspicious.",
  "{dealer} kept their hands in their lap.",
  "No steal. {dealer} is playing a longer game.",
  "{dealer} passed on the steal. Nobody is sure why.",
  "{dealer} let everyone keep their chips. Note the date."
 ],
 "end.noScore": [
  "No points anywhere. A very even round.",
  "The scoreboard did not move. Nobody touch it.",
  "Nobody scored. The round will not be discussed further.",
  "Nobody scored. Not even the dealer."
 ],
 "end.tie": [
  "A tie for the round. Nobody has to be gracious.",
  "Shared. Neither of them will bring up the other.",
  "Tied for the round. Split the credit, keep the points."
 ],
 "end.first": [
  "One down. Everyone now knows what everyone sounds like.",
  "Round one. Nobody has a reputation yet.",
  "That was the warm-up. It counts.",
  "First round over. Grudges may now begin."
 ],
 "end.late": [
  "Late Edition. Everything counted twice, including that.",
  "Double points. Double the explaining on the drive home.",
  "The Late Edition goes to print with that in it.",
  "Points doubled. Opinions unchanged."
 ],
 "end.last": [
  "That was the last one. Whatever you wrote is now permanent.",
  "Final round. Nothing more to be done about any of it.",
  "That’s every cartoon. What happened, happened."
 ],
 "end.moonHit": [
  "{name} shot the moon and it held.",
  "{name} put both chips on a card nobody could see. Correct.",
  "{name} bet everything on the face-down card. The card agreed."
 ],
 "end.moonMiss": [
  "{name} went both chips on a fake. Commitment, at least.",
  "{name} shot for the moon and hit {writer}.",
  "{name} went all in. {writer} sends thanks.",
  "Both of {name}’s chips, both on {writer}."
 ],
 "end.minds": [
  "{a} and {b} wrote the same thing. Nobody is accusing anybody.",
  "{a} and {b} had the same idea. They should not compare notes again.",
  "Two people, one caption. {a} and {b} will not be discussing it."
 ],
 "end.betOwn": [
  "{name} put a chip on their own caption. Someone had to.",
  "{name} backed their own lie. Loyal, if nothing else.",
  "{name} believed {name}. Nobody else did."
 ],
 "end.bluff": [
  "{n} people believed {writer}.",
  "{writer}’s fake drew {n} believers.",
  "{writer} talked {n} people into it.",
  "{writer} convinced {n} of you.",
  "{n} of you trusted {writer}. Interesting choice.",
  "{writer} had {n} people fooled. Some of them still are."
 ],
 "end.bluff2": [
  "{writers} split the gullible vote.",
  "{writers}, equally persuasive.",
  "{writers} each found {n} believers."
 ],
 "stamp.again": [
  "Still.",
  "Once more.",
  "Back again.",
  "Twice now.",
  "Not for the first time.",
  "Again."
 ],
 "stamp.againN": [
  "{ordinal} time tonight.",
  "This is becoming a pattern.",
  "It’s a habit now.",
  "Somebody should do something about {name}.",
  "Again. ({ordinal} time.)"
 ],
 "stamp.lead": [
  "New leader.",
  "Takes the lead.",
  "First place, as of now."
 ],
 "stamp.atLast": [
  "There it is.",
  "At last.",
  "Worth the wait."
 ],
 "stamp.tied": [
  "Shared.",
  "Split down the middle.",
  "A joint effort, unplanned."
 ],
 "score.nextDealer": [
  "{dealer} has the deck.",
  "{dealer} deals. Everyone else gets nervous.",
  "{dealer}’s turn to steal.",
  "New dealer. Same suspects."
 ],
 "frame.prompt": [
  "Anything better than the printed one?",
  "Was any of these better than the real one?",
  "Anything here worth a frame?",
  "Better than the original? Be honest.",
  "Any of these deserve a wall?",
  "Anything the cartoonist should worry about?",
  "Did one of you outdo the professional?",
  "Anything here you’d want to see again?",
  "Did anyone beat the real one?"
 ],
 "frame.sub": [
  "Most of the table agrees, and it goes on the wall.",
  "Not your own. Not the real one.",
  "Hang one, or let the original stand."
 ],
 "frame.plaque": [
  "Hung at eye level, next to the fire exit.",
  "Hanging in The Gallery. The real one has been notified.",
  "On the wall, slightly crooked, as is tradition.",
  "The Gallery has made room.",
  "Framed, wired, and hung. No refunds.",
  "The cartoonist’s version is in storage.",
  "Matted, framed, and a little better than the original.",
  "In The Gallery now. It doesn’t come down.",
  "Better than the real one. Now hanging in The Gallery."
 ],
 "frame.mine": [
  "You beat the real one. It’s on the wall, and so is your name.",
  "Your caption is on the wall. Act like it happens all the time.",
  "Framed. Try not to mention it more than twice.",
  "You’re in The Gallery. Your family will hear about this.",
  "Hanging in The Gallery under your name, for good.",
  "You beat the real one. Hanging in The Gallery for good."
 ],
 "frame.many": [
  "The real one is outnumbered.",
  "The Gallery needed a second nail.",
  "More than one beat the real one. The cartoonist is reviewing their options."
 ],
 "call.hit": [
  "{caller} called {called}. {called} answered.",
  "{caller} named {called} before a chip went down. {called} went right where {caller} said.",
  "{caller} wrote this one to {called}’s exact specifications.",
  "{caller} knew {called} would fall for it. Everyone else is now wondering what {caller} knows about them.",
  "Predicted by {caller}. Confirmed by {called}.",
  "Called shot: {called}. {caller} knows {called} better than {called} does.",
  "{caller} said {called} would buy it. {called} bought it, right on schedule.",
  "{caller} picked {called} out of a lineup in advance. Correct.",
  "{caller} saw {called} coming from across the table.",
  "{caller} called it on {called}, in writing, before the bets. {called} has no defense."
 ],
 "call.miss": [
  "{caller} called {called}. {called} let it go to voicemail.",
  "{caller} was sure about {called}. {called} was not.",
  "{caller} wrote this one for {called}. {called} returned it unopened.",
  "{caller} predicted {called}. {called} had other plans.",
  "{caller} called {called}. Wrong number.",
  "{caller} thought {called} would bite. {called} would like that noted.",
  "{caller} named {called} in advance. {called} declined to participate.",
  "{caller} had {called} figured out. Past tense.",
  "{caller} built a trap for {called}. {called} walked around it.",
  "{called} saw it coming. {caller} didn’t see that coming."
 ],
 "slip.form": [
  "The Editors thank you for thinking of us, and ask that you stop.",
  "We regret that your caption does not meet our needs at this time, or at any time.",
  "Thank you for your submission. It has been read, which is more than we can say for most.",
  "Your caption was considered carefully by the Editors, who would like that time back.",
  "We are returning your work, with our compliments to whoever groaned first.",
  "Unfortunately, we are not accepting captions like this one. We checked.",
  "Please do not take this personally. The table did.",
  "The Editors found your caption memorable, and are working on that.",
  "We have passed your caption along to another magazine, as a warning.",
  "Your submission has been filed under “Groans, assorted.”",
  "Thank you for your interest. Ours is elsewhere.",
  "We enjoyed reading your caption less than you enjoyed writing it.",
  "The Editors would like to see other work from you. Different work.",
  "While we cannot use this caption, the table has found a use for it.",
  "Not quite right for us. Not quite right for anyone, the Editors suspect.",
  "We read it twice to be sure. We are sure.",
  "Your caption will be kept on file, where it can do no harm.",
  "The Editors appreciate the effort, and have chosen to leave it at that.",
  "Due to the volume of groans received, we are unable to respond personally.",
  "We are not in a position to publish this, or to discuss it further.",
  "A bold choice. The Editors prefer timid ones.",
  "Thank you for sharing this with us. Please don’t share it with anyone else.",
  "Regretfully declined. The regret is mostly yours.",
  "The Editors have reviewed your caption and will be taking the rest of the evening off.",
  "Returned without comment. The groans are enclosed."
 ],
 "slip.note": [
  "The Editors returned {name}’s caption. {n} groans, enclosed.",
  "{name} has received a rejection slip. {n} groans, no chips.",
  "A slip from The Editors for {name}. {n} groans, no takers."
 ],
 "tvc.table": [
  "Blind laughs: {writer} {n}, the cartoonist {m}. The table takes it.",
  "Before anyone knew which was real: {writer} {n}, the cartoonist {m}.",
  "On laughs alone, {writer} outwrote the magazine, {n} to {m}.",
  "Judged blind, the table wins this one. {writer} {n}, the professional {m}.",
  "The table, {n}. The cartoonist, {m}. Somebody tell the magazine.",
  "{writer} got the bigger laugh, {n} to {m}, back when it could have been real."
 ],
 "tvc.cartoonist": [
  "Blind laughs: the cartoonist {m}, the table’s best {n}. The professional takes it.",
  "Judged blind, the printed one got the bigger laugh, {m} to {n}.",
  "The cartoonist, {m}. Everyone else, at best, {n}. Experience counts.",
  "Point to the cartoonist, {m} to {n}, before anyone knew whose it was.",
  "The real one won the laugh, {m} to {n}. The table will regroup."
 ],
 "tvc.draw": [
  "Blind laughs: {n} each. The table and the cartoonist split it.",
  "Level on laughs, {n} apiece. Nobody gets the point.",
  "A draw on laughs, {n} to {n}. Everyone keeps their dignity."
 ],
 "odds.allBlind": [
  "Every first bet found the real one. Guessing, that’s about 1 in {odds}.",
  "Everyone found it before the flip. By chance alone, about 1 in {odds}."
 ],
 "odds.sweep": [
  "Every other first bet landed on {writer}’s. By chance, about 1 in {odds}.",
  "All of the table’s first bets, on {writer}’s. Guessing, about 1 in {odds}."
 ],
 "odds.allCC": [
  "Every first bet went on the face-down card. By chance, about 1 in {odds}.",
  "The whole table bet blind on the face-down card. Guessing, about 1 in {odds}."
 ],
 "odds.moon": [
  "Both chips, face-down, and it was real. Guessing, about 1 in {odds}.",
  "{name} bet both chips on a card nobody could read. The odds were about 1 in {odds}."
 ]
};
// Both worlds: require('./public/lines.js') on the server, window.ccLines in the browser.
if (typeof module !== 'undefined' && module.exports) module.exports = ccLines;
if (typeof window !== 'undefined') window.ccLines = ccLines;
