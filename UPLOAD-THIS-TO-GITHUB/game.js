// game.js — Core game logic for Closed Caption
//
// How a round works (the Oct 29 2026 overhaul: back to a simple game; only the dealer moves it on):
//   1. WRITING      Everyone — the dealer too — writes a fake caption for the same cartoon. A skip vote (half the
//                   table) swaps the cartoon. The clock is the lobby's; no clock: when everyone's in.
//   2. READING      The app picks the face-down caption (the Closed Caption: usually a player's, the real one about
//                   one round in seven). The dealer reads the captions aloud and taps Next.
//   3. FIRST_BETS   Blind bets, everyone at once and in secret, the dealer too: 1 chip or 2 (Double Down). When the
//                   last one is in (or the clock runs out), every chip drops onto the table together (dropAt).
//   4. STEAL        The dealer must take one other player's chip off the table (no pass). Then the steal show.
//   5. REVEAL       The dealer taps to flip the face-down caption.
//   6. SECOND_BETS  Anyone holding a chip places it, everyone at once; the chips drop together; the dealer taps on.
//   7. ANSWER       The reveal, one caption at a time at the dealer's pace: who wrote it, who fell for it, the real
//                   one last. Bravo! (from the reading on): a majority of the other players frames a revealed fake.
//   8. SCORES       The scoreboard; the dealer taps Next round and the deal moves on. Game over: the winner and final
//                   scores, everyone's rating and line, then tonight's frames and the Caption of the Night vote.

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
  { id: 167, adult: true, level: "easy", title: "The Upgrade", image: "card_167_r2.jpg", correct: "He used his miles." },
  { id: 168, level: "hard", title: "Sandcastle", image: "card_168_r2.jpg", correct: "Lovely bones. The tide's a concern." },
  { id: 169, spicy: true, level: "medium", title: "The Cake", image: "card_169.jpg", correct: "We got the big one. Nobody knew which one you were." },
  { id: 171, level: "easy", title: "Bath Time", image: "card_171_r2.jpg", correct: "He had a long day at the park." },
  { id: 172, adult: true, level: "hard", title: "Tax Season", image: "card_172.jpg", correct: "He says we can deduct the vet." },
  { id: 174, level: "medium", title: "Night Shift", image: "card_174.jpg", correct: "Anything good in sports?" },
  { id: 176, adult: true, level: "hard", title: "The Commute", image: "card_176_r2.jpg", correct: "Egg salad. The whole car knew." },
  { id: 177, level: "medium", title: "The Audition", image: "card_177.jpg", correct: "Lovely. Now do it again, but slower." },
  { id: 178, spicy: true, level: "easy", title: "Garage Sale", image: "card_178.jpg", correct: "It was only worn once." },
  { id: 179, adult: true, level: "medium", title: "The Escape", image: "card_179.jpg", correct: "Don't make eye contact. He'll want the bread." },
  { id: 180, level: "easy", title: "Lifeguard", image: "card_180_r2.jpg", correct: "He takes every shift seriously." },
  { id: 181, spicy: true, level: "hard", title: "Retirement", image: "card_181.jpg", correct: "They said I could take anything I wanted." },
  { id: 182, adult: true, level: "medium", title: "Assembly Required", image: "card_182.jpg", correct: "It's not the same if you didn't suffer." },
  { id: 183, level: "medium", title: "Hide and Seek", image: "card_183_r2.jpg", correct: "The dog is not playing." },
  { id: 184, spicy: true, level: "medium", title: "The Hangover", image: "card_184.jpg", correct: "Whatever you do, don't open the minibar." },
  { id: 185, adult: true, level: "hard", title: "Dress Code", image: "card_185_r2.jpg", correct: "He's on the list." },
  { id: 186, level: "medium", title: "Story Time", image: "card_186_r2.jpg", correct: "They never interrupt." },
  { id: 187, spicy: true, level: "medium", title: "The Proposal", image: "card_187.jpg", correct: "Let her finish the frame." },
  { id: 188, adult: true, level: "easy", title: "Wrong Number", image: "card_188.jpg", correct: "He's been on hold with his bank for an hour." },
  { id: 189, level: "hard", title: "Graduation", image: "card_189_r2.jpg", correct: "He took the scenic route." },
  { id: 190, spicy: true, level: "easy", title: "The Ex Files", image: "card_190_r2.jpg", correct: "She kept the other one." },
  { id: 191, adult: true, level: "medium", title: "Saturday", image: "card_191_r2.jpg", correct: "I said one-click, not one click a minute." },
  { id: 192, level: "medium", title: "The Pitch", image: "card_192_r2.jpg", correct: "And this is where we stop swimming in circles." },
  { id: 193, spicy: true, level: "medium", title: "Couples Massage", image: "card_193.jpg", correct: "He's not licensed, but he's very affordable." },
  { id: 194, adult: true, level: "hard", title: "Overtime", image: "card_194.jpg", correct: "Nobody tells you about the follow-up." },
  { id: 195, level: "easy", title: "Lemonade", image: "card_195_r2.jpg", correct: "It's two dollars, or one hump." },
  { id: 196, spicy: true, level: "hard", title: "The Toast", image: "card_196_r2.jpg", correct: "He's only on his second anecdote." },
  { id: 197, level: "easy", title: "Photo Finish", image: "card_197.jpg", correct: "Too close to call. Also, too asleep." },
  { id: 199, spicy: true, level: "medium", title: "Separate Beds", image: "card_199.jpg", correct: "It's load-bearing." },
  { id: 200, level: "hard", title: "The Keeper", image: "card_200_r2.jpg", correct: "Nobody's hit it yet." },
  { id: 202, spicy: true, level: "easy", title: "Last Call", image: "card_202.jpg", correct: "I'll have what he's not saying." },
  { id: 204, adult: true, level: "medium", title: "The Board", image: "card_204_r2.jpg", correct: "Let's keep this short. I have a nap at two." },
  { id: 205, spicy: true, level: "medium", title: "Test Drive", image: "card_205_r2.jpg", correct: "He's still deciding." },
  { id: 206, level: "easy", title: "The Toll", image: "card_206_r2.jpg", correct: "Exact change only." },
  { id: 207, adult: true, level: "medium", title: "Going Up", image: "card_207.jpg", correct: "He's new." },
  { id: 208, spicy: true, level: "hard", title: "The Will", image: "card_208.jpg", correct: "And to Mr. Whiskers, everything else." },
  { id: 209, level: "medium", title: "Ballooning", image: "card_209_r2.jpg", correct: "He doesn't have a ticket either." },
  { id: 212, level: "hard", title: "Quiet, Please", image: "card_212.jpg", correct: "I don't make the rules, sir." },
  { id: 213, adult: true, level: "medium", title: "Touch-Up", image: "card_213.jpg", correct: "The forecast said partly cloudy." },
  { id: 214, spicy: true, level: "easy", title: "Midnight Snack", image: "card_214.jpg", correct: "Since the cheesecake incident, we take no chances." },
  { id: 215, level: "medium", title: "The Summit", image: "card_215.jpg", correct: "Mustard's extra." },
  { id: 216, adult: true, level: "hard", title: "The Collection", image: "card_216_r2.jpg", correct: "It's the first piece in here that's ever been useful." },
  { id: 217, level: "easy", title: "The Walk", image: "card_217_r2.jpg", correct: "He needed more exercise." },
  { id: 218, adult: true, level: "medium", title: "Cubicles", image: "card_218_r2.jpg", correct: "Don't mention the glue factory. He's very sensitive." },
  { id: 219, spicy: true, level: "medium", title: "Dawn", image: "card_219.jpg", correct: "You said you were working late. You don't work." },
  { id: 220, level: "hard", title: "Table for One", image: "card_220_r2.jpg", correct: "She said she'd be here by eight." },
  { id: 221, adult: true, level: "medium", title: "Yoga", image: "card_221_r2.jpg", correct: "She's not flexible, but she's very centered." },
  { id: 222, spicy: true, level: "easy", title: "The Exit", image: "card_222.jpg", correct: "Did you at least say goodbye to the Hendersons?" },
  { id: 223, level: "easy", title: "Special Delivery", image: "card_223.jpg", correct: "I ordered it on my fortieth birthday." },
  { id: 224, adult: true, level: "hard", title: "The Witness", image: "card_224.jpg", correct: "Let the record show the witness said 'Pretty bird.'" },
  { id: 226, level: "easy", title: "Competition", image: "card_226_r2.jpg", correct: "He's using live bait." },
  { id: 227, adult: true, level: "medium", title: "Open House", image: "card_227.jpg", correct: "The previous owners couldn't get him out either." },
  { id: 228, spicy: true, level: "hard", title: "Confession", image: "card_228.jpg", correct: "He's been saving up since Lent." },
  { id: 229, level: "medium", title: "Parking", image: "card_229_r2.jpg", correct: "They come by once every forty years." },
  { id: 230, adult: true, level: "medium", title: "Presentation", image: "card_230_r2.jpg", correct: "The chef recommends you savor it." },
  { id: 231, spicy: true, level: "medium", title: "Breakfast", image: "card_231.jpg", correct: "He's been very good lately." },
  { id: 232, level: "easy", title: "Picnic", image: "card_232_r2.jpg", correct: "Same as every Fourth of July." },
  { id: 233, adult: true, level: "medium", title: "Take a Number", image: "card_233_r2.jpg", correct: "My powers don't include patience." },
  { id: 235, adult: true, level: "hard", title: "Retirement Plan", image: "card_235.jpg", correct: "We said we'd wait till they came back." },
  { id: 236, level: "medium", title: "Summer", image: "card_236_r2.jpg", correct: "Global warming has been great for business." },
  { id: 239, spicy: true, level: "medium", title: "The Tasting", image: "card_239.jpg", correct: "He's a big-picture guy." },
  { id: 240, level: "hard", title: "Kite", image: "card_240.jpg", correct: "It's a family tradition." },
  { id: 243, level: "medium", title: "Night School", image: "card_243.jpg", correct: "Eyes up here, please." },
  { id: 244, adult: true, level: "hard", title: "The Big One", image: "card_244.jpg", correct: "Smile. You won't believe what's behind you." },
  { id: 245, spicy: true, level: "hard", title: "Escape Room", image: "card_245.jpg", correct: "Ten more minutes, then we'll try the door." },
  { id: 246, level: "easy", title: "Bird Watching", image: "card_246_r2.jpg", correct: "He's been out there all morning. I think he's lost." },
  { id: 247, adult: true, level: "medium", title: "Anniversary", image: "card_247.jpg", correct: "It was yesterday." },
  { id: 249, spicy: true, level: "medium", title: "Hot Tub", image: "card_249.jpg", correct: "Enjoy it. Dinner's at eight." },
  { id: 250, adult: true, level: "easy", title: "Office Party", image: "card_250_r2.jpg", correct: "Someone stop him before he does the other end." },
  { id: 251, level: "hard", title: "Going Up", image: "card_251.jpg", correct: "They finally automated the corporate ladder." },
  { id: 252, adult: true, level: "medium", title: "Delivery", image: "card_252_r2.jpg", correct: "It's cold. You must have walked." },
  { id: 253, spicy: true, level: "easy", title: "The Visit", image: "card_253_r2.jpg", correct: "Mother, I'll call you when I land." },
  { id: 254, level: "medium", title: "Right of Way", image: "card_254_r2.jpg", correct: "After you." },
  { id: 255, adult: true, level: "hard", title: "Your Move", image: "card_255.jpg", correct: "Your move." },
  { id: 256, spicy: true, level: "medium", title: "The Prize", image: "card_256.jpg", correct: "They say you start to look alike." },
  { id: 257, level: "easy", title: "Just a Trim", image: "card_257_r2.jpg", correct: "Just take a little off the top. And the sides. Carefully." },
  { id: 258, adult: true, level: "medium", title: "Parallel Parking", image: "card_258_r2.jpg", correct: "I'll only be a minute." },
  { id: 259, spicy: true, level: "medium", title: "Last Call", image: "card_259.jpg", correct: "It's on the house. Don't make it into anything." },
  { id: 260, level: "hard", title: "Insomnia", image: "card_260_r2.jpg", correct: "You're number four hundred and twelve. Sleep tight." },
  { id: 261, adult: true, level: "medium", title: "Cash Machine", image: "card_261.jpg", correct: "Fifties, if you have them. Take your time." },
  { id: 262, adult: true, level: "easy", title: "All You Can Eat", image: "card_262_r2.jpg", correct: "It says all you can eat. It doesn't say where." },
  { id: 263, level: "medium", title: "Life Drawing", image: "card_263_r2.jpg", correct: "Same pose as yesterday, please." },
  { id: 266, level: "hard", title: "Mail", image: "card_266_r2.jpg", correct: "Probably just bills." },
  { id: 268, spicy: true, level: "medium", title: "The Heist", image: "card_268.jpg", correct: "Look, we both know who really lives here." },
  { id: 269, level: "medium", title: "The Orchestra", image: "card_269.jpg", correct: "Budget cuts." },
  { id: 270, level: "easy", title: "Sighting", image: "card_270_r2.jpg", correct: "No one's going to believe this." },
  { id: 271, adult: true, level: "easy", title: "Bachelor Cooking", image: "card_271_r2.jpg", correct: "Medium-rare, light starch." },
  { id: 272, level: "hard", title: "Shadow", image: "card_272.jpg", correct: "He's never really been on board with my plans." },
  { id: 273, adult: true, level: "medium", title: "Door to Door", image: "card_273_r2.jpg", correct: "Think of it as a starter home." },
  { id: 275, level: "medium", title: "Running Late", image: "card_275_r2.jpg", correct: "Go on without me." },
  { id: 276, adult: true, level: "hard", title: "The Reading", image: "card_276_r2.jpg", correct: "I see a woman looking into a crystal ball." },
  { id: 277, level: "medium", title: "On Duty", image: "card_277_r2.jpg", correct: "Nobody's drowned since I started. Mostly out of respect." },
  { id: 278, adult: true, level: "medium", title: "The Jury", image: "card_278.jpg", correct: "Ladies and gentlemen of the jury, please. I'm talking." },
  { id: 279, adult: true, level: "hard", title: "Race Day", image: "card_279.jpg", correct: "The rent's very reasonable." },
  { id: 280, level: "medium", title: "Clean Beach", image: "card_280.jpg", correct: "Tell the tide it can come in now." },
  { id: 281, adult: true, level: "easy", title: "Pulled Over", image: "card_281.jpg", correct: "Do you know how fast you were going? Neither do I." },
  { id: 282, adult: true, level: "medium", title: "The Trick", image: "card_282_r2.jpg", correct: "It's chapter four. Can you go slower?" },
  { id: 284, adult: true, level: "easy", title: "Body Wrap", image: "card_284_r2.jpg", correct: "Just a touch-up. The full treatment takes three thousand years." },
  { id: 285, level: "medium", title: "Expecting", image: "card_285_r2.jpg", correct: "It says not to sit on them too long." },
  { id: 286, adult: true, level: "hard", title: "Power Plant", image: "card_286.jpg", correct: "Shareholders don't need to know." },
  { id: 287, spicy: true, level: "medium", title: "Blood Drive", image: "card_287_r2.jpg", correct: "I'm here to make a withdrawal." },
  { id: 288, level: "easy", title: "Rodeo", image: "card_288_r2.jpg", correct: "Eight seconds. A new record." },
  { id: 289, adult: true, level: "easy", title: "Dinner Party", image: "card_289_r2.jpg", correct: "His mother never let him have seconds." },
  { id: 290, adult: true, level: "medium", title: "The Verdict", image: "card_290_r2.jpg", correct: "Too much salt. Throw him to the lions." },
  { id: 291, level: "medium", title: "The Commute", image: "card_291_r2.jpg", correct: "He's been late every day since the Cretaceous." },
  { id: 292, adult: true, level: "easy", title: "Motivation", image: "card_292.jpg", correct: "Six more miles and you can have the hole." },
  { id: 293, spicy: true, level: "easy", title: "The Getaway", image: "card_293_r2.jpg", correct: "He said he needed some air." },
  { id: 294, level: "medium", title: "Camouflage", image: "card_294_r2.jpg", correct: "Your move, if you can find it." },
  { id: 295, adult: true, level: "medium", title: "Flight Plan", image: "card_295_r2.jpg", correct: "Does anyone here know Ohio?" },
  { id: 296, spicy: true, level: "medium", title: "Economy", image: "card_296_r2.jpg", correct: "He likes to keep up with the news." },
  { id: 297, level: "easy", title: "Fitting", image: "card_297_r2.jpg", correct: "We may have something in a canoe." },
  { id: 298, level: "medium", title: "Maintenance", image: "card_298_r2.jpg", correct: "Forty years and you still squeak when you're nervous." },
  { id: 299, adult: true, level: "medium", title: "References", image: "card_299.jpg", correct: "And what would you say is his greatest weakness?" },
  { id: 300, level: "medium", title: "Reach", image: "card_300_r2.jpg", correct: "She said she wanted the moon. She didn't say which night." },
  { id: 304, adult: true, level: "hard", title: "Killing Time", image: "card_304.jpg", correct: "I'm in no hurry." },
  { id: 305, spicy: true, level: "hard", title: "Lie", image: "card_305_r2.jpg", correct: "Found it." },
  { id: 306, level: "easy", title: "The Comb", image: "card_306_r2.jpg", correct: "It's the principle of the thing." },
  { id: 307, adult: true, level: "medium", title: "The Forecast", image: "card_307_r2.jpg", correct: "Let's go live to me." },
  { id: 308, spicy: true, level: "medium", title: "The Act", image: "card_308.jpg", correct: "He's the one with the drinking problem." },
  { id: 309, level: "medium", title: "Upgrade", image: "card_309.jpg", correct: "We upgraded." },
  { id: 310, adult: true, level: "easy", title: "Signal", image: "card_310_r2.jpg", correct: "Enlightenment can wait. I'm on hold." },
  { id: 311, adult: true, level: "medium", title: "Midlife", image: "card_311.jpg", correct: "I've always wanted one." },
  { id: 312, level: "hard", title: "Hanging On", image: "card_312_r2.jpg", correct: "Not on my watch." },
  { id: 313, adult: true, level: "medium", title: "Mondays", image: "card_313_r2.jpg", correct: "Decaf is for the living." },
  { id: 314, spicy: true, level: "easy", title: "Dutch", image: "card_314_r2.jpg", correct: "You had the bread." },
  { id: 315, level: "hard", title: "Help Desk", image: "card_315_r2.jpg", correct: "Your call is important to us. Please hold." },
  { id: 316, adult: true, level: "hard", title: "The Viewing", image: "card_316_r2.jpg", correct: "I don't think they like me." },
  { id: 318, adult: true, level: "medium", title: "Dinner Show", image: "card_318_r2.jpg", correct: "He's been showing off since the circus closed." },
  { id: 319, adult: true, level: "medium", title: "Off Season", image: "card_319_r2.jpg", correct: "The elves think I'm at a conference." },
  { id: 337, adult: true, level: "medium", title: "Summit Party", image: "card_337.jpg", correct: "Make a wish. Not that one." },
  { id: 338, level: "medium", title: "Dinner Table", image: "card_338.jpg", correct: "He said he'd fix the wobble." },
  { id: 339, level: "medium", title: "Science Fair", image: "card_339_r2.jpg", correct: "She helped with the poster." },
  { id: 340, level: "easy", title: "Boarding Pass", image: "card_340.jpg", correct: "I was told two of everything." },
  { id: 341, level: "easy", title: "Early Knock", image: "card_341_r2.jpg", correct: "You again. We have a doorbell." },
  { id: 342, adult: true, level: "medium", title: "Floor Level", image: "card_342_r2.jpg", correct: "He's protesting something. Nobody's sure what." },
  { id: 343, level: "hard", title: "Second Wheel", image: "card_343_r2.jpg", correct: "It's basically the same wheel, but it's a whole new wheel." },
  { id: 345, spicy: true, level: "medium", title: "Pantry Raid", image: "card_345.jpg", correct: "The kids are asleep. This is my book club." },
  { id: 346, adult: true, level: "medium", title: "Endless Form", image: "card_346_r2.jpg", correct: "Just sign at the bottom." },
  { id: 347, level: "easy", title: "Putting Green", image: "card_347_r2.jpg", correct: "Play it as it lies." },
  { id: 348, adult: true, level: "hard", title: "Lawn Inspection", image: "card_348_r2.jpg", correct: "The neighbors filed a complaint. About your grass, not you." },
  { id: 349, level: "easy", title: "Water Cooler", image: "card_349.jpg", correct: "Did you hear they're cutting the air-conditioning?" },
  { id: 350, level: "easy", title: "Picnic Exodus", image: "card_350.jpg", correct: "Let them have the potato salad. Nobody wanted it." },
  { id: 351, adult: true, level: "medium", title: "Sent", image: "card_351.jpg", correct: "He replied all." },
  { id: 352, level: "medium", title: "Arena Dinner", image: "card_352.jpg", correct: "I'd skip the special. It's me." },
  { id: 353, level: "hard", title: "Frog Kiss", image: "card_353.jpg", correct: "It's a start." },
  { id: 354, level: "easy", title: "Grandpa's Call", image: "card_354_r2.jpg", correct: "Speak up, I can't see you." },
  { id: 355, spicy: true, level: "medium", title: "Ferry Ride", image: "card_355.jpg", correct: "I was told there'd be a beach." },
  { id: 356, level: "easy", title: "Heavy Canoe", image: "card_356_r2.jpg", correct: "Just keep paddling, dear." },
  { id: 357, spicy: true, level: "easy", title: "Book Club", image: "card_357.jpg", correct: "Did anyone actually read it?" },
  { id: 358, adult: true, level: "easy", title: "Table for One", image: "card_358.jpg", correct: "She's a regular." },
  { id: 359, level: "easy", title: "Lookout Duty", image: "card_359_r2.jpg", correct: "Somebody has to set the tone." },
  { id: 360, spicy: true, level: "hard", title: "Minibar Night", image: "card_360.jpg", correct: "I'll come back." },
  { id: 361, level: "medium", title: "One More Bag", image: "card_361.jpg", correct: "While you're up there." },
  { id: 362, level: "medium", title: "Otter Raft", image: "card_362.jpg", correct: "It's not complicated. It's a rock." },
  { id: 363, level: "easy", title: "Sideline Dad", image: "card_363.jpg", correct: "He's reading the other team's defense." },
  { id: 364, adult: true, level: "hard", title: "Dropped Shoe", image: "card_364_r2.jpg", correct: "Probably nothing." },
  { id: 365, level: "easy", title: "Back Row", image: "card_365_r2.jpg", correct: "I paid for the IMAX." },
  { id: 366, adult: true, level: "hard", title: "Hardware Aisle", image: "card_366_r2.jpg", correct: "Take all the time you need, sir. The store closes at nine." },
  { id: 367, adult: true, level: "medium", title: "Empty Lot", image: "card_367.jpg", correct: "I like to be near the entrance." },
  { id: 368, level: "medium", title: "Cave Portrait", image: "card_368.jpg", correct: "Try to look less extinct." },
  { id: 369, spicy: true, level: "medium", title: "House Wine", image: "card_369.jpg", correct: "An impish little box. Notes of Tuesday." },
  { id: 370, adult: true, level: "hard", title: "Edge Fishing", image: "card_370.jpg", correct: "They're really biting off the edge tonight." },
  { id: 371, level: "medium", title: "Playing Dead", image: "card_371.jpg", correct: "Not again, Gerald." },
  { id: 372, adult: true, level: "easy", title: "Back in Office", image: "card_372.jpg", correct: "Business on top, Sunday on the bottom." },
  { id: 373, spicy: true, level: "easy", title: "Card Game", image: "card_373.jpg", correct: "Double or nothing, Doris." },
  { id: 374, adult: true, level: "easy", title: "Sauna Bench", image: "card_374.jpg", correct: "I think he's new to saunas." },
  { id: 375, adult: true, level: "medium", title: "Lunch Security", image: "card_375.jpg", correct: "Somebody took his yogurt in 2019." },
  { id: 377, adult: true, level: "medium", title: "Sales Meeting", image: "card_377_r2.jpg", correct: "Henderson is processing the quarter." },
  { id: 379, level: "medium", title: "Harp Issued", image: "card_379_r2.jpg", correct: "Fifteen-love." },
  { id: 380, adult: true, level: "medium", title: "Against Current", image: "card_380.jpg", correct: "Some of us were born upstream." },
  { id: 381, spicy: true, level: "hard", title: "Next Table", image: "card_381.jpg", correct: "They'll learn." },
  { id: 382, spicy: true, level: "hard", title: "Gold Watch", image: "card_382.jpg", correct: "Fifty years and not one sick day." },
  { id: 383, adult: true, level: "easy", title: "Open Mic", image: "card_383.jpg", correct: "You're killing, Dave. With a very specific crowd." },
  { id: 384, adult: true, level: "medium", title: "Leaf Blowers", image: "card_384.jpg", correct: "It's not a competition, Gary." },
  { id: 385, level: "hard", title: "Crooked Stone", image: "card_385_r2.jpg", correct: "Close enough. It'll be a mystery anyway." },
  { id: 386, adult: true, level: "hard", title: "Hoard Search", image: "card_386.jpg", correct: "I think I dropped an earring." },
  { id: 387, level: "medium", title: "Kids' Table", image: "card_387.jpg", correct: "One more Thanksgiving and he's in." },
  { id: 388, adult: true, level: "medium", title: "Airport Screening", image: "card_388.jpg", correct: "Anything to declare?" },
  { id: 389, level: "easy", title: "Driving Lesson", image: "card_389.jpg", correct: "Just checking my mirrors." },
  { id: 392, spicy: true, level: "hard", title: "Mantis Dinner", image: "card_392.jpg", correct: "He was delicious company." },
  { id: 393, adult: true, level: "medium", title: "By Weight", image: "card_393_r2.jpg", correct: "Your appeal is heavy, sir. Very heavy." },
  { id: 394, spicy: true, level: "medium", title: "Last Call", image: "card_394.jpg", correct: "You've had enough. Of everyone." },
  { id: 395, spicy: true, level: "easy", title: "Happy Hour", image: "card_395_r2.jpg", correct: "First round's on Q3." },
  { id: 396, spicy: true, level: "hard", title: "Henhouse Poker", image: "card_396.jpg", correct: "Funny. He keeps winning." },
  { id: 397, level: "hard", title: "Bill Night", image: "card_397_r2.jpg", correct: "You can have whatever's left after the electric bill. So, this." },
  { id: 398, spicy: true, level: "hard", title: "Cliff Edge", image: "card_398.jpg", correct: "Business has never been better." },
  { id: 399, adult: true, level: "medium", title: "Cubicle Moat", image: "card_399_r2.jpg", correct: "She's in a meeting." },
  { id: 400, spicy: true, level: "medium", title: "Cuckoo Clock", image: "card_400.jpg", correct: "Every hour, Linda. Every single hour." },
  { id: 401, spicy: true, level: "hard", title: "Tiptoe", image: "card_401_r2.jpg", correct: "We see eye to eye on everything." },
  { id: 402, level: "easy", title: "Full Service", image: "card_402_r2.jpg", correct: "Every Saturday since the Eisenhower administration." },
  { id: 404, level: "medium", title: "Safety First", image: "card_404.jpg", correct: "Honestly, he's got more riding on this than I do." },
  { id: 405, level: "medium", title: "Early Bird", image: "card_405.jpg", correct: "Today the worm got up earlier." },
  { id: 406, level: "medium", title: "Road Crew", image: "card_406.jpg", correct: "Nobody said anything about going around." },
  { id: 407, level: "medium", title: "Too Hot", image: "card_407_r2.jpg", correct: "Forty years he's done this. Not one fire." },
  { id: 408, level: "hard", title: "Bright Idea", image: "card_408.jpg", correct: "The rest are still thinking it over." },
  { id: 409, adult: true, level: "easy", title: "Dinner Upstairs", image: "card_409.jpg", correct: "We always seat him away from the in-laws." },
  { id: 410, adult: true, level: "easy", title: "Fill It Up", image: "card_410.jpg", correct: "He insists on premium. Says you can taste it." },
  { id: 412, adult: true, level: "medium", title: "Wait Here", image: "card_412.jpg", correct: "Okay, buddy. Yours is decaf." },
  { id: 413, adult: true, level: "medium", title: "Steeping", image: "card_413.jpg", correct: "I asked for one lump." },
  { id: 414, adult: true, level: "medium", title: "Crosswalk Thief", image: "card_414.jpg", correct: "That's the third one this month." },
  { id: 415, adult: true, level: "hard", title: "The Bag", image: "card_415.jpg", correct: "Well. I guess you've heard about the job in Phoenix." },
  { id: 416, adult: true, level: "medium", title: "Cold Feet", image: "card_416_r2.jpg", correct: "Give me a minute. I'm working up to it." },
  { id: 417, adult: true, level: "hard", title: "Spare Key", image: "card_417.jpg", correct: "I said one copy." },
  { id: 418, spicy: true, level: "easy", title: "In His Cups", image: "card_418.jpg", correct: "He asked for the bottomless option." },
  { id: 419, spicy: true, level: "medium", title: "Baggage", image: "card_419.jpg", correct: "Fair warning: I'm a lot to unpack." },
  { id: 420, spicy: true, level: "hard", title: "Regulars", image: "card_420.jpg", correct: "He's a good listener. Takes exact change." },
  { id: 421, spicy: true, level: "hard", title: "Dollhouse", image: "card_421.jpg", correct: "He finally got his man cave." },
  { id: 320, level: "hard", title: "Insulated", image: "card_320_r2.jpg", correct: "He read something online." },
  { id: 321, adult: true, level: "medium", title: "Ink", image: "card_321.jpg", correct: "We're up to grandchild number eleven." },
  { id: 322, spicy: true, level: "easy", title: "Training", image: "card_322_r2.jpg", correct: "Three weeks ago he couldn't find the kettle." },
  { id: 324, adult: true, level: "medium", title: "Chores", image: "card_324_r2.jpg", correct: "It's Tuesday. Even up here, it's Tuesday." },
  { id: 326, level: "easy", title: "Personal Best", image: "card_326_r2.jpg", correct: "Next month he's going for the whole wheel." },
  { id: 328, spicy: true, level: "medium", title: "The Check", image: "card_328_r2.jpg", correct: "Shall I just leave this with the chair, sir?" },
  { id: 329, level: "medium", title: "Delivery", image: "card_329.jpg", correct: "Do you take returns?" },
  { id: 330, adult: true, level: "easy", title: "Weekend", image: "card_330_r2.jpg", correct: "He swears they were biting last Tuesday." },
  { id: 332, level: "medium", title: "Head Count", image: "card_332_r2.jpg", correct: "Four, five, six, and a chance of showers." },
  { id: 333, adult: true, level: "medium", title: "Feeding Time", image: "card_333_r2.jpg", correct: "Not now. They're checking the markets." },
  { id: 334, spicy: true, level: "easy", title: "Dinner", image: "card_334.jpg", correct: "Gerald had a procedure. We don't ask." },
  { id: 424, spicy: true, level: "medium", title: "Lookout Point", image: "card_424.jpg", correct: "Even he has his limits." },
  { id: 425, spicy: true, level: "hard", title: "Wrong Hole", image: "card_425.jpg", correct: "He insisted on room to grow." },
  { id: 426, spicy: true, level: "hard", title: "Dusty Wait", image: "card_426_r2.jpg", correct: "They said the doctor would be right with me." },
  { id: 427, adult: true, level: "hard", title: "Safe Cracker", image: "card_427_r2.jpg", correct: "Three to the left, two to the right, and it orders more paper towels." },
  { id: 428, level: "easy", title: "Downpour", image: "card_428_r2.jpg", correct: "Forecast said scattered showers. Nobody mentioned breeds." },
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
  { id: 459, level: "easy", title: "Safety Gear", image: "card_459.jpg", correct: "Either way, somebody's having breakfast." },
  { id: 460, level: "medium", title: "Bookworm", image: "card_460.jpg", correct: "We prefer you read it the long way." },
  { id: 461, adult: true, level: "easy", title: "Holding It In", image: "card_461.jpg", correct: "He's carrying himself very well." },
  { id: 462, level: "easy", title: "Groomed", image: "card_462.jpg", correct: "Did you want to keep the rest?" },
  { id: 463, level: "hard", title: "The Piper", image: "card_463.jpg", correct: "Finally, someone the vacuums listen to." },
  { id: 659, level: "easy", title: "Clean Room", image: "card_659.jpg", correct: "Who signed him in?" },
  { id: 464, level: "easy", title: "The Rescue", image: "card_464.jpg", correct: "Every Tuesday. She's got quite a following." },
  { id: 465, level: "medium", title: "Hedge", image: "card_465.jpg", correct: "We agreed to split it down the middle." },
  { id: 466, level: "hard", title: "Dry Cleaning", image: "card_466.jpg", correct: "I'm afraid yours left without paying." },
  { id: 467, level: "medium", title: "After Midnight", image: "card_467.jpg", correct: "Every year, the same left shoe." },
  { id: 468, adult: true, level: "medium", title: "Shrine", image: "card_468.jpg", correct: "It answered him once. That was enough." },
  { id: 660, level: "easy", title: "Party Fog", image: "card_660.jpg", correct: "Head count after the cake, please." },
  { id: 469, adult: true, level: "medium", title: "Inspection", image: "card_469.jpg", correct: "He retired on Friday." },
  { id: 470, adult: true, level: "medium", title: "Nest Inspection", image: "card_470.jpg", correct: "Your permit says three eggs." },
  { id: 471, level: "easy", title: "Balcony Scene", image: "card_471.jpg", correct: "Any requests, sir? Take your time." },
  { id: 472, adult: true, level: "easy", title: "Ride Share", image: "card_472.jpg", correct: "I did pick the shared ride." },
  { id: 473, level: "medium", title: "Homework", image: "card_473.jpg", correct: "They can't take the diploma back, Daddy." },
  { id: 661, level: "hard", title: "Counting Moles", image: "card_661.jpg", correct: "Gary, we have a scale for this." },
  { id: 474, spicy: true, level: "medium", title: "Undressed", image: "card_474.jpg", correct: "You may want to get dressed. Quickly." },
  { id: 475, adult: true, level: "medium", title: "Second Edition", image: "card_475.jpg", correct: "Make it a hundred. I have a temper." },
  { id: 476, adult: true, level: "medium", title: "Backdrop", image: "card_476.jpg", correct: "Good, I see everyone's done the reading." },
  { id: 477, adult: true, level: "medium", title: "Seating Chart", image: "card_477.jpg", correct: "It all goes back to your Uncle Dennis." },
  { id: 478, adult: true, level: "easy", title: "Quiet Hours", image: "card_478.jpg", correct: "Take it up with the sun." },
  { id: 662, level: "hard", title: "Outlier", image: "card_662.jpg", correct: "He calls it cleaning up the data." },
  { id: 479, adult: true, level: "medium", title: "Overdue", image: "card_479.jpg", correct: "Overdue fines are up eleven percent." },
  { id: 480, adult: true, level: "medium", title: "Browsing", image: "card_480.jpg", correct: "It's asking if we're still watching." },
  { id: 481, level: "medium", title: "Back Seat", image: "card_481.jpg", correct: "The dog is Switzerland." },
  { id: 482, adult: true, level: "medium", title: "Night Owl", image: "card_482.jpg", correct: "Don't worry, I'm meeting someone." },
  { id: 483, adult: true, level: "easy", title: "Triage", image: "card_483.jpg", correct: "You should see the other guy." },
  { id: 663, level: "hard", title: "Cherry Picking", image: "card_663.jpg", correct: "One more and we have a trend." },
  { id: 484, adult: true, level: "medium", title: "Icebreaker", image: "card_484.jpg", correct: "We lost Dave in last year's icebreaker." },
  { id: 485, level: "medium", title: "Keep Out", image: "card_485.jpg", correct: "Her demands now include a car." },
  { id: 486, level: "medium", title: "Harmony", image: "card_486.jpg", correct: "I'm only here for the harmonies." },
  { id: 487, adult: true, level: "medium", title: "Victory Party", image: "card_487.jpg", correct: "Even the balloons stayed home." },
  { id: 488, adult: true, level: "easy", title: "Yard Work", image: "card_488.jpg", correct: "You missed a spot." },
  { id: 664, level: "easy", title: "Do Not Feed", image: "card_664.jpg", correct: "They're most active just before a grant deadline." },
  { id: 489, adult: true, level: "medium", title: "Boomerang", image: "card_489.jpg", correct: "Your room's been reassigned." },
  { id: 490, adult: true, level: "medium", title: "Bus Stop", image: "card_490.jpg", correct: "Finally, a line where I fit in." },
  { id: 491, adult: true, level: "medium", title: "Deep Thought", image: "card_491.jpg", correct: "Honestly, this one's more relatable." },
  { id: 492, adult: true, level: "medium", title: "Pay to Park", image: "card_492.jpg", correct: "The app doesn't have a box for camel." },
  { id: 493, level: "medium", title: "Thermostat", image: "card_493.jpg", correct: "We agreed on sixty-two in 1979." },
  { id: 665, level: "easy", title: "Laser Pointer", image: "card_665.jpg", correct: "Twelve billion dollars, and it's the cat's favorite toy." },
  { id: 494, level: "medium", title: "Buried", image: "card_494.jpg", correct: "For the last time, those are all my front doors." },
  { id: 495, adult: true, level: "medium", title: "The Reveal", image: "card_495.jpg", correct: "I'll have the Expressionist." },
  { id: 497, spicy: true, level: "medium", title: "Swear Jar", image: "card_497.jpg", correct: "We can't print the boat's name." },
  { id: 498, level: "easy", title: "Wake-Up", image: "card_498.jpg", correct: "Honey, he's returning your socks." },
  { id: 499, adult: true, level: "easy", title: "Landfall", image: "card_499.jpg", correct: "No plundering in the swim area." },
  { id: 666, level: "medium", title: "Full Gear", image: "card_666.jpg", correct: "Happy birthday to one of you." },
  { id: 500, spicy: true, level: "medium", title: "Truce", image: "card_500.jpg", correct: "Put it next to the one about your mother." },
  { id: 502, adult: true, level: "medium", title: "Lunch Break", image: "card_502.jpg", correct: "Could use mustard." },
  { id: 503, adult: true, level: "easy", title: "Interrogation", image: "card_503.jpg", correct: "Okay. Now tell me you weren't there." },
  { id: 504, spicy: true, level: "easy", title: "The Woods", image: "card_504.jpg", correct: "There's a line." },
  { id: 505, spicy: true, level: "medium", title: "Thin Walls", image: "card_505.jpg", correct: "Poor man. She repeats everything he says." },
  { id: 667, level: "medium", title: "Sabbatical", image: "card_667.jpg", correct: "I was gone one semester." },
  { id: 506, spicy: true, level: "easy", title: "Skinny Dip", image: "card_506.jpg", correct: "Leave him the watch. We're not animals." },
  { id: 507, adult: true, level: "medium", title: "Pay to Pull", image: "card_507.jpg", correct: "Kid, I'll give you ten bucks not to try." },
  { id: 509, spicy: true, level: "medium", title: "Supply Closet", image: "card_509.jpg", correct: "I'd try the supply closet on four." },
  { id: 510, spicy: true, level: "medium", title: "Courtship", image: "card_510.jpg", correct: "Seven letters for 'show-off.'" },
  { id: 511, adult: true, level: "hard", title: "The Search", image: "card_511.jpg", correct: "If he asks, I'm in sales." },
  { id: 668, level: "medium", title: "Launch Control", image: "card_668.jpg", correct: "We're go for launch, pending Grandma." },
  { id: 512, spicy: true, level: "hard", title: "Third Wheel", image: "card_512.jpg", correct: "It was up twice last night." },
  { id: 513, spicy: true, level: "medium", title: "Honeymoon Suite", image: "card_513.jpg", correct: "She says she's a very heavy sleeper." },
  { id: 514, adult: true, level: "medium", title: "Spa Day", image: "card_514.jpg", correct: "My wife booked this for me." },
  { id: 515, adult: true, level: "medium", title: "The Catch", image: "card_515.jpg", correct: "Sorry, pal. Catch and release." },
  { id: 516, spicy: true, level: "medium", title: "Swipe", image: "card_516.jpg", correct: "Maybe I'll text first." },
  { id: 669, adult: true, level: "medium", title: "Peer Review", image: "card_669.jpg", correct: "Reviewer Two has a few minor comments." },
  { id: 517, adult: true, level: "medium", title: "Reserved", image: "card_517.jpg", correct: "They both checked out yesterday." },
  { id: 518, spicy: true, level: "medium", title: "Bedfellow", image: "card_518.jpg", correct: "The front desk says he was here first." },
  { id: 519, spicy: true, level: "medium", title: "Steady Aim", image: "card_519.jpg", correct: "Maybe start with a watermelon." },
  { id: 520, spicy: true, level: "hard", title: "Surprise", image: "card_520.jpg", correct: "So what are we having with it?" },
  { id: 522, level: "hard", title: "The Odd One", image: "card_522.jpg", correct: "I'm flattered, but the sun's that way." },
  { id: 670, adult: true, level: "easy", title: "Poster Session", image: "card_670.jpg", correct: "If there are no questions, I'll start again." },
  { id: 523, spicy: true, level: "medium", title: "Tip Jar", image: "card_523.jpg", correct: "Do you know anything shorter?" },
  { id: 525, level: "medium", title: "Lights Out", image: "card_525.jpg", correct: "He never makes it past the bunny." },
  { id: 526, adult: true, level: "medium", title: "High Tide", image: "card_526.jpg", correct: "He's almost done with the chapter." },
  { id: 527, spicy: true, level: "hard", title: "The View", image: "card_527.jpg", correct: "The listing did say 'dramatic views.'" },
  { id: 529, level: "medium", title: "Rinse", image: "card_529.jpg", correct: "Somewhere, a landfill is very impressed." },
  { id: 671, adult: true, level: "medium", title: "Error Bars", image: "card_671.jpg", correct: "So it's a definite maybe." },
  { id: 530, level: "medium", title: "Empty Nest", image: "card_530.jpg", correct: "Thirty-four is a perfectly good age to fly." },
  { id: 531, spicy: true, level: "easy", title: "All In", image: "card_531.jpg", correct: "That's how I started." },
  { id: 532, adult: true, level: "medium", title: "Reunion", image: "card_532.jpg", correct: "You haven't changed a bit." },
  { id: 534, spicy: true, level: "medium", title: "Reflection", image: "card_534.jpg", correct: "I'll let you two talk." },
  { id: 535, level: "medium", title: "Car Seat", image: "card_535.jpg", correct: "Don't make me turn this car around, Dad." },
  { id: 672, adult: true, level: "hard", title: "Unopened", image: "card_672.jpg", correct: "I'm hearing a little of both." },
  { id: 536, adult: true, level: "hard", title: "Groundhog Day", image: "card_536.jpg", correct: "Six more weeks of winter, scattered showers Thursday." },
  { id: 538, adult: true, level: "hard", title: "Corporate Ladder", image: "card_538.jpg", correct: "I'd share, but you know how it is up here." },
  { id: 539, spicy: true, level: "hard", title: "Lashed", image: "card_539.jpg", correct: "Honestly, it's the cardigan that does it for me." },
  { id: 693, adult: true, level: "medium", title: "Pre-Op", image: "card_693.jpg", correct: "Honestly, his plan is better than mine." },
  { id: 953, spicy: true, level: "medium", title: "Going Once", image: "card_953.jpg", correct: "She doesn't even have a barn." },
  { id: 1081, adult: true, level: "medium", title: "Fugu", image: "card_1081.jpg", correct: "The omakase comes with a waiver." },
  { id: 540, spicy: true, level: "hard", title: "Nearby", image: "card_540.jpg", correct: "Our dogs have been seeing each other for weeks." },
  { id: 825, level: "easy", title: "Paranormal", image: "card_825.jpg", correct: "It's the only way anyone sees us anymore." },
  { id: 954, level: "medium", title: "Plug", image: "card_954.jpg", correct: "Don't ask it anything hard. It's peak hours." },
  { id: 824, level: "medium", title: "Switchback", image: "card_824.jpg", correct: "He was just under the line when we got here." },
  { id: 1082, level: "hard", title: "Inch Apart", image: "card_1082.jpg", correct: "They've waited forty thousand years. Give them a minute." },
  { id: 694, adult: true, level: "medium", title: "Behind the Wall", image: "card_694.jpg", correct: "We were told the house came furnished." },
  { id: 826, spicy: true, level: "easy", title: "Gray Bin", image: "card_826.jpg", correct: "They told me it was a quilting retreat." },
  { id: 955, adult: true, level: "hard", title: "Widow's Walk", image: "card_955.jpg", correct: "She's watching for a ship to take him back." },
  { id: 1083, level: "easy", title: "Wind Load", image: "card_1083.jpg", correct: "It's not personal. It's code." },
  { id: 541, level: "easy", title: "Violation", image: "card_541.jpg", correct: "Neighbors say it was a quiet lawn." },
  { id: 827, adult: true, level: "easy", title: "Gratuity", image: "card_827.jpg", correct: "There's a \"no tip\" button, but I wouldn't." },
  { id: 956, level: "medium", title: "Modern Medicine", image: "card_956.jpg", correct: "Insurance still wants it the old way." },
  { id: 1084, level: "medium", title: "Hearth", image: "card_1084.jpg", correct: "Two more minutes, then bed." },
  { id: 695, level: "easy", title: "Covenant", image: "card_695.jpg", correct: "Watercraft has to be parked behind the house." },
  { id: 828, level: "medium", title: "Quiet Car", image: "card_828.jpg", correct: "You can unwrap that in the vestibule." },
  { id: 957, adult: true, level: "easy", title: "Hot Wire", image: "card_957.jpg", correct: "Every summer, a new cousin." },
  { id: 1085, adult: true, level: "easy", title: "Dibs", image: "card_1085.jpg", correct: "My grandson gets his license in June." },
  { id: 673, adult: true, level: "easy", title: "Repeat Patient", image: "card_673.jpg", correct: "It's sticking again right around the gallbladder." },
  { id: 829, level: "easy", title: "Seasoned", image: "card_829.jpg", correct: "Third one this year who thinks it needs more salt." },
  { id: 958, adult: true, level: "hard", title: "Lineup", image: "card_958.jpg", correct: "The prints are a perfect match, which is the problem." },
  { id: 1086, adult: true, level: "easy", title: "Discharge", image: "card_1086.jpg", correct: "The first hour was free. You were here eleven days." },
  { id: 696, level: "hard", title: "Control Group", image: "card_696.jpg", correct: "Everyone wants to be in the control group." },
  { id: 830, level: "easy", title: "Midnight Buffet", image: "card_830.jpg", correct: "Whatever you do, don't announce the chocolate fountain." },
  { id: 959, adult: true, level: "medium", title: "Deer Camp", image: "card_959.jpg", correct: "Quiet. He's never come this close before." },
  { id: 1087, spicy: true, level: "hard", title: "Raw Bar", image: "card_1087.jpg", correct: "Thirty-one years, and the palm gets the romantic evening." },
  { id: 542, level: "hard", title: "The Line", image: "card_542.jpg", correct: "I'm not sure, but the reviews are excellent." },
  { id: 831, level: "medium", title: "Origin Story", image: "card_831.jpg", correct: "Before you rinse that off, hear us out." },
  { id: 960, spicy: true, level: "hard", title: "Visiting Hours", image: "card_960.jpg", correct: "Harold told me he was at bingo." },
  { id: 1088, level: "medium", title: "Smoke Follows", image: "card_1088.jpg", correct: "Every trip. It just likes him." },
  { id: 697, level: "medium", title: "Glovebox", image: "card_697.jpg", correct: "At home I just hide it in a little tuna." },
  { id: 832, adult: true, level: "easy", title: "Exit Row", image: "card_832.jpg", correct: "I'll need a verbal yes from each of you." },
  { id: 1089, level: "medium", title: "Hidden Father", image: "card_1089.jpg", correct: "Neutral expression, please. He's crossing a border." },
  { id: 544, adult: true, level: "medium", title: "Zero G", image: "card_544.jpg", correct: "Facilities says it's a known issue." },
  { id: 833, level: "medium", title: "Cool Aisle", image: "card_833.jpg", correct: "We'll be out by Labor Day." },
  { id: 962, adult: true, level: "medium", title: "Slow Vehicle", image: "card_962.jpg", correct: "He's been doing nine miles an hour since your water broke." },
  { id: 1090, level: "hard", title: "Observer", image: "card_1090.jpg", correct: "Close it. He has to know." },
  { id: 698, adult: true, level: "easy", title: "Baby-Proofed", image: "card_698.jpg", correct: "Well, the book did say to think like her." },
  { id: 834, level: "medium", title: "Tolerances", image: "card_834.jpg", correct: "It's two nights at your sister's." },
  { id: 963, level: "easy", title: "Bouquet Toss", image: "card_963.jpg", correct: "She's been training since the christening." },
  { id: 1091, adult: true, level: "easy", title: "Launch Day", image: "card_1091.jpg", correct: "It was only rated for a light christening." },
  { id: 545, level: "medium", title: "Open Concept", image: "card_545.jpg", correct: "We'd like it a little more open." },
  { id: 835, adult: true, level: "medium", title: "Impact Test", image: "card_835.jpg", correct: "Ninety-eight miles an hour, and still no volunteers." },
  { id: 964, level: "easy", title: "Nostrils", image: "card_964.jpg", correct: "Grandpa, tilt the phone down. No, the other down." },
  { id: 1092, spicy: true, level: "medium", title: "Sign-In", image: "card_1092.jpg", correct: "You're both listed as 'the wife.'" },
  { id: 699, spicy: true, level: "hard", title: "Animalcules", image: "card_699.jpg", correct: "He said he'd be right in. That was 1677." },
  { id: 836, level: "easy", title: "Shoehorn", image: "card_836.jpg", correct: "Mind the doors. And the cake." },
  { id: 965, spicy: true, level: "medium", title: "Reenactment", image: "card_965.jpg", correct: "Your father wanted to see if it still fit." },
  { id: 1093, level: "medium", title: "Specials", image: "card_1093.jpg", correct: "Forgive me. It's the last of the risotto." },
  { id: 546, adult: true, level: "medium", title: "Pruning", image: "card_546.jpg", correct: "Leave it. It's the first thing the deer haven't eaten." },
  { id: 837, adult: true, level: "medium", title: "Snuffed", image: "card_837.jpg", correct: "The tribe has spoken. Also, your parking pass is deactivated." },
  { id: 966, level: "medium", title: "Divining", image: "card_966.jpg", correct: "Either way, it's eight hundred dollars." },
  { id: 1094, spicy: true, level: "medium", title: "Tick Check", image: "card_1094.jpg", correct: "We used to light the candles first." },
  { id: 700, level: "hard", title: "Culture", image: "card_700.jpg", correct: "Hold on. They just elected me mayor." },
  { id: 838, adult: true, level: "hard", title: "Long Haul", image: "card_838.jpg", correct: "You promised you'd only be gone a week." },
  { id: 967, adult: true, level: "easy", title: "Standoff", image: "card_967.jpg", correct: "Nobody has to come out. We just want to talk about the recliner." },
  { id: 1095, level: "medium", title: "Locate", image: "card_1095.jpg", correct: "Call before you dig, Captain." },
  { id: 547, level: "easy", title: "Potluck", image: "card_547.jpg", correct: "Bless this food, and whoever brought the chicken." },
  { id: 839, level: "medium", title: "Backyard Well", image: "card_839.jpg", correct: "Suddenly everyone remembers my birthday." },
  { id: 968, level: "medium", title: "Autosteer", image: "card_968.jpg", correct: "Forty years I drove that thing. Nobody waved." },
  { id: 1096, level: "medium", title: "Siege Lunch", image: "card_1096.jpg", correct: "We'll resume the siege after the lunch rush." },
  { id: 701, spicy: true, level: "medium", title: "Lipstick", image: "card_701.jpg", correct: "The seal looks good. The marriage, I can't certify." },
  { id: 840, spicy: true, level: "hard", title: "Upper Berth", image: "card_840.jpg", correct: "I'd like to file a complaint about the ceiling." },
  { id: 969, level: "easy", title: "Stash", image: "card_969.jpg", correct: "I'd look harder, but I can't find my glasses." },
  { id: 1097, level: "easy", title: "Seed Head", image: "card_1097.jpg", correct: "Same wish every morning, and it always comes true." },
  { id: 674, adult: true, level: "medium", title: "Decipher", image: "card_674.jpg", correct: "We've cracked the first word. It's 'take.'" },
  { id: 841, level: "easy", title: "Ball Kid", image: "card_841.jpg", correct: "We're thinking of adding a line judge." },
  { id: 970, adult: true, level: "medium", title: "Recognized", image: "card_970.jpg", correct: "Tell your mother the coffee cake was lovely." },
  { id: 1098, level: "hard", title: "Reference Mass", image: "card_1098.jpg", correct: "Don't. Technically, that's now the kilogram." },
  { id: 702, adult: true, level: "medium", title: "Background Check", image: "card_702.jpg", correct: "Now one from the side, for the scrapbook." },
  { id: 842, adult: true, level: "hard", title: "Middle Seat", image: "card_842.jpg", correct: "They said I'd hardly notice them." },
  { id: 961, adult: true, level: "medium", title: "Firmware", image: "card_961.jpg", correct: "Whatever you do, don't restart him." },
  { id: 971, adult: true, level: "medium", title: "Active", image: "card_971.jpg", correct: "His manager says he's never been more responsive." },
  { id: 1099, level: "easy", title: "Mise en Place", image: "card_1099.jpg", correct: "Grilled cheese in about forty minutes." },
  { id: 548, spicy: true, level: "medium", title: "Moving Out", image: "card_548.jpg", correct: "I guess it finally got tired of just sleeping." },
  { id: 843, spicy: true, level: "hard", title: "Password", image: "card_843.jpg", correct: "Just until he gets back on his feet." },
  { id: 972, adult: true, level: "hard", title: "Magnetic", image: "card_972.jpg", correct: "Thirty years married. My tie points the other way now." },
  { id: 1100, level: "medium", title: "Cold Front", image: "card_1100.jpg", correct: "He's had that hammock out since January." },
  { id: 703, adult: true, level: "easy", title: "Scrub In", image: "card_703.jpg", correct: "It doesn't believe in germs either." },
  { id: 844, level: "hard", title: "Towel Art", image: "card_844.jpg", correct: "He's much better at turndown service." },
  { id: 973, adult: true, level: "medium", title: "Training Burn", image: "card_973.jpg", correct: "First time that kitchen's been warm since 1962." },
  { id: 1101, level: "medium", title: "Escalation", image: "card_1101.jpg", correct: "Wait till you meet the guy who handles refunds." },
  { id: 549, level: "easy", title: "Steps", image: "card_549.jpg", correct: "Four hundred more steps and it's technically breakfast." },
  { id: 845, spicy: true, level: "medium", title: "Page Turner", image: "card_845.jpg", correct: "Brace yourself. Chuck roast is ninety-nine cents a pound." },
  { id: 974, level: "medium", title: "Smart Bulb", image: "card_974.jpg", correct: "Don't get attached. That one doesn't have an app." },
  { id: 1102, adult: true, level: "easy", title: "Intervention", image: "card_1102.jpg", correct: "Relax, everyone. It's pasteurized." },
  { id: 704, level: "easy", title: "Grill Rounds", image: "card_704.jpg", correct: "Medium-rare, and keep it elevated." },
  { id: 846, level: "easy", title: "Or Similar", image: "card_846.jpg", correct: "Where it comes from, this is a midsize." },
  { id: 975, level: "hard", title: "Hoses", image: "card_975.jpg", correct: "Forty-two years, and they're finally on the same pressure setting." },
  { id: 1103, adult: true, level: "easy", title: "Bear-Proof", image: "card_1103.jpg", correct: "So far, the bear's the only one who's passed." },
  { id: 550, adult: true, level: "medium", title: "Any Other Business", image: "card_550.jpg", correct: "The motion to wave at the ship is out of order." },
  { id: 847, spicy: true, level: "medium", title: "Food Taster", image: "card_847.jpg", correct: "He's been very sweet since he upped the life insurance." },
  { id: 976, level: "medium", title: "Campout", image: "card_976.jpg", correct: "It says the house needs some time to itself." },
  { id: 1104, adult: true, level: "medium", title: "Pre-Existing", image: "card_1104.jpg", correct: "And which of the previous owners smoked?" },
  { id: 705, adult: true, level: "easy", title: "Rush Order", image: "card_705.jpg", correct: "We'll bill you for whatever makes it." },
  { id: 848, adult: true, level: "medium", title: "First Dance", image: "card_848.jpg", correct: "The fantasy draft waits for no bride." },
  { id: 977, spicy: true, level: "medium", title: "Oil Can", image: "card_977.jpg", correct: "It's for the bedsprings, dear. The whole second floor is asking." },
  { id: 1105, adult: true, level: "hard", title: "Market Price", image: "card_1105.jpg", correct: "The lobster is up four points since you sat down." },
  { id: 551, level: "easy", title: "Decoy", image: "card_551.jpg", correct: "He's very good. We haven't seen a duck all morning." },
  { id: 849, adult: true, level: "medium", title: "Hardware", image: "card_849.jpg", correct: "I'll see your wand and raise you a pacemaker." },
  { id: 978, level: "easy", title: "Expectant Father", image: "card_978.jpg", correct: "Somewhere around forty, I stopped naming them." },
  { id: 1106, adult: true, level: "hard", title: "Light Box", image: "card_1106.jpg", correct: "The ficus is responding much better than I am." },
  { id: 706, level: "easy", title: "Extraction", image: "card_706.jpg", correct: "Your mother had a simpler plan, but it lacked ambition." },
  { id: 850, adult: true, level: "hard", title: "TV Doctor", image: "card_850.jpg", correct: "Twelve years of school to lose to kale." },
  { id: 979, spicy: true, level: "easy", title: "Two Hundred Buttons", image: "card_979.jpg", correct: "Her mother picked the dress." },
  { id: 1107, level: "easy", title: "Fender Bender", image: "card_1107.jpg", correct: "We should probably get her information too." },
  { id: 552, level: "easy", title: "Deep End", image: "card_552.jpg", correct: "The loveseat went first. It's been a long afternoon." },
  { id: 851, adult: true, level: "hard", title: "Walkaround", image: "card_851.jpg", correct: "Last time they charged us for a scratch that was already a dent." },
  { id: 980, adult: true, level: "medium", title: "Penance", image: "card_980.jpg", correct: "Have you tried turning it off and repenting?" },
  { id: 1108, level: "medium", title: "Goldilocks", image: "card_1108.jpg", correct: "Don't interrupt. She's about to find our median." },
  { id: 707, level: "hard", title: "One or Two", image: "card_707.jpg", correct: "Better? Or worse? Take all the time you need." },
  { id: 852, level: "easy", title: "Handoff", image: "card_852.jpg", correct: "Your mother ran the anchor leg for all four of you." },
  { id: 981, adult: true, level: "medium", title: "Full Disclosure", image: "card_981.jpg", correct: "At our age, you skip straight to the paperwork." },
  { id: 1109, adult: true, level: "medium", title: "Tandem", image: "card_1109.jpg", correct: "Whoever reaches shore first keeps the cabin." },
  { id: 675, adult: true, level: "easy", title: "Strong Field", image: "card_675.jpg", correct: "Don't worry about Gary. He'll come off when we're done." },
  { id: 853, adult: true, level: "hard", title: "Speakeasy", image: "card_853.jpg", correct: "Regular, and don't ask me how I know the password." },
  { id: 982, level: "medium", title: "After Hours", image: "card_982.jpg", correct: "He took the sandwich, but he left the crusts." },
  { id: 1110, level: "medium", title: "Prior Art", image: "card_1110.jpg", correct: "The mouse is our senior reviewer." },
  { id: 708, level: "medium", title: "School Run", image: "card_708.jpg", correct: "He gets in the bus on his own. We just have to get him to the bus." },
  { id: 854, adult: true, level: "medium", title: "Transplant", image: "card_854.jpg", correct: "Funny. Mine was full of shrimp." },
  { id: 983, adult: true, level: "medium", title: "Ice Out", image: "card_983.jpg", correct: "Earl took the third of April." },
  { id: 1111, adult: true, level: "easy", title: "Last Guests", image: "card_1111.jpg", correct: "We should do this more often. Maybe Thursday?" },
  { id: 553, level: "medium", title: "Breaking", image: "card_553.jpg", correct: "He watches the weather like it's a contact sport." },
  { id: 855, level: "easy", title: "Pro", image: "card_855.jpg", correct: "His agent says raking is a career-ending injury." },
  { id: 984, spicy: true, level: "medium", title: "Love Language", image: "card_984.jpg", correct: "Twenty years, and he still knows exactly what I want." },
  { id: 1112, level: "medium", title: "Twitch", image: "card_1112.jpg", correct: "Nobody tell Gerald. He'll never forgive himself." },
  { id: 709, spicy: true, level: "medium", title: "Contamination", image: "card_709.jpg", correct: "I'll need both of you in quarantine. Separately." },
  { id: 856, level: "easy", title: "Ghost Story", image: "card_856.jpg", correct: "And then he saw what eggs cost." },
  { id: 985, adult: true, level: "medium", title: "Garden Party", image: "card_985.jpg", correct: "More scones, anyone? We're making room." },
  { id: 1113, spicy: true, level: "medium", title: "Bail", image: "card_1113.jpg", correct: "Her mother paid. That's the part you should be worried about." },
  { id: 554, level: "easy", title: "High Water", image: "card_554.jpg", correct: "Same time Thursday, unless it gets worse." },
  { id: 857, level: "medium", title: "Landing", image: "card_857.jpg", correct: "You have the knees of a much more ordinary man." },
  { id: 986, spicy: true, level: "medium", title: "Removal", image: "card_986.jpg", correct: "He was aiming for the nurse. The nurse is not complaining." },
  { id: 1114, spicy: true, level: "medium", title: "Perimeter", image: "card_1114.jpg", correct: "We're not ruling out the salsa." },
  { id: 710, adult: true, level: "hard", title: "The Dent", image: "card_710.jpg", correct: "You're welcome to the daughter. Not the chair." },
  { id: 858, adult: true, level: "easy", title: "Penalty Box", image: "card_858.jpg", correct: "Two minutes for roughing up the thermostat." },
  { id: 987, adult: true, level: "medium", title: "Wardrobe", image: "card_987.jpg", correct: "Four thousand likes, Majesty. Not one of them has seen it in person." },
  { id: 1115, adult: true, level: "easy", title: "Window Units", image: "card_1115.jpg", correct: "Third floor has the best water pressure." },
  { id: 555, adult: true, level: "medium", title: "Dunk Tank", image: "card_555.jpg", correct: "He's the one who canceled the pension plan." },
  { id: 859, adult: true, level: "medium", title: "Studio Audience", image: "card_859.jpg", correct: "Don't encourage them. He forgot the anniversary again." },
  { id: 988, level: "medium", title: "Renewal", image: "card_988.jpg", correct: "Read the bottom line, then you may kiss the bride." },
  { id: 1116, adult: true, level: "medium", title: "Proof of Life", image: "card_1116.jpg", correct: "Breathe on it, Harold. They want it in writing." },
  { id: 711, level: "medium", title: "E-Stop", image: "card_711.jpg", correct: "He insisted on a lockout procedure before we start." },
  { id: 860, spicy: true, level: "medium", title: "Dawn Patrol", image: "card_860.jpg", correct: "It's always five o'clock at Gate 12." },
  { id: 989, level: "medium", title: "Prize Tomato", image: "card_989.jpg", correct: "Get it from below. It reads bigger from below." },
  { id: 1117, level: "easy", title: "Spinach", image: "card_1117.jpg", correct: "He thinks it's a new team-building exercise." },
  { id: 556, adult: true, level: "medium", title: "Handover", image: "card_556.jpg", correct: "He says six more weeks. HR says Friday." },
  { id: 861, level: "medium", title: "First Place", image: "card_861.jpg", correct: "The judges have asked for a second sample. For the car." },
  { id: 990, spicy: true, level: "medium", title: "Garage", image: "card_990.jpg", correct: "Give me five minutes. She's had a long day." },
  { id: 1118, level: "medium", title: "Field Test", image: "card_1118.jpg", correct: "Limestone. The goat agrees." },
  { id: 712, level: "easy", title: "Pivot", image: "card_712.jpg", correct: "Measure twice, conquer once." },
  { id: 862, adult: true, level: "easy", title: "Recline", image: "card_862.jpg", correct: "As long as you're here, you're due for a cleaning." },
  { id: 991, level: "medium", title: "Dissection", image: "card_991.jpg", correct: "Well, that's the whole lesson. Class dismissed." },
  { id: 1119, level: "medium", title: "Built to Spec", image: "card_1119.jpg", correct: "We even matched the coffee stain. It's the guest room." },
  { id: 557, level: "hard", title: "Season Ticket", image: "card_557.jpg", correct: "The schedule comes out in May. He prefers to be early." },
  { id: 863, level: "hard", title: "Rafters", image: "card_863.jpg", correct: "Thirty-one Thanksgivings. No one will ever wear that number again." },
  { id: 992, level: "hard", title: "Undersea", image: "card_992.jpg", correct: "Have you tried unplugging it and plugging it back in?" },
  { id: 1120, level: "medium", title: "Filtration", image: "card_1120.jpg", correct: "You said the vegetables were in there. He's checking." },
  { id: 713, level: "easy", title: "Five Seconds", image: "card_713.jpg", correct: "It's not the germs. It's the dog. The dog never respects the clock." },
  { id: 864, level: "medium", title: "Final Rose", image: "card_864.jpg", correct: "The dog got his rose in the first round." },
  { id: 993, adult: true, level: "medium", title: "Birthing Coach", image: "card_993.jpg", correct: "She wants an epidural. I told her we're a dairy, not a hospital." },
  { id: 1121, spicy: true, level: "medium", title: "Shadow Play", image: "card_1121.jpg", correct: "Best show at this campground since the bear got into the cooler." },
  { id: 676, adult: true, level: "hard", title: "Wind Tunnel", image: "card_676.jpg", correct: "He's ready for the Chicago office." },
  { id: 865, level: "hard", title: "Settling In", image: "card_865.jpg", correct: "We're fourth in line. The tomatoes should be ready by the time we unload." },
  { id: 994, level: "medium", title: "Charades", image: "card_994.jpg", correct: "Thirty years of marriage. She knew it from the way he picked up the card." },
  { id: 1122, level: "medium", title: "Hot Work", image: "card_1122.jpg", correct: "Technically, the permit is now the hot work." },
  { id: 714, level: "easy", title: "White Elephant", image: "card_714.jpg", correct: "House rules. You can only steal it twice." },
  { id: 866, level: "easy", title: "Returned", image: "card_866.jpg", correct: "It says it's not ready to talk about it." },
  { id: 995, level: "easy", title: "Unexpected Item", image: "card_995.jpg", correct: "He weighs exactly as much as a rotisserie chicken. It's a whole thing." },
  { id: 1123, adult: true, level: "medium", title: "Deconstructed", image: "card_1123.jpg", correct: "How would you like it cooked? Take your time. So will he." },
  { id: 558, adult: true, level: "easy", title: "Small Talk", image: "card_558.jpg", correct: "Bus is late again. Probably the weather." },
  { id: 867, adult: true, level: "easy", title: "Vitals", image: "card_867.jpg", correct: "Every time the pump clicks past fifty, the cuff goes off." },
  { id: 996, level: "medium", title: "Cake Walk", image: "card_996.jpg", correct: "Walter's been training since the Easter bake sale." },
  { id: 1124, level: "hard", title: "Fast Grower", image: "card_1124.jpg", correct: "Gary said it was a nice low-maintenance housewarming gift." },
  { id: 715, level: "medium", title: "Seniority", image: "card_715.jpg", correct: "Don't worry, kid. The bird took me a few years too." },
  { id: 868, adult: true, level: "medium", title: "Blackout", image: "card_868.jpg", correct: "I'll see your streaming service and raise you a cable box." },
  { id: 997, adult: true, level: "medium", title: "Ring Cutter", image: "card_997.jpg", correct: "She's been wanting to upgrade for years." },
  { id: 1125, level: "medium", title: "Regular", image: "card_1125.jpg", correct: "Same size as last month, Mr. Dale? Or are we going up?" },
  { id: 559, level: "medium", title: "Cup of Sugar", image: "card_559.jpg", correct: "Need anything else? Wi-Fi? Ice maker? A shower?" },
  { id: 869, adult: true, level: "hard", title: "Talking Head", image: "card_869.jpg", correct: "He doesn't know about the camera. He thinks we just find him fascinating." },
  { id: 998, spicy: true, level: "medium", title: "Wingman", image: "card_998.jpg", correct: "I think our apps are really hitting it off." },
  { id: 1126, level: "hard", title: "Two Keys", image: "card_1126.jpg", correct: "It's the recipe card. She trusts nobody alone with the paprika." },
  { id: 716, adult: true, level: "hard", title: "Prior Approval", image: "card_716.jpg", correct: "Your call is important to us. Your appendix, less so." },
  { id: 870, adult: true, level: "medium", title: "Miracle Flight", image: "card_870.jpg", correct: "Medical school never covered pre-boarding." },
  { id: 999, adult: true, level: "medium", title: "Mounted", image: "card_999.jpg", correct: "She goes out once a season. Says it relaxes her." },
  { id: 1127, adult: true, level: "medium", title: "Totality", image: "card_1127.jpg", correct: "I'll be in my office tomorrow. You'll be in my office tomorrow." },
  { id: 560, level: "easy", title: "Clocking In", image: "card_560.jpg", correct: "The turkey's been dreading his shift since August." },
  { id: 871, level: "medium", title: "Closing", image: "card_871.jpg", correct: "Thirty years at four percent, and the eggs are yours." },
  { id: 1000, spicy: true, level: "easy", title: "Drop-off", image: "card_1000.jpg", correct: "Mom said they'd be too sad to watch me go." },
  { id: 1128, adult: true, level: "medium", title: "Rate Your Visit", image: "card_1128.jpg", correct: "You can leave a comment after the anesthesia." },
  { id: 717, adult: true, level: "hard", title: "Transmutation", image: "card_717.jpg", correct: "I found your gold. It was holding up the bathroom." },
  { id: 872, level: "medium", title: "Intermission", image: "card_872.jpg", correct: "Brahms isn't going to play himself out there." },
  { id: 1001, level: "medium", title: "Quorum", image: "card_1001.jpg", correct: "Motion carries. The dog abstains on the leash law." },
  { id: 1129, spicy: true, level: "easy", title: "Shop Talk", image: "card_1129.jpg", correct: "Oh, you have to see this one. It's the same color as the sauce." },
  { id: 561, level: "medium", title: "Bulk", image: "card_561.jpg", correct: "At these prices, we can't afford not to." },
  { id: 873, level: "hard", title: "Carhop", image: "card_873.jpg", correct: "The car tips better than you do, Harold." },
  { id: 1002, adult: true, level: "medium", title: "Social Grooming", image: "card_1002.jpg", correct: "Start at the back. You'll work your way up to Gary." },
  { id: 1130, adult: true, level: "medium", title: "Hailstorm", image: "card_1130.jpg", correct: "Don't worry, kids. It's only three more payments." },
  { id: 718, adult: true, level: "easy", title: "Video Call", image: "card_718.jpg", correct: "Get some rest, sweetie. Your father and I are turning in early." },
  { id: 874, level: "easy", title: "Medical Tent", image: "card_874.jpg", correct: "Another ten minutes and they'll be fork-tender." },
  { id: 1003, level: "easy", title: "Front Moving In", image: "card_1003.jpg", correct: "We're seeing some stiffness moving in from the west." },
  { id: 1131, adult: true, level: "medium", title: "Deduction", image: "card_1131.jpg", correct: "And the fishing rod? Ergonomic mouse." },
  { id: 562, adult: true, level: "medium", title: "Site Visit", image: "card_562.jpg", correct: "Without a permit, it's coming out of your end of the field." },
  { id: 875, level: "medium", title: "Cliffhanger", image: "card_875.jpg", correct: "Seven letters, 'to be left hanging.' Any ideas?" },
  { id: 1004, adult: true, level: "medium", title: "Second Factor", image: "card_1004.jpg", correct: "Sorry to wake you. It's asking for a code." },
  { id: 1132, level: "medium", title: "Contraband", image: "card_1132.jpg", correct: "Keep your voice down. He knows a guy with pepper." },
  { id: 719, adult: true, level: "easy", title: "Lessons Learned", image: "card_719.jpg", correct: "Questions? Yes, the forklift is still a little touchy." },
  { id: 876, level: "medium", title: "Shrink Ray", image: "card_876.jpg", correct: "Same great taste, now with less of it." },
  { id: 1005, adult: true, level: "easy", title: "Heimlich", image: "card_1005.jpg", correct: "Technically, she caught the bouquet too." },
  { id: 1133, level: "easy", title: "Cornice", image: "card_1133.jpg", correct: "Gentlemen, I've decided to take a different route." },
  { id: 677, adult: true, level: "medium", title: "Vows", image: "card_677.jpg", correct: "It's exothermic. Her mother says that's a good sign." },
  { id: 877, level: "medium", title: "Bag Sizer", image: "card_877.jpg", correct: "He fits. That's three hundred dollars we're not spending on a seat." },
  { id: 1006, spicy: true, level: "medium", title: "Mayfly", image: "card_1006.jpg", correct: "He's going through something. He's six hours old." },
  { id: 1134, level: "medium", title: "Pinky Swear", image: "card_1134.jpg", correct: "Mom, he says we need two witnesses for the swings." },
  { id: 720, spicy: true, level: "medium", title: "Resemblance", image: "card_720.jpg", correct: "He gets it from my side. We all took tennis lessons." },
  { id: 878, level: "medium", title: "Played Off", image: "card_878.jpg", correct: "Bear with me. The proof is only forty minutes." },
  { id: 1007, level: "easy", title: "Holiday Visit", image: "card_1007.jpg", correct: "Merry Christmas. The tree's on the list too." },
  { id: 1135, adult: true, level: "hard", title: "Calorimetry", image: "card_1135.jpg", correct: "Bad news. That's forty minutes on the treadmill. Per sprinkle." },
  { id: 563, adult: true, level: "hard", title: "Water Hazard", image: "card_563.jpg", correct: "Put me down for a seven. And a cart." },
  { id: 879, spicy: true, level: "medium", title: "Walk of Shame", image: "card_879.jpg", correct: "The waffles are included. Everything else is between you and God." },
  { id: 1008, level: "hard", title: "Diamond Anniversary", image: "card_1008.jpg", correct: "It's a diamond. It just needs a few more weekends." },
  { id: 1136, adult: true, level: "medium", title: "Garden Tour", image: "card_1136.jpg", correct: "And next spring, you'll see these all over town." },
  { id: 721, adult: true, level: "medium", title: "Hybrid", image: "card_721.jpg", correct: "Sir Lancelot, you're on mute. Again." },
  { id: 880, adult: true, level: "medium", title: "Tagged", image: "card_880.jpg", correct: "And that's before college." },
  { id: 1009, level: "hard", title: "Liars' Table", image: "card_1009.jpg", correct: "If the Pentagon calls, tell them we're still on the eggs." },
  { id: 564, level: "easy", title: "Checkup", image: "card_564.jpg", correct: "Your numbers are fine. It's the flares I'm worried about." },
  { id: 881, level: "medium", title: "Five A.M.", image: "card_881.jpg", correct: "He's four. The pros don't start until five." },
  { id: 1010, adult: true, level: "medium", title: "Counsel", image: "card_1010.jpg", correct: "My client would like to play some relaxing rain sounds." },
  { id: 1138, level: "easy", title: "Lids", image: "card_1138.jpg", correct: "Keep looking, Duke. He's got the lid. We need the matching bottom." },
  { id: 722, level: "easy", title: "Squirrel-Proof", image: "card_722.jpg", correct: "He's been studying the plans since Phase One." },
  { id: 882, level: "hard", title: "Soul Delay", image: "card_882.jpg", correct: "Your soul has checked in. Your luggage is still in Denver." },
  { id: 1011, adult: true, level: "hard", title: "Honeypots", image: "card_1011.jpg", correct: "I didn't spend all summer hanging here to be your snack." },
  { id: 1139, adult: true, level: "easy", title: "Upstream", image: "card_1139.jpg", correct: "Removes ninety-nine percent of everything. The moose is the other one." },
  { id: 565, level: "medium", title: "The Podcast", image: "card_565.jpg", correct: "Our numbers went way up when Biscuit joined." },
  { id: 883, spicy: true, level: "hard", title: "Key Party", image: "card_883.jpg", correct: "Whoever gets Lenny's key also gets a ride home on the handlebars." },
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

