// game.js — Core game logic for Closed Caption
//
// How a round works (v2, "everyone plays"):
//   1. WRITING      Everyone — the dealer too — writes a caption for the same cartoon.
//                   Anyone can vote to mulligan the cartoon; half the table swaps it.
//   2. READING      The app secretly picks the Closed Caption (usually a random player's
//                   caption; sometimes the real one). The rest are shown. The dealer reads aloud.
//   3. FIRST_BETS   Blind bets, everyone at once and in secret (a clock catches anyone idle).
//                   The dealer does not bet. 1 chip, or both (Half-Moon / Shoot the Moon).
//                   When the last one is in, every chip drops onto the table together (dropAt).
//   4. STEAL        The dealer may take one chip off the table, before the face-down card flips.
//   5. REVEAL       The Closed Caption is turned face-up (flipAt: after the steal show).
//   6. SECOND_BETS  Anyone holding a chip places it, one at a time — anywhere, even on the same caption.
//   7. ANSWER       The reveal reel (it moves on by itself; the dealer can hold it or go back), then the recap.
//                   Frame It lives here (#5): a small frame on each fake once it's revealed; when most of the
//                   other players frame one, it's framed on the spot and hangs in The Gallery. 'Ha' and 'Groan'
//                   on every caption (#26), from the reading on. Points are paid (double in The Late Edition).
//   8. SCORES       Scoreboard; the deal moves left.
//   (FRAMING, the old Frame It screen, is gone; a room restored in it comes back on the recap.)

const PHASES = {
  LOBBY: 'lobby',
  WRITING: 'writing',
  READING: 'reading',
  FIRST_BETS: 'first_bets',
  REVEAL: 'reveal',
  SECOND_BETS: 'second_bets',
  STEAL: 'steal',
  ANSWER: 'answer',
  FRAMING: 'framing',
  SCORES: 'scores',
};

// The deck. Every cartoon up to id 112 was retired for good (Nick, Oct 19 2026: "retire all and build new"):
// the new deck is drawn in the new black-and-white style and starts at id 113 (tools/add_cartoon.py adds them here).
const CARTOONS = [
  { id: 113, level: "medium", title: "The High Dive", image: "card_113.jpg", correct: "He's been up there since the merger." },
  { id: 114, level: "easy", title: "Porch Talk", image: "card_114.jpg", correct: "He's been talking about Florida all week." },
  { id: 115, level: "medium", title: "The Recital", image: "card_115.jpg", correct: "His agent promised there'd be more of us." },
  { id: 116, level: "easy", title: "The Couch", image: "card_116.jpg", correct: "We compromised on the size." },
  { id: 117, level: "medium", title: "Park Bench", image: "card_117.jpg", correct: "She buys local." },
  { id: 119, level: "medium", title: "The Stand", image: "card_119_r2.jpg", correct: "My client is prepared to go as high as a quarter." },
  { id: 120, adult: true, level: "easy", title: "Dawn", image: "card_120.jpg", correct: "Your mother says happy birthday." },
  { id: 121, adult: true, level: "hard", title: "Open Plan", image: "card_121.jpg", correct: "HR asked us to keep some distance." },
  { id: 122, level: "medium", title: "Crossing", image: "card_122.jpg", correct: "We don't talk about it. He's happy." },
  { id: 123, spicy: true, level: "medium", title: "Patience", image: "card_123.jpg", correct: "He usually stops at the cactus." },
  { id: 124, level: "easy", title: "Spin Cycle", image: "card_124_r2.jpg", correct: "He gets nervous on the spin cycle." },
  { id: 125, adult: true, level: "medium", title: "Self-Checkout", image: "card_125.jpg", correct: "He's been here since the Crusades." },
  { id: 126, level: "hard", title: "Neighbors", image: "card_126.jpg", correct: "We were fine until he got a tree." },
  { id: 127, spicy: true, level: "medium", title: "The Morning After", image: "card_127.jpg", correct: "He says you two talked all night." },
  { id: 128, adult: true, level: "easy", title: "Guess Your Salary", image: "card_128_r2.jpg", correct: "He guessed it on the first try. She hadn't." },
  { id: 129, level: "medium", title: "The Gift", image: "card_129_r2.jpg", correct: "It came with a box, so that's something." },
  { id: 130, adult: true, level: "hard", title: "Drive-In", image: "card_130.jpg", correct: "Spoiler: he goes home." },
  { id: 132, level: "easy", title: "Beach Rental", image: "card_132_r2.jpg", correct: "He's here with a friend. Was." },
  { id: 134, adult: true, level: "hard", title: "Self-Portrait", image: "card_134_r2.jpg", correct: "I'm working through some things." },
  { id: 135, level: "medium", title: "Empty", image: "card_135.jpg", correct: "It was empty when I got here, Doris." },
  { id: 136, spicy: true, level: "medium", title: "Second Date", image: "card_136.jpg", correct: "My client is enjoying the evening." },
  { id: 137, adult: true, level: "medium", title: "Off Duty", image: "card_137_r2.jpg", correct: "Best fishing's when the light's off." },
  { id: 138, adult: true, level: "medium", title: "Performance Review", image: "card_138_r2.jpg", correct: "We're doing reviews alphabetically. Fish, hamster, cactus, you." },
  { id: 139, level: "easy", title: "Tall Order", image: "card_139_r2.jpg", correct: "He says it's the only place that gets his straw right." },
  { id: 140, spicy: true, level: "medium", title: "The Ex", image: "card_140.jpg", correct: "She was his first wife. And, apparently, his last." },
  { id: 142, adult: true, level: "medium", title: "Exhibit", image: "card_142.jpg", correct: "It's on loan from a private collector." },
  { id: 143, level: "easy", title: "Bedtime", image: "card_143.jpg", correct: "Same time tomorrow. No peeking." },
  { id: 144, spicy: true, level: "easy", title: "Neighborhood Watch", image: "card_144.jpg", correct: "Third night this week. Same car." },
  { id: 145, adult: true, level: "hard", title: "Vacancy", image: "card_145_r2.jpg", correct: "It's a starter home. You'll grow out of it." },
  { id: 146, adult: true, level: "medium", title: "Open Door", image: "card_146.jpg", correct: "That's how they let you go here." },
  { id: 147, level: "medium", title: "Rehearsal", image: "card_147.jpg", correct: "Be the crow you want to scare." },
  { id: 148, spicy: true, level: "medium", title: "Couples Yoga", image: "card_148_r2.jpg", correct: "He's been in corpse pose since 2019." },
  { id: 149, level: "easy", title: "Crossing Guard", image: "card_149_r2.jpg", correct: "Twenty minutes so far. He's halfway." },
  { id: 150, adult: true, level: "medium", title: "The Interview", image: "card_150.jpg", correct: "Says here you're a team player." },
  { id: 151, spicy: true, level: "hard", title: "Anniversary", image: "card_151.jpg", correct: "It's to the storage unit. Happy anniversary." },
  { id: 153, adult: true, level: "easy", title: "No Vacancy", image: "card_153_r2.jpg", correct: "We have a lovely room with a ceiling." },
  { id: 154, spicy: true, level: "medium", title: "Dinner Guest", image: "card_154_r2.jpg", correct: "She's been with the family longer than any of you." },
  { id: 155, level: "hard", title: "Lost and Found", image: "card_155.jpg", correct: "Describe the other one." },
  { id: 156, adult: true, level: "medium", title: "Parallel Parking", image: "card_156_r2.jpg", correct: "Sir, you're over the line." },
  { id: 157, level: "easy", title: "Fetch", image: "card_157.jpg", correct: "He has a guy for that." },
  { id: 158, adult: true, level: "medium", title: "Exit Interview", image: "card_158_r2.jpg", correct: "We'll miss you. The cactus, less so." },
  { id: 159, spicy: true, level: "medium", title: "Plus One", image: "card_159.jpg", correct: "My wife couldn't make it, so I brought someone who agrees with me." },
  { id: 161, adult: true, level: "medium", title: "The Grill", image: "card_161.jpg", correct: "Nobody touch it. Gary has a system." },
  { id: 162, spicy: true, level: "easy", title: "The Nap", image: "card_162_r2.jpg", correct: "Nobody move. He asked for 'surprise me.'" },
  { id: 165, level: "medium", title: "The Bridge", image: "card_165_r2.jpg", correct: "Cash, card, or one of your brothers?" },
  { id: 167, adult: true, level: "easy", title: "The Upgrade", image: "card_167.jpg", correct: "He's been flying with us a long time." },
  { id: 168, level: "hard", title: "Sandcastle", image: "card_168.jpg", correct: "It's lovely, but you'll need a permit for the moat." },
  { id: 169, spicy: true, level: "medium", title: "The Cake", image: "card_169.jpg", correct: "We got the big one. Nobody knew which one you were." },
  { id: 171, level: "easy", title: "Bath Time", image: "card_171.jpg", correct: "He won't get out until you say sorry." },
  { id: 172, adult: true, level: "hard", title: "Tax Season", image: "card_172.jpg", correct: "He says we can deduct the vet." },
  { id: 174, level: "medium", title: "Night Shift", image: "card_174.jpg", correct: "Anything good in sports?" },
  { id: 176, adult: true, level: "hard", title: "The Commute", image: "card_176.jpg", correct: "Some people bring a book." },
  { id: 177, level: "medium", title: "The Audition", image: "card_177.jpg", correct: "Lovely. Now do it again, but slower." },
  { id: 178, spicy: true, level: "easy", title: "Garage Sale", image: "card_178.jpg", correct: "It was only worn once." },
  { id: 179, adult: true, level: "medium", title: "The Escape", image: "card_179.jpg", correct: "Don't make eye contact. He'll want the bread." },
  { id: 180, level: "easy", title: "Lifeguard", image: "card_180.jpg", correct: "He takes the job very seriously since the incident." },
  { id: 181, spicy: true, level: "hard", title: "Retirement", image: "card_181.jpg", correct: "They said I could take anything I wanted." },
  { id: 182, adult: true, level: "medium", title: "Assembly Required", image: "card_182.jpg", correct: "It's not the same if you didn't suffer." },
  { id: 183, level: "medium", title: "Hide and Seek", image: "card_183.jpg", correct: "He's getting better at this." },
  { id: 184, spicy: true, level: "medium", title: "The Hangover", image: "card_184.jpg", correct: "Whatever you do, don't open the minibar." },
  { id: 185, adult: true, level: "hard", title: "Dress Code", image: "card_185.jpg", correct: "He's on the list." },
  { id: 186, level: "medium", title: "Story Time", image: "card_186.jpg", correct: "They never interrupt." },
  { id: 187, spicy: true, level: "medium", title: "The Proposal", image: "card_187.jpg", correct: "Let her finish the frame." },
  { id: 188, adult: true, level: "easy", title: "Wrong Number", image: "card_188.jpg", correct: "He's been on hold with his bank for an hour." },
  { id: 189, level: "hard", title: "Graduation", image: "card_189.jpg", correct: "He took the scenic route." },
  { id: 190, spicy: true, level: "easy", title: "The Ex Files", image: "card_190.jpg", correct: "She kept the other one." },
  { id: 191, adult: true, level: "medium", title: "Saturday", image: "card_191.jpg", correct: "I said one-click, not one click a minute." },
  { id: 192, level: "medium", title: "The Pitch", image: "card_192.jpg", correct: "And this is where we stop swimming in circles." },
  { id: 193, spicy: true, level: "medium", title: "Couples Massage", image: "card_193.jpg", correct: "He's not licensed, but he's very affordable." },
  { id: 194, adult: true, level: "hard", title: "Overtime", image: "card_194.jpg", correct: "Nobody tells you about the follow-up." },
  { id: 195, level: "easy", title: "Lemonade", image: "card_195.jpg", correct: "It's two dollars, or one hump." },
  { id: 196, spicy: true, level: "hard", title: "The Toast", image: "card_196.jpg", correct: "He's only on his second anecdote." },
  { id: 197, level: "easy", title: "Photo Finish", image: "card_197.jpg", correct: "Too close to call. Also, too asleep." },
  { id: 199, spicy: true, level: "medium", title: "Separate Beds", image: "card_199.jpg", correct: "It's load-bearing." },
  { id: 200, level: "hard", title: "The Keeper", image: "card_200.jpg", correct: "Nobody's hit it yet." },
  { id: 202, spicy: true, level: "easy", title: "Last Call", image: "card_202.jpg", correct: "I'll have what he's not saying." },
  { id: 204, adult: true, level: "medium", title: "The Board", image: "card_204.jpg", correct: "Let's keep this short. I have a nap at two." },
  { id: 205, spicy: true, level: "medium", title: "Test Drive", image: "card_205.jpg", correct: "He's still deciding." },
  { id: 206, level: "easy", title: "The Toll", image: "card_206.jpg", correct: "Exact change only." },
  { id: 207, adult: true, level: "medium", title: "Going Up", image: "card_207.jpg", correct: "He's new." },
  { id: 208, spicy: true, level: "hard", title: "The Will", image: "card_208.jpg", correct: "And to Mr. Whiskers, everything else." },
  { id: 209, level: "medium", title: "Ballooning", image: "card_209.jpg", correct: "He doesn't have a ticket either." },
  { id: 212, level: "hard", title: "Quiet, Please", image: "card_212.jpg", correct: "I don't make the rules, sir." },
  { id: 213, adult: true, level: "medium", title: "Touch-Up", image: "card_213.jpg", correct: "The forecast said partly cloudy." },
  { id: 214, spicy: true, level: "easy", title: "Midnight Snack", image: "card_214.jpg", correct: "Since the cheesecake incident, we take no chances." },
  { id: 215, level: "medium", title: "The Summit", image: "card_215.jpg", correct: "Mustard's extra." },
  { id: 216, adult: true, level: "hard", title: "The Collection", image: "card_216.jpg", correct: "It's the first piece in here that's ever been useful." },
  { id: 217, level: "easy", title: "The Walk", image: "card_217.jpg", correct: "He needed more exercise." },
  { id: 218, adult: true, level: "medium", title: "Cubicles", image: "card_218.jpg", correct: "Don't mention the glue factory. He's very sensitive." },
  { id: 219, spicy: true, level: "medium", title: "Dawn", image: "card_219.jpg", correct: "You said you were working late. You don't work." },
  { id: 220, level: "hard", title: "Table for One", image: "card_220.jpg", correct: "She said she'd be here by eight." },
  { id: 221, adult: true, level: "medium", title: "Yoga", image: "card_221.jpg", correct: "She's not flexible, but she's very centered." },
  { id: 222, spicy: true, level: "easy", title: "The Exit", image: "card_222.jpg", correct: "Did you at least say goodbye to the Hendersons?" },
  { id: 223, level: "easy", title: "Special Delivery", image: "card_223.jpg", correct: "I ordered it on my fortieth birthday." },
  { id: 224, adult: true, level: "hard", title: "The Witness", image: "card_224.jpg", correct: "Let the record show the witness said 'Pretty bird.'" },
  { id: 226, level: "easy", title: "Competition", image: "card_226.jpg", correct: "He's using live bait." },
  { id: 227, adult: true, level: "medium", title: "Open House", image: "card_227.jpg", correct: "The previous owners couldn't get him out either." },
  { id: 228, spicy: true, level: "hard", title: "Confession", image: "card_228.jpg", correct: "He's been saving up since Lent." },
  { id: 229, level: "medium", title: "Parking", image: "card_229.jpg", correct: "They come by once every forty years." },
  { id: 230, adult: true, level: "medium", title: "Presentation", image: "card_230.jpg", correct: "The chef recommends you savor it." },
  { id: 231, spicy: true, level: "medium", title: "Breakfast", image: "card_231.jpg", correct: "He's been very good lately." },
  { id: 232, level: "easy", title: "Picnic", image: "card_232.jpg", correct: "Same as every Fourth of July." },
  { id: 233, adult: true, level: "medium", title: "Take a Number", image: "card_233.jpg", correct: "My powers don't include patience." },
  { id: 235, adult: true, level: "hard", title: "Retirement Plan", image: "card_235.jpg", correct: "We said we'd wait till they came back." },
  { id: 236, level: "medium", title: "Summer", image: "card_236.jpg", correct: "Global warming has been great for business." },
  { id: 239, spicy: true, level: "medium", title: "The Tasting", image: "card_239.jpg", correct: "He's a big-picture guy." },
  { id: 240, level: "hard", title: "Kite", image: "card_240.jpg", correct: "It's a family tradition." },
  { id: 243, level: "medium", title: "Night School", image: "card_243.jpg", correct: "Eyes up here, please." },
  { id: 244, adult: true, level: "hard", title: "The Big One", image: "card_244.jpg", correct: "Smile. You won't believe what's behind you." },
  { id: 245, spicy: true, level: "hard", title: "Escape Room", image: "card_245.jpg", correct: "Ten more minutes, then we'll try the door." },
  { id: 246, level: "easy", title: "Bird Watching", image: "card_246.jpg", correct: "He's been out there all morning. I think he's lost." },
  { id: 247, adult: true, level: "medium", title: "Anniversary", image: "card_247.jpg", correct: "It was yesterday." },
  { id: 249, spicy: true, level: "medium", title: "Hot Tub", image: "card_249.jpg", correct: "Enjoy it. Dinner's at eight." },
  { id: 250, adult: true, level: "easy", title: "Office Party", image: "card_250.jpg", correct: "Someone stop him before he does the other end." },
  { id: 251, level: "hard", title: "Going Up", image: "card_251.jpg", correct: "They finally automated the corporate ladder." },
  { id: 252, adult: true, level: "medium", title: "Delivery", image: "card_252.jpg", correct: "It's cold. You must have walked." },
  { id: 253, spicy: true, level: "easy", title: "The Visit", image: "card_253.jpg", correct: "Mother, I'll call you when I land." },
  { id: 254, level: "medium", title: "Right of Way", image: "card_254.jpg", correct: "After you." },
  { id: 255, adult: true, level: "hard", title: "Your Move", image: "card_255.jpg", correct: "Your move." },
  { id: 256, spicy: true, level: "medium", title: "The Prize", image: "card_256.jpg", correct: "They say you start to look alike." },
  { id: 257, level: "easy", title: "Just a Trim", image: "card_257.jpg", correct: "Just take a little off the top. And the sides. Carefully." },
  { id: 258, adult: true, level: "medium", title: "Parallel Parking", image: "card_258.jpg", correct: "I'll only be a minute." },
  { id: 259, spicy: true, level: "medium", title: "Last Call", image: "card_259.jpg", correct: "It's on the house. Don't make it into anything." },
  { id: 260, level: "hard", title: "Insomnia", image: "card_260.jpg", correct: "You're number four hundred and twelve. Sleep tight." },
  { id: 261, adult: true, level: "medium", title: "Cash Machine", image: "card_261.jpg", correct: "Fifties, if you have them. Take your time." },
  { id: 262, adult: true, level: "easy", title: "All You Can Eat", image: "card_262.jpg", correct: "It says all you can eat. It doesn't say where." },
  { id: 263, level: "medium", title: "Life Drawing", image: "card_263.jpg", correct: "Same pose as yesterday, please." },
  { id: 266, level: "hard", title: "Mail", image: "card_266.jpg", correct: "Probably just bills." },
  { id: 268, spicy: true, level: "medium", title: "The Heist", image: "card_268.jpg", correct: "Look, we both know who really lives here." },
  { id: 269, level: "medium", title: "The Orchestra", image: "card_269.jpg", correct: "Budget cuts." },
  { id: 270, level: "easy", title: "Sighting", image: "card_270.jpg", correct: "No one's going to believe this." },
  { id: 271, adult: true, level: "easy", title: "Bachelor Cooking", image: "card_271.jpg", correct: "Medium-rare, light starch." },
  { id: 272, level: "hard", title: "Shadow", image: "card_272.jpg", correct: "He's never really been on board with my plans." },
  { id: 273, adult: true, level: "medium", title: "Door to Door", image: "card_273.jpg", correct: "Think of it as a starter home." },
  { id: 275, level: "medium", title: "Running Late", image: "card_275.jpg", correct: "Go on without me." },
  { id: 276, adult: true, level: "hard", title: "The Reading", image: "card_276.jpg", correct: "I see a woman looking into a crystal ball." },
  { id: 277, level: "medium", title: "On Duty", image: "card_277.jpg", correct: "Nobody's drowned since I started. Mostly out of respect." },
  { id: 278, adult: true, level: "medium", title: "The Jury", image: "card_278.jpg", correct: "Ladies and gentlemen of the jury, please. I'm talking." },
  { id: 279, adult: true, level: "hard", title: "Race Day", image: "card_279.jpg", correct: "The rent's very reasonable." },
  { id: 280, level: "medium", title: "Clean Beach", image: "card_280.jpg", correct: "Tell the tide it can come in now." },
  { id: 281, adult: true, level: "easy", title: "Pulled Over", image: "card_281.jpg", correct: "Do you know how fast you were going? Neither do I." },
  { id: 282, adult: true, level: "medium", title: "The Trick", image: "card_282.jpg", correct: "It's chapter four. Can you go slower?" },
  { id: 284, adult: true, level: "easy", title: "Body Wrap", image: "card_284.jpg", correct: "Just a touch-up. The full treatment takes three thousand years." },
  { id: 285, level: "medium", title: "Expecting", image: "card_285.jpg", correct: "It says not to sit on them too long." },
  { id: 286, adult: true, level: "hard", title: "Power Plant", image: "card_286.jpg", correct: "Shareholders don't need to know." },
  { id: 287, spicy: true, level: "medium", title: "Blood Drive", image: "card_287.jpg", correct: "I'm here to make a withdrawal." },
  { id: 288, level: "easy", title: "Rodeo", image: "card_288.jpg", correct: "Eight seconds. A new record." },
  { id: 289, adult: true, level: "easy", title: "Dinner Party", image: "card_289.jpg", correct: "His mother never let him have seconds." },
  { id: 290, adult: true, level: "medium", title: "The Verdict", image: "card_290.jpg", correct: "Too much salt. Throw him to the lions." },
  { id: 291, level: "medium", title: "The Commute", image: "card_291.jpg", correct: "He's been late every day since the Cretaceous." },
  { id: 292, adult: true, level: "easy", title: "Motivation", image: "card_292.jpg", correct: "Six more miles and you can have the hole." },
  { id: 293, spicy: true, level: "easy", title: "The Getaway", image: "card_293.jpg", correct: "He said he needed some air." },
  { id: 294, level: "medium", title: "Camouflage", image: "card_294.jpg", correct: "Your move, if you can find it." },
  { id: 295, adult: true, level: "medium", title: "Flight Plan", image: "card_295.jpg", correct: "Does anyone here know Ohio?" },
  { id: 296, spicy: true, level: "medium", title: "Economy", image: "card_296.jpg", correct: "He likes to keep up with the news." },
  { id: 297, level: "easy", title: "Fitting", image: "card_297.jpg", correct: "We may have something in a canoe." },
  { id: 298, level: "medium", title: "Maintenance", image: "card_298.jpg", correct: "Forty years and you still squeak when you're nervous." },
  { id: 299, adult: true, level: "medium", title: "References", image: "card_299.jpg", correct: "And what would you say is his greatest weakness?" },
  { id: 300, level: "medium", title: "Reach", image: "card_300.jpg", correct: "She said she wanted the moon. She didn't say which night." },
  { id: 304, adult: true, level: "hard", title: "Killing Time", image: "card_304.jpg", correct: "I'm in no hurry." },
  { id: 305, spicy: true, level: "hard", title: "Lie", image: "card_305.jpg", correct: "Found it." },
  { id: 306, level: "easy", title: "The Comb", image: "card_306.jpg", correct: "It's the principle of the thing." },
  { id: 307, adult: true, level: "medium", title: "The Forecast", image: "card_307.jpg", correct: "Let's go live to me." },
  { id: 308, spicy: true, level: "medium", title: "The Act", image: "card_308.jpg", correct: "He's the one with the drinking problem." },
  { id: 309, level: "medium", title: "Upgrade", image: "card_309.jpg", correct: "We upgraded." },
  { id: 310, adult: true, level: "easy", title: "Signal", image: "card_310.jpg", correct: "Enlightenment can wait. I'm on hold." },
  { id: 311, adult: true, level: "medium", title: "Midlife", image: "card_311.jpg", correct: "I've always wanted one." },
  { id: 312, level: "hard", title: "Hanging On", image: "card_312.jpg", correct: "Not on my watch." },
  { id: 313, adult: true, level: "medium", title: "Mondays", image: "card_313.jpg", correct: "Decaf is for the living." },
  { id: 314, spicy: true, level: "easy", title: "Dutch", image: "card_314.jpg", correct: "You had the bread." },
  { id: 315, level: "hard", title: "Help Desk", image: "card_315.jpg", correct: "Your call is important to us. Please hold." },
  { id: 316, adult: true, level: "hard", title: "The Viewing", image: "card_316.jpg", correct: "I don't think they like me." },
  { id: 318, adult: true, level: "medium", title: "Dinner Show", image: "card_318.jpg", correct: "He's been showing off since the circus closed." },
  { id: 319, adult: true, level: "medium", title: "Off Season", image: "card_319.jpg", correct: "The elves think I'm at a conference." },
  { id: 337, adult: true, level: "medium", title: "Summit Party", image: "card_337.jpg", correct: "Make a wish. Not that one." },
  { id: 338, level: "medium", title: "Dinner Table", image: "card_338.jpg", correct: "He said he'd fix the wobble." },
  { id: 339, level: "medium", title: "Science Fair", image: "card_339.jpg", correct: "She helped with the poster." },
  { id: 340, level: "easy", title: "Boarding Pass", image: "card_340.jpg", correct: "I was told two of everything." },
  { id: 341, level: "easy", title: "Early Knock", image: "card_341.jpg", correct: "You again. We have a doorbell." },
  { id: 342, adult: true, level: "medium", title: "Floor Level", image: "card_342.jpg", correct: "He's protesting something. Nobody's sure what." },
  { id: 343, level: "hard", title: "Second Wheel", image: "card_343.jpg", correct: "It's basically the same wheel, but it's a whole new wheel." },
  { id: 345, spicy: true, level: "medium", title: "Pantry Raid", image: "card_345.jpg", correct: "The kids are asleep. This is my book club." },
  { id: 346, adult: true, level: "medium", title: "Endless Form", image: "card_346.jpg", correct: "Just sign at the bottom." },
  { id: 347, level: "easy", title: "Putting Green", image: "card_347.jpg", correct: "Play it as it lies." },
  { id: 348, adult: true, level: "hard", title: "Lawn Inspection", image: "card_348.jpg", correct: "The neighbors filed a complaint. About your grass, not you." },
  { id: 349, level: "easy", title: "Water Cooler", image: "card_349.jpg", correct: "Did you hear they're cutting the air-conditioning?" },
  { id: 350, level: "easy", title: "Picnic Exodus", image: "card_350.jpg", correct: "Let them have the potato salad. Nobody wanted it." },
  { id: 351, adult: true, level: "medium", title: "Sent", image: "card_351.jpg", correct: "He replied all." },
  { id: 352, level: "medium", title: "Arena Dinner", image: "card_352.jpg", correct: "I'd skip the special. It's me." },
  { id: 353, level: "hard", title: "Frog Kiss", image: "card_353.jpg", correct: "It's a start." },
  { id: 354, level: "easy", title: "Grandpa's Call", image: "card_354.jpg", correct: "Speak up, I can't see you." },
  { id: 355, spicy: true, level: "medium", title: "Ferry Ride", image: "card_355.jpg", correct: "I was told there'd be a beach." },
  { id: 356, level: "easy", title: "Heavy Canoe", image: "card_356.jpg", correct: "Just keep paddling, dear." },
  { id: 357, spicy: true, level: "easy", title: "Book Club", image: "card_357.jpg", correct: "Did anyone actually read it?" },
  { id: 358, adult: true, level: "easy", title: "Table for One", image: "card_358.jpg", correct: "She's a regular." },
  { id: 359, level: "easy", title: "Lookout Duty", image: "card_359.jpg", correct: "Somebody has to set the tone." },
  { id: 360, spicy: true, level: "hard", title: "Minibar Night", image: "card_360.jpg", correct: "I'll come back." },
  { id: 361, level: "medium", title: "One More Bag", image: "card_361.jpg", correct: "While you're up there." },
  { id: 362, level: "medium", title: "Otter Raft", image: "card_362.jpg", correct: "It's not complicated. It's a rock." },
  { id: 363, level: "easy", title: "Sideline Dad", image: "card_363.jpg", correct: "He's reading the other team's defense." },
  { id: 364, adult: true, level: "hard", title: "Dropped Shoe", image: "card_364.jpg", correct: "Probably nothing." },
  { id: 365, level: "easy", title: "Back Row", image: "card_365.jpg", correct: "I paid for the IMAX." },
  { id: 366, adult: true, level: "hard", title: "Hardware Aisle", image: "card_366.jpg", correct: "Take all the time you need, sir. The store closes at nine." },
  { id: 367, adult: true, level: "medium", title: "Empty Lot", image: "card_367.jpg", correct: "I like to be near the entrance." },
  { id: 368, level: "medium", title: "Cave Portrait", image: "card_368.jpg", correct: "Try to look less extinct." },
  { id: 369, spicy: true, level: "medium", title: "House Wine", image: "card_369.jpg", correct: "An impish little box. Notes of Tuesday." },
  { id: 370, adult: true, level: "hard", title: "Edge Fishing", image: "card_370.jpg", correct: "They're really biting off the edge tonight." },
  { id: 371, level: "medium", title: "Playing Dead", image: "card_371.jpg", correct: "Not again, Gerald." },
  { id: 372, adult: true, level: "easy", title: "Back in Office", image: "card_372.jpg", correct: "Business on top, Sunday on the bottom." },
  { id: 373, spicy: true, level: "easy", title: "Card Game", image: "card_373.jpg", correct: "Double or nothing, Doris." },
  { id: 374, adult: true, level: "easy", title: "Sauna Bench", image: "card_374.jpg", correct: "I think he's new to saunas." },
  { id: 375, adult: true, level: "medium", title: "Lunch Security", image: "card_375.jpg", correct: "Somebody took his yogurt in 2019." },
  { id: 377, adult: true, level: "medium", title: "Sales Meeting", image: "card_377.jpg", correct: "Henderson is processing the quarter." },
  { id: 379, level: "medium", title: "Harp Issued", image: "card_379.jpg", correct: "Fifteen-love." },
  { id: 380, adult: true, level: "medium", title: "Against Current", image: "card_380.jpg", correct: "Some of us were born upstream." },
  { id: 381, spicy: true, level: "hard", title: "Next Table", image: "card_381.jpg", correct: "They'll learn." },
  { id: 382, spicy: true, level: "hard", title: "Gold Watch", image: "card_382.jpg", correct: "Fifty years and not one sick day." },
  { id: 383, adult: true, level: "easy", title: "Open Mic", image: "card_383.jpg", correct: "You're killing, Dave. With a very specific crowd." },
  { id: 384, adult: true, level: "medium", title: "Leaf Blowers", image: "card_384.jpg", correct: "It's not a competition, Gary." },
  { id: 385, level: "hard", title: "Crooked Stone", image: "card_385.jpg", correct: "Close enough. It'll be a mystery anyway." },
  { id: 386, adult: true, level: "hard", title: "Hoard Search", image: "card_386.jpg", correct: "I think I dropped an earring." },
  { id: 387, level: "medium", title: "Kids' Table", image: "card_387.jpg", correct: "One more Thanksgiving and he's in." },
  { id: 388, adult: true, level: "medium", title: "Airport Screening", image: "card_388.jpg", correct: "Anything to declare?" },
  { id: 389, level: "easy", title: "Driving Lesson", image: "card_389.jpg", correct: "Just checking my mirrors." },
  { id: 392, spicy: true, level: "hard", title: "Mantis Dinner", image: "card_392.jpg", correct: "He was delicious company." },
  { id: 393, adult: true, level: "medium", title: "By Weight", image: "card_393.jpg", correct: "Your appeal is heavy, sir. Very heavy." },
  { id: 394, spicy: true, level: "medium", title: "Last Call", image: "card_394.jpg", correct: "You've had enough. Of everyone." },
  { id: 395, spicy: true, level: "easy", title: "Happy Hour", image: "card_395.jpg", correct: "First round's on Q3." },
  { id: 396, spicy: true, level: "hard", title: "Henhouse Poker", image: "card_396.jpg", correct: "Funny. He keeps winning." },
  { id: 397, level: "hard", title: "Bill Night", image: "card_397.jpg", correct: "You can have whatever's left after the electric bill. So, this." },
  { id: 398, spicy: true, level: "hard", title: "Cliff Edge", image: "card_398.jpg", correct: "Business has never been better." },
  { id: 399, adult: true, level: "medium", title: "Cubicle Moat", image: "card_399.jpg", correct: "She's in a meeting." },
  { id: 400, spicy: true, level: "medium", title: "Cuckoo Clock", image: "card_400.jpg", correct: "Every hour, Linda. Every single hour." },
  { id: 401, spicy: true, level: "hard", title: "Tiptoe", image: "card_401.jpg", correct: "We see eye to eye on everything." },
  { id: 402, level: "easy", title: "Full Service", image: "card_402.jpg", correct: "Every Saturday since the Eisenhower administration." },
  { id: 404, level: "medium", title: "Safety First", image: "card_404.jpg", correct: "Honestly, he's got more riding on this than I do." },
  { id: 405, level: "medium", title: "Early Bird", image: "card_405.jpg", correct: "Today the worm got up earlier." },
  { id: 406, level: "medium", title: "Road Crew", image: "card_406.jpg", correct: "Nobody said anything about going around." },
  { id: 407, level: "medium", title: "Too Hot", image: "card_407.jpg", correct: "Forty years he's done this. Not one fire." },
  { id: 408, level: "hard", title: "Bright Idea", image: "card_408.jpg", correct: "The rest are still thinking it over." },
  { id: 409, adult: true, level: "easy", title: "Dinner Upstairs", image: "card_409.jpg", correct: "We always seat him away from the in-laws." },
  { id: 410, adult: true, level: "easy", title: "Fill It Up", image: "card_410.jpg", correct: "He insists on premium. Says you can taste it." },
  { id: 412, adult: true, level: "medium", title: "Wait Here", image: "card_412.jpg", correct: "Okay, buddy. Yours is decaf." },
  { id: 413, adult: true, level: "medium", title: "Steeping", image: "card_413.jpg", correct: "I asked for one lump." },
  { id: 414, adult: true, level: "medium", title: "Crosswalk Thief", image: "card_414.jpg", correct: "That's the third one this month." },
  { id: 415, adult: true, level: "hard", title: "The Bag", image: "card_415.jpg", correct: "Well. I guess you've heard about the job in Phoenix." },
  { id: 416, adult: true, level: "medium", title: "Cold Feet", image: "card_416.jpg", correct: "Give me a minute. I'm working up to it." },
  { id: 417, adult: true, level: "hard", title: "Spare Key", image: "card_417.jpg", correct: "I said one copy." },
  { id: 418, spicy: true, level: "easy", title: "In His Cups", image: "card_418.jpg", correct: "He asked for the bottomless option." },
  { id: 419, spicy: true, level: "medium", title: "Baggage", image: "card_419.jpg", correct: "Fair warning: I'm a lot to unpack." },
  { id: 420, spicy: true, level: "hard", title: "Regulars", image: "card_420.jpg", correct: "He's a good listener. Takes exact change." },
  { id: 421, spicy: true, level: "hard", title: "Dollhouse", image: "card_421.jpg", correct: "He finally got his man cave." },
  { id: 320, level: "hard", title: "Insulated", image: "card_320.jpg", correct: "He read something online." },
  { id: 321, adult: true, level: "medium", title: "Ink", image: "card_321.jpg", correct: "We're up to grandchild number eleven." },
  { id: 322, spicy: true, level: "easy", title: "Training", image: "card_322.jpg", correct: "Three weeks ago he couldn't find the kettle." },
  { id: 324, adult: true, level: "medium", title: "Chores", image: "card_324.jpg", correct: "It's Tuesday. Even up here, it's Tuesday." },
  { id: 326, level: "easy", title: "Personal Best", image: "card_326.jpg", correct: "Next month he's going for the whole wheel." },
  { id: 328, spicy: true, level: "medium", title: "The Check", image: "card_328.jpg", correct: "Shall I just leave this with the chair, sir?" },
  { id: 329, level: "medium", title: "Delivery", image: "card_329.jpg", correct: "Do you take returns?" },
  { id: 330, adult: true, level: "easy", title: "Weekend", image: "card_330.jpg", correct: "He swears they were biting last Tuesday." },
  { id: 332, level: "medium", title: "Head Count", image: "card_332.jpg", correct: "Four, five, six, and a chance of showers." },
  { id: 333, adult: true, level: "medium", title: "Feeding Time", image: "card_333.jpg", correct: "Not now. They're checking the markets." },
  { id: 334, spicy: true, level: "easy", title: "Dinner", image: "card_334.jpg", correct: "Gerald had a procedure. We don't ask." },
  { id: 424, spicy: true, level: "medium", title: "Lookout Point", image: "card_424.jpg", correct: "Even he has his limits." },
  { id: 425, spicy: true, level: "hard", title: "Wrong Hole", image: "card_425.jpg", correct: "He insisted on room to grow." },
  { id: 426, spicy: true, level: "hard", title: "Dusty Wait", image: "card_426.jpg", correct: "They said the doctor would be right with me." },
  { id: 427, adult: true, level: "hard", title: "Safe Cracker", image: "card_427.jpg", correct: "Three to the left, two to the right, and it orders more paper towels." },
  { id: 428, level: "easy", title: "Downpour", image: "card_428.jpg", correct: "Forecast said scattered showers. Nobody mentioned breeds." },
  { id: 429, adult: true, level: "easy", title: "Trust Fall", image: "card_429.jpg", correct: "Q3 is going about the same way." },
  { id: 430, level: "easy", title: "Fresh Skin", image: "card_430.jpg", correct: "Don't worry. I'm not wearing the old one." },
  { id: 431, level: "easy", title: "Lap Lane", image: "card_431.jpg", correct: "He's a member." },
  { id: 432, level: "easy", title: "Dry Land", image: "card_432.jpg", correct: "Same time every morning. The cat's working up to it." },
  { id: 433, level: "easy", title: "Light Packer", image: "card_433.jpg", correct: "We agreed. Just the essentials." },
  { id: 434, level: "easy", title: "Hibernation", image: "card_434.jpg", correct: "He said to leave them by the door." },
  { id: 435, level: "medium", title: "Under Review", image: "card_435.jpg", correct: "After further review, it was the dog." },
  { id: 436, level: "medium", title: "The X-Ray", image: "card_436.jpg", correct: "Nothing to worry about. Is it someone from work?" },
  { id: 437, level: "easy", title: "Just the Weekend", image: "card_437.jpg", correct: "Just the weekend, dear. The truck is in case it goes well." },
  { id: 438, level: "medium", title: "Formation", image: "card_438.jpg", correct: "Every year he insists the bus is cheaper." },
  { id: 654, level: "medium", title: "Conditioning", image: "card_654.jpg", correct: "Interesting. He's salivating and I haven't even rung it." },
  { id: 439, level: "medium", title: "Coin Toss", image: "card_439.jpg", correct: "Page 400 says we all go home." },
  { id: 440, level: "medium", title: "Revolving Door", image: "card_440.jpg", correct: "Afternoon, ladies. Mind the step." },
  { id: 441, level: "easy", title: "The Shelf", image: "card_441.jpg", correct: "It's rated for one book. A paperback." },
  { id: 442, spicy: true, level: "medium", title: "Check-Up", image: "card_442.jpg", correct: "And how long has it been doing this at parties?" },
  { id: 443, level: "medium", title: "Statement", image: "card_443.jpg", correct: "My client will not be taking questions from the cat." },
  { id: 655, level: "medium", title: "Displacement", image: "card_655.jpg", correct: "Eureka, apparently, means you're cleaning this up." },
  { id: 444, level: "medium", title: "Doorbell Cam", image: "card_444.jpg", correct: "He's casing the place. I'm watching him case the place." },
  { id: 445, level: "easy", title: "Wishbone", image: "card_445.jpg", correct: "Same wish every year. Neither of them will say what it is." },
  { id: 446, adult: true, level: "medium", title: "Quota", image: "card_446.jpg", correct: "One drop. Now tell me again about the bear." },
  { id: 447, level: "medium", title: "SPF", image: "card_447.jpg", correct: "He's learned his lesson about the sun." },
  { id: 448, level: "medium", title: "Contactless", image: "card_448.jpg", correct: "We don't do cash anymore, sweetie." },
  { id: 656, level: "easy", title: "Missing Piece", image: "card_656.jpg", correct: "We'll mark it incomplete and say nothing to the dog." },
  { id: 449, adult: true, level: "easy", title: "Waiting Room", image: "card_449.jpg", correct: "He's been here since the referral." },
  { id: 450, level: "easy", title: "Deer Crossing", image: "card_450.jpg", correct: "He says he was the model." },
  { id: 451, level: "medium", title: "Golden Touch", image: "card_451.jpg", correct: "We said no hugging the cat." },
  { id: 452, level: "easy", title: "Campsite", image: "card_452.jpg", correct: "One bar. Everybody stay very still." },
  { id: 453, spicy: true, level: "easy", title: "The Gown", image: "card_453.jpg", correct: "Everything looks fine. They agree." },
  { id: 657, level: "hard", title: "Aftershock", image: "card_657.jpg", correct: "Magnitude: Biscuit." },
  { id: 454, adult: true, level: "easy", title: "Early Flight", image: "card_454.jpg", correct: "Purpose of your trip?" },
  { id: 455, level: "medium", title: "Wash Day", image: "card_455.jpg", correct: "After the wedding, things got more practical." },
  { id: 456, level: "easy", title: "Speed Trap", image: "card_456.jpg", correct: "Clocked him at a personal best." },
  { id: 457, spicy: true, level: "easy", title: "Recovery", image: "card_457.jpg", correct: "The doctor said one bag. I'm going with two." },
  { id: 458, level: "medium", title: "Fall Cleanup", image: "card_458.jpg", correct: "Don't even think about it." },
  { id: 658, level: "medium", title: "Group Photo", image: "card_658.jpg", correct: "A little further, please. Little further." },
];