// The permanent Gallery deck (lives across games and game nights)
const store = require('./store');
const Rating = require('./rating');
// A room's Gallery starts from the server's saved copy (when there is one); phones add theirs on join
function newRoomDeck() { const d = store.createDeck(); if (store.file) for (const e of store.all().reverse()) d.add(e, true); return d; }
const deckOf = (game) => game.deck || (game.deck = newRoomDeck());
// A Gallery caption is stamped by the server when a table frames it
const crypto = require('crypto');
const SIGN_KEY = process.env.GALLERY_KEY || 'closed-caption/gallery/v1';
const sigOf = (e) => crypto.createHmac('sha256', SIGN_KEY).update(Number(e.cartoonId) + '|' + store.norm(e.caption) + '|' + String(e.author || '').toLowerCase()).digest('base64url').slice(0, 32);
// Phones carry the Gallery between nights: merge what one brings (max 300, cartoons we know)
function syncGallery(game, entries) {
  if (!Array.isArray(entries)) return { error: 'That didn’t take. Try again.' };
  const known = new Set(CARTOONS.map(c => c.id)); let added = 0, refused = 0;
  for (const e of entries.slice(0, 300)) {
    if (!e || isRetiredId(e.cartoonId) || !known.has(Number(e.cartoonId))) { refused++; continue; }
    if (deckOf(game).add(e, true)) added++;
  }
  return { ok: true, added, refused };
}