// The real captions get the same polish as players' captions, so they look identical
const { polish } = require('./polish');
for (const c of CARTOONS) c.correct = polish(c.correct).text;
// Retired for good: nothing below FIRST_LIVE_ID is ever dealt, shown, framed or synced (store.js refuses them too)
const { FIRST_LIVE_ID } = require('./store');
const isRetiredId = (id) => !(Number(id) >= FIRST_LIVE_ID);
for (let i = CARTOONS.length - 1; i >= 0; i--) if (isRetiredId(CARTOONS[i].id)) CARTOONS.splice(i, 1);
// The lobby says the deck is still being drawn until it holds this many cartoons
const DECK_DRAWN = 60;

// The permanent Hall of Fame deck (lives across games and game nights)
const store = require('./store');
const Rating = require('./rating');
// A room's Gallery starts from the server's saved copy (when there is one); phones add theirs on join
function newRoomDeck() { const d = store.createDeck(); if (store.file) for (const e of store.all().reverse()) d.add(e, true); return d; }   // without a saved copy, rooms never see each other's captions
const deckOf = (game) => game.deck || (game.deck = newRoomDeck());
// #3: a Gallery caption is stamped by the server when a table frames it. Phones carry the stamp between nights;
// a caption typed into a phone's storage has none, so Expert Mode never deals it as the real answer.
const crypto = require('crypto');
const SIGN_KEY = process.env.GALLERY_KEY || 'closed-caption/gallery/v1';
const sigOf = (e) => crypto.createHmac('sha256', SIGN_KEY).update(Number(e.cartoonId) + '|' + store.norm(e.caption) + '|' + String(e.author || '').toLowerCase()).digest('base64url').slice(0, 32);
const SIG_FROM = Date.UTC(2026, 9, 19, 16);   // frames from before stamping began are trusted as they are
const signed = (e) => !!e && ((typeof e.sig === 'string' && e.sig === sigOf(e)) || (!e.sig && Number(e.at) > 0 && Number(e.at) < SIG_FROM));
function trustedEntries(game) {
  const d = deckOf(game), n = d.count(), top = n ? d.recent(1)[0].id : '';
  if (!game._trusted || game._trusted.n !== n || game._trusted.top !== top) game._trusted = { n, top, list: d.all().filter(signed) };
  return game._trusted.list;
}
// Phones carry the Gallery between nights: merge what one brings (max 300, cartoons we know)
function syncGallery(game, entries) {
  if (!Array.isArray(entries)) return { error: 'That didn’t take. Try again.' };
  const known = new Set(CARTOONS.map(c => c.id)); let added = 0, refused = 0;
  for (const e of entries.slice(0, 300)) {
    if (!e || isRetiredId(e.cartoonId) || !known.has(Number(e.cartoonId))) { refused++; continue; }   // a retired cartoon's frame never comes back
    if (deckOf(game).add(e, true)) added++;
  }
  return { ok: true, added, refused };
}

const MAX_PLAYERS = 8;

/* ── Round lines (#39): every stock line comes from public/lines.js, picked here so every phone shows the same one.
   A room deals each pool like a deck for the whole night (across games): no line repeats until its pool is used up.
   pickLine(game, keys, vars): the first key whose deck still has an unseen line tonight wins (a small special pool,
   once used up, falls through to the next, more general one); the last key reshuffles when it runs out. ── */
let LINES = {};
try { LINES = require('./public/lines.js') || {}; } catch (e) { console.error('lines.js failed to load', e); LINES = {}; }
function fillLine(t, vars) {
  return String(t).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m));
}
function pickLine(game, keys, vars, perKey) {
  const list = (Array.isArray(keys) ? keys : [keys]).map((k, i) => ({ k, v: (perKey && perKey[i]) || vars })).filter(x => Array.isArray(LINES[x.k]) && LINES[x.k].length);
  if (!list.length) return '';
  const deck = game.lineDeck || (game.lineDeck = {});
  for (let i = 0; i < list.length; i++) {
    const k = list[i].k, pool = LINES[k], last = i === list.length - 1;
    vars = list[i].v;
    let d = Array.isArray(deck[k]) ? deck[k].filter(x => Number.isInteger(x) && x >= 0 && x < pool.length) : null;
    if (d && deck[k + '#'] !== pool.length) d = null;   // the pool was edited since this room started dealing it
    if (!d) d = shuffleArray(pool.map((_, j) => j));
    else if (!d.length) {
      if (!last) { deck[k] = d; continue; }   // used up tonight: the next, more general pool
      d = shuffleArray(pool.map((_, j) => j));
      if (d.length > 1 && d[0] === deck[k + '^']) d.push(d.shift());   // a fresh shuffle never opens with the last one
    }
    const j = d.shift();
    deck[k] = d; deck[k + '#'] = pool.length; deck[k + '^'] = j;
    return fillLine(pool[j], vars);
  }
  return '';
}
// One line per slot per round (game.lines is cleared when a round is dealt)
function roundLine(game, slot, keys, vars) {
  const L = game.lines || (game.lines = {});
  if (L[slot] === undefined) L[slot] = pickLine(game, keys, vars);
  return L[slot];
}
const first1 = (name) => (String(name || '').trim().split(/\s+/)[0]) || String(name || '');
const ordinal = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const nameList = (names) => names.length <= 1 ? (names[0] || '') : names.length === 2 ? `${names[0]} & ${names[1]}` : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
// How the skipped cartoon meets its end: one of 50 hand-drawn gags (public/skips.js, CCMulligan; Nick, Oct 21 2026).
// The server deals them like a deck for the night, so every phone plays the same one and none repeats until all have.
// (Keep in step with the engine's GAGS keys; a phone that doesn't know a kind plays its own next one.)
const SKIP_GAGS = ['golf', 'goat', 'demo', 'critic', 'magic', 'free', 'A_anvil', 'A_piano', 'A_tnt', 'A_cannon', 'A_roller', 'A_bowl', 'A_glove', 'A_wreck', 'A_trap', 'A_sumo', 'A_tuba',
  'B_plumber', 'B_washer', 'B_painter', 'B_chemist', 'B_dentist', 'B_mail', 'B_chef', 'B_mime', 'B_electric', 'B_photo', 'B_pest', 'C_cat', 'C_dog', 'C_skunk', 'C_beaver', 'C_kangaroo',
  'C_seagull', 'C_snake', 'C_spider', 'C_moth', 'C_ants', 'C_elephant', 'D_rug', 'D_lapse', 'D_disc', 'D_ref', 'D_wash', 'D_vac', 'D_sneeze', 'D_fish', 'D_bat', 'D_lift', 'D_kite'];
const SKIP_MS = 5000;   // the gag (3.5–4.2 s) and its 'Mulligan.' line, plus the shared lead: the writers get it back
// A night-long shuffle bag: every item once before any repeats, never the same one twice running
function dealNight(game, name, list) {
  const decks = game.nightDecks || (game.nightDecks = {});
  let d = Array.isArray(decks[name]) ? decks[name].filter(x => list.includes(x)) : [];
  if (!d.length) { d = shuffleArray(list); if (d.length > 1 && d[0] === decks[name + '^']) d.push(d.shift()); }
  const x = d.shift();
  decks[name] = d; decks[name + '^'] = x;
  return x;
}