const MAX_PLAYERS = 8;
const first1 = (name) => (String(name || '').trim().split(/\s+/)[0]) || String(name || '');
const ordinal = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
// A night-long shuffle bag: every item once before any repeats, never the same one twice running
function dealNight(game, name, list) {
  const decks = game.nightDecks || (game.nightDecks = {});
  let d = Array.isArray(decks[name]) ? decks[name].filter(x => list.includes(x)) : [];
  if (!d.length) { d = shuffleArray(list); if (d.length > 1 && d[0] === decks[name + '^']) d.push(d.shift()); }
  const x = d.shift();
  decks[name] = d; decks[name + '^'] = x;
  return x;
}

/* The steal show (public/steal.js and the films in public/steals/). The night's first steal gets the full show, then at
   most one full show a game (about one steal in four); every other steal is the short one. Never decided by where the
   chip was, so the show can't hint at the answer. The films are dealt like a deck for the night. */
const HEISTS = [['chameleon', 'The Chameleon'], ['octopus', 'The Octopus'], ['laundry', 'The One Red Sock'], ['sunbather', 'The Tan'], ['blush', 'The Charmer'], ['titration', 'The Endpoint'], ['shellgame', 'The Shell Game'], ['contraption', 'The Machine'], ['pollen', 'The Bumblebee'], ['bubblegum', 'The Bubble'], ['fondue', 'The Fondue'], ['auntie', 'The Auntie'], ['raincloud', 'The Little Cloud'], ['highlighter', 'The Highlighter'], ['crayon', 'The Coloring Book'], ['bathbomb', 'The Bath Bomb'], ['paintball', 'High Noon'], ['frosting', 'The Baker'], ['magichat', 'The Magician'], ['polaroid', 'The Snapshot'], ['cottoncandy', 'The Fair'], ['jerseyswap', 'The Jersey Swap'], ['dunk', 'The Victory Shower'], ['putt', 'The Winner’s Jacket'], ['icerink', 'Between Periods'], ['wave', 'The Wave'], ['phonebooth', 'The Quick Change'], ['glowstick', 'Lights Out']].map(([id, name]) => ({ id, name }));
function nextHeist(game) { const id = dealNight(game, 'thieves', HEISTS.map(h => h.id)); return Math.max(0, HEISTS.findIndex(h => h.id === id)); }
const STEAL_CAUGHT_PTS = 1;   // a chip stolen off a fake caption pays its owner this much
// How long each steal show runs on the phones (public/steal.js FILM_MS / SHORT_MS); the flip waits for it
const STEAL_FULL_MS = 10300, STEAL_SHORT_MS = 4500, STEAL_FULL_SHARE = 0.25;
// Bets: everyone at once, in secret. The clock catches anyone idle; the last chip in gets a beat (to take it back),
// then every chip drops onto the table together and the table gets a look.
const BLIND_MS = 45000, ALL_IN_BEAT_MS = 1500, DROP_HOLD_MS = 3200;
const LATE_BET_MS = 30000, BET_MORE_MS = 20000;
const FLIP_MS = 2400;   // the card turning over on the phones: the last chips' clock starts after it
const CAPTION_MAX = 100;   // the real ones are under 75 characters
/* Seats (Nick, Oct 29 2026: "it said that I was no longer the dealer or no longer hosting"). A phone that locks or
   drops keeps its seat, its deals and the host's job for GONE_MS; only after that (or when the player leaves, or the
   host moves on without them) does the seat count as gone. Waiting on captions and chips is separate and short
   (AWAY_WAIT_MS), so a dead phone never holds the table up. */