// The steal shows (Nick, Oct 21 2026: the hand-drawn thieves, public/thieves.js CCSteal). 'full' (~6.5 s): the night's
// first steal, then about one in four, at random — never decided by where the chip was, so the show can't hint at the
// answer; the closing caption is held ~2.5 s. Every other steal is 'short' (~2 s), ending on the thief's one-word tag.
// A room deals the thieves like a deck for the night. The show's lines never hint at the answer (#39): the closing
// caption is neutral (thief.X.closing, then steal.closing); the thief's own line comes AFTER the reveal only (on the
// reel, keyed to where the chip was: thief.X.real / thief.X.fake). Lines: public/lines.js.
const HEISTS = [['cat', 'The Cat'], ['fisherman', 'The Fisherman'], ['bellhop', 'The Bellhop'], ['burglar', 'The Burglar'], ['painter', 'The Painter'], ['pickpocket', 'The Pickpocket']].map(([id, name]) => ({ id, name }));
// A chip stolen off a fake caption pays its owner this much (the steal's cost)
const STEAL_CAUGHT_PTS = 1;
// How long each steal show runs on the phones (public/steal.js FULL_MS / SHORT_MS); the flip waits for it
const STEAL_FULL_MS = 6500, STEAL_SHORT_MS = 2000, STEAL_FULL_SHARE = 0.25;
// Blind bets: everyone at once. The clock catches anyone idle; the last chip in gets a beat (to take it back),
// then every chip drops onto the table together and the table gets a look before the steal (or the flip).
const BLIND_MS = 45000, ALL_IN_BEAT_MS = 1500, DROP_HOLD_MS = 3200;
// The Late Edition card (the last trip around the table: double points); the writers get the time back
const LATE_MS = 3500;
// #6: the flip and the reveal reel move on by themselves (the dealer can hold them, or go back). The flip: a held
// second of silence, the card turns on every phone at once (#18), then time to read it out.
const FLIP_AUTO_MS = 6500;
const REEL_LEAD_MS = 400;
// #5 Frame It on the reveal: the night's first frame gets the whole ceremony (the reel waits for it); after that a
// quick plaque (3 s) that doesn't stop anything.
const FRAME_FULL_MS = 9000, FRAME_PLAQUE_MS = 3200, FRAME_LEAD_MS = 600;
// R11 a called shot that comes in; R1 a rejection slip needs this many groans (and no chips)
const CALL_PTS = 3, SLIP_GROANS = 3;
const firstNameOf = (game, pid) => { const p = game.players.find(q => q.id === pid); return (String(p ? p.name : '').trim().split(/\s+/)[0]) || 'you'; };
// Next thief off the night's deck (an index into HEISTS)
function nextHeist(game) {
  const id = dealNight(game, 'thieves', HEISTS.map(h => h.id));
  return Math.max(0, HEISTS.findIndex(h => h.id === id));
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const DEFAULT_SETTINGS = {
  rounds: null,                  // null = everyone deals once; else fixed number
  targetScore: null,             // null = play the rounds; else first to X points
  pointsOpenBet: 2,              // blind chip on the real caption, out in the open
  pointsClosedBet: 5,            // blind chip on the Closed Caption when it's the real one: the long shot (Shoot the Moon = 10)
  pointsOpenLate: 1,             // late chip (after the reveal) on the real caption, anywhere
  pointsClosedLate: 1,           // kept equal to pointsOpenLate
  pointsPerFool: 2,              // to the writer, for each chip someone else puts on their caption (writing pays like spotting)
  dealerBonus: 4,                // dealer scores this if no chip ends up on the real caption
  pointsStealCorrect: 1,         // (retired: a stolen chip on the real caption now pays the dealer what it would have paid)
  autoCloseProbability: 0.15,    // share of rounds where the real caption is the Closed Caption
  stealEnabled: true,            // dealer may knock one chip off the table before the answer
  // [settings] Lobby settings (Nick, Oct 18 2026)
  dealerMode: 'steal',           // 'steal' = dealer doesn't bet, steals one chip (default); 'bet' = no steal, the dealer bets 2 chips like everyone;
                                 // 'both' = "kitchen sink": the dealer bets 2 chips AND then steals one (never their own)
  laps: 1,                       // game length when rounds/targetScore are null: everyone deals once (1), twice (2) or three times (3)
  family: false,                 // family cartoons only (skips the few grown-up ones)
  spicy: false,                  // 'After dark': mixes in the PG-13 cartoons
  direction: 'left',             // which way the deal and the betting go around the table
  expert: false,                 // Expert Mode: the real answer comes from the Hall of Fame deck
};

// [settings] Writing timer: 0 = no timer (nobody is rushed; the dealer or host ends writing), else 30 s to 10 min.
const DEFAULT_TIMER = 120;   // new rooms: 2 minutes
function cleanTimer(t) {
  const n = Number(t);
  if (t === null || t === undefined || t === '' || !Number.isInteger(n)) return null;
  return n === 0 || (n >= 30 && n <= 600) ? n : null;
}
// [settings] Dealer modes
const dealerBets = (game) => game.settings.dealerMode === 'bet' || game.settings.dealerMode === 'both';
const stealOn = (game) => game.settings.dealerMode !== 'bet' && !!game.settings.stealEnabled;

function createGame(hostId, hostName, timerDuration = DEFAULT_TIMER, seenIds = []) {
  return {
    seenIds: cleanSeen(seenIds),   // cartoons the host's phone has seen in earlier games
    seenBy: { [hostId]: cleanSeen(seenIds) },   // every phone's 'already seen' list, by player
    deck: newRoomDeck(),            // this room's Gallery: the server's saved copy + whatever the phones bring
    closePlan: [],                  // closePlan[round - 1] = true when the real caption is face-down that round
    flags: [],                      // Frame It picks, live (#5): { fromId, round, target, at } — one per player per caption
    framePicks: {},                 // this round's frames: { targetKey: [playerId] } (anyone may frame any number of fakes)
    roundFrames: [],                // this round's framings, in order: the celebration items (each with n, at, kind, ms)
    nightFrames: 0,                 // framings in this room tonight (every game): the first gets the whole ceremony
    frameHold: 0,                   // the reel waits until then (the night's first frame is being hung)
    frameBusy: 0,                   // the last celebration ends then (the next one waits its turn)
    inducted: [],                   // 'round|target' keys already inducted this game
    lastInduction: null,            // the latest induction, for the celebration: { n, round, target, caption, ..., list }
    lineDeck: {},                   // #39: the night's place in every line pool (lines.js), so nothing repeats
    lines: {},                      // this round's picked lines, by slot (sent to the phones that show them)
    calls: {},                      // R11 called shots this round: { callerId: calledId } (secret until the reveal)
    callResults: [],                // the reveal: [{ callerId, calledId, key, hit, line }]
    tvc: { table: 0, cartoonist: 0, draws: 0 },   // R10 the table vs. the cartoonist, this game (blind laughs)
    tvcRound: null,                 // this round's blind-laugh result: { side, key, writerIds, best, real, line }
    odds: null,                     // R8 this game's one odds line: { round, kind, odds, line }
    slips: [],                      // R1 this round's rejection slips: [{ round, target, writerId, caption, groans, line, note }]
    record: null,                   // this game's record for the end of the night (see newRecord)
    realCredit: null,               // Expert Mode: who wrote this round's real answer { author, month, flags, entryId }
    code: generateRoomCode(),
    phase: PHASES.LOBBY,
    phaseAt: Date.now(),  // server time of the latest phase change
    stepAt: null,         // server time of the latest reveal-reel step
    stealShows: 0,        // steals this game
    nightSteals: 0,       // steals in this room tonight (every game): the first gets the full show
    blind: {},            // this round's blind bets while they're secret: { playerId: { target, count, at } }
    blindEnd: null,       // when the blind-bet clock runs out (null: no clock, e.g. a no-timer room)
    dropAt: null,         // when every blind chip dropped onto the table at once (server time)
    flipAt: null,         // when the face-down card turns over (after the steal show, if there was one)
    lateFrom: null,       // The Late Edition: the round the last trip around the table began (double points)
    finalLaps: null,      // first to N: once someone gets there, how many deals finish the trip around the table
    fixedLaps: null,      // a fixed round count, as whole trips around the table (frozen when the game starts)
    players: [{ id: hostId, name: hostName, score: 0, connected: true }],
    voice: {},            // voice call: { playerId: { on, muted } } (cleared when a phone drops)
    hostId,
    timerDuration,
    settings: { ...DEFAULT_SETTINGS },
    round: 0,
    dealerIndex: -1,
    dealCount: {},        // [settings] how many times each player has dealt this game (game length = everyone deals N times)
    usedCartoonIds: [],
    cartoon: null,
    correctCaption: '',
    autoClose: false,
    submissions: [],      // { playerId, playerName, caption }
    closedCaption: '',
    closedIsCorrect: false,
    closedPlayerId: null,
    openCaptions: [],     // { caption, isCorrect, playerId }
    firstBets: {},
    secondBets: {},
    bets: [],             // public log, in order: { playerId, target, count, stage, stolen? }
    betOrder: [],
    steal: null,          // { victimId, target, stage, betIndex } | { skipped: true }
    mulliganVotes: [],
    mulliganCount: 0,
    mulliganEvent: null,  // { n, quip, image }
    roundScores: {},
    roundScoreDetails: {},
    dealerBonusAwarded: false,
    previousRank: {},
    timerEnd: null,
    timerToken: 0,
    history: [],
    reactions: {},        // #26 { [targetKey]: { [playerId]: { ha?: 1|2, groan?: 1|2 } } } — 1 = before the answer (blind), 2 = after
    reel: null,           // the answer screen's reveal reel: { order: [targetKey...], step, nobody, paused, dueAt }
    flipDue: null,        // #6 when the face-down card's screen moves on by itself (null: held)
    flipHold: false,      // the dealer is holding the flip
    roundBadges: [],      // { kind, playerIds, target, detail } — this round
    gameBadges: [],       // every round's badges this game, each with its round
    crowns: {},           // Grand Poobah crowns this game: { playerId: n }
    gameNo: 0,            // games started in this room (the rating result is keyed by room + game)
    ratingSnap: null,     // the table as the game started: { playerId: { r, g, name } } (rating.js)
    opening: null,        // the opening card: { at, gameId, table, opener, favorite, underdog, ... }
    ratingResult: null,   // game over: { gameId, rows: { playerId: { before, after, delta, ... } }, order }
    verdictsAt: null,     // the dealer/host moved on from the verdicts (phones time the Grand Poobah from this)
  };
}

// Every phase change is stamped with the server clock: phones start the big moments from it, together
function setPhase(game, phase) { game.phase = phase; game.phaseAt = Date.now(); }
function setReelStep(game, step) { game.reel.step = step; game.stepAt = Date.now(); game.reel.dueAt = reelDue(game); }   // #6: the next step's own clock

function cleanSeen(ids) {
  const valid = new Set(CARTOONS.map(c => c.id));
  return Array.isArray(ids) ? [...new Set(ids.map(Number).filter(n => valid.has(n)))] : [];
}
function setSeen(game, ids) { game.seenIds = cleanSeen(ids); (game.seenBy = game.seenBy || {})[game.hostId] = game.seenIds; }
// A phone tells us which cartoons it has already seen (on joining, and back in the lobby)
function setPlayerSeen(game, playerId, ids) {
  if (!game.players.some(p => p.id === playerId)) return { error: 'Player not in game' };
  if (!Array.isArray(ids)) return { error: 'That didn’t take. Try again.' };
  (game.seenBy = game.seenBy || {})[playerId] = cleanSeen(ids.slice(0, 200));
  return { ok: true };
}
// How many people at the table have already seen each cartoon
function seenCounts(game) {
  const here = new Set(game.players.map(p => p.id)), n = new Map();
  for (const [pid, ids] of Object.entries(game.seenBy || {})) if (here.has(pid)) for (const id of ids) n.set(id, (n.get(id) || 0) + 1);
  return n;
}
// Of these cartoons, the ones the fewest people here have seen (ideally nobody)
function freshest(game, list) {
  if (!list.length) return list;
  const n = seenCounts(game), min = Math.min(...list.map(c => n.get(c.id) || 0));
  const out = list.filter(c => (n.get(c.id) || 0) === min);
  if (min === 0) {                       // nobody here has seen these: the newest cartoons go first
    const newest = out.filter(c => c.id >= NEWEST_FROM);
    return newest.length ? newest : out;
  }
  // Everyone has seen something: deal the ones seen longest ago
  const ago = seenAgo(game), most = Math.max(...out.map(c => ago.get(c.id) ?? 1e9));
  return out.filter(c => (ago.get(c.id) ?? 1e9) === most);
}
const NEWEST_FROM = FIRST_LIVE_ID;       // the newest batch of cartoons (raise it when a new batch lands)
// For each cartoon: how many cartoons ago anyone here last saw it (0 = the last one they saw)
function seenAgo(game) {
  const here = new Set(game.players.map(p => p.id)), m = new Map();
  for (const [pid, ids] of Object.entries(game.seenBy || {})) if (here.has(pid))
    ids.forEach((id, i) => { const a = ids.length - 1 - i; m.set(id, Math.min(m.has(id) ? m.get(id) : a, a)); });
  return m;
}

function updateSettings(game, partial) {
  if (game.phase !== PHASES.LOBBY) return { error: 'Settings can only be changed in the lobby' };
  const s = game.settings;
  const ints = ['rounds', 'targetScore', 'pointsOpenBet', 'pointsClosedBet', 'pointsOpenLate', 'pointsClosedLate', 'pointsPerFool', 'dealerBonus', 'pointsStealCorrect'];
  for (const key of Object.keys(partial || {})) {
    const val = partial[key];
    if (key === 'stealEnabled') { s.stealEnabled = !!val; continue; }
    // [settings] Dealer mode: the steal is on in 'steal' and 'both' ('kitchen sink'), off in 'bet'
    if (key === 'dealerMode') {
      if (!['steal', 'bet', 'both'].includes(val)) return { error: 'That didn’t take. Try again.' };
      s.dealerMode = val; s.stealEnabled = val !== 'bet'; continue;
    }
    // [settings] Game length: everyone deals 1, 2 or 3 times
    if (key === 'laps') {
      const n = Number(val);
      if (![1, 2, 3].includes(n)) return { error: 'That didn’t take. Try again.' };
      s.laps = n; continue;
    }
    if (key === 'family') { s.family = !!val; if (s.family) s.spicy = false; continue; }
    if (key === 'spicy') { s.spicy = !!val; if (s.spicy) s.family = false; continue; }
    if (key === 'expert') {
      if (typeof val !== 'boolean') return { error: 'That didn’t take. Try again.' };
      if (val && deckCartoons(game) < 3) return { error: 'The Gallery opens once 3 cartoons have a framed caption' };
      s.expert = val; continue;
    }
    if (key === 'direction') { if (val !== 'left' && val !== 'right') return { error: 'That didn’t take. Try again.' }; s.direction = val; continue; }
    if (key === 'autoCloseProbability') {
      const n = Number(val);
      if (isNaN(n) || n < 0 || n > 1) return { error: 'That didn’t take. Try again.' };
      s.autoCloseProbability = n; continue;
    }
    if (!ints.includes(key)) continue;
    if (val === null && (key === 'rounds' || key === 'targetScore')) { s[key] = null; continue; }
    const n = Number(val);
    if (!Number.isInteger(n) || n < 0 || n > 100) return { error: 'That didn’t take. Try again.' };
    s[key] = n;
  }
  return { ok: true };
}

function addPlayer(game, playerId, playerName) {
  if (game.players.length >= MAX_PLAYERS) return { error: `The table’s full (${MAX_PLAYERS} max)` };
  if (game.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) return { error: 'Someone here already has that name' };
  // Late joiners are added at the end of the table, so the deal order of everyone else is unchanged.
  // They score from zero and join in from the current writing phase or the next round.
  game.players.push({ id: playerId, name: playerName, score: 0, connected: true, joinedRound: game.round });
  return { ok: true, midGame: game.phase !== PHASES.LOBBY };
}

function kickPlayer(game, hostId, targetPlayerId) {
  if (game.phase !== PHASES.LOBBY) return { error: 'Can only remove players in the lobby' };
  if (game.hostId !== hostId) return { error: 'Only the host can remove players' };
  if (hostId === targetPlayerId) return { error: 'You can’t remove yourself' };
  const target = game.players.find(p => p.id === targetPlayerId);
  if (!target) return { error: 'Player not in game' };
  game.players = game.players.filter(p => p.id !== targetPlayerId);
  return { ok: true, kickedName: target.name };
}

// Lobby: the host moves a seat up (-1) or down (+1) the table order
function moveSeat(game, hostId, targetId, dir) {
  if (game.phase !== PHASES.LOBBY) return { error: 'Seats can only be changed in the lobby' };
  if (game.hostId !== hostId) return { error: 'Only the host can arrange the seats' };
  const i = game.players.findIndex(p => p.id === targetId), j = i + (dir < 0 ? -1 : 1);
  if (i < 0) return { error: 'Player not in game' };
  if (j < 0 || j >= game.players.length) return { ok: true };
  [game.players[i], game.players[j]] = [game.players[j], game.players[i]];
  return { ok: true };
}

const connectedPlayers = (game) => game.players.filter(p => p.connected);
const dealerOf = (game) => game.players[game.dealerIndex] || null;
const nameOfPlayer = (game, pid) => (game.players.find(p => p.id === pid) || {}).name || '?';

const stepOf = (game) => (game.settings.direction === 'right' ? -1 : 1);
const seatAt = (n, i) => ((i % n) + n) % n;

/* #37: every game is whole trips around the table, so everyone deals the same number of times.
   How many deals each player gets: 'everyone deals N times' (laps); a fixed round count rounded UP to whole trips
   (frozen when the game starts); first to N: open-ended until someone gets there, then the trip being played is
   finished (finalLaps) before anyone is crowned. null = no end in sight yet. */
function lapsOf(game) {
  const s = game.settings;
  if (s.targetScore) return game.finalLaps || null;
  if (s.rounds) return game.fixedLaps || Math.max(1, Math.ceil(s.rounds / Math.max(1, game.players.length)));
  return [1, 2, 3].includes(s.laps) ? s.laps : 1;
}
// The next seat after `from`, going the table's direction, held by someone who is here.
// The first deal of a game goes to seat 1. Falls back to the next seat.
function nextDealerIndex(game, from) {
  const n = game.players.length, step = stepOf(game);
  if (!n) return -1;
  if (from < 0) { for (let k = 0; k < n; k++) if (game.players[k].connected) return k; return 0; }
  // #29: nobody deals more than their share while someone here still has a deal to come
  const laps = lapsOf(game), counts = game.dealCount || {};
  if (laps) for (let k = 1; k <= n; k++) {
    const i = seatAt(n, from + k * step);
    if (game.players[i].connected && (counts[game.players[i].id] || 0) < laps) return i;
  }
  for (let k = 1; k <= n; k++) {
    const i = seatAt(n, from + k * step);
    if (game.players[i].connected) return i;
  }
  return seatAt(n, from + step);
}

/* ── Which rounds have the real caption face-down ──
   Planned ahead so it's about the lobby's share of rounds, never two in a row. */
function planBlock(len, k, forbidFirst) {
  const start = forbidFirst ? 1 : 0, m = len - start;
  k = Math.max(0, Math.min(k, Math.ceil(m / 2)));
  // k non-adjacent spots among m: pick k of (m - k + 1), then spread them apart
  const picks = shuffleArray([...Array(Math.max(0, m - k + 1)).keys()]).slice(0, k).sort((a, b) => a - b);
  const block = Array(len).fill(false);
  picks.forEach((c, i) => { block[start + c + i] = true; });
  return block;
}
// "A little luck" (Nick, Oct 17): every planned round gets its own chance at the lobby's share,
// so a game averages 15% but can land on 0, 1 or now and then 2 (or more in long games).
const luckyCount = (n, p) => { let k = 0; for (let i = 0; i < n; i++) if (Math.random() < p) k++; return k; };
function ensurePlan(game, round) {
  const p = game.settings.autoCloseProbability;
  if (!game.closePlan.length && !game.settings.targetScore) {
    const n = totalRounds(game);
    game.closePlan = planBlock(n, luckyCount(n, p), false);
  }
  while (game.closePlan.length < round) {
    // First-to-X games (and extra rounds): blocks of 7, same luck
    game.closePlan.push(...planBlock(7, luckyCount(7, p), !!game.closePlan[game.closePlan.length - 1]));
  }
  return !!game.closePlan[round - 1];
}

/* ── Expert Mode: the real answer is a Hall of Fame caption ──
   Never one written by someone at this table (nobody gets dealt their own caption as the answer). */
const tableNames = (game) => new Set(game.players.map(p => p.name.toLowerCase()));
function expertCartoonIds(game) {
  const names = tableNames(game), out = new Set();
  for (const e of trustedEntries(game)) if (!names.has(e.author.toLowerCase())) out.add(e.cartoonId);
  return CARTOONS.filter(c => out.has(c.id)).map(c => c.id);
}
const deckCartoons = (game) => expertCartoonIds(game).length;

// Expert deal: a cartoon with a Hall of Fame caption this table can play, or null (then deal normally)
function dealExpert(game, currentId) {
  const ok = new Set(expertCartoonIds(game));
  // Never twice in one game; otherwise the ones the fewest people here have seen
  const pool = freshest(game, allowed(game).filter(c => ok.has(c.id) && !game.usedCartoonIds.includes(c.id) && c.id !== currentId));
  if (!pool.length) return null;   // every deck cartoon has been played this game
  const cartoon = pickByLevel(game, pool), names = tableNames(game);
  const entry = pick(trustedEntries(game).filter(e => e.cartoonId === cartoon.id && !names.has(e.author.toLowerCase())));
  return entry ? { cartoon, entry } : null;
}

/* The hidden difficulty (Nick, Oct 19 2026). Every cartoon is tagged easy, medium or hard; players never see it and
   there is no setting. A game is a setlist: it opens easier and builds. A table of new players (most have played
   fewer than REGULAR_GAMES games, as their phones report through 'career'; unknown = new) gets mostly easy and
   medium, very few hard; a table of regulars gets more hard. The level only chooses among the cartoons the normal
   rules already allow (never twice in a game, fewest people here have seen it, the deck's rating). */
const LEVELS = ['easy', 'medium', 'hard'];
const levelOf = (c) => LEVELS.includes(c.level) ? c.level : 'medium';
const REGULAR_GAMES = 5;
//                 opening third         middle third          last third     (weights for easy, medium, hard)
const SETLIST = {
  fresh:   [[0.75, 0.25, 0.00], [0.40, 0.55, 0.05], [0.25, 0.60, 0.15]],
  regular: [[0.40, 0.50, 0.10], [0.15, 0.50, 0.35], [0.05, 0.40, 0.55]],
};
function tableKind(game) {
  const ps = game.players.filter(p => p.connected !== false);
  const list = ps.length ? ps : game.players;
  const regulars = list.filter(p => (p.games || 0) >= REGULAR_GAMES).length;
  return list.length && regulars * 2 > list.length ? 'regular' : 'fresh';   // half or more new: a new table
}
// Where this deal sits in the game: 0 = the opening third, 1 = the middle, 2 = the last third
function setPosition(game) {
  const s = game.settings, round = Math.max(1, game.round || 1);
  const total = s.targetScore ? Math.max(6, game.players.length * 2) : Math.max(1, totalRounds(game));
  if (total <= 1) return 0;
  const f = (round - 1) / (total - 1);
  return f < 1 / 3 ? 0 : f < 2 / 3 ? 1 : 2;
}
function pickByLevel(game, list) {
  if (list.length <= 1) return list[0];
  const w = SETLIST[tableKind(game)][setPosition(game)];
  const by = { easy: [], medium: [], hard: [] };
  for (const c of list) by[levelOf(c)].push(c);
  // Roll a level; if that bucket is empty, try its neighbours (medium sits next to both)
  let r = Math.random() * (w[0] + w[1] + w[2]), lv = r < w[0] ? 'easy' : r < w[0] + w[1] ? 'medium' : 'hard';
  const order = lv === 'easy' ? ['easy', 'medium', 'hard'] : lv === 'hard' ? ['hard', 'medium', 'easy']
    : (w[0] >= w[2] ? ['medium', 'easy', 'hard'] : ['medium', 'hard', 'easy']);
  for (const l of order) if (by[l].length) return pickVaried(game, by[l]);
  return pickVaried(game, list);
}

/* Variety (Nick, Oct 19 2026: "always well shuffled with different creators' work randomly distributed ... no really
   similar in a row"). card_meta.json tags every card with its creator voice, drawing style and setting/subject words.
   Of the cards the rules allow, the deal picks at random among those that share the least with the last three played:
   never the same creator or style back to back, no shared setting or subject with the card just before, and less
   overlap with the two before that. Cards without tags count as different from everything. */
let CARD_META = {};
try { CARD_META = require('./card_meta.json'); } catch (e) { CARD_META = {}; }
function samenessScore(id, recent) {
  const m = CARD_META[id];
  if (!m) return 0;
  let s = 0;
  recent.forEach((rid, k) => {
    const r = CARD_META[rid];
    if (!r) return;
    const near = k === 0;                       // k = 0 is the card just played
    if (near && m.voice && m.voice === r.voice) s += 3;
    if (near && m.style && m.style === r.style) s += 2;
    const shared = (m.tags || []).filter(t => (r.tags || []).includes(t)).length;
    s += shared * (k === 0 ? 3 : k === 1 ? 2 : 1);
  });
  return s;
}
function pickVaried(game, list) {
  if (list.length <= 1) return list[0];
  const recent = (game.usedCartoonIds || []).slice(-3).reverse();
  if (!recent.length) return pick(list);
  let best = Infinity, bestList = [];
  for (const c of list) {
    const s = samenessScore(c.id, recent);
    if (s < best) { best = s; bestList = [c]; } else if (s === best) bestList.push(c);
  }
  return pick(bestList);
}

// Is there a cartoon this game hasn't played yet? (never a repeat within a game, never a retired one)
const canDeal = (game) => allowed(game).some(c => !(game.usedCartoonIds || []).includes(c.id) && !(game.cartoon && c.id === game.cartoon.id));
// Put a fresh cartoon on the table, never the one being replaced. False when the deck has nothing new left
// (the cartoon on the table, if any, stays).
function dealCartoon(game) {
  const currentId = game.cartoon ? game.cartoon.id : null;
  const x = game.settings.expert ? dealExpert(game, currentId) : null;
  if (!x && !canDeal(game)) return false;
  if (x) {
    game.usedCartoonIds.push(x.cartoon.id);
    game.cartoon = { id: x.cartoon.id, title: x.cartoon.title, image: x.cartoon.image };
    game.correctCaption = polish(x.entry.caption).text;
    game.realCredit = { author: x.entry.author, month: x.entry.month, flags: x.entry.flags, entryId: x.entry.id };
  } else dealNormal(game, currentId);
  game.autoClose = ensurePlan(game, Math.max(1, game.round));   // a mulligan keeps the round's plan
  game.submissions = [];
  game.mulliganVotes = [];
  game.calls = {};   // R11: a call was made for a caption that no longer exists
  if (game.lines) delete game.lines.waitLast;
  game.timerEnd = game.timerDuration > 0 ? Date.now() + game.timerDuration * 1000 : null;   // [settings] no timer: no end time
  game.timeAdds = 0;
  game.timerToken = (game.timerToken || 0) + 1;
  return true;
}
// Family games never deal the grown-up cartoons
// PG-13 cartoons only come up in 'After dark' games
const allowed = (game) => CARTOONS.filter(c => !isRetiredId(c.id) && !(game.settings.family && (c.adult || c.spicy)) && !(c.spicy && !game.settings.spicy));
function dealNormal(game, currentId) {
  // Never twice in one game; of the rest, the ones the fewest people at the table have seen.
  // Nobody sees a repeat until they've seen the whole deck.
  const available = freshest(game, allowed(game).filter(c => !game.usedCartoonIds.includes(c.id) && c.id !== currentId));
  if (!available.length) return false;   // out of new cartoons: the caller decides (end the game, keep the cartoon, skip the mulligan)
  const cartoon = pickByLevel(game, available);
  game.usedCartoonIds.push(cartoon.id);
  game.cartoon = { id: cartoon.id, title: cartoon.title, image: cartoon.image };
  game.correctCaption = cartoon.correct;
  game.realCredit = null;
  return true;
}

// Before a game starts: enough cartoons in this deck (Family / Standard / Everything) for the whole game?
// (Repeats for regulars are fine: the lobby says so. An empty deck never crashes: the lobby shows a calm note.) Needs one per round: players x laps, the fixed round count, or (first to X) at least 6.
function deckStatus(game) {
  const s = game.settings, n = Math.max(3, connectedPlayers(game).length), laps = [1, 2, 3].includes(s.laps) ? s.laps : 1;
  const need = s.targetScore ? Math.max(6, n) : s.rounds ? n * Math.ceil(s.rounds / n) : n * laps;   // #37: fixed rounds are whole trips
  const pool = allowed(game), seen = seenCounts(game), used = new Set(game.usedCartoonIds || []);
  const fresh = pool.filter(c => !(seen.get(c.id) > 0) && !used.has(c.id)).length;   // never one this room has already played
  return { live: CARTOONS.length, pool: pool.length, fresh, need, ok: pool.length >= need, drawing: CARTOONS.length < DECK_DRAWN };
}
const nWord = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
function deckLine(d) { return d.live ? `The new deck is being drawn. ${nWord(d.live, 'cartoon')} so far.` : 'The new deck is being drawn. No cartoons yet.'; }
function startCheck(game) {
  const d = deckStatus(game);
  if (d.ok) return { ok: true };
  return { error: d.pool ? `This game needs ${nWord(d.need, 'cartoon')}. This deck has ${d.pool}.` : 'No cartoons in this deck yet.' };
}
// The deck ran out mid-game: this scoreboard is the last one
function endForDeck(game) {
  game.deckOut = true;
  game.notice = { text: 'That was the last new cartoon. Final scores.', at: Date.now() };
}

function startRound(game, options = {}) {
  if (!options.sameRound && !canDeal(game) && !(game.settings.expert && dealExpert(game, game.cartoon && game.cartoon.id))) return { error: 'The deck is out of new cartoons' };
  if (!options.sameRound) {
    game.round++;
    // #37: a fixed round count is played as whole trips around the table (frozen for this game)
    if (game.round === 1 && game.settings.rounds && !game.settings.targetScore) game.fixedLaps = Math.max(1, Math.ceil(game.settings.rounds / Math.max(1, game.players.filter(isPresent).length || game.players.length)));
    game.dealerIndex = nextDealerIndex(game, game.dealerIndex);
    // [settings] count the deal (game length 'everyone deals N times' reads this)
    const d = game.players[game.dealerIndex];
    if (d) { game.dealCount = game.dealCount || {}; game.dealCount[d.id] = (game.dealCount[d.id] || 0) + 1; }
    // #11: The Late Edition — the last trip around the table pays double. It starts with the first deal of the
    // final lap (a game that goes around once has no 'last trip' to single out: all of it would double)
    const laps = lapsOf(game);
    if (!game.lateFrom && !game.settings.targetScore && laps >= 2 && d && game.dealCount[d.id] >= laps) game.lateFrom = game.round;
  }
  if (!dealCartoon(game)) {
    // Nobody wrote anything and the deck has nothing new: the same cartoon again, fresh clock
    game.submissions = []; game.mulliganVotes = [];
    game.timerEnd = game.timerDuration > 0 ? Date.now() + game.timerDuration * 1000 : null;
    game.timeAdds = 0; game.timerToken = (game.timerToken || 0) + 1;
    game.notice = { text: 'Same cartoon. The deck has nothing new left.', at: Date.now() };
  }
  if (game.round === 1 && !options.sameRound && !game.ratingSnap) beginRated(game);
  if (game.round === 1 && !options.sameRound) { game.record = newRecord(); game.tvc = { table: 0, cartoonist: 0, draws: 0 }; game.odds = null; }
  if (game.lateFrom === game.round && !options.sameRound && game.timerEnd) game.timerEnd += LATE_MS;   // the Late Edition card never eats writing time
  // This round's lines (#39). A same-round redeal keeps the ones already picked.
  if (!options.sameRound) {
    game.lines = {};
    game.calls = {};
    game.prevMulligan = 0;
    if (game.timerDuration > 0) { roundLine(game, 'warn20', 'write.warn20'); roundLine(game, 'warn10', 'write.warn10'); roundLine(game, 'timesUp', 'write.timesUp'); }
    roundLine(game, 'lockedIn', 'write.lockedIn');
    if (game.lateFrom === game.round && !(game.targetHit)) roundLine(game, 'lateBanner', 'late.banner');
  }
  game.blind = {};
  game.blindEnd = null;
  game.dropAt = null;
  game.flipAt = null;
  game.closedCaption = '';
  game.closedIsCorrect = false;
  game.closedPlayerId = null;
  game.openCaptions = [];
  game.firstBets = {};
  game.secondBets = {};
  game.bets = [];
  game.betOrder = [];
  game.steal = null;
  game.mulliganEvent = null;
  game.roundScores = {};
  game.roundScoreDetails = {};
  game.dealerBonusAwarded = false;
  game.reactions = {};
  game.reel = null;
  game.flipDue = null;
  game.flipHold = false;
  game.roundBadges = [];
  game.framePicks = {};
  game.roundFrames = [];
  game.frameHold = 0;
  game.callResults = [];
  game.tvcRound = null;
  game.slips = [];
  setPhase(game, PHASES.WRITING);
}

// Someone whose phone just locked or blinked off for a few seconds still counts as here
const AWAY_GRACE_MS = 45000;   // a phone that locks or switches apps keeps its place for 45 s
const isPresent = (p) => p.connected || (p.disconnectedAt && Date.now() - p.disconnectedAt < AWAY_GRACE_MS);

// Everyone who is here has written something
function allCaptionsIn(game) {
  const here = game.players.filter(isPresent);
  return here.length > 0 && here.every(p => game.submissions.some(s => s.playerId === p.id));
}

// mode: 'check' = if there are likely typos, send them back to the writer instead of submitting;
//       'fix'   = submit with the spelling fixes; 'keep' = submit with the writer's own spelling.
// Punctuation, capitals and apostrophes are always tidied.
function submitCaption(game, playerId, caption, mode = 'check') {
  if (game.phase !== PHASES.WRITING) return { error: 'Writing time is over' };
  const player = game.players.find(p => p.id === playerId);
  if (!player) return { error: 'Player not in game' };
  if (game.submissions.some(s => s.playerId === playerId)) return { error: 'Already submitted' };
  const raw = (caption || '').toString();
  if (raw.length > 400) return { error: 'Too long. The real ones are short.' };
  const p = polish(raw);
  if (!p.text || !/[A-Za-z0-9]/.test(p.text)) return { error: 'Write something first' };
  if (p.text.length > 220) return { error: 'Too long. The real ones are short.' };
  if (mode === 'check' && p.typos.length) return { ok: true, check: { polished: p.text, fixed: p.fixed, typos: p.typos } };
  const finalText = mode === 'keep' ? p.text : p.fixed;
  if (tooCloseToReal(finalText, game.correctCaption)) return { error: 'Too close to the real one. Write your own.' };   // #31: regulars remember the real ones
  game.submissions.push({ playerId, playerName: player.name, caption: finalText });
  noteLastWriter(game);
  return { ok: true, allIn: allCaptionsIn(game) };
}
// #39: one writer left: the table's line about them, and their own nudge (picked once per last writer)
function noteLastWriter(game) {
  if (game.phase !== PHASES.WRITING) return;
  const sub = new Set(game.submissions.map(s => s.playerId));
  const here = game.players.filter(p => p.connected || sub.has(p.id)), waiting = here.filter(p => !sub.has(p.id));
  if (here.length < 2 || waiting.length !== 1) return;
  const p = waiting[0], L = game.lines || (game.lines = {});
  if (L.waitLast && L.waitLast.pid === p.id) return;
  const dealer = dealerOf(game), top = Math.max(...game.players.map(q => q.score));
  const keys = [];
  if (dealer && dealer.id === p.id) keys.push('wait.lastDealer');
  else if (top > 0 && p.score === top && game.players.filter(q => q.score === top).length === 1) keys.push('wait.lastLeader');
  if (isLate(game)) keys.push('wait.lastLate');
  if (game.round === 1) keys.push('wait.lastFirst');
  if (!game.timerDuration) keys.push('wait.lastNoTimer');
  keys.push('wait.last');
  L.waitLast = { pid: p.id, text: pickLine(game, keys, { name: first1(p.name) }), title: pickLine(game, 'wait.nudgeTitle'), sub: pickLine(game, 'wait.nudgeSub') };
}

// Toggle this player's mulligan vote. Half the table (at least 2 people) swaps the cartoon.
function mulliganThreshold(game) {
  const c = connectedPlayers(game).length;
  return c < 2 ? 1 : Math.max(2, Math.ceil(c / 2));
}
function voteMulligan(game, playerId) {
  if (game.phase !== PHASES.WRITING) return { error: 'You can only mulligan while writing' };
  if (!game.players.some(p => p.id === playerId)) return { error: 'Player not in game' };
  const i = game.mulliganVotes.indexOf(playerId);
  if (i >= 0) { game.mulliganVotes.splice(i, 1); return { ok: true, triggered: false }; }
  game.mulliganVotes.push(playerId);
  const here = new Set(connectedPlayers(game).map(p => p.id));
  const votes = game.mulliganVotes.filter(id => here.has(id)).length;
  if (votes < mulliganThreshold(game)) return { ok: true, triggered: false };

  const oldImage = game.cartoon ? game.cartoon.image : null;
  if (!dealCartoon(game)) {   // nothing new left in the deck: no mulligan, this cartoon stays
    game.mulliganVotes = [];
    game.notice = { text: 'That’s the last new cartoon. It stays.', at: Date.now() };
    return { ok: true, triggered: false, skipped: true };
  }
  game.mulliganCount = (game.mulliganCount || 0) + 1;
  if (game.timerEnd) game.timerEnd += SKIP_MS;   // the gag plays over the new cartoon: give that time back ([settings] no timer: nothing to give)
  game.prevMulligan = (game.prevMulligan || 0) + 1;   // this round's mulligans: a second in a row gets its own line
  const quip = pickLine(game, game.prevMulligan > 1 ? ['write.mulligan2', 'write.mulligan'] : ['write.mulligan']) || 'Next.';
  game.mulliganEvent = { n: game.mulliganCount, quip, kind: dealNight(game, 'skips', SKIP_GAGS), image: oldImage, at: Date.now() };
  return { ok: true, triggered: true };
}

// Writing is over: the app picks the Closed Caption and lays out the rest.
function finishWriting(game) {
  if (game.phase !== PHASES.WRITING) return { ok: true, noop: true };
  if (game.submissions.length === 0) return { ok: true, empty: true };

  const subs = shuffleArray(game.submissions);
  if (game.autoClose) {
    game.closedCaption = game.correctCaption;
    game.closedIsCorrect = true;
    game.closedPlayerId = null;
    game.openCaptions = subs.map(s => ({ caption: s.caption, isCorrect: false, playerId: s.playerId }));
  } else {
    const chosen = subs[0];
    game.closedCaption = chosen.caption;
    game.closedIsCorrect = false;
    game.closedPlayerId = chosen.playerId;
    const opens = subs.slice(1).map(s => ({ caption: s.caption, isCorrect: false, playerId: s.playerId }));
    opens.push({ caption: game.correctCaption, isCorrect: true, playerId: null });
    game.openCaptions = shuffleArray(opens);
  }
  game.mulliganVotes = [];
  // R11: a called shot needs the caller's caption on the table (it always is) and someone who bets
  for (const [caller, called] of Object.entries(game.calls || {})) if (!game.submissions.some(s => s.playerId === caller) || !canBeCalled(game, caller, called)) delete game.calls[caller];
  // #39: the reading and betting lines for this round
  const dealer = dealerOf(game), dn = dealer ? first1(dealer.name) : '';
  if (game.round >= 2) roundLine(game, 'readSub', 'read.sub', { n: game.openCaptions.length });
  roundLine(game, 'readHint', 'read.hint');
  if (game.closedPlayerId) { roundLine(game, 'yoursRead', 'read.yours'); roundLine(game, 'yoursFlip', 'flip.yours'); }
  if (!dealerBets(game)) roundLine(game, 'betDealer', stealOn(game) ? 'bet.dealer' : 'bet.dealerNoSteal');
  if (stealOn(game)) roundLine(game, 'stealWait', 'steal.waiting', { dealer: dn });
  roundLine(game, 'betWatch', 'bet.watch');
  roundLine(game, 'betDown', 'bet.down');
  roundLine(game, 'flipLead', 'flip.lead');
  roundLine(game, 'flipUp', 'flip.up');
  setPhase(game, PHASES.READING);
  return { ok: true };
}

/* R11 Called shot: once your caption is in (and until the betting starts), you may secretly name one person you
   expect to fall for it. If they put a chip on it, +3 (doubled in The Late Edition), and the reveal says so either way. */
function canBeCalled(game, caller, called) {
  if (!called || called === caller || !game.players.some(p => p.id === called)) return false;
  const dealer = dealerOf(game);
  return !(dealer && dealer.id === called && !dealerBets(game));   // a dealer who doesn't bet can't fall for anything
}
function callShot(game, playerId, target) {
  if (game.phase !== PHASES.WRITING && game.phase !== PHASES.READING) return { error: 'Calls close when the betting starts' };
  if (!game.submissions.some(s => s.playerId === playerId)) return { error: 'Lock in your caption first' };
  game.calls = game.calls || {};
  if (target === null || target === undefined || target === '') { delete game.calls[playerId]; return { ok: true }; }
  if (!canBeCalled(game, playerId, String(target))) return { error: 'Pick someone who bets this round' };
  game.calls[playerId] = String(target);
  return { ok: true };
}

// Around the table from the dealer, in the table's direction; the dealer doesn't bet
// ([settings] unless the dealer mode is 'bet' or 'both': then the dealer bets last)
function computeBetOrder(game) {
  const n = game.players.length, order = [], step = stepOf(game);
  for (let k = 1; k < n; k++) order.push(game.players[seatAt(n, game.dealerIndex + k * step)].id);
  const dealer = dealerOf(game);
  if (dealer && dealerBets(game)) order.push(dealer.id);
  return order;
}

/* ── Blind bets: everyone at once, in secret (#7) ──
   Each bettor locks in a caption and 1 or 2 chips; nobody sees where until every chip drops onto the table at
   the same moment (dropAt). The clock catches anyone idle (a no-timer room has none: the dealer or host drops
   the chips). Then the dealer's steal (#8: before the face-down card flips), the flip, and the late chips,
   which still go one at a time. */
function moveToFirstBets(game) {
  if (game.phase !== PHASES.READING) return { error: 'Too late — the game moved on' };
  game.betOrder = computeBetOrder(game);
  game.bets = [];
  game.firstBets = {};
  game.secondBets = {};
  game.blind = {};
  game.dropAt = null;
  game.flipAt = null;
  game.blindEnd = game.timerDuration > 0 ? Date.now() + BLIND_MS : null;
  setPhase(game, PHASES.FIRST_BETS);
  return { ok: true };
}

const stageBet = (game, pid, stage) => game.bets.find(b => b.playerId === pid && b.stage === stage) || null;
// A blind bet is in: still secret, or already on the table
const hasBlind = (game, pid) => !!(game.blind && game.blind[pid]) || !!stageBet(game, pid, 1);

// Holding one chip after the flip: one chip down blind (stolen or not), or sat the blind bet out while here
function eligibleSecondBetters(game) {
  return game.betOrder.filter(pid => {
    const b1 = stageBet(game, pid, 1);
    if (!b1) return false;
    return b1.target === 'pass' ? !!b1.late : (b1.count + (b1.stolen || 0)) === 1;
  });
}

function pendingBetters(game) {
  if (game.phase === PHASES.FIRST_BETS) {
    if (game.dropAt) return [];
    // Whoever hasn't locked in (a phone gone past the grace no longer holds the table up)
    return game.betOrder.filter(pid => { if (hasBlind(game, pid)) return false; const p = game.players.find(x => x.id === pid); return !!p && isPresent(p); });
  }
  if (game.phase === PHASES.SECOND_BETS) return eligibleSecondBetters(game).filter(pid => !stageBet(game, pid, 2));
  return [];
}
// Late chips go one at a time; blind bets have no turns
function currentBetterId(game) { if (game.phase !== PHASES.SECOND_BETS) return null; const p = pendingBetters(game); return p.length ? p[0] : null; }

function validateTarget(game, target) {
  if (target === 'closed') return { ok: true, target: 'closed' };
  if ((typeof target !== 'number' && typeof target !== 'string') || target === '') return { error: 'That didn’t take. Try again.' };   // Number({}) can throw; Number(null) is 0
  const idx = Number(target);
  if (!Number.isInteger(idx) || idx < 0 || idx >= game.openCaptions.length) return { error: 'That didn’t take. Try again.' };
  return { ok: true, target: idx };
}

function placeBet(game, playerId, betTarget) {
  const stage = game.phase === PHASES.FIRST_BETS ? 1 : game.phase === PHASES.SECOND_BETS ? 2 : 0;
  if (!stage) return { error: 'Too late — the game moved on' };
  const dealer = dealerOf(game);
  if (dealer && dealer.id === playerId && !dealerBets(game)) return { error: 'The dealer doesn’t bet' };   // [settings] 'bet'/'both': the dealer bets too
  if (!betTarget || typeof betTarget !== 'object') return { error: 'That didn’t take. Try again.' };
  const count = Number(betTarget.count);
  if (stage === 1) {
    if (game.dropAt) return { error: 'The chips are down' };
    if (hasBlind(game, playerId)) return { error: 'You already bet' };
    if (!game.betOrder.includes(playerId)) return { error: 'You sit this round out' };   // joined after the betting began
    if (count !== 1 && count !== 2) return { error: 'That didn’t take. Try again.' };
    const v = validateTarget(game, betTarget.target);
    if (v.error) return v;
    game.blind[playerId] = { target: v.target, count, at: Date.now() };
    return { ok: true, allIn: pendingBetters(game).length === 0 };
  }
  if (stageBet(game, playerId, 2)) return { error: 'You already bet' };
  if (currentBetterId(game) !== playerId) return { error: 'Not your turn yet' };
  if (count !== 1) return { error: 'You have one chip left' };
  const v = validateTarget(game, betTarget.target);
  if (v.error) return v;
  // The last chip can go anywhere — including on top of your first one.
  game.bets.push({ playerId, target: v.target, count, stage, at: Date.now() });
  game.secondBets[playerId] = { target: v.target, count };
  return { ok: true, allIn: pendingBetters(game).length === 0 };
}

// Changed your mind? A blind bet can be taken back until the chips drop. A late chip: within a few seconds,
// as long as nobody has bet after you.
const UNDO_MS = 4000;
function undoBet(game, playerId) {
  const stage = game.phase === PHASES.FIRST_BETS ? 1 : game.phase === PHASES.SECOND_BETS ? 2 : 0;
  if (stage === 1) {
    if (game.dropAt || !game.blind || !game.blind[playerId]) return { error: 'Too late to take it back' };
    delete game.blind[playerId];
    return { ok: true };
  }
  const last = game.bets[game.bets.length - 1];
  if (!stage || !last || last.playerId !== playerId || last.stage !== stage || last.target === 'pass') return { error: 'Too late to take it back' };
  if (Date.now() - (last.at || 0) > UNDO_MS) return { error: 'Too late to take it back' };
  game.bets.pop();
  delete game.secondBets[playerId];
  game.timerToken = (game.timerToken || 0) + 1;   // cancels the 'all chips are down' move
  return { ok: true };
}

// A late chip whose phone has gone quiet: they sit it out
function skipCurrentBetter(game) {
  if (game.phase === PHASES.FIRST_BETS) return { error: 'Everyone bets at once. Drop the chips instead.' };
  if (game.phase !== PHASES.SECOND_BETS) return { error: 'Too late — the game moved on' };
  const pid = currentBetterId(game);
  if (!pid) return { error: 'Nobody is waiting to bet' };
  game.bets.push({ playerId: pid, target: 'pass', count: 0, stage: 2 });
  return { ok: true, skipped: pid, allIn: pendingBetters(game).length === 0 };
}

// Every blind chip lands at once, in seat order. Anyone who didn't bet sits the blind bet out: still here, they
// keep one chip for after the flip; phone gone, nothing.
function dropBlind(game) {
  if (game.phase !== PHASES.FIRST_BETS) return { error: 'Too late — the game moved on' };
  if (game.dropAt) return { ok: true, noop: true };
  const at = Date.now();
  for (const pid of game.betOrder) {
    if (stageBet(game, pid, 1)) continue;   // (a room restored from an older server: already on the table)
    const b = game.blind && game.blind[pid];
    if (b) {
      game.bets.push({ playerId: pid, target: b.target, count: b.count, stage: 1, at });
      game.firstBets[pid] = { target: b.target, count: b.count };
    } else {
      const p = game.players.find(x => x.id === pid);
      game.bets.push({ playerId: pid, target: 'pass', count: 0, stage: 1, late: !!(p && p.connected), at });
    }
  }
  game.blind = {};
  game.blindEnd = null;
  game.dropAt = at;
  return { ok: true };
}

const chipsOnTable = (game) => game.bets.reduce((n, b) => n + (b.target === 'pass' ? 0 : b.count), 0);
// [settings] only other players' chips can be stolen
const othersChipsOnTable = (game, dealer) => game.bets.reduce((n, b) => n + (b.target === 'pass' || (dealer && b.playerId === dealer.id) ? 0 : b.count), 0);

// The chips are down and the table has had its look: the dealer's steal, or straight to the flip
function afterBlinds(game) {
  if (game.phase !== PHASES.FIRST_BETS) return { error: 'Too late — the game moved on' };
  if (!game.dropAt) dropBlind(game);
  const dealer = dealerOf(game);
  if (stealOn(game) && dealer && othersChipsOnTable(game, dealer) > 0) {
    game.steal = null;
    setPhase(game, PHASES.STEAL);
    return { ok: true };
  }
  return startFlip(game, Date.now());
}
// The face-down card turns over at `at` (server time): every phone flips it together (#18: a held second of
// silence, then the turn). #6: then it moves on by itself (flipDue), unless the dealer holds it.
function startFlip(game, at) {
  game.flipAt = at;
  game.flipHold = false;
  game.flipDue = at + FLIP_AUTO_MS;
  const riders = [...new Set(game.bets.filter(b => b.stage === 1 && b.target === 'closed' && b.count > 0).map(b => b.playerId))];
  if (riders.length) roundLine(game, 'flipRiders', 'flip.riders', { riders: nameList(riders.map(id => firstNameOf(game, id))) });
  else roundLine(game, 'flipNone', 'flip.none');
  setPhase(game, PHASES.REVEAL);
  return { ok: true };
}
// #6: the dealer (or the host) holds the flip or the reel, and lets it go again
function setHold(game, on) {
  const now = Date.now();
  if (game.phase === PHASES.REVEAL) {
    game.flipHold = !!on;
    game.flipDue = on ? null : Math.max(now + 1800, (game.flipAt || now) + FLIP_AUTO_MS);
    return { ok: true };
  }
  if (game.phase === PHASES.ANSWER && game.reel) {
    game.reel.paused = !!on;
    game.reel.dueAt = reelDue(game, on ? null : 2200);
    return { ok: true };
  }
  return { error: 'Nothing to hold right now' };
}

// After the flip: the late chips if anyone holds one, else the answer
function moveFromReveal(game) {
  if (game.phase !== PHASES.REVEAL) return { error: 'Too late — the game moved on' };
  if (eligibleSecondBetters(game).some(pid => !stageBet(game, pid, 2))) { setPhase(game, PHASES.SECOND_BETS); return { ok: true }; }
  revealAnswer(game);
  return { ok: true };
}

function moveFromSecondBets(game) {
  if (game.phase !== PHASES.SECOND_BETS) return { error: 'Too late — the game moved on' };
  revealAnswer(game);
  return { ok: true };
}

// The dealer takes one chip off the table (betIndex = index in game.bets), or passes (null). Then the flip,
// once the steal show is over.
function stealChip(game, betIndex) {
  if (game.phase !== PHASES.STEAL) return { error: 'Too late — the game moved on' };
  if (betIndex === null || betIndex === undefined) {
    game.steal = { skipped: true };
    return startFlip(game, Date.now());
  }
  const bet = game.bets[Number(betIndex)];
  if (!bet || bet.target === 'pass' || bet.count < 1) return { error: 'No chip there' };
  const dl = dealerOf(game);
  if (dl && bet.playerId === dl.id) return { error: 'You can’t steal your own chip' };   // [settings] kitchen sink: the dealer's own chips stay put
  bet.count -= 1;
  bet.stolen = (bet.stolen || 0) + 1;
  const onCorrect = isBetOnCorrect(game, bet);   // kept on the server until the answer: no phone sees it before
  game.stealShows = (game.stealShows || 0) + 1;
  game.nightSteals = (game.nightSteals || 0) + 1;
  // #1: the night's first steal gets the full show; after that about one in four, at random. Never decided by
  // where the chip was, so the show can't tip anyone off.
  const stealShow = game.nightSteals === 1 || Math.random() < STEAL_FULL_SHARE ? 'full' : 'short';
  const robbed = game.history.filter(h => h.steal && h.steal.victimId === bet.playerId).length;   // earlier steals off this player, this game
  const robbedBefore = robbed > 0;
  const v = { name: firstNameOf(game, bet.playerId), count: robbed + 1, ordinal: ordinal(robbed + 1) };
  // #39: nothing said during the show may hint where the chip was. The full show ends on a neutral closing caption
  // (or a callback, for a repeat victim); the short one on a receipt. The thief's gloat waits for the reveal.
  const act = nextHeist(game), thief = HEISTS[act].id, actName = HEISTS[act].name;
  // full: a closing caption held under the show (a repeat victim gets a callback instead); short: the thief's tag
  const gloat = stealShow === 'full'
    ? (robbed >= 2 ? pickLine(game, ['steal.again3', 'steal.again'], v) : robbedBefore ? pickLine(game, 'steal.again', v) : pickLine(game, [`thief.${thief}.closing`, 'steal.closing'], v))
    : pickLine(game, `thief.${thief}.tag`);
  const at = Date.now();
  game.steal = { victimId: bet.playerId, target: bet.target, stage: bet.stage, betIndex: Number(betIndex), onCorrect, act, thief, actName, gloat, again: robbedBefore, robbed, stealShow, seed: Math.floor(Math.random() * 1e9), at, show: game.stealShows };
  return startFlip(game, at + (stealShow === 'full' ? STEAL_FULL_MS : STEAL_SHORT_MS) + 300);
}

function isBetOnCorrect(game, bet) {
  if (!bet || bet.target === 'pass') return false;
  if (bet.target === 'closed') return !!game.closedIsCorrect;
  const c = game.openCaptions[bet.target];
  return !!(c && c.isCorrect);
}

function revealAnswer(game) {
  setPhase(game, PHASES.ANSWER);
  const s = game.settings;
  const scores = {}, details = {};
  game.players.forEach(p => { scores[p.id] = 0; details[p.id] = []; });
  const mult = isLate(game) ? 2 : 1;   // #11 The Late Edition: every point this round counts double
  const add = (pid, pts, reason) => {
    if (!pts || !(pid in scores)) return;
    pts *= mult;
    scores[pid] += pts;
    details[pid].push(mult > 1 ? { pts, reason, x2: true } : { pts, reason });
  };

  // [settings] 'anyoneRight' = another player (not the dealer) has a chip left on the real caption.
  // A betting dealer's own chip on the real one scores like anyone's, and never cancels the dealer's revenge.
  const dealerNow = dealerOf(game);
  let anyoneRight = false;
  for (const bet of game.bets) {
    if (!bet || bet.target === 'pass' || bet.count + (bet.stolen || 0) < 1) continue;
    const blind = bet.stage === 1, onClosed = bet.target === 'closed', both = bet.count === 2;
    if (bet.count > 0 && isBetOnCorrect(game, bet)) {
      if (!dealerNow || bet.playerId !== dealerNow.id) anyoneRight = true;
      const per = blind ? (onClosed ? s.pointsClosedBet : s.pointsOpenBet) : s.pointsOpenLate;
      let reason;
      if (blind && onClosed && both) reason = 'Shot the Moon';
      else if (blind && both) reason = 'Half-Moon on the real caption';
      else if (blind && onClosed) reason = 'Blind chip on the Closed Caption';
      else if (blind) reason = 'Blind chip on the real caption';
      else reason = 'Late chip on the real caption';
      add(bet.playerId, per * bet.count, reason);
    }
    const author = onClosed ? game.closedPlayerId : (game.openCaptions[bet.target] || {}).playerId;
    const fooled = bet.count + (bet.stolen || 0);   // a stolen chip still fooled them: the writer keeps that point
    if (author && author !== bet.playerId) add(author, s.pointsPerFool * fooled, `Fooled ${nameOfPlayer(game, bet.playerId)}`);
  }

  const dealer = dealerOf(game);
  // Nick's rule: stealing a chip off the real caption pays the dealer
  // Nick's rule: a stolen chip becomes the dealer's chip. If it sits on the real caption, it pays the dealer
  // exactly what it would have paid its old owner (blind open, blind Closed Caption, or late); the victim gets nothing for it.
  if (dealer && game.steal && game.steal.victimId && game.steal.onCorrect) {
    const st = game.steal, blind = st.stage === 1;
    const per = blind ? (st.target === 'closed' ? s.pointsClosedBet : s.pointsOpenBet) : s.pointsOpenLate;
    add(dealer.id, per, blind ? 'Stole a blind chip off the real caption — it’s yours now' : 'Stole a chip off the real caption — it’s yours now');
  }
  // Owner's rule (Oct 2026): the steal has a cost. A chip stolen off a FAKE caption pays its owner +1 ("caught you"):
  // the dealer has shown everyone which caption they think is fake. (Off the real caption: unchanged, it pays the dealer.)
  if (dealer && game.steal && game.steal.victimId && !game.steal.onCorrect) {
    add(game.steal.victimId, STEAL_CAUGHT_PTS, 'Caught you: your chip was stolen off a fake caption');
  }
  game.dealerBonusAwarded = false;
  if (!anyoneRight && dealer && s.dealerBonus > 0) {
    add(dealer.id, s.dealerBonus, 'Dealer’s revenge — no chip on the real caption');
    game.dealerBonusAwarded = true;
  }
  // R11 called shots: did the person you named put a chip on your caption? (a stolen chip still counts: they bit)
  game.callResults = [];
  for (const [caller, called] of Object.entries(game.calls || {})) {
    if (!(caller in scores)) continue;
    const key = game.closedPlayerId === caller ? 'closed' : keyOf(game.openCaptions.findIndex(c => c.playerId === caller));
    if (key === '-1') continue;
    const hit = game.bets.some(b => b.playerId === called && keyOf(b.target) === key && chipsOf(b) > 0);
    if (hit) add(caller, CALL_PTS, `Called shot: ${nameOfPlayer(game, called)} bit`);
    game.callResults.push({ callerId: caller, calledId: called, key, hit, line: pickLine(game, hit ? 'call.hit' : 'call.miss', { caller: firstNameOf(game, caller), called: firstNameOf(game, called) }) });
  }

  game.roundScores = scores;
  game.roundScoreDetails = details;

  // Rank before this round's points (tied players share a rank)
  game.previousRank = {};
  game.players.forEach(p => { game.previousRank[p.id] = game.players.filter(q => q.score > p.score).length; });
  for (const [pid, pts] of Object.entries(scores)) {
    const p = game.players.find(x => x.id === pid);
    if (p) p.score += pts;
  }

  { const order = reelOrder(game), real = realKey(game); let k = 0;
    while (k < order.length && order[k] !== real && votesOn(game, order[k]) === 0) k++;
    game.reel = { order, step: 1, nobody: k >= 2 && k < order.length ? k : 0, paused: false, dueAt: null }; }   // #24: the captions nobody bit on share one step
  game.stepAt = game.phaseAt;
  // Badges never break the answer: if anything goes wrong, the round just has none
  try { awardBadges(game); } catch (e) { console.error('badges', e); game.roundBadges = []; }
  // #39 / R10 / R8: the reel's lines, the recap's headline, the blind-laugh score, the odds. Never break the answer.
  try { reelLines(game); } catch (e) { console.error('reel lines', e); }
  try { endLines(game, mult); } catch (e) { console.error('round-end lines', e); }
  try { tableVsCartoonist(game); } catch (e) { console.error('table vs cartoonist', e); game.tvcRound = null; }
  try { oddsLine(game); } catch (e) { console.error('odds', e); }
  game.reel.dueAt = reelDue(game);   // #6: the reel moves on by itself

  game.history.push({
    round: game.round,
    cartoon: { ...game.cartoon },
    correctCaption: game.correctCaption,
    realCredit: game.realCredit ? { ...game.realCredit } : null,
    dealerName: dealer ? dealer.name : '',
    double: mult > 1,   // The Late Edition
    autoClose: game.autoClose,
    openCaptions: game.openCaptions.map(c => ({ caption: c.caption, isCorrect: c.isCorrect, playerId: c.playerId, playerName: c.playerId ? nameOfPlayer(game, c.playerId) : null })),
    closedCaption: game.closedCaption,
    closedIsCorrect: game.closedIsCorrect,
    closedPlayerId: game.closedPlayerId,
    closedPlayerName: game.closedPlayerId ? nameOfPlayer(game, game.closedPlayerId) : null,
    bets: game.bets.map(b => ({ ...b })),
    steal: game.steal ? { ...game.steal } : null,
    roundScores: { ...scores },
    roundScoreDetails: JSON.parse(JSON.stringify(details)),
    dealerBonusAwarded: game.dealerBonusAwarded,
    reactions: JSON.parse(JSON.stringify(game.reactions || {})),
    reacts: reactionCounts(game),   // #26 per caption { ha, groan, haBlind } (refreshed when the round ends)
    calls: game.callResults.map(c => ({ ...c })),   // R11
    tvc: game.tvcRound ? { ...game.tvcRound } : null,   // R10
    odds: game.odds && game.odds.round === game.round ? { ...game.odds } : null,   // R8
    reelOrder: [...game.reel.order],
    badges: JSON.parse(JSON.stringify(game.roundBadges)),
  });
}

/* ── #39 The reel's lines, one set per round (the server picks, every phone shows the same) ── */
function reelLines(game) {
  const R = {}, real = realKey(game), dealer = dealerOf(game), st = game.steal, dn = dealer ? first1(dealer.name) : '';
  const L = game.lines || (game.lines = {});
  const bettors = new Set(game.bets.filter(b => b.target !== 'pass').map(b => b.playerId)).size || game.betOrder.length;
  for (const key of game.reel.order) {
    const o = {};
    if (key === real) {
      const people = [...new Set(game.bets.filter(b => keyOf(b.target) === key && b.count > 0).map(b => b.playerId))];
      const ever = game.bets.some(b => keyOf(b.target) === key && chipsOf(b) > 0), k = people.length;
      if (!k) o.line = ever ? pickLine(game, 'reel.realStolen', { victim: st && st.victimId ? firstNameOf(game, st.victimId) : 'someone', dealer: dn }) : pickLine(game, 'reel.realNobody');
      else if (k === bettors && k >= 2) o.line = pickLine(game, ['reel.realAll', 'reel.real']);
      else if (k === 1) o.line = pickLine(game, ['reel.realOne', 'reel.real'], { name: firstNameOf(game, people[0]) });
      else if (k > bettors / 2) o.line = pickLine(game, ['reel.realMost', 'reel.real'], { k, n: bettors });
      else o.line = pickLine(game, ['reel.realFew', 'reel.real'], { k, n: bettors });
      o.lead = pickLine(game, 'reel.lead');
    } else {
      const w = writerOfKey(game, key);
      const backers = [...new Set(game.bets.filter(b => keyOf(b.target) === key && b.playerId !== w && chipsOf(b) > 0).map(b => b.playerId))];
      const field = game.betOrder.filter(id => id !== w);
      if (!backers.length) o.nobody = pickLine(game, 'reel.fakeNobody');
      else if (field.length >= 2 && field.every(id => backers.includes(id))) o.fell = pickLine(game, ['reel.fellAll', 'reel.fell']);
      else if (backers.length === 1) o.fell = pickLine(game, ['reel.fellOne', 'reel.fell']);
      else o.fell = pickLine(game, 'reel.fell');
    }
    R[key] = o;
  }
  // The thief's own line, now that it can't give anything away (on the caption the chip came off): after a full
  // show, in character and keyed to where the chip was; after a short one, the paperwork
  if (st && st.victimId && R[keyOf(st.target)]) {
    const vn = firstNameOf(game, st.victimId);
    R[keyOf(st.target)].gloat = st.stealShow === 'full' && st.thief
      ? { who: st.actName, text: pickLine(game, [`thief.${st.thief}.${st.onCorrect ? 'real' : 'fake'}`, 'steal.receipt'], { name: vn }) }
      : { who: null, text: pickLine(game, (st.robbed || 0) >= 1 ? ['steal.againShort', 'steal.receipt'] : 'steal.receipt', { name: vn }) };
  }
  for (const c of game.callResults || []) if (R[c.key]) R[c.key].call = c.line;   // R11, on the caller's caption
  L.reel = R;
  if (game.reel.nobody) L.reelGroup = pickLine(game, 'reel.group', { k: game.reel.nobody });
  L.reelHold = pickLine(game, 'reel.hold', { dealer: dn });
  // #5: the recap's Frame It list (round 1 keeps the line that teaches it)
  L.framePrompt = game.round === 1 ? 'Did anyone beat the real one?' : pickLine(game, 'frame.prompt');
  L.frameSub = game.round === 1 ? 'Frame it. When most of the table does, it hangs in The Gallery for good.' : pickLine(game, 'frame.sub');
  const rs = Object.values(game.roundScores || {});
  if (rs.some(p => p >= 6) || (game.roundBadges || []).some(b => b.kind === 'moon' && (b.detail || {}).shot === 'moon')) L.noted = pickLine(game, 'reel.noted');
}

/* ── #39 The recap's lines: one headline (the first situation that fits, and whose pool still has a fresh line
   tonight), the steal in a sentence (only now: the real caption is out), and the nobody-scored line ── */
function endLines(game, mult) {
  const L = game.lines || (game.lines = {}), real = realKey(game), fakes = playerKeys(game), dealer = dealerOf(game);
  const dn = dealer ? first1(dealer.name) : '', fn = (id) => firstNameOf(game, id), st = game.steal;
  const cand = [], add = (k, v) => cand.push({ k, v: v || {} });
  const blindOn = (key) => game.bets.filter(b => b.stage === 1 && keyOf(b.target) === key && chipsOf(b) > 0);
  const moons = (game.roundBadges || []).filter(b => b.kind === 'moon');
  const moonShot = moons.find(b => (b.detail || {}).shot === 'moon');
  if (moonShot) add('end.moonHit', { name: fn(moonShot.playerIds[0]) });
  const ccRiders = [...new Set(blindOn('closed').filter(b => b.playerId !== game.closedPlayerId).map(b => b.playerId))];
  if (game.closedIsCorrect && ccRiders.length) add('end.ccRealRiders', { riders: nameList(ccRiders.map(fn)) });
  const sweep = (game.roundBadges || []).find(b => b.kind === 'clean_sweep');
  if (sweep) add('end.swept', { writer: fn(sweep.playerIds[0]) });
  const betters = game.betOrder.filter(id => game.bets.some(b => b.playerId === id && b.target !== 'pass'));
  if (betters.length >= 2 && betters.every(id => game.bets.some(b => b.playerId === id && keyOf(b.target) === real && chipsOf(b) > 0))) add('end.allFound');
  if (game.closedIsCorrect && !game.bets.some(b => b.target === 'closed' && chipsOf(b) > 0)) add('end.ccRealAlone');
  if (game.dealerBonusAwarded && dealer) add('end.revenge', { dealer: dn, pts: (game.settings.dealerBonus || 0) * mult });
  for (const b of game.bets) {
    if (b.stage !== 1 || chipsOf(b) !== 2 || keyOf(b.target) === real) continue;
    const w = writerOfKey(game, keyOf(b.target));
    if (w && w !== b.playerId) { add('end.moonMiss', { name: fn(b.playerId), writer: fn(w) }); break; }
  }
  if (!game.closedIsCorrect && game.closedPlayerId && ccRiders.length) add('end.ccFakeRiders', { writer: fn(game.closedPlayerId), riders: nameList(ccRiders.map(fn)) });
  const minds = (game.roundBadges || []).find(b => b.kind === 'great_minds');
  if (minds && minds.playerIds.length >= 2) add('end.minds', { a: fn(minds.playerIds[0]), b: fn(minds.playerIds[1]) });
  const fk = fakes.map(k => { const w = writerOfKey(game, k); return { k, w, people: new Set(game.bets.filter(b => keyOf(b.target) === k && b.playerId !== w && chipsOf(b) > 0).map(b => b.playerId)).size, chips: votesOn(game, k) }; });
  const maxChips = Math.max(0, ...fk.map(f => f.chips)), tops = fk.filter(f => f.chips === maxChips && maxChips >= 2), tw = [...new Set(tops.map(f => f.w))];
  if (tops.length && tw.length === 1 && tops[0].people >= 2) add('end.bluff', { writer: fn(tw[0]), n: tops[0].people });
  else if (tops.length && tw.length === 2 && tops.every(f => f.people === tops[0].people) && tops[0].people >= 2) add('end.bluff2', { writers: nameList(tw.map(fn)), n: tops[0].people });
  if (fakes.length && !fk.some(f => f.chips > 0) && game.bets.some(b => keyOf(b.target) === real && chipsOf(b) > 0)) add('end.honest', { n: fakes.length });
  const own = game.bets.find(b => b.target !== 'pass' && chipsOf(b) > 0 && writerOfKey(game, keyOf(b.target)) === b.playerId);
  if (own) add('end.betOwn', { name: fn(own.playerId) });
  const rs = game.roundScores || {}, top = Math.max(0, ...Object.values(rs));
  if (top > 0 && Object.values(rs).filter(v => v === top).length >= 2) add('end.tie');
  if (lapsOf(game) && game.round >= totalRounds(game)) add('end.last');
  if (isLate(game)) add('end.late');
  if (game.round === 1) add('end.first');
  L.endHead = cand.length ? pickLine(game, cand.map(c => c.k), null, cand.map(c => c.v)) : '';
  // The steal, said after the answer only (#1: the show never hints)
  if (st && st.victimId) L.endSteal = st.onCorrect ? pickLine(game, 'end.stoleReal', { dealer: dn, victim: fn(st.victimId) }) : pickLine(game, 'end.stoleFake', { dealer: dn, victim: fn(st.victimId), pts: STEAL_CAUGHT_PTS * mult });
  else if (st && st.skipped && stealOn(game)) L.endSteal = pickLine(game, 'end.peace', { dealer: dn });
  if (!Object.values(rs).some(v => v > 0)) L.noScore = pickLine(game, 'end.noScore');
}

/* ── R10 The table vs. the cartoonist: 'Ha' taps made before the answer (nobody knew which was real) are a blind
   test. The table's best fake against the real caption; the round goes to whichever got more. ── */
function tableVsCartoonist(game) {
  const real = realKey(game);
  const blindHa = (key) => Object.values((game.reactions || {})[key] || {}).filter(r => r && r.ha === 1).length;
  const fakes = playerKeys(game).map(k => ({ k, n: blindHa(k), w: writerOfKey(game, k) }));
  const best = Math.max(0, ...fakes.map(f => f.n)), m = blindHa(real);
  game.tvcRound = null;
  if (!best && !m) return;
  const tops = best > 0 ? fakes.filter(f => f.n === best) : [];
  const writerIds = [...new Set(tops.map(f => f.w).filter(Boolean))];
  const side = best > m ? 'table' : m > best ? 'cartoonist' : 'draw';
  game.tvc = game.tvc || { table: 0, cartoonist: 0, draws: 0 };
  game.tvc[side === 'draw' ? 'draws' : side]++;
  const line = pickLine(game, 'tvc.' + side, { writer: nameList(writerIds.map(id => firstNameOf(game, id))) || 'The table', n: best, m });
  game.tvcRound = { round: game.round, side, best, real: m, keys: tops.map(f => f.k), writerIds, line, score: { ...game.tvc } };
}

/* ── R8 The odds of that, stated deadpan: worked out from the rules and this table (each first bet as a blind guess
   among the captions that aren't yours; the face-down card is real about autoCloseProbability of the time).
   Only for something rarer than 1 in 20, and once a game. ── */
function fmtOdds(n) {
  if (n < 100) return String(Math.round(n));
  if (n < 1000) return String(Math.round(n / 5) * 5);
  const p = Math.pow(10, Math.floor(Math.log10(n)) - 1);
  return (Math.round(n / p) * p).toLocaleString('en-US');
}
function oddsLine(game) {
  if (game.odds) return;
  const C = game.openCaptions.length + 1, wrote = new Set(game.submissions.map(s => s.playerId));
  const choices = (pid) => Math.max(1, C - (wrote.has(pid) ? 1 : 0));
  const prod = (ids) => ids.reduce((p, id) => p / choices(id), 1);
  const blind = game.bets.filter(b => b.stage === 1 && b.target !== 'pass' && chipsOf(b) > 0);
  const bettors = game.betOrder.filter(pid => blind.some(b => b.playerId === pid));
  const allBet = bettors.length === game.betOrder.length && bettors.length >= 3;
  const real = realKey(game), ev = [];
  if (allBet && blind.every(b => keyOf(b.target) === real)) ev.push({ kind: 'allBlind', p: prod(bettors) });
  if (allBet && blind.every(b => b.target === 'closed')) ev.push({ kind: 'allCC', p: prod(bettors) });
  // One fake drew every other first bet. Any fake could have: their chances add up (they can't both happen).
  let pAny = 0, swept = null;
  for (const k of playerKeys(game)) {
    const w = writerOfKey(game, k), others = game.betOrder.filter(id => id !== w);
    if (others.length < 3) continue;
    pAny += prod(others);
    if (others.every(id => blind.some(b => b.playerId === id && keyOf(b.target) === k))) swept = w;
  }
  if (swept && pAny > 0) ev.push({ kind: 'sweep', p: pAny, vars: { writer: firstNameOf(game, swept) } });
  const pc = Math.min(1, Math.max(0, Number(game.settings.autoCloseProbability) || 0.15));
  for (const b of blind) if (b.target === 'closed' && game.closedIsCorrect && chipsOf(b) === 2) { ev.push({ kind: 'moon', p: pc / choices(b.playerId), vars: { name: firstNameOf(game, b.playerId) } }); break; }
  const rare = ev.filter(e => e.p > 0 && e.p < 1 / 20).sort((a, b) => a.p - b.p)[0];
  if (!rare) return;
  const odds = fmtOdds(1 / rare.p);
  game.odds = { round: game.round, kind: rare.kind, odds, p: rare.p, line: pickLine(game, 'odds.' + rare.kind, { ...(rare.vars || {}), odds }) };
}

/* ── #6 The reel moves on by itself: a few seconds a caption (longer when there's more to read), the real one
   longest. The recap waits for the dealer. Held (paused): no clock. The night's first framing holds it too. ── */
function reelStepMs(game, step) {
  const r = game.reel; if (!r) return 0;
  const n = r.order.length; if (step > n) return 0;
  const k = r.nobody || 0;
  if (k && step <= k) return 2300 + 450 * k;
  const key = r.order[step - 1], o = ((game.lines || {}).reel || {})[key] || {};
  const badges = (game.roundBadges || []).filter(b => String(b.target) === key || (key === realKey(game) && ['moon', 'pickpocket'].includes(b.kind))).length;
  if (key === realKey(game)) {   // the drumroll, the stamp (1.2 s), a line or two to read
    let ms = 5000 + (badges ? 600 : 0);
    if (game.odds && game.odds.round === game.round) ms += 1000;
    if (game.tvcRound && game.tvcRound.line) ms += 800;
    return ms;
  }
  let ms = votesOn(game, key) ? 3200 : 2500;   // read aloud already: who wrote it, who fell for it
  if (badges) ms += 600;
  if (o.call) ms += 900;
  if (o.gloat) ms += 800;
  return ms;
}
function reelDue(game, fromNow) {
  const r = game.reel; if (!r || r.paused) return null;
  if (r.step > r.order.length) return null;
  const base = fromNow !== undefined && fromNow !== null ? Date.now() + fromNow : (game.stepAt || Date.now()) + REEL_LEAD_MS + reelStepMs(game, r.step);
  return Math.max(base, (game.frameHold || 0) + 800);
}

// The recap is done: the scoreboard (#5: Frame It happened on the reveal, so there's no screen in between)
function moveToScoreboard(game) {
  if (game.phase !== PHASES.ANSWER) return { error: 'Too late — the game moved on' };
  if (game.reel && game.reel.step < game.reel.order.length + 1) return { error: 'Finish the reveal first' };
  if (Date.now() < (game.frameHold || 0) - 300) return { error: 'One moment. It’s being hung.' };
  try { closeRound(game); } catch (e) { console.error('round close', e); }
  // #37 first to N: someone got there. The trip around the table is finished first (everyone deals the same
  // number of times), and #11 the rest of that trip is The Late Edition.
  const s = game.settings;
  if (s.targetScore && !game.finalLaps && game.players.some(p => p.score >= s.targetScore)) {
    const counts = game.dealCount || {}, here = game.players.filter(isPresent);
    game.finalLaps = Math.max(1, ...(here.length ? here : game.players).map(p => counts[p.id] || 0));
    const top = Math.max(...game.players.map(p => p.score));
    game.targetHit = { round: game.round, ids: game.players.filter(p => p.score === top).map(p => p.id), score: top };
    if (!isGameOver(game)) game.lateFrom = game.round + 1;
  }
  if (!isGameOver(game) && !canDeal(game)) endForDeck(game);   // nothing left to deal: this is the final scoreboard
  setPhase(game, PHASES.SCORES);
  game.scoresAt = Date.now();   // phones time the Grand Poobah ceremony from this, so it plays together
  try { scoreLines(game); } catch (e) { console.error('score lines', e); }
  if (isGameOver(game)) settleRating(game);
  return { ok: true };
}

/* ── The round is over (the reel is done, the frames are in): the tallies the end of the night reads (#26 Ha and
   Groan per caption, R1 rejection slips, R10 the table vs. the cartoonist, R11 called shots, R8 the odds) ── */
function newRecord() { return { captions: [], table: { table: 0, cartoonist: 0, draws: 0 }, rejections: [], calls: [], odds: null }; }
function closeRound(game) {
  const h = game.history.find(x => x.round === game.round);
  const counts = reactionCounts(game), mult = isLate(game) ? 2 : 1;
  const rec = game.record || (game.record = newRecord());
  // R1: a fake with no chips at all and 3+ groans: a rejection slip from The Editors, slid to its writer
  game.slips = [];
  for (const key of playerKeys(game)) {
    const w = writerOfKey(game, key), c = counts[key] || {};
    if (!w || votesOn(game, key) > 0 || (c.groan || 0) < SLIP_GROANS) continue;
    const slip = { round: game.round, target: key, writerId: w, writer: nameOfPlayer(game, w), caption: captionOfKey(game, key), groans: c.groan, image: game.cartoon && game.cartoon.image,
      line: pickLine(game, 'slip.form'), note: pickLine(game, 'slip.note', { name: firstNameOf(game, w), n: c.groan }), month: MONTH() };
    game.slips.push(slip);
  }
  // The game's record, rebuilt for this round (a re-deal never counts twice)
  rec.captions = rec.captions.filter(x => x.round !== game.round);
  for (const key of playerKeys(game)) {
    const w = writerOfKey(game, key), c = counts[key] || {};
    rec.captions.push({ round: game.round, target: key, writerId: w, writer: nameOfPlayer(game, w), caption: captionOfKey(game, key), ha: c.ha || 0, groan: c.groan || 0, haBlind: c.haBlind || 0, chips: votesOn(game, key), framed: (game.inducted || []).includes(game.round + '|' + (key === 'closed' ? 'closed' : Number(key))) });
  }
  { const rk = realKey(game), c = counts[rk] || {}; rec.real = (rec.real || []).filter(x => x.round !== game.round).concat({ round: game.round, ha: c.ha || 0, groan: c.groan || 0, haBlind: c.haBlind || 0 }); }
  rec.rejections = rec.rejections.filter(x => x.round !== game.round).concat(game.slips.map(s => ({ round: s.round, target: s.target, writerId: s.writerId, writer: s.writer, caption: s.caption, groans: s.groans, line: s.line })));
  rec.calls = rec.calls.filter(x => x.round !== game.round).concat((game.callResults || []).map(c => ({ round: game.round, callerId: c.callerId, calledId: c.calledId, hit: c.hit, pts: c.hit ? CALL_PTS * mult : 0 })));
  rec.table = { ...(game.tvc || { table: 0, cartoonist: 0, draws: 0 }) };
  if (game.odds && !rec.odds) rec.odds = { ...game.odds };
  if (h) { h.reacts = counts; h.reactions = JSON.parse(JSON.stringify(game.reactions || {})); h.slips = game.slips.map(s => ({ ...s })); h.frames = (game.roundFrames || []).map(f => ({ target: f.target, caption: f.caption, author: f.author, flags: f.flags, kind: f.kind })); }
}
// #39: the scoreboard's lines: the round winner's stamp (by what happened) and the wait for the next dealer
function scoreLines(game) {
  const L = game.lines || (game.lines = {}), rs = game.roundScores || {}, best = Math.max(0, ...Object.values(rs));
  const winners = best > 0 ? game.players.filter(p => rs[p.id] === best).map(p => p.id) : [];
  delete L.stamp;
  if (winners.length > 1) L.stamp = pickLine(game, 'stamp.tied');
  else if (winners.length === 1) {
    const w = winners[0], fn = firstNameOf(game, w);
    const wins = game.history.filter(r => r.round < game.round).filter(r => { const x = r.roundScores || {}, m = Math.max(0, ...Object.values(x)); return m > 0 && x[w] === m && Object.values(x).filter(v => v === m).length === 1; }).length;
    const p = game.players.find(q => q.id === w), top = Math.max(...game.players.map(q => q.score));
    const leads = !!p && p.score === top && game.players.filter(q => q.score === top).length === 1 && (game.previousRank || {})[w] > 0;
    if (wins >= 2) L.stamp = pickLine(game, ['stamp.againN', 'stamp.again'], { ordinal: ordinal(wins + 1), name: fn });
    else if (wins === 1) L.stamp = pickLine(game, 'stamp.again', { name: fn });
    else if (leads) L.stamp = pickLine(game, 'stamp.lead', { name: fn });
    else if (game.round >= 4) L.stamp = pickLine(game, 'stamp.atLast', { name: fn });
  }
  if (!isGameOver(game)) { const nd = game.players[nextDealerIndex(game, game.dealerIndex)]; if (nd) L.nextDealer = pickLine(game, 'score.nextDealer', { dealer: first1(nd.name) }); }
}

// [settings] 'Everyone deals N times' (laps): the rounds played so far, plus the deals still to come going around
// the table from the current dealer, stopping at the first seat that has already dealt N times. With N = 1 and
// nobody joining late this is exactly the old 'one round per player'; a late joiner adds the deals they will get.
// (#37: a fixed round count and first-to-N are trips around the table too: see lapsOf. null = no end in sight yet.)
function totalRounds(game) {
  const n = game.players.length, laps = lapsOf(game);
  if (!laps) return null;
  if (!game.round || game.dealerIndex < 0 || !game.dealCount || !n) return n * laps;
  const c = { ...game.dealCount }, step = stepOf(game);
  let i = game.dealerIndex, more = 0;
  for (let g = 0; g <= n * laps; g++) {
    i = seatAt(n, i + step);
    const id = game.players[i].id;
    if (!isPresent(game.players[i]) && (c[id] || 0) < laps) continue;   // #29: someone who left doesn't hold the game open for their deal
    if ((c[id] || 0) >= laps) break;
    c[id] = (c[id] || 0) + 1; more++;
  }
  return game.round + more;
}

function isGameOver(game) {
  if (game.deckOut) return true;
  if (!lapsOf(game)) return false;   // first to N, and nobody's there yet
  return game.round >= totalRounds(game);
}
// #11 The Late Edition: this round (or `round`) pays double
const isLate = (game, round = game.round) => !!game.lateFrom && round >= game.lateFrom;

/* #9 / #11: the winner. Most points; a tie for first goes to whoever fooled the most (chips other players put on
   their fakes, all game: a stolen chip still fooled them), then to more captions framed tonight. Still level: a tie. */
function fooledTally(game) {
  const t = {};
  for (const h of game.history || []) for (const b of h.bets || []) {
    if (!b || b.target === 'pass') continue;
    const c = b.target === 'closed' ? { playerId: h.closedPlayerId, isCorrect: h.closedIsCorrect } : ((h.openCaptions || [])[b.target] || {});
    const n = (b.count || 0) + (b.stolen || 0);
    if (c.isCorrect || !c.playerId || c.playerId === b.playerId || n < 1) continue;
    t[c.playerId] = (t[c.playerId] || 0) + n;
  }
  return t;
}
function framedTally(game) {
  const t = {};
  for (const e of hallOfFame(game)) if (!e.isReal && e.writerId) t[e.writerId] = (t[e.writerId] || 0) + 1;
  return t;
}
function standing(game) {
  const ps = game.players;
  if (!ps.length) return null;
  const top = Math.max(...ps.map(p => p.score));
  let tied = ps.filter(p => p.score === top).map(p => p.id);
  const out = { top, tied: [...tied], by: 'points', winners: tied };
  if (tied.length < 2) return out;
  const fooled = fooledTally(game), mf = Math.max(...tied.map(id => fooled[id] || 0));
  out.fooled = Object.fromEntries(tied.map(id => [id, fooled[id] || 0]));
  tied = tied.filter(id => (fooled[id] || 0) === mf);
  if (tied.length === 1) return { ...out, by: 'fooled', winners: tied };
  const framed = framedTally(game), mr = Math.max(...tied.map(id => framed[id] || 0));
  out.framed = Object.fromEntries(tied.map(id => [id, framed[id] || 0]));
  tied = tied.filter(id => (framed[id] || 0) === mr);
  return { ...out, by: tied.length === 1 ? 'framed' : 'tie', winners: tied };
}

/* ── #5 Frame It, on the reveal: a small frame on every fake once the reel has shown who wrote it (and on the recap).
   Frame as many as deserve it (never your own, never the real one); tap again to take it back. A caption is FRAMED
   the moment a majority of the other players (everyone but its writer) have framed it (inductNeed): it hangs in
   The Gallery on the spot. The night's first framing gets the whole ceremony (the reel waits for it); after that,
   a quick plaque that doesn't stop anything. ── */
function authorOf(game, target) { return target === 'closed' ? game.closedPlayerId : (game.openCaptions[target] || {}).playerId; }
// The captions the reel has shown so far (their writers are out); at the recap, all of them
function revealedKeys(game) {
  const r = game.reel; if (!r) return [];
  const n = r.order.length, k = r.nobody || 0;
  const shown = r.step > n ? n : (k && r.step <= k ? k : r.step);
  return r.order.slice(0, shown);
}
function pickFrame(game, playerId, target, on) {
  if (game.phase !== PHASES.ANSWER) return { error: 'Framing happens on the reveal' };
  if (!game.players.some(p => p.id === playerId)) return { error: 'Player not in game' };
  const v = validateTarget(game, target);
  if (v.error) return v;
  const key = keyOf(v.target);
  if (!revealedKeys(game).includes(key)) return { error: 'Not yet. Wait for it.' };
  if (authorOf(game, v.target) === playerId) return { error: 'You can’t frame your own caption' };
  if (isBetOnCorrect(game, { target: v.target })) return { error: 'The real caption can’t be framed' };
  const picks = (game.framePicks = game.framePicks || {}), list = picks[key] || (picks[key] = []);
  const has = list.includes(playerId), want = on === undefined || on === null ? !has : !!on;
  if (want === has) return { ok: true, noop: true };
  game.flags = game.flags || [];
  if (want) { list.push(playerId); game.flags.push({ fromId: playerId, round: game.round, target: v.target, at: Date.now() }); }
  else { list.splice(list.indexOf(playerId), 1); game.flags = game.flags.filter(f => !(f.round === game.round && String(f.target) === key && f.fromId === playerId)); }
  let framed = null;
  const ikey = game.round + '|' + v.target;
  if (want && list.length >= inductNeed(game) && !(game.inducted || []).includes(ikey)) framed = frameNow(game, v.target);
  return { ok: true, framed: !!framed };
}
// Framed: into The Gallery now, and the celebration is scheduled on every phone (one after another if two land at once)
function frameNow(game, target) {
  game.inducted = game.inducted || [];
  const key = game.round + '|' + target;
  game.inducted.push(key);
  const fl = (game.flags || []).filter(f => f.round === game.round && String(f.target) === String(target));
  const now = Date.now(), full = !(game.nightFrames > 0);
  const at = Math.max(now + FRAME_LEAD_MS, game.frameBusy || 0), ms = full ? FRAME_FULL_MS : FRAME_PLAQUE_MS;
  let it = null;
  try { it = induct(game, target, fl, fl.length, at); } catch (e) { console.error('induction', e); }
  if (!it) return null;
  game.nightFrames = (game.nightFrames || 0) + 1;
  game.frameBusy = at + ms;
  if (full) game.frameHold = at + ms;   // the reel waits while the night's first frame is hung
  const many = (game.roundFrames || []).length >= 1;
  const n = Math.max((game.lastInduction && game.lastInduction.n) || 0, game.inductionCount || 0) + 1;
  Object.assign(it, { n, kind: full ? 'full' : 'plaque', ms,
    line: pickLine(game, many ? ['frame.many', 'frame.plaque'] : 'frame.plaque', { n: (game.roundFrames || []).length + 1 }),
    lineMine: pickLine(game, 'frame.mine') });
  game.roundFrames = (game.roundFrames || []).concat(it);
  game.lastInduction = { ...it, list: game.roundFrames };
  if (game.reel && !game.reel.paused && game.reel.step <= game.reel.order.length) game.reel.dueAt = Math.max(game.reel.dueAt || 0, reelDue(game) || 0);
  return it;
}
// Framed = a majority of the OTHER players (the writer can't frame their own): 3 players -> 2, 4 -> 2, 5 -> 3, 6 -> 3, 8 -> 4
const inductNeed = (game) => Math.floor(Math.max(1, game.players.length - 1) / 2) + 1;
// A caption was just framed: player-written fakes join the permanent deck. Returns the celebration (at = when it plays)
function induct(game, target, fl, count, at = Date.now()) {
  const h = game.history.find(x => x.round === game.round);
  if (!h) return null;
  const c = target === 'closed' ? { caption: h.closedCaption, playerId: h.closedPlayerId, isCorrect: h.closedIsCorrect } : (h.openCaptions[target] || {});
  const isReal = !!c.isCorrect, author = c.playerId ? nameOfPlayer(game, c.playerId) : null;
  const image = h.cartoon && h.cartoon.image, flaggers = fl.map(f => nameOfPlayer(game, f.fromId)), month = MONTH();
  let entry = null;
  // The real caption is celebrated but not added (it's already the real one)
  if (!isReal && author && c.caption) {
    const raw = { cartoonId: h.cartoon.id, image, caption: c.caption, author, flaggers, flags: count, month };
    entry = deckOf(game).add({ ...raw, sig: sigOf(raw) });
    if (entry && store.file) store.add(entry, true);   // the server's saved copy (kept for good when DATA_DIR is set)
  }
  return {
    round: game.round, target, at, caption: c.caption || '', author: isReal ? null : author, isReal,
    image, flaggers, flags: count, month, entryId: entry ? entry.id : null,
    entry: entry || null,   // phones save this to carry The Gallery to the next game night
  };
}
const MONTH = () => new Date().toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/New_York' });
// Captions with enough flags (see inductNeed), with everything a Hall of Fame card needs
function hallOfFame(game) {
  const groups = new Map();
  for (const f of game.flags) { const k = f.round + '|' + f.target; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(f); }
  const out = [];
  for (const [k, fl] of groups) {
    // Once inducted, always listed (even if a late joiner raises the bar or a flag is taken back)
    if (fl.length < inductNeed(game) && !(game.inducted || []).includes(k)) continue;
    const { round, target } = fl[0];
    let caption, writerName, writerId, image, isReal;
    const live = round === game.round && ANSWERED.includes(game.phase);
    const h = game.history.find(x => x.round === round);
    if (!h) continue;
    image = h.cartoon && h.cartoon.image;
    if (target === 'closed') { caption = h.closedCaption; writerId = h.closedPlayerId; isReal = !!h.closedIsCorrect; }
    else { const c = h.openCaptions[target] || {}; caption = c.caption; writerId = c.playerId; isReal = !!c.isCorrect; }
    writerName = writerId ? nameOfPlayer(game, writerId) : null;
    out.push({ round, target, caption, writerId, writerName, isReal, image, flaggers: fl.map(f => nameOfPlayer(game, f.fromId)), month: MONTH(), live });
  }
  return out.sort((a, b) => a.round - b.round);
}

/* ── The finale: after the winner and the Grand Poobah, tonight's Gallery.
   Every caption framed tonight is shown; with two or more, the table votes (never for your own).
   The winner is Caption of the Night: a short ceremony on every phone at once, then memorialized
   on the untouched cartoon in The Gallery. ── */
const SHOW_LEAD_MS = 1500;   // a beat after the result, so every phone starts the ceremony together
function finaleEntries(game) {
  return hallOfFame(game).filter(e => !e.isReal && e.caption && e.writerId).map(e => ({
    key: e.round + '|' + e.target, round: e.round, target: e.target, caption: e.caption,
    writerId: e.writerId, writerName: e.writerName, image: e.image,
    cartoonId: ((game.history.find(h => h.round === e.round) || {}).cartoon || {}).id,
    frames: e.flaggers.length, flaggers: e.flaggers,
  }));
}
const finaleCanVote = (f, pid) => f.entries.some(e => e.writerId !== pid);
function openFinale(game) {
  if (game.phase !== PHASES.SCORES || !isGameOver(game)) return { error: 'The Gallery opens when the game is over' };
  if (game.finale) return { ok: true, noop: true };
  const entries = finaleEntries(game);
  if (!entries.length) return { error: 'Nothing was framed tonight' };
  game.finale = { at: Date.now(), entries, votes: {}, voters: game.players.filter(isPresent).map(p => p.id), winner: null, counts: null, tie: false, showAt: null };
  if (entries.length === 1) resolveFinale(game);
  return { ok: true };
}
function voteFinale(game, playerId, key) {
  const f = game.finale;
  if (!f || f.winner) return { error: 'The votes are in' };
  const e = f.entries.find(x => x.key === String(key));
  if (!e) return { error: 'Pick one of tonight’s frames' };
  if (e.writerId === playerId) return { error: 'You can’t vote for your own' };
  f.votes[playerId] = e.key;
  if (!f.voters.includes(playerId)) f.voters.push(playerId);
  if (finaleAllIn(game)) resolveFinale(game);
  return { ok: true };
}
function finaleAllIn(game) {
  const f = game.finale; if (!f) return false;
  const need = f.voters.filter(pid => { const p = game.players.find(x => x.id === pid); return p && isPresent(p) && finaleCanVote(f, pid); });
  return need.length > 0 && need.every(pid => pid in f.votes);
}
// Most votes; a tie goes to more frames, then a coin flip (and the ceremony says so)
function resolveFinale(game) {
  const f = game.finale;
  if (!f || f.winner) return { ok: true, noop: true };
  const counts = {}; for (const e of f.entries) counts[e.key] = 0;
  for (const k of Object.values(f.votes)) if (k in counts) counts[k]++;
  const top = Math.max(...Object.values(counts));
  let best = f.entries.filter(e => counts[e.key] === top);
  const most = Math.max(...best.map(e => e.frames));
  best = best.filter(e => e.frames === most);
  f.tie = best.length > 1;
  f.winner = best[Math.floor(Math.random() * best.length)].key;
  f.counts = counts;
  f.showAt = Date.now() + SHOW_LEAD_MS;
  // Memorialized: the room's Gallery remembers it was Caption of the Night
  const w = f.entries.find(e => e.key === f.winner);
  f.best = 'Caption of the Night · ' + MONTH();
  try { const d = deckOf(game); if (d.markBest) d.markBest(w.cartoonId, w.caption, f.best); } catch (e) {}
  return { ok: true };
}

/* ── #26 'Ha' and 'Groan': two quiet buttons on every caption, from the reading to the end of the reveal. No points.
   Each player can Ha and/or Groan each caption once (tap again to take it back), never their own. Nothing is shown
   before the answer (only your own taps, on your phone): a laugh count would hint at what's real. From the answer on,
   the counts per caption. A tap made before the answer is 'blind' (1), after it 'open' (2): R10 counts blind Ha's. ── */
const REACTION_KINDS = ['ha', 'groan'];
const REACT_PHASES = [PHASES.READING, PHASES.FIRST_BETS, PHASES.STEAL, PHASES.REVEAL, PHASES.SECOND_BETS, PHASES.ANSWER];
function react(game, playerId, target, kind, on) {
  if (!REACT_PHASES.includes(game.phase)) return { error: 'Reactions close with the round' };
  if (!game.players.some(p => p.id === playerId)) return { error: 'Player not in game' };
  if (!REACTION_KINDS.includes(kind)) return { error: 'That didn’t take. Try again.' };
  const v = validateTarget(game, target);
  if (v.error) return v;
  if (v.target === 'closed' && !REVEALED.includes(game.phase)) return { error: 'The Closed Caption is still face-down' };
  if (authorOf(game, v.target) === playerId) return { error: 'Not your own' };
  const key = String(v.target);
  const map = game.reactions[key] || (game.reactions[key] = {});
  const mine = map[playerId] && typeof map[playerId] === 'object' ? map[playerId] : (map[playerId] = {});
  const has = !!mine[kind], want = on === undefined || on === null ? !has : !!on;
  if (want && !has) mine[kind] = ANSWERED.includes(game.phase) ? 2 : 1;
  else if (!want && has) delete mine[kind];
  if (!Object.keys(mine).length) delete map[playerId];
  return { ok: true };
}
// { [targetKey]: { ha, groan, haBlind } } — never who (it would give away who wrote what)
function reactionCounts(game) {
  const out = {};
  for (const [key, map] of Object.entries(game.reactions || {})) {
    const c = { ha: 0, groan: 0, haBlind: 0 };
    for (const r of Object.values(map || {})) {
      if (!r || typeof r !== 'object') continue;   // (a room restored from before #26: the old emoji kinds don't count)
      if (r.ha) c.ha++;
      if (r.ha === 1) c.haBlind++;
      if (r.groan) c.groan++;
    }
    if (c.ha || c.groan) out[key] = c;
  }
  return out;
}
function myReactions(game, playerId) {
  const out = {};
  for (const [key, map] of Object.entries(game.reactions || {})) { const r = map && map[playerId]; if (r && typeof r === 'object' && (r.ha || r.groan)) out[key] = { ha: !!r.ha, groan: !!r.groan }; }
  return out;
}

/* ── Who wrote what, and who believed it (shared by the reel and the badges) ── */
const keyOf = (t) => String(t);
const chipsOf = (b) => (b && b.target !== 'pass' ? (b.count || 0) + (b.stolen || 0) : 0);   // stolen chips still count as belief
const writerOfKey = (game, key) => (key === 'closed' ? game.closedPlayerId : (game.openCaptions[Number(key)] || {}).playerId) || null;
const realKey = (game) => (game.closedIsCorrect ? 'closed' : keyOf(game.openCaptions.findIndex(c => c.isCorrect)));
const captionOfKey = (game, key) => (key === 'closed' ? game.closedCaption : (game.openCaptions[Number(key)] || {}).caption) || '';
// Every caption a player wrote this round (the Closed Caption included when it's theirs)
function playerKeys(game) {
  const keys = game.openCaptions.map((c, i) => (c.playerId ? keyOf(i) : null)).filter(k => k !== null);
  if (game.closedPlayerId) keys.push('closed');
  return keys;
}
// Chips other players put on a caption (the writer's own don't count)
function votesOn(game, key) {
  const w = writerOfKey(game, key);
  return game.bets.reduce((n, b) => n + (keyOf(b.target) === key && b.playerId !== w ? chipsOf(b) : 0), 0);
}
// Fakes from fewest votes to most (ties in random order), the real caption last
function reelOrder(game) {
  const fakes = shuffleArray(playerKeys(game)).map(k => ({ k, v: votesOn(game, k) })).sort((a, b) => a.v - b.v).map(x => x.k);
  const real = realKey(game);
  return real === '-1' ? fakes : [...fakes, real];
}
// The reel steps through the captions by itself (#6); the dealer can go on, go back, or skip to the round recap
function reelStep(game, how) {
  if (game.phase !== PHASES.ANSWER || !game.reel) return { error: 'Too late — the game moved on' };
  const last = game.reel.order.length + 1;
  const k = game.reel.nobody || 0;   // #24: steps 1..k are one 'Nobody bit' screen
  if (how === 'next') { if (game.reel.step >= last) return { error: 'Already at the recap' }; setReelStep(game, k && game.reel.step <= k ? k + 1 : game.reel.step + 1); }
  else if (how === 'prev') { if (game.reel.step <= 1 || (k && game.reel.step <= k)) return { error: 'Already at the first caption' }; setReelStep(game, k && game.reel.step === k + 1 ? 1 : game.reel.step - 1); }
  else if (how === 'skip') setReelStep(game, last);
  else return { error: 'That didn’t take. Try again.' };
  return { ok: true, step: game.reel.step };
}

/* ── Badges: worked out once the answer is in, never shown before.
   Only the five that tell a story: moon, three_bagger, clean_sweep, great_minds, pickpocket ── */
const normCaption = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
function nearlySame(a, b) {
  const x = normCaption(a), y = normCaption(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const wx = new Set(x.split(' ')), wy = new Set(y.split(' '));
  if (x.split(' ').length < 3 || y.split(' ').length < 3) return false;
  const both = [...wx].filter(w => wy.has(w)).length;
  return both / new Set([...wx, ...wy]).size >= 0.6;
}
// #31: word for word (or nearly) the real caption. Strict on purpose: a fresh caption almost never trips it,
// and a loose test would hint at the real answer.
function tooCloseToReal(a, real) {
  const x = normCaption(a), y = normCaption(String(real || '').replace(/\s*\(\d+\)\s*$/, ''));
  if (!x || !y) return false;
  if (x === y) return true;
  const xs = x.split(' '), ys = y.split(' ');
  if (xs.length < 4 || ys.length < 4) return false;
  const wx = new Set(xs), wy = new Set(ys), both = [...wx].filter(w => wy.has(w)).length;
  return both / new Set([...wx, ...wy]).size >= 0.8;
}
function awardBadges(game) {
  const here = new Set(game.players.map(p => p.id));
  const out = [];
  const give = (kind, ids, target, detail = {}) => {
    const playerIds = [...new Set(ids)].filter(id => here.has(id));
    if (playerIds.length) out.push({ kind, playerIds, target: target === null ? null : keyOf(target), detail });
  };
  const real = realKey(game);
  const fakes = playerKeys(game);
  const order = (game.reel && game.reel.order) || [];
  const bothBlind = (b) => b.stage === 1 && chipsOf(b) === 2;
  const betsOn = (key) => game.bets.filter(b => keyOf(b.target) === key && chipsOf(b) > 0);
  const othersOn = (key, test = () => true) => [...new Set(betsOn(key).filter(b => b.playerId !== writerOfKey(game, key) && test(b)).map(b => b.playerId))];

  // Moon: both chips blind on the real caption (Shoot the Moon if it was face-down)
  for (const b of game.bets) if (bothBlind(b) && keyOf(b.target) === real) give('moon', [b.playerId], real, { shot: real === 'closed' ? 'moon' : 'half' });

  for (const key of fakes) {
    const w = writerOfKey(game, key), votes = votesOn(game, key);
    const bagged = othersOn(key, bothBlind);
    if (bagged.length >= 3) give('three_bagger', [w], key, { by: bagged });
    const backers = othersOn(key);
    const field = game.betOrder.filter(id => id !== w);
    if (field.length >= 2 && field.every(id => backers.includes(id))) give('clean_sweep', [w], key, { votes });
  }

  // Great minds: two players wrote nearly the same caption; it pops on whichever is revealed second
  for (let i = 0; i < fakes.length; i++) for (let j = i + 1; j < fakes.length; j++) {
    const a = fakes[i], b = fakes[j];
    if (!nearlySame(captionOfKey(game, a), captionOfKey(game, b))) continue;
    const later = order.indexOf(a) > order.indexOf(b) ? a : b;
    give('great_minds', [writerOfKey(game, a), writerOfKey(game, b)], later, { targets: [a, b] });
  }

  // Pickpocket: the dealer stole a chip off the real caption
  const dealer = dealerOf(game);
  if (dealer && game.steal && game.steal.victimId && game.steal.onCorrect) give('pickpocket', [dealer.id], game.steal.target, {});

  // (The Grand Poobah is crowned by the phones from the bets; it is not a badge.)

  // #39: each badge's line, picked here so every phone pops the same one
  for (const b of out) {
    const d = b.detail || (b.detail = {});
    const k = b.kind === 'moon' ? (d.shot === 'moon' ? 'badge.moon' : 'badge.half') : b.kind === 'three_bagger' ? 'badge.three' : b.kind === 'clean_sweep' ? 'badge.sweep' : b.kind === 'great_minds' ? 'badge.minds' : b.kind === 'pickpocket' ? 'badge.pickpocket' : null;
    if (k) d.line = pickLine(game, k, { names: nameList((d.by || []).map(id => firstNameOf(game, id))) });
  }
  game.roundBadges = out;
  game.gameBadges = (game.gameBadges || []).concat(out.map(b => ({ ...b, round: game.round })));
}

/* ── The rating (chess-style, rating.js): each phone keeps its own; the server does the arithmetic once a game ──
   The 'career' message: { rating, games, total, lines } — this phone's rating and games played, its badge count,
   and the short keys of the verdict lines it has already been shown (so nobody reads the same line twice). */
const OPEN_MS = 3500;   // the opening card before the first cartoon (round 1's writing clock starts after it)
const FULL_RATING_ROUNDS = 8;   // #38: games this long (or longer) move the rating the full amount; shorter ones, in proportion
function setCareer(game, playerId, msg) {
  const p = game.players.find(x => x.id === playerId);
  if (!p) return { error: 'Player not in game' };
  msg = msg || {};
  const bad = { error: 'That didn’t take. Try again.' };
  if (msg.rating !== undefined && msg.rating !== null && !Rating.validRating(msg.rating)) return bad;
  if (msg.games !== undefined && !Rating.validGames(msg.games)) return bad;
  if (msg.total !== undefined && !Rating.validGames(msg.total)) return bad;
  let lines = null;
  if (msg.lines !== undefined) { lines = Rating.cleanSeenLines(msg.lines); if (!lines) return bad; }
  const rated = Rating.validRating(msg.rating);
  p.rating = rated ? msg.rating : null;
  p.games = rated && Rating.validGames(msg.games) ? msg.games : 0;
  if (msg.total !== undefined) p.badgeTotal = msg.total;
  if (lines) p.seenLines = lines;
  // A phone that reports a moment after the start (it was still connecting) still counts, until the first answer
  const sn = game.ratingSnap && game.ratingSnap[playerId];
  if (sn && !sn.reported && rated && game.round <= 1 && !ANSWERED.includes(game.phase)) {
    game.ratingSnap[playerId] = { ...Rating.snapshot([p])[playerId], reported: true };
  }
  return { ok: true };
}
const ratingTitle = (p) => Rating.validRating(p.rating) && (p.games || 0) >= Rating.PROVISIONAL_GAMES ? Rating.titleOf(p.rating) : null;
// The game starts: freeze the table's ratings, pick the opening card's lines, give round 1 its full clock back
function beginRated(game) {
  game.gameNo = (game.gameNo || 0) + 1;
  game.gameId = game.code + '-' + game.gameNo + '-' + Date.now().toString(36);
  const here = game.players.filter(isPresent);
  const snap = Rating.snapshot(here);
  here.forEach(p => { snap[p.id].reported = Rating.validRating(p.rating); });
  game.ratingSnap = snap;
  game.ratingResult = null;
  game.verdictsAt = null;
  try {
    const o = Rating.opening(here, snap, game.gameId);
    game.opening = { ...o, at: Date.now(), ms: OPEN_MS, gameId: game.gameId };
    if (game.timerEnd) game.timerEnd += OPEN_MS;   // the writers never lose time to the card
  } catch (e) { console.error('opening card failed', e); game.opening = null; }
}
// Game over: everyone seated at the start is rated on their final score (a player who left counts on the score they left with)
function settleRating(game) {
  if (game.ratingResult || !game.ratingSnap) return;
  try {
    const scores = {};
    for (const p of game.players) if (game.ratingSnap[p.id]) scores[p.id] = p.score;
    const fav = game.opening && game.opening.favorite ? game.opening.favorite.id : null;
    // #38: a short game is mostly luck, so it moves the rating less: the full amount from FULL_RATING_ROUNDS rounds
    const scale = Math.min(1, Math.max(1, game.round || 1) / FULL_RATING_ROUNDS);
    const r = Rating.settle(game.ratingSnap, scores, game.players, game.gameId, fav, scale);
    if (r.order.length < 2) { game.ratingResult = { gameId: game.gameId, rows: {}, order: [], none: true }; return; }
    game.ratingResult = { gameId: game.gameId, rows: r.rows, order: r.order, at: Date.now(), scale, short: scale < 1, rounds: game.round };
  } catch (e) { console.error('rating failed', e); game.ratingResult = { gameId: game.gameId, rows: {}, order: [], none: true }; }
}
// The dealer/host moves on from the verdicts to the Grand Poobah
function closeVerdicts(game) {
  if (game.phase !== PHASES.SCORES || !isGameOver(game)) return { error: 'Not yet' };
  if (!game.verdictsAt) game.verdictsAt = Date.now();
  return { ok: true };
}

function resetForNewGame(game) {
  setPhase(game, PHASES.LOBBY);
  game.deckOut = false;
  game.finale = null;
  game.flags = [];
  game.framePicks = {};
  game.roundFrames = [];
  game.frameHold = 0;
  game.frameBusy = 0;
  game.inducted = [];
  game.realCredit = null;
  // (lineDeck and nightFrames keep going: no line repeats tonight, and the first frame of the night was the big one)
  game.lines = {};
  game.calls = {};
  game.callResults = [];
  game.tvc = { table: 0, cartoonist: 0, draws: 0 };
  game.tvcRound = null;
  game.odds = null;
  game.slips = [];
  game.record = null;
  game.flipDue = null;
  game.flipHold = false;
  // The celebration belongs to the old game (n keeps counting, so phones still spot the next one)
  game.inductionCount = game.lastInduction ? game.lastInduction.n : (game.inductionCount || 0);
  game.lastInduction = null;
  game.closePlan = [];
  game.round = 0;
  game.dealerIndex = -1;
  game.dealCount = {};   // [settings]
  game.history = [];
  game.previousRank = {};
  game.players.forEach(p => { p.score = 0; });
  game.cartoon = null;
  game.submissions = [];
  game.bets = [];
  game.betOrder = [];
  game.steal = null;
  game.mulliganVotes = [];
  game.mulliganEvent = null;
  game.roundScores = {};
  game.roundScoreDetails = {};
  game.timerEnd = null;
  game.timerToken = (game.timerToken || 0) + 1;
  game.reactions = {};
  game.reel = null;
  game.roundBadges = [];
  game.gameBadges = [];
  game.crowns = {};
  game.stealShows = 0;   // (nightSteals keeps counting: the full show is for the night's first steal)
  game.blind = {};
  game.blindEnd = null;
  game.dropAt = null;
  game.flipAt = null;
  game.lateFrom = null;
  game.finalLaps = null;
  game.fixedLaps = null;
  game.targetHit = null;
  game.stepAt = null;
  game.ratingSnap = null;
  game.opening = null;
  game.ratingResult = null;
  game.verdictsAt = null;
}

const AFTER_WRITING = [PHASES.READING, PHASES.FIRST_BETS, PHASES.REVEAL, PHASES.SECOND_BETS, PHASES.STEAL, PHASES.ANSWER, PHASES.FRAMING, PHASES.SCORES];
const BETTING_ON = [PHASES.FIRST_BETS, PHASES.REVEAL, PHASES.SECOND_BETS, PHASES.STEAL, PHASES.ANSWER, PHASES.FRAMING, PHASES.SCORES];
const REVEALED = [PHASES.REVEAL, PHASES.SECOND_BETS, PHASES.ANSWER, PHASES.FRAMING, PHASES.SCORES];   // (not STEAL: it comes before the flip)
const ANSWERED = [PHASES.ANSWER, PHASES.FRAMING, PHASES.SCORES];

const TAKEOVER_SECS = 30;
const GAZETTE_SIZE = 40;

// Voice chat: who's in the call and who's muted ({ playerId: { on, muted } }); the audio itself goes phone to phone
function setVoice(game, playerId, on, muted) {
  if (!game.voice) game.voice = {};
  if (on && game.players.some(p => p.id === playerId)) game.voice[playerId] = { on: true, muted: !!muted };
  else delete game.voice[playerId];
}
const clearVoice = (game, playerId) => { if (game && game.voice) delete game.voice[playerId]; };

// What each phone is allowed to see
function getPlayerView(game, playerId) {
  const dealer = dealerOf(game);
  const isDealer = !!dealer && dealer.id === playerId;
  const dealerAwaySecs = dealer && !dealer.connected && dealer.disconnectedAt ? Math.floor((Date.now() - dealer.disconnectedAt) / 1000) : 0;
  const s = game.settings;
  const published = deckOf(game).authorCounts();   // lowercase name -> captions in the Hall of Fame deck

  const base = {
    code: game.code,
    phase: game.phase,
    locked: !!game.locked,           // #51: the host locked the room (no new names)
    notice: game.notice || null,     // #26: a table announcement { text, at }
    // #30: someone at the door says they're a player whose seat is on another phone: the host decides
    seatClaim: game.seatClaim && game.hostId === playerId ? { ...game.seatClaim } : null,
    players: game.players.map(p => ({ id: p.id, name: p.name, score: p.score, connected: p.connected, watched: !!p.watched, rating: Rating.validRating(p.rating) ? p.rating : null, provisional: !Rating.validRating(p.rating) || (p.games || 0) < Rating.PROVISIONAL_GAMES, title: ratingTitle(p), published: published.get(p.name.toLowerCase()) || 0 })),
    round: game.round,
    totalRounds: lapsOf(game) ? totalRounds(game) : null,
    // #11 The Late Edition: when it began, whether this round pays double, and (first to N) who got there
    late: game.lateFrom ? { from: game.lateFrom, on: isLate(game), hit: game.targetHit ? { ...game.targetHit, ids: [...game.targetHit.ids] } : null, ms: LATE_MS } : null,
    flipAt: game.flipAt || null,     // when the face-down card turns over (server time)
    dropAt: game.dropAt || null,     // when the blind chips dropped onto the table (server time)
    settings: { ...s },
    deckSize: CARTOONS.length,
    hostId: game.hostId,
    isHost: game.hostId === playerId,
    dealerId: dealer ? dealer.id : null,
    dealerName: dealer ? dealer.name : null,
    dealerConnected: dealer ? dealer.connected : false,
    dealerAwaySecs,
    canTakeover: !isDealer && dealerAwaySecs >= TAKEOVER_SECS,
    takeoverSecs: TAKEOVER_SECS,
    isDealer,
    playerId,
    timerDuration: game.timerDuration,
    timerEnd: game.timerEnd,
    serverNow: Date.now(),
    phaseAt: game.phaseAt || null,   // server time this phase began (phones sync the big moments to it)
    stepAt: game.stepAt || null,     // server time of the latest reveal-reel step
    stealShows: game.stealShows || 0,
    voice: Object.fromEntries(Object.entries(game.voice || {}).filter(([pid]) => game.players.some(p => p.id === pid && p.connected)).map(([pid, v]) => [pid, { on: true, muted: !!v.muted }])),   // who's in the voice call
    inductNeed: inductNeed(game),
    lastInduction: game.lastInduction ? { ...game.lastInduction, flaggers: [...game.lastInduction.flaggers], list: (game.lastInduction.list || []).map(x => ({ ...x, flaggers: [...x.flaggers] })) } : null,   // the latest framing (#5: the moment it's framed, on the reveal)
    hofDeck: deckCartoons(game),
    hofTotal: deckOf(game).count(),
  };
  // #3: in Expert games the Gallery holds the real answers, so every cartoon still to be dealt is kept out of sight
  // (and the one on the table until its answer is out). Phones hide these from the Gallery they carry, too.
  const hide = s.expert ? new Set(expertCartoonIds(game).filter(id => !game.usedCartoonIds.includes(id))) : null;
  if (hide && game.cartoon && !ANSWERED.includes(game.phase)) hide.add(game.cartoon.id);
  base.galleryHidden = hide ? [...hide] : [];
  // The Gazette: the newest Hall of Fame captions, between rounds only
  if (game.phase === PHASES.LOBBY || game.phase === PHASES.SCORES) {
    base.gazette = hide ? deckOf(game).recent(GAZETTE_SIZE * 4).filter(e => !hide.has(e.cartoonId)).slice(0, GAZETTE_SIZE) : deckOf(game).recent(GAZETTE_SIZE);
  }
  if (game.phase === PHASES.LOBBY) {
    // #30: the host's phone went quiet in the lobby: after 20 s, the next player here may take over
    const host = game.players.find(p => p.id === game.hostId);
    const hostAwayMs = host && !host.connected && host.disconnectedAt ? Date.now() - host.disconnectedAt : 0;
    if (hostAwayMs >= 20000) {
      const next = game.players.find(p => p.connected && p.id !== game.hostId);
      base.hostAway = { name: host.name, secs: Math.floor(hostAwayMs / 1000) };
      base.canTakeHost = !!next && next.id === playerId;
    }
    const d = deckStatus(game);   // only the live deck counts (retired ids a phone has seen are ignored)
    base.freshCount = d.fresh; base.poolCount = d.pool;
    base.deck = { ...d, line: deckLine(d) };
    return base;
  }

  if (game.cartoon) base.cartoon = game.cartoon;
  if (game.opening && game.round === 1 && game.phase === PHASES.WRITING) base.opening = JSON.parse(JSON.stringify(game.opening));
  const mine = game.submissions.find(x => x.playerId === playerId);

  if (game.phase === PHASES.WRITING) {
    base.submittedPlayerIds = game.submissions.map(x => x.playerId);
    base.hasSubmitted = !!mine;
    base.myCaption = mine ? mine.caption : null;
    base.mulliganVotes = [...game.mulliganVotes];
    base.mulliganNeeded = mulliganThreshold(game);
    base.timeAdds = game.timeAdds || 0;
    base.myMulligan = game.mulliganVotes.includes(playerId);
  }
  base.mulliganEvent = game.mulliganEvent;

  if (AFTER_WRITING.includes(game.phase)) {
    base.openCaptions = game.openCaptions.map(c => c.caption);
    base.myOpenIndex = game.openCaptions.findIndex(c => c.playerId === playerId);
    base.iWrote = !!mine;
  }

  if (BETTING_ON.includes(game.phase)) {
    base.bets = game.bets.map(b => ({ ...b }));   // (blind bets only reach here once they've dropped)
    base.betOrder = [...game.betOrder];
    const myBlind = game.blind && game.blind[playerId];
    base.myFirstBet = game.firstBets[playerId] || (myBlind ? { target: myBlind.target, count: myBlind.count } : null);
    base.mySecondBet = game.secondBets[playerId] || null;
    base.currentBetterId = currentBetterId(game);
    base.currentBetterName = base.currentBetterId ? nameOfPlayer(game, base.currentBetterId) : null;
    base.pendingBetters = pendingBetters(game);
    base.allBetsIn = base.pendingBetters.length === 0;
    base.eligibleSecondBetters = eligibleSecondBetters(game);
    if (game.phase === PHASES.FIRST_BETS) {
      // #7: who has locked in (never where) until every chip drops at once
      base.blindIn = game.dropAt ? [...game.betOrder] : game.betOrder.filter(pid => hasBlind(game, pid));
      base.blindEnd = game.blindEnd || null;
      base.isMyTurn = !game.dropAt && game.betOrder.includes(playerId) && !hasBlind(game, playerId);
    } else base.isMyTurn = base.currentBetterId === playerId;
    // #1: whether the stolen chip was on the real caption stays on the server until the answer
    if (game.steal) { const { onCorrect, ...st } = game.steal; base.steal = ANSWERED.includes(game.phase) ? { ...game.steal } : st; }
    else base.steal = null;
  }

  // #26 Ha / Groan: before the answer only your own taps; from the answer on, the counts per caption (never who)
  if (REACT_PHASES.includes(game.phase) || game.phase === PHASES.SCORES) {
    base.myReactions = myReactions(game, playerId);
    if (ANSWERED.includes(game.phase)) base.reactionCounts = reactionCounts(game);
  }
  if (ANSWERED.includes(game.phase)) {
    base.reel = game.reel ? { order: [...game.reel.order], step: game.reel.step, nobody: game.reel.nobody || 0, paused: !!game.reel.paused, dueAt: game.reel.dueAt || null } : null;
    base.roundBadges = (game.roundBadges || []).map(b => ({ ...b, detail: { ...(b.detail || {}) } }));
  }
  // #6: the flip moves on by itself at flipDue (null: the dealer is holding it)
  if (game.phase === PHASES.REVEAL) { base.flipDue = game.flipDue || null; base.flipHold = !!game.flipHold; }
  // #39: this round's lines (the server picked them; a line about your own face-down caption only reaches you)
  { const L = game.lines || {}, out = {};
    for (const [k, v] of Object.entries(L)) {
      if ((k === 'yoursRead' || k === 'yoursFlip') && game.closedPlayerId !== playerId) continue;
      if (k === 'betDealer' && !isDealer) continue;
      if ((k === 'reel' || k.startsWith('end') || k === 'noted' || k === 'reelGroup' || k === 'reelHold') && !ANSWERED.includes(game.phase)) continue;
      out[k] = v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v;
    }
    base.lines = out; }
  // R11: your own call (secret), until the reveal says how it went
  if (game.phase === PHASES.WRITING || game.phase === PHASES.READING) base.myCall = (game.calls || {})[playerId] || null;
  if (ANSWERED.includes(game.phase)) base.callResults = (game.callResults || []).map(c => ({ ...c }));

  if (REVEALED.includes(game.phase)) {
    base.closedCaption = game.closedCaption;
    base.iWroteClosed = game.closedPlayerId === playerId;
  }

  if (ANSWERED.includes(game.phase)) {
    base.correctCaption = game.correctCaption;
    base.realCredit = game.realCredit ? { ...game.realCredit } : null;
    base.closedIsCorrect = game.closedIsCorrect;
    base.closedPlayerName = game.closedPlayerId ? nameOfPlayer(game, game.closedPlayerId) : null;
    base.roundScores = game.roundScores;
    base.roundScoreDetails = game.roundScoreDetails || {};
    base.dealerBonusAwarded = !!game.dealerBonusAwarded;
    base.openCaptionDetails = game.openCaptions.map(c => ({ caption: c.caption, isCorrect: c.isCorrect, playerId: c.playerId, playerName: c.playerId ? nameOfPlayer(game, c.playerId) : null }));
    base.closedPlayerId = game.closedPlayerId;
    base.flags = game.flags.filter(f => f.round === game.round).map(f => ({ ...f }));
    base.allFlags = game.flags.map(f => ({ ...f }));
    base.hallOfFame = hallOfFame(game);
  }

  // #5 Frame It on the reveal: what you've framed, how many frames each caption has (never who), what's been framed
  if (game.phase === PHASES.ANSWER) {
    const picks = game.framePicks || {};
    base.framing = {
      mine: Object.keys(picks).filter(k => (picks[k] || []).includes(playerId)),
      counts: Object.fromEntries(Object.entries(picks).map(([k, l]) => [k, (l || []).length]).filter(([, n]) => n > 0)),
      framed: (game.roundFrames || []).map(f => String(f.target)),
      revealed: revealedKeys(game),
      hold: game.frameHold || 0,
    };
  }
  // R10 / R8: the blind-laugh score and this round's odds line (from the answer on)
  if (ANSWERED.includes(game.phase)) {
    base.tvc = { ...(game.tvc || { table: 0, cartoonist: 0, draws: 0 }) };
    base.tvcRound = game.tvcRound ? { ...game.tvcRound } : null;
    base.odds = game.odds && game.odds.round === game.round ? { ...game.odds } : null;
  }

  if (game.phase === PHASES.SCORES) {
    base.slips = (game.slips || []).map(x => ({ ...x }));   // R1: this round's rejection slips (each writer's phone shows its own)
    base.record = game.record ? JSON.parse(JSON.stringify(game.record)) : null;   // the game so far, for the end of the night
    base.gameOver = isGameOver(game);
    base.previousRank = game.previousRank || {};
    base.history = game.history || [];
    base.scoresAt = game.scoresAt || null;
    base.gameBadges = (game.gameBadges || []).map(b => ({ ...b }));
    if (!base.gameOver) {
      const nd = game.players[nextDealerIndex(game, game.dealerIndex)];
      base.nextDealerName = nd ? nd.name : '';
      base.nextDealerId = nd ? nd.id : null;
      base.isNextDealer = !!nd && nd.id === playerId;
      // #11: the next deal opens The Late Edition (the scoreboard says so)
      const laps = lapsOf(game);
      base.nextLate = game.lateFrom === game.round + 1 || (!game.lateFrom && !s.targetScore && laps >= 2 && !!nd && ((game.dealCount || {})[nd.id] || 0) + 1 >= laps);
    }
    if (base.gameOver) {
      base.standing = standing(game);   // the winner(s), with the tie-break that decided it
      base.framedTonight = finaleEntries(game).length;
      settleRating(game);   // (a room restored from before the rating: worked out now, once)
      if (game.ratingResult && !game.ratingResult.none) base.rating = JSON.parse(JSON.stringify(game.ratingResult));
      base.verdictsAt = game.verdictsAt || null;
      const f = game.finale;
      if (f) base.finale = {
        at: f.at, entries: f.entries.map(e => ({ ...e, flaggers: [...e.flaggers] })),
        voters: [...f.voters], decided: Object.keys(f.votes), myVote: f.votes[playerId] || null,
        canVote: finaleCanVote(f, playerId), winner: f.winner, counts: f.counts ? { ...f.counts } : null,
        tie: f.tie, showAt: f.showAt, best: f.best || null,
      };
    }
  }
  return base;
}

// The dealer (or host) gives the table 30 more seconds — up to three times a cartoon
function addTime(game) {
  if (game.phase !== PHASES.WRITING) return { error: 'Only while writing' };
  if (!game.timerEnd) return { error: 'No timer this game' };   // [settings] no timer: nothing to add to
  if ((game.timeAdds || 0) >= 3) return { error: 'That’s all the extra time this round' };
  game.timeAdds = (game.timeAdds || 0) + 1;
  game.timerEnd = Math.max(game.timerEnd, Date.now()) + 30000;
  game.timerToken = (game.timerToken || 0) + 1;
  return { ok: true };
}

/* #6: a restart (every update restarts the server) used to wipe every room. The host's phone keeps a sealed copy
   of the room (encrypted and signed by the server, unreadable on the phone) and hands it back after a restart. */
const SEAL_KEY = crypto.createHash('sha256').update('seal|' + (process.env.RESTORE_KEY || process.env.GALLERY_KEY || 'closed-caption/restore/v1')).digest();
const SKIP = new Set(['deck', '_trusted', '_advAt', '_sealTag', '_sealAt', 'voice']);
function sealGame(game) {
  const plain = {};
  for (const k of Object.keys(game)) if (!SKIP.has(k)) plain[k] = game[k];
  plain.players = (game.players || []).map(p => { const { seenLines, ...rest } = p; return rest; });   // the phones send their seen lines again when they rejoin (keeps the copy small)
  plain.sealedAt = Date.now();
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', SEAL_KEY, iv);
  const body = Buffer.concat([c.update(require('zlib').deflateSync(Buffer.from(JSON.stringify(plain)))), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString('base64url');
}
function unsealGame(blob) {
  try {
    const b = Buffer.from(String(blob || ''), 'base64url');
    if (b.length < 30 || b.length > 400000) return null;
    const d = crypto.createDecipheriv('aes-256-gcm', SEAL_KEY, b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    const g = JSON.parse(require('zlib').inflateSync(Buffer.concat([d.update(b.subarray(28)), d.final()])).toString());
    if (!g || !g.code || !Array.isArray(g.players) || Date.now() - g.sealedAt > 6 * 3600 * 1000) return null;   // a copy older than 6 h is a different night
    g.deck = newRoomDeck(); g.voice = {};
    if (!g.blind || typeof g.blind !== 'object') g.blind = {};   // (a room sealed by an older server)
    g.seatClaim = null;   // the phone that was waiting at the door has to ask again
    if (g.phase === PHASES.FIRST_BETS && !g.dropAt && g.blindEnd) g.blindEnd = Math.max(g.blindEnd, Date.now() + 20000);   // bettors get a fair 20 s back
    g.usedCartoonIds = (g.usedCartoonIds || []).filter(id => !isRetiredId(id));
    if (g.cartoon && isRetiredId(g.cartoon.id)) resetForNewGame(g);   // a room from before the retirement: back to the lobby
    // #5: a room sealed on the old Frame It screen comes back on the recap (Frame It lives on the reveal now)
    if (g.phase === 'framing') { g.phase = PHASES.ANSWER; if (g.reel) { g.reel.step = (g.reel.order || []).length + 1; g.reel.dueAt = null; } }
    // #6: the reel and the flip pick up where they were, with a fair few seconds
    if (g.phase === PHASES.ANSWER && g.reel && g.reel.dueAt) g.reel.dueAt = Math.max(g.reel.dueAt, Date.now() + 3000);
    if (g.phase === PHASES.REVEAL && g.flipDue) g.flipDue = Math.max(g.flipDue, Date.now() + 3000);
    if (!g.lineDeck || typeof g.lineDeck !== 'object') g.lineDeck = {};
    if (!g.lines || typeof g.lines !== 'object') g.lines = {};
    g.players.forEach(p => { p.connected = false; p.disconnectedAt = Date.now(); });
    g.timerToken = (g.timerToken || 0) + 1;
    if (g.timerEnd) g.timerEnd = Math.max(g.timerEnd, Date.now() + 30000);   // writers get a fair 30 s back
    return g;
  } catch (e) { return null; }
}

module.exports = {
  sealGame, unsealGame, tooCloseToReal, pickByLevel, tableKind, setPosition, levelOf, canDeal, deckStatus, startCheck, endForDeck, isRetiredId, FIRST_LIVE_ID,
  PHASES, CARTOONS, DEFAULT_SETTINGS, MAX_PLAYERS, TAKEOVER_SECS,
  cleanTimer, DEFAULT_TIMER, totalRounds,   // [settings]
  addTime, undoBet, freshest, createGame, updateSettings, addPlayer, kickPlayer, moveSeat, setSeen, pickFrame, hallOfFame, planBlock, ensurePlan,
  callShot, setHold, reelDue, revealedKeys, pickLine, noteLastWriter, reactionCounts, FLIP_AUTO_MS, LINES,
  inductNeed, deckCartoons, dealCartoon, store, syncGallery, setPlayerSeen, seenCounts,
  startRound, submitCaption, voteMulligan, finishWriting, allCaptionsIn,
  moveToFirstBets, placeBet, skipCurrentBetter, dropBlind, afterBlinds, moveFromReveal, moveFromSecondBets, eligibleSecondBetters,
  standing, fooledTally, isLate, lapsOf, BLIND_MS, ALL_IN_BEAT_MS, DROP_HOLD_MS, STEAL_FULL_MS, STEAL_SHORT_MS, LATE_MS,
  openFinale, voteFinale, resolveFinale, finaleAllIn,
  setVoice, clearVoice,
  stealChip, revealAnswer, moveToScoreboard, isGameOver, resetForNewGame, isPresent,
  REACTION_KINDS, react, reelStep, reelOrder, votesOn, awardBadges, setCareer, closeVerdicts, OPEN_MS,
  currentBetterId, pendingBetters, nextDealerIndex, getPlayerView, generateRoomCode,
};