const GONE_MS = 15 * 60000;
const AWAY_WAIT_MS = 12000;
const STANDIN_MS = 120000;   // the dealer's phone really off this long: the host's phone may move on without them

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // no I or O
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/* Settings. The lobby sets three things: the writing timer, the game length and the deck. Everything else is fixed. */
const DEFAULT_SETTINGS = {
  rounds: null,                  // (older phones) a fixed number of rounds, played as whole trips around the table
  targetScore: null,             // first to N points (the trip around the table is finished first)
  laps: 2,                       // everyone deals once (1), twice (2) or three times (3)
  family: false,                 // the Family deck
  spicy: true,                   // the Everything deck (Standard = neither)
};
const FIXED = {
  pointsOpenBet: 2,              // blind chip on the real caption, out in the open
  pointsClosedBet: 5,            // blind chip on the face-down caption when it's the real one
  pointsOpenLate: 1,             // late chip (after the flip) on the real caption
  pointsClosedLate: 1,
  pointsPerFool: 2,              // to the writer, for each chip someone else puts on their caption
  dealerBonus: 4,                // dealer's revenge: no other player's chip ends up on the real caption
  autoCloseProbability: 0.15,    // share of rounds where the real caption is the face-down one
  dealerMode: 'both',            // the dealer bets 2 chips, then steals one of another player's chips
  stealEnabled: true,
  direction: 'left',
  expert: false,
  voice: null,
  house: null,
};
const settingsOf = (game) => ({ ...DEFAULT_SETTINGS, ...(game.settings || {}), ...FIXED });

// Writing timer: 0 = no timer, else 30 s to 10 min
const DEFAULT_TIMER = 120;
function cleanTimer(t) {
  const n = Number(t);
  if (t === null || t === undefined || t === '' || !Number.isInteger(n)) return null;
  return n === 0 || (n >= 30 && n <= 600) ? n : null;
}

function createGame(hostId, hostName, timerDuration = DEFAULT_TIMER, seenIds = []) {
  return {
    v: 3,
    seenIds: cleanSeen(seenIds),
    seenBy: { [hostId]: cleanSeen(seenIds) },
    deck: newRoomDeck(),
    closePlan: [],
    flags: [], framePicks: {}, roundFrames: [], inducted: [], lastInduction: null, nightFrames: 0,
    code: generateRoomCode(),
    phase: PHASES.LOBBY,
    phaseAt: Date.now(),
    stealShows: 0, nightSteals: 0,
    blind: {}, blindEnd: null, dropAt: null,
    lateBlind: {}, lateEnd: null, lateDropAt: null,
    flipped: false, flipAt: null,
    finalLaps: null, fixedLaps: null,
    players: [{ id: hostId, name: hostName, score: 0, connected: true }],
    hostId,
    timerDuration,
    settings: { ...DEFAULT_SETTINGS },
    round: 0,
    dealerIndex: -1,
    dealCount: {},
    usedCartoonIds: [],
    cartoon: null,
    correctCaption: '',
    autoClose: false,
    submissions: [],
    closedCaption: '', closedIsCorrect: false, closedPlayerId: null,
    openCaptions: [],
    firstBets: {}, secondBets: {},
    bets: [],
    betOrder: [],
    steal: null, stealEnd: 0,
    mulliganVotes: [], mulliganCount: 0, mulliganEvent: null,
    roundScores: {}, roundScoreDetails: {}, dealerBonusAwarded: false, previousRank: {},
    timerEnd: null, timerToken: 0,
    history: [],
    reactions: {},
    reel: null,
    gameNo: 0,
    ratingSnap: null, ratingResult: null,
    ending: null, finale: null, over: false,
  };
}

function setPhase(game, phase) { game.phase = phase; game.phaseAt = Date.now(); }

/* ── Seen cartoons: nobody at the table sees a repeat until they've seen the whole deck ── */
function cleanSeen(ids) {
  const valid = new Set(CARTOONS.map(c => c.id));
  return Array.isArray(ids) ? [...new Set(ids.map(Number).filter(n => valid.has(n)))] : [];
}
function setSeen(game, ids) { game.seenIds = cleanSeen(ids); (game.seenBy = game.seenBy || {})[game.hostId] = game.seenIds; }
function setPlayerSeen(game, playerId, ids) {
  if (!game.players.some(p => p.id === playerId)) return { error: 'You’re not in this game.' };
  if (!Array.isArray(ids)) return { error: 'That didn’t take. Try again.' };
  (game.seenBy = game.seenBy || {})[playerId] = cleanSeen(ids.slice(0, 200));
  return { ok: true };
}
function seenCounts(game) {
  const here = new Set(game.players.map(p => p.id)), n = new Map();
  for (const [pid, ids] of Object.entries(game.seenBy || {})) if (here.has(pid)) for (const id of ids) n.set(id, (n.get(id) || 0) + 1);
  return n;
}
const NEWEST_FROM = FIRST_LIVE_ID;
function seenAgo(game) {
  const here = new Set(game.players.map(p => p.id)), m = new Map();
  for (const [pid, ids] of Object.entries(game.seenBy || {})) if (here.has(pid))
    ids.forEach((id, i) => { const a = ids.length - 1 - i; m.set(id, Math.min(m.has(id) ? m.get(id) : a, a)); });
  return m;
}
// Of these cartoons, the ones the fewest people here have seen (ideally nobody)
function freshest(game, list) {
  if (!list.length) return list;
  const n = seenCounts(game), min = Math.min(...list.map(c => n.get(c.id) || 0));
  const out = list.filter(c => (n.get(c.id) || 0) === min);
  if (min === 0) { const newest = out.filter(c => c.id >= NEWEST_FROM); return newest.length ? newest : out; }
  const ago = seenAgo(game), most = Math.max(...out.map(c => ago.get(c.id) ?? 1e9));
  return out.filter(c => (ago.get(c.id) ?? 1e9) === most);
}

/* ── The lobby: timer, game length, deck (anything else a phone sends is ignored) ── */
function updateSettings(game, partial) {
  if (game.phase !== PHASES.LOBBY) return { error: 'Settings can only be changed in the lobby' };
  const s = game.settings = { ...DEFAULT_SETTINGS, ...(game.settings || {}) };
  const bad = { error: 'That didn’t take. Try again.' };
  const next = { ...s };
  for (const key of Object.keys(partial || {})) {
    const val = partial[key];
    if (key === 'laps') { const n = Number(val); if (![1, 2, 3].includes(n)) return bad; next.laps = n; }
    else if (key === 'rounds' || key === 'targetScore') {
      if (val === null || val === undefined || val === '') { next[key] = null; continue; }
      const n = Number(val); if (!Number.isInteger(n) || n < 1 || n > 100) return bad; next[key] = n;
    }
    else if (key === 'family') { next.family = !!val; if (next.family) next.spicy = false; }
    else if (key === 'spicy') { next.spicy = !!val; if (next.spicy) next.family = false; }
    // everything else (dealer mode, seating direction, odds, points, house players, Gallery mode…) is fixed now
  }
  Object.assign(s, { rounds: next.rounds, targetScore: next.targetScore, laps: next.laps, family: next.family, spicy: next.spicy });
  return { ok: true };
}

function addPlayer(game, playerId, playerName) {
  if (game.players.length >= MAX_PLAYERS) return { error: `The table’s full (${MAX_PLAYERS} max)` };
  if (game.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) return { error: 'Someone here already has that name' };
  // Late joiners sit at the end of the table and start level with last place
  const live = game.players.filter(p => !isGone(p));
  const start = game.phase !== PHASES.LOBBY && live.length ? Math.max(0, Math.min(...live.map(p => p.score || 0))) : 0;
  game.players.push({ id: playerId, name: playerName, score: start, connected: true, joinedRound: game.round });
  return { ok: true, midGame: game.phase !== PHASES.LOBBY };
}
function kickPlayer(game, hostId, targetPlayerId) {
  if (game.phase !== PHASES.LOBBY) return { error: 'Can only remove players in the lobby' };
  if (game.hostId !== hostId) return { error: 'Only the host can remove players' };
  if (hostId === targetPlayerId) return { error: 'You can’t remove yourself' };
  const target = game.players.find(p => p.id === targetPlayerId);
  if (!target) return { error: 'You’re not in this game.' };
  game.players = game.players.filter(p => p.id !== targetPlayerId);
  return { ok: true, kickedName: target.name };
}
// Mid-game, the host moves on without someone (their phone died, or they went home): their seat stays (scores are
// kept) but it no longer deals or holds anything up. They can come back with the same name.
function removePlayer(game, hostId, targetId) {
  if (game.hostId !== hostId) return { error: 'Only the host can do that' };
  if (hostId === targetId) return { error: 'You can’t remove yourself' };
  if (game.phase === PHASES.LOBBY) return kickPlayer(game, hostId, targetId);
  const p = game.players.find(x => x.id === targetId);
  if (!p) return { error: 'You’re not in this game.' };
  p.gone = true; p.connected = false; p.disconnectedAt = p.disconnectedAt || Date.now();
  return { ok: true, name: p.name, midGame: true };
}

const dealerOf = (game) => game.players[game.dealerIndex] || null;
const nameOfPlayer = (game, pid) => (game.players.find(p => p.id === pid) || {}).name || '?';
// Gone for good: left, moved on without by the host, or away past GONE_MS
const isGone = (p, now = Date.now()) => !!p && (!!p.gone || (!p.connected && !!p.disconnectedAt && now - p.disconnectedAt >= GONE_MS));
const isSeated = (p) => !!p && !isGone(p);
// (kept for the server and old callers: a seat that still counts)
const isPresent = isSeated;
const awayMs = (p, now = Date.now()) => (!p || p.connected || !p.disconnectedAt ? 0 : now - p.disconnectedAt);

/* ── The deal: everyone deals the same number of times (laps); the deal passes left ── */
const seatAt = (n, i) => ((i % n) + n) % n;
function lapsOf(game) {
  const s = settingsOf(game);
  if (s.targetScore) return game.finalLaps || null;
  if (s.rounds) return game.fixedLaps || Math.max(1, Math.ceil(s.rounds / Math.max(1, game.players.length)));
  return [1, 2, 3].includes(s.laps) ? s.laps : 2;
}
// The next seat after `from` that is still at the table and still has a deal to come
function nextDealerIndex(game, from) {
  const n = game.players.length;
  if (!n) return -1;
  const laps = lapsOf(game), counts = game.dealCount || {};
  const owed = (p) => !laps || (counts[p.id] || 0) < laps;
  const start = from < 0 ? -1 : from;
  for (let k = 1; k <= n; k++) { const i = seatAt(n, start + k), p = game.players[i]; if (isSeated(p) && owed(p)) return i; }
  for (let k = 1; k <= n; k++) { const i = seatAt(n, start + k); if (isSeated(game.players[i])) return i; }
  return seatAt(n, start + 1);
}
// Rounds so far plus every deal still owed to someone at the table (null: first to N, nobody there yet)
function totalRounds(game) {
  const n = game.players.length, laps = lapsOf(game);
  if (!laps) return null;
  if (!game.round || game.dealerIndex < 0) return game.players.filter(isSeated).length * laps || n * laps;
  const c = game.dealCount || {};
  let more = 0;
  for (const p of game.players) if (isSeated(p)) more += Math.max(0, laps - (c[p.id] || 0));
  return game.round + more;
}
function liveOver(game) {
  if (game.deckOut) return true;
  if (!lapsOf(game)) return false;
  return game.round >= totalRounds(game);
}
const isGameOver = (game) => !!game.over;
// The scoreboard's 'next round' tap: if nobody left at the table has a deal to come, the game ends here
function finishIfOver(game) {
  if (game.over) return true;
  if (game.phase !== PHASES.SCORES || !liveOver(game)) return false;
  endGame(game);
  return true;
}

/* ── Which rounds have the real caption face-down: about 15% of rounds, never two in a row ── */
function planBlock(len, k, forbidFirst) {
  const start = forbidFirst ? 1 : 0, m = len - start;
  k = Math.max(0, Math.min(k, Math.ceil(m / 2)));
  const picks = shuffleArray([...Array(Math.max(0, m - k + 1)).keys()]).slice(0, k).sort((a, b) => a - b);
  const block = Array(len).fill(false);
  picks.forEach((c, i) => { block[start + c + i] = true; });
  return block;
}
const luckyCount = (n, p) => { let k = 0; for (let i = 0; i < n; i++) if (Math.random() < p) k++; return k; };
function ensurePlan(game, round) {
  const p = FIXED.autoCloseProbability;
  if (!game.closePlan.length && !settingsOf(game).targetScore) { const n = totalRounds(game) || 7; game.closePlan = planBlock(n, luckyCount(n, p), false); }
  while (game.closePlan.length < round) game.closePlan.push(...planBlock(7, luckyCount(7, p), !!game.closePlan[game.closePlan.length - 1]));
  return !!game.closePlan[round - 1];
}

/* ── The hidden difficulty: a game opens easier and builds; a table of regulars gets more hard ones ── */
const LEVELS = ['easy', 'medium', 'hard'];
const levelOf = (c) => LEVELS.includes(c.level) ? c.level : 'medium';
const REGULAR_GAMES = 5;
const SETLIST = {
  fresh:   [[0.75, 0.25, 0.00], [0.40, 0.55, 0.05], [0.25, 0.60, 0.15]],
  regular: [[0.40, 0.50, 0.10], [0.15, 0.50, 0.35], [0.05, 0.40, 0.55]],
};
function tableKind(game) {
  const ps = game.players.filter(p => p.connected !== false), list = ps.length ? ps : game.players;
  const regulars = list.filter(p => (p.games || 0) >= REGULAR_GAMES).length;
  return list.length && regulars * 2 > list.length ? 'regular' : 'fresh';
}
function setPosition(game) {
  const s = settingsOf(game), round = Math.max(1, game.round || 1);
  const total = s.targetScore ? Math.max(6, game.players.length * 2) : Math.max(1, totalRounds(game) || 1);
  if (total <= 1) return 0;
  const f = (round - 1) / (total - 1);
  return f < 1 / 3 ? 0 : f < 2 / 3 ? 1 : 2;
}
function pickByLevel(game, list) {
  if (list.length <= 1) return list[0];
  const w = SETLIST[tableKind(game)][setPosition(game)];
  const by = { easy: [], medium: [], hard: [] };
  for (const c of list) by[levelOf(c)].push(c);
  const r = Math.random() * (w[0] + w[1] + w[2]), lv = r < w[0] ? 'easy' : r < w[0] + w[1] ? 'medium' : 'hard';
  const order = lv === 'easy' ? ['easy', 'medium', 'hard'] : lv === 'hard' ? ['hard', 'medium', 'easy'] : (w[0] >= w[2] ? ['medium', 'easy', 'hard'] : ['medium', 'hard', 'easy']);
  for (const l of order) if (by[l].length) return pickVaried(game, by[l]);
  return pickVaried(game, list);
}
// Variety: never the same creator or style back to back, little shared setting with the last three (card_meta.json)
let CARD_META = {};
try { CARD_META = require('./card_meta.json'); } catch (e) { CARD_META = {}; }
function samenessScore(id, recent) {
  const m = CARD_META[id];
  if (!m) return 0;
  let s = 0;
  recent.forEach((rid, k) => {
    const r = CARD_META[rid]; if (!r) return;
    if (k === 0 && m.voice && m.voice === r.voice) s += 3;
    if (k === 0 && m.style && m.style === r.style) s += 2;
    s += (m.tags || []).filter(t => (r.tags || []).includes(t)).length * (k === 0 ? 3 : k === 1 ? 2 : 1);
  });
  return s;
}
function pickVaried(game, list) {
  if (list.length <= 1) return list[0];
  const recent = (game.usedCartoonIds || []).slice(-3).reverse();
  if (!recent.length) return pick(list);
  let best = Infinity, bestList = [];
  for (const c of list) { const s = samenessScore(c.id, recent); if (s < best) { best = s; bestList = [c]; } else if (s === best) bestList.push(c); }
  return pick(bestList);
}

// Never deal a cartoon whose picture isn't on the server (checked once at start), nor a pulled one
const HAS_IMAGE = (() => { const fs = require('fs'), path = require('path'), dir = path.join(__dirname, 'public', 'images'); const ok = new Set(); for (const c of CARTOONS) { try { if (c.image && fs.statSync(path.join(dir, c.image)).size > 0) ok.add(c.id); } catch (e) {} } return ok; })();
const PULLED = new Set([116, 121, 126, 136, 146, 151, 157, 197, 213, 235, 240, 245, 255, 275, 280, 285, 290, 300, 305, 310, 315, 320, 330, 332, 337, 339, 346, 349, 354, 356, 362, 369, 379, 389, 394, 399, 402, 407, 412, 417, 427, 438, 442]);
const allowed = (game) => { const s = settingsOf(game); return CARTOONS.filter(c => HAS_IMAGE.has(c.id) && !isRetiredId(c.id) && !PULLED.has(c.id) && !(s.family && (c.adult || c.spicy)) && !(c.spicy && !s.spicy)); };
const canDeal = (game) => allowed(game).some(c => !(game.usedCartoonIds || []).includes(c.id) && !(game.cartoon && c.id === game.cartoon.id));
function dealCartoon(game) {
  const currentId = game.cartoon ? game.cartoon.id : null;
  const available = freshest(game, allowed(game).filter(c => !game.usedCartoonIds.includes(c.id) && c.id !== currentId));
  if (!available.length) return false;
  const cartoon = pickByLevel(game, available);
  game.usedCartoonIds.push(cartoon.id);
  game.cartoon = { id: cartoon.id, image: cartoon.image };
  game.correctCaption = cartoon.correct;
  game.autoClose = ensurePlan(game, Math.max(1, game.round));
  game.submissions = [];
  game.mulliganVotes = [];
  game.timerEnd = game.timerDuration > 0 ? Date.now() + game.timerDuration * 1000 : null;
  game.timerToken = (game.timerToken || 0) + 1;
  return true;
}
// Before a game starts: enough cartoons in this deck for the whole game?
function deckStatus(game) {
  const s = settingsOf(game), n = Math.max(3, game.players.filter(p => p.connected).length), laps = [1, 2, 3].includes(s.laps) ? s.laps : 2;
  const need = s.targetScore ? Math.max(6, n) : s.rounds ? n * Math.ceil(s.rounds / n) : n * laps;
  const pool = allowed(game), seen = seenCounts(game), used = new Set(game.usedCartoonIds || []);
  const fresh = pool.filter(c => !(seen.get(c.id) > 0) && !used.has(c.id)).length;
  return { live: CARTOONS.length, pool: pool.length, fresh, need, ok: pool.length >= need, drawing: CARTOONS.length < DECK_DRAWN };
}
const nWord = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
function deckLine(d) { return d.live ? `The new deck is being drawn. ${nWord(d.live, 'cartoon')} so far.` : 'The new deck is being drawn. No cartoons yet.'; }
function startCheck(game) {
  const d = deckStatus(game);
  if (d.ok) return { ok: true };
  return { error: d.pool ? `This game needs ${nWord(d.need, 'cartoon')}. This deck has ${d.pool}.` : 'No cartoons in this deck yet.' };
}
function endForDeck(game) { game.deckOut = true; game.notice = { text: 'That was the last new cartoon. Final scores.', at: Date.now() }; }

function startRound(game, options = {}) {
  if (!options.sameRound && !canDeal(game)) return { error: 'The deck is out of new cartoons' };
  if (!options.sameRound) {
    game.round++;
    const s = settingsOf(game);
    if (game.round === 1 && s.rounds && !s.targetScore) game.fixedLaps = Math.max(1, Math.ceil(s.rounds / Math.max(1, game.players.filter(isSeated).length || game.players.length)));
    game.dealerIndex = nextDealerIndex(game, game.dealerIndex < 0 && game.firstDealFrom >= 0 ? game.firstDealFrom : game.dealerIndex);
    const d = game.players[game.dealerIndex];
    if (d) { game.dealCount = game.dealCount || {}; game.dealCount[d.id] = (game.dealCount[d.id] || 0) + 1; }
  }
  if (!dealCartoon(game)) {
    game.submissions = []; game.mulliganVotes = [];
    game.timerEnd = game.timerDuration > 0 ? Date.now() + game.timerDuration * 1000 : null;
    game.timerToken = (game.timerToken || 0) + 1;
    game.notice = { text: 'Same cartoon. The deck has nothing new left.', at: Date.now() };
  }
  if (game.round === 1 && !options.sameRound && !game.ratingSnap) beginRated(game);
  game.blind = {}; game.blindEnd = null; game.dropAt = null;
  game.lateBlind = {}; game.lateEnd = null; game.lateDropAt = null;
  game.flipped = false; game.flipAt = null;
  game.closedCaption = ''; game.closedIsCorrect = false; game.closedPlayerId = null;
  game.openCaptions = [];
  game.firstBets = {}; game.secondBets = {};
  game.bets = []; game.betOrder = []; game.betMore = null;
  game.steal = null; game.stealEnd = 0; game.nextThief = null;
  game.mulliganEvent = null;
  game.roundScores = {}; game.roundScoreDetails = {}; game.dealerBonusAwarded = false;
  game.reactions = {};
  game.reel = null;
  game.framePicks = {}; game.roundFrames = [];
  setPhase(game, PHASES.WRITING);
  return { ok: true };
}

/* ── Writing ── */
const waitingWriters = (game) => game.players.filter(p => isSeated(p) && !game.submissions.some(s => s.playerId === p.id)).map(p => p.id);
// Everyone at the table has written
function allCaptionsIn(game) { const here = game.players.filter(isSeated); return here.length > 0 && here.every(p => game.submissions.some(s => s.playerId === p.id)); }
// Everyone whose phone is on has written (a phone that went off gets AWAY_WAIT_MS, never the whole clock)
function connectedAllIn(game) {
  const on = game.players.filter(p => p.connected && !p.gone);
  return game.submissions.length >= 2 && on.length > 0 && on.every(p => game.submissions.some(x => x.playerId === p.id));
}
const normCaption = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
// Word for word (or nearly) the real caption. Strict on purpose: a loose test would hint at the real answer.
function tooCloseToReal(a, real) {
  const x = normCaption(a), y = normCaption(String(real || '').replace(/\s*\(\d+\)\s*$/, ''));
  if (!x || !y) return false;
  if (x === y) return true;
  const xs = x.split(' '), ys = y.split(' ');
  if (xs.length < 4 || ys.length < 4) return false;
  const wx = new Set(xs), wy = new Set(ys), both = [...wx].filter(w => wy.has(w)).length;
  return both / new Set([...wx, ...wy]).size >= 0.8;
}
// mode: 'check' = likely typos go back to the writer first; 'fix' = with the fixes; 'keep' = as typed.
// Punctuation, capitals and apostrophes are always tidied.
function submitCaption(game, playerId, caption, mode = 'check') {
  if (game.phase !== PHASES.WRITING) return { error: 'Writing time is over' };
  const player = game.players.find(p => p.id === playerId);
  if (!player) return { error: 'You’re not in this game.' };
  if (game.submissions.some(s => s.playerId === playerId)) return { error: 'Already submitted' };
  const raw = (caption || '').toString();
  if (raw.length > CAPTION_MAX * 2) return { error: 'Too long. The real ones are short.' };
  const p = polish(raw);
  if (!p.text || !/[\p{L}\p{N}]/u.test(p.text)) return { error: 'Write something first.' };
  if (p.text.length > CAPTION_MAX) return { error: 'Too long. The real ones are short.' };
  if (mode === 'check' && p.typos.length) return { ok: true, check: { polished: p.text, fixed: p.fixed, typos: p.typos } };
  const finalText = (mode === 'keep' ? p.text : p.fixed).slice(0, CAPTION_MAX + 20);
  if (tooCloseToReal(finalText, game.correctCaption)) return { error: 'Too close to the real one. Write your own.' };
  game.submissions.push({ playerId, playerName: player.name, caption: finalText });
  return { ok: true, allIn: allCaptionsIn(game) };
}
// The skip vote: half the table (at least 2) swaps the cartoon for a fresh one, with a fresh clock
function mulliganThreshold(game) { const c = game.players.filter(p => p.connected && !p.gone).length; return c < 2 ? 1 : Math.max(2, Math.ceil(c / 2)); }
function voteMulligan(game, playerId) {
  if (game.phase !== PHASES.WRITING) return { error: 'You can only skip a cartoon while writing.' };
  if (!game.players.some(p => p.id === playerId)) return { error: 'You’re not in this game.' };
  const i = game.mulliganVotes.indexOf(playerId);
  if (i >= 0) { game.mulliganVotes.splice(i, 1); return { ok: true, triggered: false }; }
  game.mulliganVotes.push(playerId);
  const here = new Set(game.players.filter(p => p.connected && !p.gone).map(p => p.id));
  if (game.mulliganVotes.filter(id => here.has(id)).length < mulliganThreshold(game)) return { ok: true, triggered: false };
  if (!dealCartoon(game)) { game.mulliganVotes = []; game.notice = { text: 'That’s the last new cartoon. It stays.', at: Date.now() }; return { ok: true, triggered: false, skipped: true }; }
  game.mulliganCount = (game.mulliganCount || 0) + 1;
  game.mulliganEvent = { n: game.mulliganCount, at: Date.now() };
  game.notice = { text: 'Skipped. Here’s a new cartoon.', at: Date.now() };
  return { ok: true, triggered: true };
}
// Writing is over: the app picks the face-down caption (a player's, or now and then the real one) and lays out the rest
function finishWriting(game) {
  if (game.phase !== PHASES.WRITING) return { ok: true, noop: true };
  if (game.submissions.length === 0) return { ok: true, empty: true };
  const subs = shuffleArray(game.submissions);
  if (game.autoClose) {
    game.closedCaption = game.correctCaption; game.closedIsCorrect = true; game.closedPlayerId = null;
    game.openCaptions = shuffleArray(subs.map(s => ({ caption: s.caption, isCorrect: false, playerId: s.playerId })));
  } else {
    const chosen = subs[0];
    game.closedCaption = chosen.caption; game.closedIsCorrect = false; game.closedPlayerId = chosen.playerId;
    const opens = subs.slice(1).map(s => ({ caption: s.caption, isCorrect: false, playerId: s.playerId }));
    opens.push({ caption: game.correctCaption, isCorrect: true, playerId: null });
    game.openCaptions = shuffleArray(opens);
  }
  game.mulliganVotes = [];
  setPhase(game, PHASES.READING);
  return { ok: true };
}

/* ── Bets: everyone at once, in secret, 1 or 2 chips; the dealer bets too (last in the order) ── */
function computeBetOrder(game) {
  const n = game.players.length, order = [];
  for (let k = 1; k < n; k++) { const p = game.players[seatAt(n, game.dealerIndex + k)]; if (isSeated(p)) order.push(p.id); }
  const dealer = dealerOf(game);
  if (dealer) order.push(dealer.id);
  return order;
}
function moveToFirstBets(game) {
  if (game.phase !== PHASES.READING) return { error: 'Too late — the game moved on' };
  game.betOrder = computeBetOrder(game);
  game.bets = []; game.firstBets = {}; game.secondBets = {}; game.blind = {};
  game.dropAt = null; game.flipAt = null; game.flipped = false;
  game.blindEnd = Date.now() + BLIND_MS;
  game.betMore = null;
  setPhase(game, PHASES.FIRST_BETS);
  return { ok: true };
}
const stageBet = (game, pid, stage) => game.bets.find(b => b.playerId === pid && b.stage === stage) || null;
const hasBlind = (game, pid) => !!(game.blind && game.blind[pid]) || !!stageBet(game, pid, 1);
const hasLate = (game, pid) => !!(game.lateBlind && game.lateBlind[pid]) || !!stageBet(game, pid, 2);
// Holding one chip after the flip: bet one chip blind (stolen or not), or sat the blind bet out while here
function eligibleSecondBetters(game) {
  return game.betOrder.filter(pid => {
    const b1 = stageBet(game, pid, 1);
    if (!b1) return false;
    return b1.target === 'pass' ? !!b1.late : (b1.count + (b1.stolen || 0)) === 1;
  });
}
// Who the table is still waiting on (anyone still at the table; a phone that's off gets a short wait, see the server)
function pendingBetters(game) {
  const seated = (pid) => isSeated(game.players.find(x => x.id === pid));
  if (game.phase === PHASES.FIRST_BETS) return game.dropAt ? [] : game.betOrder.filter(pid => !hasBlind(game, pid) && seated(pid));
  if (game.phase === PHASES.SECOND_BETS) return game.lateDropAt ? [] : eligibleSecondBetters(game).filter(pid => !hasLate(game, pid) && seated(pid));
  return [];
}
function onlyAwayPending(game) {
  const pend = pendingBetters(game);
  return pend.length > 0 && pend.every(pid => { const p = game.players.find(x => x.id === pid); return !p || !p.connected; });
}
// Anyone at the table, once per betting stage: 20 more seconds
function moreBetTime(game, pid) {
  const who = first1(nameOfPlayer(game, pid));
  if (game.phase === PHASES.FIRST_BETS && !game.dropAt && game.blindEnd) {
    if (game.betMore) return { error: 'Already added time once this round.' };
    game.blindEnd += BET_MORE_MS; game.betMore = who; return { ok: true, stage: 1 };
  }
  if (game.phase === PHASES.SECOND_BETS && !game.lateDropAt && game.lateEnd) {
    if (game.betMore) return { error: 'Already added time once this round.' };
    game.lateEnd += BET_MORE_MS; game.betMore = who; return { ok: true, stage: 2 };
  }
  return { error: 'No clock to stretch right now' };
}
function validateTarget(game, target) {
  if (target === 'closed') return { ok: true, target: 'closed' };
  if ((typeof target !== 'number' && typeof target !== 'string') || target === '') return { error: 'That didn’t take. Try again.' };
  const idx = Number(target);
  if (!Number.isInteger(idx) || idx < 0 || idx >= game.openCaptions.length) return { error: 'That didn’t take. Try again.' };
  return { ok: true, target: idx };
}
function placeBet(game, playerId, betTarget) {
  const stage = game.phase === PHASES.FIRST_BETS ? 1 : game.phase === PHASES.SECOND_BETS ? 2 : 0;
  if (!stage) return { error: 'Too late — the game moved on' };
  if (!betTarget || typeof betTarget !== 'object') return { error: 'That didn’t take. Try again.' };
  const count = Number(betTarget.count);
  if (stage === 1) {
    if (game.dropAt) return { error: 'The chips are down' };
    if (hasBlind(game, playerId)) return { error: 'You already bet' };
    if (!game.betOrder.includes(playerId)) return { error: 'You sit this round out' };
    if (count !== 1 && count !== 2) return { error: 'That didn’t take. Try again.' };
    const v = validateTarget(game, betTarget.target); if (v.error) return v;
    game.blind[playerId] = { target: v.target, count, at: Date.now() };
    return { ok: true, allIn: pendingBetters(game).length === 0 };
  }
  if (game.lateDropAt) return { error: 'The chips are down' };
  if (hasLate(game, playerId)) return { error: 'You already bet' };
  if (!eligibleSecondBetters(game).includes(playerId)) return { error: 'No chips left this round' };
  if (count !== 1) return { error: 'You have one chip left' };
  const v = validateTarget(game, betTarget.target); if (v.error) return v;
  game.lateBlind = game.lateBlind || {};
  game.lateBlind[playerId] = { target: v.target, count: 1, at: Date.now() };
  return { ok: true, allIn: pendingBetters(game).length === 0 };
}
// A secret bet can be taken back until the chips drop
function undoBet(game, playerId) {
  if (game.phase === PHASES.FIRST_BETS) {
    if (game.dropAt || !game.blind || !game.blind[playerId]) return { error: 'Too late to take it back' };
    delete game.blind[playerId]; return { ok: true };
  }
  if (game.phase === PHASES.SECOND_BETS) {
    if (game.lateDropAt || !game.lateBlind || !game.lateBlind[playerId]) return { error: 'Too late to take it back' };
    delete game.lateBlind[playerId]; return { ok: true };
  }
  return { error: 'Too late to take it back' };
}
// Every blind chip lands at once. Anyone who didn't bet sits it out: still here, they keep one chip for after the flip.
function dropBlind(game) {
  if (game.phase !== PHASES.FIRST_BETS) return { error: 'Too late — the game moved on' };
  if (game.dropAt) return { ok: true, noop: true };
  const at = Date.now();
  for (const pid of game.betOrder) {
    if (stageBet(game, pid, 1)) continue;
    const b = game.blind && game.blind[pid];
    if (b) { game.bets.push({ playerId: pid, target: b.target, count: b.count, stage: 1, at }); game.firstBets[pid] = { target: b.target, count: b.count }; }
    else { const p = game.players.find(x => x.id === pid); game.bets.push({ playerId: pid, target: 'pass', count: 0, stage: 1, late: !!(p && p.connected), at }); }
  }
  game.blind = {}; game.blindEnd = null; game.dropAt = at;
  return { ok: true };
}
function dropLate(game) {
  if (game.phase !== PHASES.SECOND_BETS) return { error: 'Too late — the game moved on' };
  if (game.lateDropAt) return { ok: true, noop: true };
  const at = Date.now();
  for (const pid of eligibleSecondBetters(game)) {
    if (stageBet(game, pid, 2)) continue;
    const b = game.lateBlind && game.lateBlind[pid];
    if (b) { game.bets.push({ playerId: pid, target: b.target, count: 1, stage: 2, at }); game.secondBets[pid] = { target: b.target, count: 1 }; }
    else game.bets.push({ playerId: pid, target: 'pass', count: 0, stage: 2, at });
  }
  game.lateBlind = {}; game.lateEnd = null; game.lateDropAt = at;
  return { ok: true };
}
const isBetOnCorrect = (game, bet) => !!bet && bet.target !== 'pass' && (bet.target === 'closed' ? !!game.closedIsCorrect : !!(game.openCaptions[bet.target] || {}).isCorrect);
// The chips the dealer may steal: another player's, still on the table
const stealable = (game) => { const d = dealerOf(game); return game.bets.map((b, i) => ({ b, i })).filter(({ b }) => b.target !== 'pass' && b.count > 0 && (!d || b.playerId !== d.id)); };

// The chips are down and the table has had its look: the dealer's steal (forced), or straight to the flip
function afterBlinds(game) {
  if (game.phase !== PHASES.FIRST_BETS) return { error: 'Too late — the game moved on' };
  if (!game.dropAt) dropBlind(game);
  if (dealerOf(game) && stealable(game).length) {
    game.steal = null;
    game.nextThief = HEISTS[nextHeist(game)].id;   // dealt now, so phones can load that film while the dealer chooses
    setPhase(game, PHASES.STEAL);
    return { ok: true };
  }
  toFlip(game);   // nothing to steal: no steal, nothing said
  return { ok: true };
}
function toFlip(game) { game.flipped = false; game.flipAt = null; setPhase(game, PHASES.REVEAL); }
// The dealer takes one chip off the table (betIndex = index in game.bets). There is no pass.
function stealChip(game, betIndex) {
  if (game.phase !== PHASES.STEAL) return { error: 'Too late — the game moved on' };
  const i = (typeof betIndex === 'number' || (typeof betIndex === 'string' && betIndex !== '')) ? Number(betIndex) : NaN;   // (Number(null) is 0)
  const bet = Number.isInteger(i) ? game.bets[i] : null;
  if (!bet || bet.target === 'pass' || bet.count < 1) return { error: 'Tap a chip to steal it' };
  const dl = dealerOf(game);
  if (dl && bet.playerId === dl.id) return { error: 'You can’t steal your own chip' };
  bet.count -= 1;
  bet.stolen = (bet.stolen || 0) + 1;
  const onCorrect = isBetOnCorrect(game, bet);   // kept on the server until the answer
  game.stealShows = (game.stealShows || 0) + 1;
  game.nightSteals = (game.nightSteals || 0) + 1;
  const stealShow = game.nightSteals === 1 || (!game.stealFullGame && Math.random() < STEAL_FULL_SHARE) ? 'full' : 'short';
  if (stealShow === 'full') game.stealFullGame = true;
  const pre = HEISTS.findIndex(h => h.id === game.nextThief), act = pre >= 0 ? pre : nextHeist(game);
  game.nextThief = null;
  const at = Date.now();
  game.steal = { victimId: bet.playerId, target: bet.target, stage: bet.stage, betIndex: i, onCorrect, act, thief: HEISTS[act].id, actName: HEISTS[act].name, stealShow, seed: Math.floor(Math.random() * 1e9), at, show: game.stealShows };
  game.stealEnd = at + (stealShow === 'full' ? STEAL_FULL_MS : STEAL_SHORT_MS) + 300;
  toFlip(game);
  return { ok: true };
}
// The app's choice when the host moves on without the dealer
function randomSteal(game) { const list = stealable(game); return list.length ? stealChip(game, pick(list).i) : (toFlip(game), { ok: true }); }

/* ── The flip: the dealer turns the face-down caption over. Anyone holding a chip then places it (everyone at once). ── */
function flip(game) {
  if (game.phase !== PHASES.REVEAL) return { error: 'Too late — the game moved on' };
  if (game.flipped) return { ok: true, noop: true };
  if (Date.now() < (game.stealEnd || 0) - 250) return { error: 'One moment. Let the steal finish.', soft: true };
  game.flipped = true;
  game.flipAt = Date.now();
  if (eligibleSecondBetters(game).some(pid => !stageBet(game, pid, 2) && isSeated(game.players.find(x => x.id === pid)))) {
    game.lateBlind = {}; game.lateDropAt = null; game.lateEnd = game.flipAt + FLIP_MS + LATE_BET_MS; game.betMore = null;
    setPhase(game, PHASES.SECOND_BETS);
  }
  return { ok: true };
}

/* ── The answer: points, then the reveal, one caption at a time, at the dealer's pace ── */
function revealAnswer(game) {
  if (game.phase === PHASES.SECOND_BETS && !game.lateDropAt) dropLate(game);
  setPhase(game, PHASES.ANSWER);
  const s = FIXED;
  const scores = {}, details = {};
  game.players.forEach(p => { scores[p.id] = 0; details[p.id] = []; });
  const add = (pid, pts, reason) => { if (!pts || !(pid in scores)) return; scores[pid] += pts; details[pid].push({ pts, reason }); };
  const dealer = dealerOf(game);
  let anyoneRight = false;
  for (const bet of game.bets) {
    if (!bet || bet.target === 'pass' || bet.count + (bet.stolen || 0) < 1) continue;
    const blind = bet.stage === 1, onClosed = bet.target === 'closed', both = bet.count === 2;
    if (bet.count > 0 && isBetOnCorrect(game, bet)) {
      if (!dealer || bet.playerId !== dealer.id) anyoneRight = true;
      const per = blind ? (onClosed ? s.pointsClosedBet : s.pointsOpenBet) : s.pointsOpenLate;
      const reason = blind && onClosed && both ? 'Blind Double Down' : blind && both ? 'Double Down' : blind && onClosed ? 'Blind chip on the face-down one' : blind ? 'Blind chip on the real one' : 'Late chip on the real one';
      add(bet.playerId, per * bet.count, reason);
    }
    const author = onClosed ? game.closedPlayerId : (game.openCaptions[bet.target] || {}).playerId;
    const fooled = bet.count + (bet.stolen || 0);   // a stolen chip still fooled them
    if (author && author !== bet.playerId) add(author, s.pointsPerFool * fooled, `Fooled ${first1(nameOfPlayer(game, bet.playerId))}`);
  }
  const st = game.steal;
  if (dealer && st && st.victimId && st.onCorrect) {
    const per = st.stage === 1 ? (st.target === 'closed' ? s.pointsClosedBet : s.pointsOpenBet) : s.pointsOpenLate;
    add(dealer.id, per, 'Stole a chip off the real one');
  }
  if (dealer && st && st.victimId && !st.onCorrect) add(st.victimId, STEAL_CAUGHT_PTS, 'Your chip was stolen off a fake');
  game.dealerBonusAwarded = false;
  if (!anyoneRight && dealer && s.dealerBonus > 0) { add(dealer.id, s.dealerBonus, 'Dealer’s revenge'); game.dealerBonusAwarded = true; }
  game.roundScores = scores;
  game.roundScoreDetails = details;
  game.previousRank = {};
  game.players.forEach(p => { game.previousRank[p.id] = game.players.filter(q => q.score > p.score).length; });
  for (const [pid, pts] of Object.entries(scores)) { const p = game.players.find(x => x.id === pid); if (p) p.score += pts; }
  { const order = reelOrder(game), real = realKey(game); let k = 0;
    while (k < order.length && order[k] !== real && votesOn(game, order[k]) === 0) k++;
    game.reel = { order, step: 1, nobody: k >= 2 && k < order.length ? k : 0 }; }   // the captions nobody bit on share one step
  game.stepAt = game.phaseAt;
  game.history.push({
    round: game.round,
    cartoon: { ...game.cartoon },
    correctCaption: game.correctCaption,
    dealerName: dealer ? dealer.name : '',
    autoClose: game.autoClose,
    openCaptions: game.openCaptions.map(c => ({ caption: c.caption, isCorrect: c.isCorrect, playerId: c.playerId, playerName: c.playerId ? nameOfPlayer(game, c.playerId) : null })),
    closedCaption: game.closedCaption, closedIsCorrect: game.closedIsCorrect, closedPlayerId: game.closedPlayerId,
    closedPlayerName: game.closedPlayerId ? nameOfPlayer(game, game.closedPlayerId) : null,
    bets: game.bets.map(b => ({ ...b })),
    steal: st ? { ...st } : null,
    roundScores: { ...scores },
    frames: [],
  });
  loveFrames(game);
}
const keyOf = (t) => String(t);
const chipsOf = (b) => (b && b.target !== 'pass' ? (b.count || 0) + (b.stolen || 0) : 0);   // stolen chips still count as belief
const writerOfKey = (game, key) => (key === 'closed' ? game.closedPlayerId : (game.openCaptions[Number(key)] || {}).playerId) || null;
const realKey = (game) => (game.closedIsCorrect ? 'closed' : keyOf(game.openCaptions.findIndex(c => c.isCorrect)));
function fakeKeys(game) {
  const keys = game.openCaptions.map((c, i) => (c.playerId ? keyOf(i) : null)).filter(k => k !== null);
  if (game.closedPlayerId) keys.push('closed');
  return keys;
}
// Chips other players put on a caption (the writer's own don't count)
function votesOn(game, key) { const w = writerOfKey(game, key); return game.bets.reduce((n, b) => n + (keyOf(b.target) === key && b.playerId !== w ? chipsOf(b) : 0), 0); }
// Fakes from fewest chips to most (ties at random), the real caption last
function reelOrder(game) {
  const fakes = shuffleArray(fakeKeys(game)).map(k => ({ k, v: votesOn(game, k) })).sort((a, b) => a.v - b.v).map(x => x.k);
  const real = realKey(game);
  return real === '-1' ? fakes : [...fakes, real];
}
// The captions the reveal has shown so far (their writers are out)
function revealedKeys(game) {
  if (game.phase === PHASES.SCORES) return fakeKeys(game).concat(realKey(game));
  const r = game.reel; if (!r || game.phase !== PHASES.ANSWER) return [];
  const k = r.nobody || 0, shown = k && r.step <= k ? k : r.step;
  return r.order.slice(0, Math.min(shown, r.order.length));
}
// The dealer's Next on the reveal: the next caption, and after the real one, the scores
function reelNext(game) {
  if (game.phase !== PHASES.ANSWER || !game.reel) return { error: 'Too late — the game moved on' };
  const n = game.reel.order.length, k = game.reel.nobody || 0;
  if (game.reel.step >= n) return moveToScoreboard(game);
  game.reel.step = k && game.reel.step <= k ? k + 1 : game.reel.step + 1;
  game.stepAt = Date.now();
  loveFrames(game);
  return { ok: true, step: game.reel.step };
}

/* ── Scores ── */
function moveToScoreboard(game) {
  if (game.phase !== PHASES.ANSWER) return { error: 'Too late — the game moved on' };
  const s = settingsOf(game);
  // First to N: someone got there. The trip around the table is finished first (everyone deals the same number of times).
  if (s.targetScore && !game.finalLaps && game.players.some(p => p.score >= s.targetScore)) {
    const counts = game.dealCount || {}, here = game.players.filter(isSeated);
    game.finalLaps = Math.max(1, ...(here.length ? here : game.players).map(p => counts[p.id] || 0));
  }
  if (!liveOver(game) && !canDeal(game)) endForDeck(game);
  setPhase(game, PHASES.SCORES);
  game.scoresAt = Date.now();
  if (liveOver(game)) endGame(game);
  return { ok: true };
}
function endGame(game) {
  game.over = true;
  game.scoresAt = Date.now();
  game.ending = { step: 0, at: Date.now() };
  settleRating(game);
}
// The winner: most points; a tie goes to whoever fooled the most chips, then to more captions framed. Still level: a tie.
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
function framedTally(game) { const t = {}; for (const e of hallOfFame(game)) if (!e.isReal && e.writerId) t[e.writerId] = (t[e.writerId] || 0) + 1; return t; }
function standing(game) {
  const ps = game.players;
  if (!ps.length) return null;
  const top = Math.max(...ps.map(p => p.score));
  let tied = ps.filter(p => p.score === top).map(p => p.id);
  const out = { top, tied: [...tied], by: 'points', winners: tied };
  if (tied.length < 2) return out;
  const fooled = fooledTally(game), mf = Math.max(...tied.map(id => fooled[id] || 0));
  tied = tied.filter(id => (fooled[id] || 0) === mf);
  if (tied.length === 1) return { ...out, by: 'fooled', winners: tied };
  const framed = framedTally(game), mr = Math.max(...tied.map(id => framed[id] || 0));
  tied = tied.filter(id => (framed[id] || 0) === mr);
  return { ...out, by: tied.length === 1 ? 'framed' : 'tie', winners: tied };
}

/* ── Bravo! and the frame. Bravo! on any caption but your own, from the reading until the next deal (nobody sees a
   count). Once a fake is revealed (its writer is out), when a majority of the other players have given it a Bravo!,
   it's framed on the spot and hangs in The Gallery for good. Never the real one. ── */
const REACT_PHASES = [PHASES.READING, PHASES.FIRST_BETS, PHASES.STEAL, PHASES.REVEAL, PHASES.SECOND_BETS, PHASES.ANSWER, PHASES.SCORES];
const authorOf = (game, target) => (target === 'closed' ? game.closedPlayerId : (game.openCaptions[target] || {}).playerId);
const flipShown = (game) => game.flipped || [PHASES.SECOND_BETS, PHASES.ANSWER, PHASES.SCORES].includes(game.phase);
function react(game, playerId, target, kind, on) {
  if (!REACT_PHASES.includes(game.phase) || (game.phase === PHASES.SCORES && game.over)) return { error: 'Too late for a Bravo: the round’s over.' };
  if (!game.players.some(p => p.id === playerId)) return { error: 'You’re not in this game.' };
  if (kind !== undefined && kind !== 'ha') return { error: 'That didn’t take. Try again.' };
  const v = validateTarget(game, target); if (v.error) return v;
  if (v.target === 'closed' && !flipShown(game)) return { error: 'The Closed Caption is still face-down' };
  if (authorOf(game, v.target) === playerId) return { error: 'Not your own.' };
  const key = String(v.target);
  const map = game.reactions[key] || (game.reactions[key] = {});
  const has = !!(map[playerId] && map[playerId].ha), want = on === undefined || on === null ? !has : !!on;
  if (want) map[playerId] = { ha: 1 }; else delete map[playerId];
  loveFrames(game);
  return { ok: true };
}
// Framed = a majority of the OTHER players at the table: 3 players -> 2, 4 -> 2, 5 -> 3, 6 -> 3, 8 -> 4
const inductNeed = (game) => Math.floor(Math.max(1, game.players.filter(isSeated).length - 1) / 2) + 1;
function loveFrames(game) {
  const shown = revealedKeys(game), need = inductNeed(game), real = realKey(game);
  if (!shown.length) return;
  game.flags = game.flags || [];
  for (const key of shown) {
    if (key === real) continue;
    const target = key === 'closed' ? 'closed' : Number(key), author = authorOf(game, target);
    if (!author) continue;
    const lovers = Object.entries((game.reactions || {})[key] || {}).filter(([id, r]) => r && r.ha && id !== author).map(([id]) => id);
    (game.framePicks = game.framePicks || {})[key] = lovers;
    game.flags = game.flags.filter(f => !(f.round === game.round && String(f.target) === key && !lovers.includes(f.fromId)));
    for (const id of lovers) if (!game.flags.some(f => f.round === game.round && String(f.target) === key && f.fromId === id)) game.flags.push({ fromId: id, round: game.round, target, at: Date.now() });
    if (lovers.length >= need && !(game.inducted || []).includes(game.round + '|' + target)) frameNow(game, target);
  }
}
const MONTH = () => new Date().toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/New_York' });
function frameNow(game, target) {
  game.inducted = game.inducted || [];
  game.inducted.push(game.round + '|' + target);
  const h = game.history.find(x => x.round === game.round);
  if (!h) return null;
  const c = target === 'closed' ? { caption: h.closedCaption, playerId: h.closedPlayerId } : (h.openCaptions[target] || {});
  const author = c.playerId ? nameOfPlayer(game, c.playerId) : null;
  if (!author || !c.caption) return null;
  const fl = (game.flags || []).filter(f => f.round === game.round && String(f.target) === String(target));
  const image = h.cartoon && h.cartoon.image, flaggers = fl.map(f => nameOfPlayer(game, f.fromId)), month = MONTH();
  const raw = { cartoonId: h.cartoon.id, image, caption: c.caption, author, flaggers, flags: fl.length, month };
  const entry = deckOf(game).add({ ...raw, sig: sigOf(raw) });
  if (entry && store.file) store.add(entry, true);
  game.nightFrames = (game.nightFrames || 0) + 1;
  const n = (game.inductionCount || 0) + 1; game.inductionCount = n;
  const it = { n, round: game.round, target: String(target), at: Date.now(), caption: c.caption, author, writerId: c.playerId, image, flaggers, flags: fl.length, month, entry: entry || null };
  game.roundFrames = (game.roundFrames || []).concat(it);
  game.lastInduction = { ...it, list: game.roundFrames };
  h.frames = (h.frames || []).concat({ target: String(target), caption: c.caption, author });
  return it;
}
function myReactions(game, playerId) {
  const out = {};
  for (const [key, map] of Object.entries(game.reactions || {})) if (map && map[playerId] && map[playerId].ha) out[key] = { ha: true };
  return out;
}
// Tonight's framed captions, with everything a Gallery card needs
function hallOfFame(game) {
  const groups = new Map();
  for (const f of game.flags || []) { const k = f.round + '|' + f.target; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(f); }
  const out = [];
  for (const [k, fl] of groups) {
    if (!(game.inducted || []).includes(k)) continue;
    const { round, target } = fl[0];
    const h = game.history.find(x => x.round === round);
    if (!h) continue;
    const c = target === 'closed' ? { caption: h.closedCaption, playerId: h.closedPlayerId, isCorrect: h.closedIsCorrect } : (h.openCaptions[target] || {});
    out.push({ round, target, caption: c.caption, writerId: c.playerId, writerName: c.playerId ? nameOfPlayer(game, c.playerId) : null, isReal: !!c.isCorrect, image: h.cartoon && h.cartoon.image, cartoonId: h.cartoon && h.cartoon.id, flaggers: fl.map(f => nameOfPlayer(game, f.fromId)), month: MONTH() });
  }
  return out.sort((a, b) => a.round - b.round);
}

/* ── The end of the game: the winner and final scores → each player's rating and line → tonight's frames and the
   Caption of the Night vote. The host moves it on. ── */
const SHOW_LEAD_MS = 1500;
// The vote fits one screen: at most six of tonight's frames, the ones with the most Bravos (then the latest).
// Every frame still hangs in The Gallery.
const FINALE_MAX = 6;
function finaleEntries(game) {
  const all = hallOfFame(game).filter(e => !e.isReal && e.caption && e.writerId);
  const top = all.length <= FINALE_MAX ? all : [...all].sort((a, b) => (b.flaggers.length - a.flaggers.length) || (b.round - a.round)).slice(0, FINALE_MAX).sort((a, b) => a.round - b.round);
  return top.map(e => ({
    key: e.round + '|' + e.target, round: e.round, target: e.target, caption: e.caption,
    writerId: e.writerId, writerName: e.writerName, image: e.image, cartoonId: e.cartoonId,
    frames: e.flaggers.length, flaggers: e.flaggers,
  }));
}
const finaleCanVote = (f, pid) => f.entries.some(e => e.writerId !== pid);
function openFinale(game) {
  if (game.phase !== PHASES.SCORES || !game.over) return { error: 'The Gallery opens when the game is over' };
  if (game.finale) return { ok: true, noop: true };
  const entries = finaleEntries(game);
  if (!entries.length) return { error: 'Nothing was framed tonight' };
  game.finale = { at: Date.now(), entries, votes: {}, voters: game.players.filter(p => isSeated(p)).map(p => p.id), winner: null, counts: null, tie: false, showAt: null };
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
  const need = f.voters.filter(pid => { const p = game.players.find(x => x.id === pid); return p && p.connected && !p.gone && finaleCanVote(f, pid); });
  return need.length > 0 && need.every(pid => pid in f.votes);
}
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
  const w = f.entries.find(e => e.key === f.winner);
  f.best = 'Caption of the Night · ' + MONTH();
  try { const d = deckOf(game); if (d.markBest) d.markBest(w.cartoonId, w.caption, f.best); } catch (e) {}
  return { ok: true };
}
// The host's Next through the end of the game. Returns { ok } or { error }; `last` when there is nothing after it.
function endingNext(game, from) {
  if (game.phase !== PHASES.SCORES || !game.over) return { error: 'The game is still going' };
  const e = game.ending || (game.ending = { step: 0, at: Date.now() });
  if (from !== undefined && from !== null && Number(from) !== e.step) return { ok: true, noop: true };   // a double tap
  if (e.step === 0) { e.step = 1; e.at = Date.now(); return { ok: true }; }
  if (e.step === 1) {
    if (!finaleEntries(game).length) return { error: 'Nothing was framed tonight' };
    const r = openFinale(game); if (r.error) return r;
    e.step = 2; e.at = Date.now();
    return { ok: true };
  }
  return { ok: true, noop: true };
}

/* ── The rating (chess-style, rating.js): each phone keeps its own; the server does the arithmetic once a game ── */
const FULL_RATING_ROUNDS = 8;   // games this long (or longer) move the rating the full amount; shorter ones, in proportion
function setCareer(game, playerId, msg) {
  const p = game.players.find(x => x.id === playerId);
  if (!p) return { error: 'You’re not in this game.' };
  msg = msg || {};
  const bad = { error: 'That didn’t take. Try again.' };
  if (msg.rating !== undefined && msg.rating !== null && !Rating.validRating(msg.rating)) return bad;
  if (msg.games !== undefined && !Rating.validGames(msg.games)) return bad;
  let lines = null;
  if (msg.lines !== undefined) { lines = Rating.cleanSeenLines(msg.lines); if (!lines) return bad; }
  const rated = Rating.validRating(msg.rating);
  p.rating = rated ? msg.rating : null;
  p.games = rated && Rating.validGames(msg.games) ? msg.games : 0;
  if (lines) p.seenLines = lines;
  // A phone that reports a moment after the start (it was still connecting) still counts, until the first answer
  const sn = game.ratingSnap && game.ratingSnap[playerId];
  if (sn && !sn.reported && rated && game.round <= 1 && [PHASES.WRITING, PHASES.READING, PHASES.FIRST_BETS].includes(game.phase)) {
    game.ratingSnap[playerId] = { ...Rating.snapshot([p])[playerId], reported: true };
  }
  return { ok: true };
}
const ratingTitle = (p) => Rating.validRating(p.rating) && (p.games || 0) >= Rating.PROVISIONAL_GAMES ? Rating.titleOf(p.rating) : null;
function beginRated(game) {
  game.gameNo = (game.gameNo || 0) + 1;
  game.gameId = game.code + '-' + game.gameNo + '-' + Date.now().toString(36);
  const here = game.players.filter(isSeated);
  const snap = Rating.snapshot(here);
  here.forEach(p => { snap[p.id].reported = Rating.validRating(p.rating); });
  game.ratingSnap = snap;
  game.ratingResult = null;
}
// Game over: everyone seated at the start is rated on their final score
function settleRating(game) {
  if (game.ratingResult || !game.ratingSnap) return;
  try {
    const scores = {};
    for (const p of game.players) if (game.ratingSnap[p.id]) scores[p.id] = p.score;
    const scale = Math.min(1, Math.max(1, game.round || 1) / FULL_RATING_ROUNDS);
    const r = Rating.settle(game.ratingSnap, scores, game.players, game.gameId, null, scale);
    if (r.order.length < 2) { game.ratingResult = { gameId: game.gameId, rows: {}, order: [], none: true }; return; }
    game.ratingResult = { gameId: game.gameId, rows: r.rows, order: r.order, at: Date.now(), scale, short: scale < 1, rounds: game.round };
  } catch (e) { console.error('rating failed', e); game.ratingResult = { gameId: game.gameId, rows: {}, order: [], none: true }; }
}

function resetForNewGame(game) {
  setPhase(game, PHASES.LOBBY);
  game.deckOut = false; game.over = false; game.ending = null; game.finale = null;
  game.stealFullGame = false;
  game.flags = []; game.framePicks = {}; game.roundFrames = []; game.inducted = [];
  game.inductionCount = game.lastInduction ? game.lastInduction.n : (game.inductionCount || 0);
  game.lastInduction = null;
  game.closePlan = [];
  game.round = 0;
  game.dealerIndex = -1;
  game.firstDealFrom = seatAt(Math.max(1, game.players.length), (game.gameNo || 0) - 1);   // the next game's first deal moves one seat on
  game.dealCount = {};
  game.history = [];
  game.previousRank = {};
  game.players = game.players.filter(p => !p.gone);   // whoever left for good isn't at the next game's table
  game.players.forEach(p => { p.score = 0; delete p.again; });
  if (!game.players.some(p => p.id === game.hostId) && game.players.length) game.hostId = (game.players.find(p => p.connected) || game.players[0]).id;
  game.cartoon = null; game.submissions = []; game.bets = []; game.betOrder = [];
  game.steal = null; game.stealEnd = 0; game.mulliganVotes = []; game.mulliganEvent = null;
  game.roundScores = {}; game.roundScoreDetails = {};
  game.timerEnd = null; game.timerToken = (game.timerToken || 0) + 1;
  game.reactions = {}; game.reel = null;
  game.stealShows = 0;
  game.blind = {}; game.blindEnd = null; game.dropAt = null;
  game.flipped = false; game.flipAt = null;
  game.finalLaps = null; game.fixedLaps = null;
  game.stepAt = null;
  game.ratingSnap = null; game.ratingResult = null;
}

/* ── The dealer moves the game on; nobody else can. If the dealer's phone has really been off for STANDIN_MS (or the
   host moved on without them), the HOST's phone gets one button: "Move on without <name>". ── */
function dealerOff(game, now = Date.now()) {
  const d = dealerOf(game);
  if (!d || game.phase === PHASES.LOBBY || game.phase === PHASES.WRITING) return false;
  return isGone(d, now) || awayMs(d, now) >= STANDIN_MS;
}
const canStandIn = (game, pid, now = Date.now()) => game.hostId === pid && !!dealerOf(game) && dealerOf(game).id !== pid && dealerOff(game, now) && !(game.phase === PHASES.SCORES && game.over);
// What the dealer's one button does right now. { ok } | { error } | { wait: true } (nothing for the dealer to do yet)
function dealerNext(game, standIn) {
  switch (game.phase) {
    case PHASES.READING: return moveToFirstBets(game);
    case PHASES.STEAL: return standIn ? randomSteal(game) : { error: 'Tap a chip to steal it' };
    case PHASES.REVEAL:
      if (!game.flipped) return flip(game);
      revealAnswer(game); return { ok: true };
    case PHASES.SECOND_BETS:
      if (!game.lateDropAt) return { wait: true };
      revealAnswer(game); return { ok: true };
    case PHASES.ANSWER: return reelNext(game);
    case PHASES.SCORES:
      if (game.over) return { wait: true };
      if (finishIfOver(game)) return { ok: true, over: true };
      return startRound(game);
    default: return { wait: true };
  }
}

const BETTING_ON = [PHASES.FIRST_BETS, PHASES.STEAL, PHASES.REVEAL, PHASES.SECOND_BETS, PHASES.ANSWER, PHASES.SCORES];
const AFTER_WRITING = [PHASES.READING].concat(BETTING_ON);
const ANSWERED = [PHASES.ANSWER, PHASES.SCORES];

// What each phone is allowed to see
function getPlayerView(game, playerId) {
  const dealer = dealerOf(game);
  const isDealer = !!dealer && dealer.id === playerId;
  const s = settingsOf(game);
  const now = Date.now();
  const published = deckOf(game).authorCounts();
  const base = {
    code: game.code,
    phase: game.phase,
    locked: !!game.locked,
    notice: game.notice || null,
    seatClaim: game.seatClaim && game.hostId === playerId ? { ...game.seatClaim } : null,
    players: game.players.map(p => ({ id: p.id, name: p.name, score: p.score, connected: !!p.connected, gone: isGone(p, now), rating: Rating.validRating(p.rating) ? p.rating : null, provisional: !Rating.validRating(p.rating) || (p.games || 0) < Rating.PROVISIONAL_GAMES, title: ratingTitle(p), published: published.get(p.name.toLowerCase()) || 0 })),
    round: game.round,
    totalRounds: lapsOf(game) ? totalRounds(game) : null,
    settings: { ...s },
    deckSize: CARTOONS.length,
    hostId: game.hostId,
    isHost: game.hostId === playerId,
    dealerId: dealer ? dealer.id : null,
    dealerName: dealer ? dealer.name : null,
    dealerConnected: dealer ? !!dealer.connected : false,
    dealerOff: dealerOff(game, now),
    canStandIn: canStandIn(game, playerId, now),
    isDealer,
    playerId,
    timerDuration: game.timerDuration,
    timerEnd: game.timerEnd,
    serverNow: now,
    phaseAt: game.phaseAt || null,
    stepAt: game.stepAt || null,
    inductNeed: inductNeed(game),
    lastInduction: game.lastInduction ? JSON.parse(JSON.stringify(game.lastInduction)) : null,
    hofDeck: 0,
    hofTotal: deckOf(game).count(),
    house: { list: [], auto: false, max: 0 },
    galleryHidden: [],
    gameNo: game.gameNo || 0,
    captionMax: CAPTION_MAX,
  };
  if (game.phase === PHASES.LOBBY || game.phase === PHASES.SCORES) base.gazette = deckOf(game).recent(40);
  if (game.phase === PHASES.LOBBY) {
    const host = game.players.find(p => p.id === game.hostId);
    const hostAway = awayMs(host, now);
    if (hostAway >= 20000) base.hostAway = { name: host.name, secs: Math.floor(hostAway / 1000) };
    base.canTakeHost = false;
    const d = deckStatus(game);
    base.freshCount = d.fresh; base.poolCount = d.pool;
    base.deck = { ...d, line: deckLine(d) };
    return base;
  }
  if (game.cartoon) base.cartoon = { id: game.cartoon.id, image: game.cartoon.image };
  const mine = game.submissions.find(x => x.playerId === playerId);
  if (game.phase === PHASES.WRITING) {
    base.submittedPlayerIds = game.submissions.map(x => x.playerId);
    base.waitingWriters = waitingWriters(game);
    base.hasSubmitted = !!mine;
    base.myCaption = mine ? mine.caption : null;
    base.mulliganVotes = [...game.mulliganVotes];
    base.mulliganNeeded = mulliganThreshold(game);
    base.myMulligan = game.mulliganVotes.includes(playerId);
  }
  base.mulliganEvent = game.mulliganEvent || null;
  if (AFTER_WRITING.includes(game.phase)) {
    base.openCaptions = game.openCaptions.map(c => c.caption);
    base.myOpenIndex = game.openCaptions.findIndex(c => c.playerId === playerId);
    base.iWrote = !!mine;
    base.iWroteClosed = game.closedPlayerId === playerId;
    base.myReactions = myReactions(game, playerId);
  }
  if (BETTING_ON.includes(game.phase)) {
    base.bets = game.bets.map(b => ({ ...b }));   // (blind bets only reach here once they've dropped)
    base.betOrder = [...game.betOrder];
    const myBlind = game.blind && game.blind[playerId];
    base.myFirstBet = game.firstBets[playerId] || (myBlind ? { target: myBlind.target, count: myBlind.count } : null);
    base.mySecondBet = game.secondBets[playerId] || null;
    base.pendingBetters = pendingBetters(game);
    base.eligibleSecondBetters = eligibleSecondBetters(game);
    base.betMore = game.betMore || null;
    if (game.phase === PHASES.FIRST_BETS) {
      base.blindIn = game.dropAt ? [...game.betOrder] : game.betOrder.filter(pid => hasBlind(game, pid));
      base.blindEnd = game.blindEnd || null;
      base.dropAt = game.dropAt || null;
      base.isMyTurn = !game.dropAt && game.betOrder.includes(playerId) && !hasBlind(game, playerId);
    } else if (game.phase === PHASES.SECOND_BETS) {
      const myLate = game.lateBlind && game.lateBlind[playerId];
      if (!base.mySecondBet && myLate) base.mySecondBet = { target: myLate.target, count: 1 };
      base.lateIn = game.lateDropAt ? [...base.eligibleSecondBetters] : base.eligibleSecondBetters.filter(pid => hasLate(game, pid));
      base.lateEnd = game.lateEnd || null;
      base.lateDropAt = game.lateDropAt || null;
      base.isMyTurn = !game.lateDropAt && base.eligibleSecondBetters.includes(playerId) && !hasLate(game, playerId);
    } else base.isMyTurn = false;
    // whether the stolen chip was on the real caption stays on the server until the answer
    if (game.steal) { const { onCorrect, ...st } = game.steal; base.steal = ANSWERED.includes(game.phase) ? { ...game.steal } : st; } else base.steal = null;
    base.stealEnd = game.stealEnd || 0;
    base.stealShow = game.steal ? game.steal.stealShow : null;
    if (game.phase === PHASES.STEAL) { base.nextThief = game.nextThief || null; base.stealable = stealable(game).map(x => x.i); }
  }
  if (game.phase === PHASES.REVEAL || game.phase === PHASES.SECOND_BETS || ANSWERED.includes(game.phase)) {
    base.flipped = flipShown(game);
    base.flipAt = game.flipAt || null;
    if (base.flipped) base.closedCaption = game.closedCaption;
  }
  if (ANSWERED.includes(game.phase)) {
    base.correctCaption = game.correctCaption;
    base.closedIsCorrect = game.closedIsCorrect;
    base.closedPlayerId = game.closedPlayerId;
    base.closedPlayerName = game.closedPlayerId ? nameOfPlayer(game, game.closedPlayerId) : null;
    base.roundScores = game.roundScores;
    base.roundScoreDetails = game.roundScoreDetails || {};
    base.dealerBonusAwarded = !!game.dealerBonusAwarded;
    base.openCaptionDetails = game.openCaptions.map(c => ({ caption: c.caption, isCorrect: c.isCorrect, playerId: c.playerId, playerName: c.playerId ? nameOfPlayer(game, c.playerId) : null }));
    base.reel = game.reel ? { order: [...game.reel.order], step: game.reel.step, nobody: game.reel.nobody || 0 } : null;
    base.framed = (game.roundFrames || []).map(f => String(f.target));
    base.hallOfFame = hallOfFame(game);
  }
  if (game.phase === PHASES.SCORES) {
    base.gameOver = !!game.over;
    base.previousRank = game.previousRank || {};
    base.scoresAt = game.scoresAt || null;
    if (!game.over) {
      const nd = game.players[nextDealerIndex(game, game.dealerIndex)];
      base.nextDealerName = nd ? nd.name : '';
      base.nextDealerId = nd ? nd.id : null;
      base.endsNext = liveOver(game);
    } else {
      base.ending = game.ending ? { ...game.ending } : { step: 0 };
      base.framedTonight = finaleEntries(game).length;
      base.standing = standing(game);
      settleRating(game);
      if (game.ratingResult && !game.ratingResult.none) base.rating = JSON.parse(JSON.stringify(game.ratingResult));
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

/* A restart (every update restarts the server) used to wipe every room. The phones keep a sealed copy of the room
   (encrypted and signed by the server, unreadable on the phone) and hand it back after a restart. */
if (!process.env.RESTORE_KEY && !process.env.GALLERY_KEY && (process.env.RENDER || process.env.NODE_ENV === 'production')) console.warn('RESTORE_KEY is not set: room copies will not survive a server restart');
const SEAL_KEY = crypto.createHash('sha256').update('seal|' + (process.env.RESTORE_KEY || process.env.GALLERY_KEY || (process.env.RENDER || process.env.NODE_ENV === 'production' ? crypto.randomBytes(32).toString('hex') : 'closed-caption/restore/v1'))).digest();
const SKIP = new Set(['deck', '_advAt', '_sealTag', '_sealAt', 'voice']);
function sealGame(game) {
  const plain = {};
  for (const k of Object.keys(game)) if (!SKIP.has(k)) plain[k] = game[k];
  plain.players = (game.players || []).map(p => { const { seenLines, ...rest } = p; return rest; });   // the phones send their seen lines again when they rejoin
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
    g.deck = newRoomDeck();
    g.seatClaim = null;
    g.settings = { ...DEFAULT_SETTINGS, rounds: (g.settings || {}).rounds || null, targetScore: (g.settings || {}).targetScore || null, laps: [1, 2, 3].includes((g.settings || {}).laps) ? g.settings.laps : 2, family: !!(g.settings || {}).family, spicy: !!(g.settings || {}).spicy };
    ['blind', 'lateBlind', 'reactions', 'framePicks', 'dealCount', 'firstBets', 'secondBets'].forEach(k => { if (!g[k] || typeof g[k] !== 'object') g[k] = {}; });
    ['flags', 'roundFrames', 'inducted', 'history', 'usedCartoonIds', 'bets', 'betOrder', 'submissions', 'openCaptions', 'mulliganVotes', 'closePlan'].forEach(k => { if (!Array.isArray(g[k])) g[k] = []; });
    g.usedCartoonIds = g.usedCartoonIds.filter(id => !isRetiredId(id));
    if (g.cartoon && isRetiredId(g.cartoon.id)) resetForNewGame(g);
    // A room sealed by the older server: its stages map onto today's (nothing moves on by itself any more)
    if (g.v !== 3) {
      if (g.phase === 'framing') g.phase = PHASES.ANSWER;
      if (g.phase === PHASES.REVEAL) { g.flipped = !!(g.flipAt && g.flipAt <= Date.now()); g.stealEnd = g.flipAt && !g.flipped ? g.flipAt : 0; }
      if (g.phase === PHASES.ANSWER && g.reel) g.reel.step = Math.max(1, Math.min(g.reel.step || 1, (g.reel.order || []).length));
      if (g.phase === PHASES.SCORES && g.over && !g.ending) g.ending = { step: 0, at: Date.now() };
      if (g.phase === PHASES.SCORES && g.over === undefined) g.over = false;
      g.v = 3;
    }
    if (g.phase === PHASES.FIRST_BETS && !g.dropAt) g.blindEnd = Math.max(g.blindEnd || 0, Date.now() + 20000);   // bettors get a fair 20 s back
    if (g.phase === PHASES.SECOND_BETS && !g.lateDropAt) g.lateEnd = Math.max(g.lateEnd || 0, Date.now() + 10000);
    g.players.forEach(p => { p.connected = false; p.disconnectedAt = Date.now(); });
    g.timerToken = (g.timerToken || 0) + 1;
    if (g.timerEnd) g.timerEnd = Math.max(g.timerEnd, Date.now() + 30000);   // writers get a fair 30 s back
    return g;
  } catch (e) { return null; }
}

module.exports = {
  PHASES, CARTOONS, DEFAULT_SETTINGS, MAX_PLAYERS, CAPTION_MAX, GONE_MS, STANDIN_MS, AWAY_WAIT_MS,
  sealGame, unsealGame, tooCloseToReal, pickByLevel, tableKind, setPosition, levelOf, canDeal, deckStatus, startCheck, endForDeck, isRetiredId, FIRST_LIVE_ID,
  cleanTimer, DEFAULT_TIMER, totalRounds, lapsOf, nextDealerIndex, freshest, planBlock, ensurePlan,
  createGame, updateSettings, addPlayer, kickPlayer, removePlayer, setSeen, setPlayerSeen, seenCounts, store, syncGallery, dealCartoon,
  startRound, submitCaption, voteMulligan, finishWriting, allCaptionsIn, connectedAllIn, onlyAwayPending, waitingWriters,
  moveToFirstBets, placeBet, undoBet, dropBlind, dropLate, moreBetTime, afterBlinds, eligibleSecondBetters, pendingBetters,
  stealChip, randomSteal, stealable, flip, revealAnswer, reelNext, reelOrder, votesOn, moveToScoreboard, isGameOver, liveOver, finishIfOver, resetForNewGame,
  isPresent, isSeated, isGone, dealerOff, canStandIn, dealerNext, react, inductNeed, hallOfFame, standing, fooledTally,
  openFinale, voteFinale, resolveFinale, finaleAllIn, endingNext, setCareer, getPlayerView, generateRoomCode, polish,
  BLIND_MS, ALL_IN_BEAT_MS, DROP_HOLD_MS, LATE_BET_MS, BET_MORE_MS, FLIP_MS, STEAL_FULL_MS, STEAL_SHORT_MS,
};
