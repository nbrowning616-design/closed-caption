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
//   7. ANSWER       The real caption is shown and points are paid (double in The Late Edition).
//   8. FRAMING      "Anything frame-worthy?" Everyone secretly picks one caption (not their own) or passes.
//                   Enough picks on one caption and it's framed: it hangs in The Gallery.
//   9. SCORES       Scoreboard; the deal moves left.

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
  { id: 118, level: "easy", title: "Checkmate", image: "card_118.jpg", correct: "He's been reading my books again." },
  { id: 119, level: "medium", title: "The Stand", image: "card_119.jpg", correct: "Clause nine covers refills." },
  { id: 120, adult: true, level: "easy", title: "Dawn", image: "card_120.jpg", correct: "Your mother says happy birthday." },
  { id: 121, adult: true, level: "hard", title: "Open Plan", image: "card_121.jpg", correct: "HR asked us to keep some distance." },
  { id: 122, level: "medium", title: "Crossing", image: "card_122.jpg", correct: "We don't talk about it. He's happy." },
  { id: 123, spicy: true, level: "medium", title: "Patience", image: "card_123.jpg", correct: "He usually stops at the cactus." },
  { id: 124, level: "easy", title: "Spin Cycle", image: "card_124.jpg", correct: "It's his cousin. They were close." },
  { id: 125, adult: true, level: "medium", title: "Self-Checkout", image: "card_125.jpg", correct: "He's been here since the Crusades." },
  { id: 126, level: "hard", title: "Neighbors", image: "card_126.jpg", correct: "We were fine until he got a tree." },
  { id: 127, spicy: true, level: "medium", title: "The Morning After", image: "card_127.jpg", correct: "He says you two talked all night." },
  { id: 128, adult: true, level: "easy", title: "Guess Your Salary", image: "card_128.jpg", correct: "Higher. No, lower. Much lower." },
  { id: 129, level: "medium", title: "The Gift", image: "card_129.jpg", correct: "Four hundred dollars, and she picked the packaging." },
  { id: 130, adult: true, level: "hard", title: "Drive-In", image: "card_130.jpg", correct: "Spoiler: he goes home." },
  { id: 131, adult: true, level: "medium", title: "Keynote", image: "card_131.jpg", correct: "And that brings us to my second hour." },
  { id: 132, level: "easy", title: "Beach Rental", image: "card_132.jpg", correct: "First time south?" },
  { id: 133, spicy: true, level: "easy", title: "Tasting Menu", image: "card_133.jpg", correct: "The chef recommends chewing slowly." },
  { id: 134, adult: true, level: "hard", title: "Self-Portrait", image: "card_134.jpg", correct: "He says it's his good side." },
  { id: 135, level: "medium", title: "Empty", image: "card_135.jpg", correct: "It was empty when I got here, Doris." },
  { id: 136, spicy: true, level: "medium", title: "Second Date", image: "card_136.jpg", correct: "My client is enjoying the evening." },
  { id: 137, adult: true, level: "medium", title: "Off Duty", image: "card_137.jpg", correct: "Ships have GPS now. Fish don't." },
  { id: 138, adult: true, level: "medium", title: "Performance Review", image: "card_138.jpg", correct: "Before we discuss the raise, tell me about the fish." },
  { id: 139, level: "easy", title: "Tall Order", image: "card_139.jpg", correct: "Ask if it comes in a large." },
  { id: 140, spicy: true, level: "medium", title: "The Ex", image: "card_140.jpg", correct: "She was his first wife. And, apparently, his last." },
  { id: 141, level: "hard", title: "Summit", image: "card_141.jpg", correct: "I came up for the quiet. You're the third today." },
  { id: 142, adult: true, level: "medium", title: "Exhibit", image: "card_142.jpg", correct: "It's on loan from a private collector." },
  { id: 143, level: "easy", title: "Bedtime", image: "card_143.jpg", correct: "Same time tomorrow. No peeking." },
  { id: 144, spicy: true, level: "easy", title: "Neighborhood Watch", image: "card_144.jpg", correct: "Third night this week. Same car." },
  { id: 145, adult: true, level: "hard", title: "Vacancy", image: "card_145.jpg", correct: "It's a starter home. Great school district." },
  { id: 146, adult: true, level: "medium", title: "Open Door", image: "card_146.jpg", correct: "That's how they let you go here." },
  { id: 147, level: "medium", title: "Rehearsal", image: "card_147.jpg", correct: "Be the crow you want to scare." },
  { id: 148, spicy: true, level: "medium", title: "Couples Yoga", image: "card_148.jpg", correct: "He's working on acceptance." },
  { id: 149, level: "easy", title: "Crossing Guard", image: "card_149.jpg", correct: "He's been on this shift since Tuesday." },
  { id: 150, adult: true, level: "medium", title: "The Interview", image: "card_150.jpg", correct: "Says here you're a team player." },
  { id: 151, spicy: true, level: "hard", title: "Anniversary", image: "card_151.jpg", correct: "It's to the storage unit. Happy anniversary." },
  { id: 152, level: "medium", title: "Ice Fishing", image: "card_152.jpg", correct: "He's been here longer. Let him have the hole." },
  { id: 153, adult: true, level: "easy", title: "No Vacancy", image: "card_153.jpg", correct: "Check-in isn't until dusk." },
  { id: 154, spicy: true, level: "medium", title: "Dinner Guest", image: "card_154.jpg", correct: "Watered it twice and suddenly it's family." },
  { id: 155, level: "hard", title: "Lost and Found", image: "card_155.jpg", correct: "Describe the other one." },
  { id: 156, adult: true, level: "medium", title: "Parallel Parking", image: "card_156.jpg", correct: "I was here first. That's all I'm saying." },
  { id: 157, level: "easy", title: "Fetch", image: "card_157.jpg", correct: "He has a guy for that." },
  { id: 158, adult: true, level: "medium", title: "Exit Interview", image: "card_158.jpg", correct: "It's the only one here that never lied to me." },
  { id: 159, spicy: true, level: "medium", title: "Plus One", image: "card_159.jpg", correct: "My wife couldn't make it, so I brought someone who agrees with me." },
  { id: 161, adult: true, level: "medium", title: "The Grill", image: "card_161.jpg", correct: "Nobody touch it. Gary has a system." },
  { id: 162, spicy: true, level: "easy", title: "The Nap", image: "card_162.jpg", correct: "Don't wake him. He tips by the hour." },
  { id: 164, adult: true, level: "hard", title: "Fire Drill", image: "card_164.jpg", correct: "I'm on a deadline. The building can wait." },
  { id: 165, level: "medium", title: "The Bridge", image: "card_165.jpg", correct: "We stopped taking riddles in March." },
  { id: 166, spicy: true, level: "medium", title: "Wine Tasting", image: "card_166.jpg", correct: "Notes of oak, leather, and a second bottle." },
  { id: 167, adult: true, level: "easy", title: "The Upgrade", image: "card_167.jpg", correct: "He's been flying with us a long time." },
  { id: 168, level: "hard", title: "Sandcastle", image: "card_168.jpg", correct: "It's lovely, but you'll need a permit for the moat." },
  { id: 169, spicy: true, level: "medium", title: "The Cake", image: "card_169.jpg", correct: "We got the big one. Nobody knew which one you were." },
  { id: 170, adult: true, level: "medium", title: "Space", image: "card_170.jpg", correct: "I told you to turn left at Saturn." },
  { id: 171, level: "easy", title: "Bath Time", image: "card_171.jpg", correct: "He won't get out until you say sorry." },
  { id: 172, adult: true, level: "hard", title: "Tax Season", image: "card_172.jpg", correct: "He says we can deduct the vet." },
  { id: 173, adult: true, level: "medium", title: "The Meeting", image: "card_173.jpg", correct: "He's reviewed the quarterly numbers. They're under the couch now." },
  { id: 174, level: "medium", title: "Night Shift", image: "card_174.jpg", correct: "Anything good in sports?" },
  { id: 175, spicy: true, level: "easy", title: "Speed Dating", image: "card_175.jpg", correct: "So far it's going really well." },
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
  { id: 198, adult: true, level: "medium", title: "The Interview", image: "card_198.jpg", correct: "It says here you were in hibernation from November to March." },
  { id: 199, spicy: true, level: "medium", title: "Separate Beds", image: "card_199.jpg", correct: "It's load-bearing." },
  { id: 200, level: "hard", title: "The Keeper", image: "card_200.jpg", correct: "Nobody's hit it yet." },
  { id: 201, adult: true, level: "medium", title: "Laundry Day", image: "card_201.jpg", correct: "Tuesdays I'm also my own dry cleaner." },
  { id: 202, spicy: true, level: "easy", title: "Last Call", image: "card_202.jpg", correct: "I'll have what he's not saying." },
  { id: 203, level: "medium", title: "Time Off", image: "card_203.jpg", correct: "It's not a vacation if you go somewhere colder." },
  { id: 204, adult: true, level: "medium", title: "The Board", image: "card_204.jpg", correct: "Let's keep this short. I have a nap at two." },
  { id: 205, spicy: true, level: "medium", title: "Test Drive", image: "card_205.jpg", correct: "He's still deciding." },
  { id: 206, level: "easy", title: "The Toll", image: "card_206.jpg", correct: "Exact change only." },
  { id: 207, adult: true, level: "medium", title: "Going Up", image: "card_207.jpg", correct: "He's new." },
  { id: 208, spicy: true, level: "hard", title: "The Will", image: "card_208.jpg", correct: "And to Mr. Whiskers, everything else." },
  { id: 209, level: "medium", title: "Ballooning", image: "card_209.jpg", correct: "He doesn't have a ticket either." },
  { id: 210, adult: true, level: "easy", title: "Next", image: "card_210.jpg", correct: "Just a little off the everything." },
  { id: 211, spicy: true, level: "medium", title: "Speed Dating", image: "card_211.jpg", correct: "She's a much better listener than the last three." },
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
  { id: 225, spicy: true, level: "medium", title: "Personal Best", image: "card_225.jpg", correct: "Slowly. Don't let it touch your mouth." },
  { id: 226, level: "easy", title: "Competition", image: "card_226.jpg", correct: "He's using live bait." },
  { id: 227, adult: true, level: "medium", title: "Open House", image: "card_227.jpg", correct: "The previous owners couldn't get him out either." },
  { id: 228, spicy: true, level: "hard", title: "Confession", image: "card_228.jpg", correct: "He's been saving up since Lent." },
  { id: 229, level: "medium", title: "Parking", image: "card_229.jpg", correct: "They come by once every forty years." },
  { id: 230, adult: true, level: "medium", title: "Presentation", image: "card_230.jpg", correct: "The chef recommends you savor it." },
  { id: 231, spicy: true, level: "medium", title: "Breakfast", image: "card_231.jpg", correct: "He's been very good lately." },
  { id: 232, level: "easy", title: "Picnic", image: "card_232.jpg", correct: "Same as every Fourth of July." },
  { id: 233, adult: true, level: "medium", title: "Take a Number", image: "card_233.jpg", correct: "My powers don't include patience." },
  { id: 234, level: "easy", title: "Cocktails", image: "card_234.jpg", correct: "I'm told he's very down to earth." },
  { id: 235, adult: true, level: "hard", title: "Retirement Plan", image: "card_235.jpg", correct: "We said we'd wait till they came back." },
  { id: 236, level: "medium", title: "Summer", image: "card_236.jpg", correct: "Global warming has been great for business." },
  { id: 237, level: "easy", title: "Lost and Found", image: "card_237.jpg", correct: "Next time, sir, try to keep an eye on it." },
  { id: 238, adult: true, level: "medium", title: "Fitting", image: "card_238.jpg", correct: "Will sir be dressing left or right?" },
  { id: 239, spicy: true, level: "medium", title: "The Tasting", image: "card_239.jpg", correct: "He's a big-picture guy." },
  { id: 240, level: "hard", title: "Kite", image: "card_240.jpg", correct: "It's a family tradition." },
  { id: 241, adult: true, level: "medium", title: "Self-Checkout", image: "card_241.jpg", correct: "I'm going to need to see some ID." },
  { id: 242, spicy: true, level: "easy", title: "Settlement", image: "card_242.jpg", correct: "And the house?" },
  { id: 243, level: "medium", title: "Night School", image: "card_243.jpg", correct: "Eyes up here, please." },
  { id: 244, adult: true, level: "hard", title: "The Big One", image: "card_244.jpg", correct: "Smile. You won't believe what's behind you." },
  { id: 245, spicy: true, level: "hard", title: "Escape Room", image: "card_245.jpg", correct: "Ten more minutes, then we'll try the door." },
  { id: 246, level: "easy", title: "Bird Watching", image: "card_246.jpg", correct: "He's been out there all morning. I think he's lost." },
  { id: 247, adult: true, level: "medium", title: "Anniversary", image: "card_247.jpg", correct: "It was yesterday." },
  { id: 248, level: "medium", title: "Security", image: "card_248.jpg", correct: "Sorry, residents only." },
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
  { id: 264, adult: true, level: "medium", title: "Reading Club", image: "card_264.jpg", correct: "Don't tell me how it ends." },
  { id: 266, level: "hard", title: "Mail", image: "card_266.jpg", correct: "Probably just bills." },
  { id: 267, adult: true, level: "medium", title: "Arrivals", image: "card_267.jpg", correct: "Is this the line for the good cloud?" },
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
  { id: 283, level: "easy", title: "The Meeting", image: "card_283.jpg", correct: "Moving on. Q3." },
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
  { id: 301, adult: true, level: "easy", title: "Self-Portrait", image: "card_301.jpg", correct: "I paint what I see." },
  { id: 302, adult: true, level: "easy", title: "Between Jobs", image: "card_302.jpg", correct: "Things have been slow since the apps." },
  { id: 303, level: "medium", title: "House Hunting", image: "card_303.jpg", correct: "This one has a lot of character. And a previous owner." },
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
  { id: 317, level: "easy", title: "Crosswalk", image: "card_317.jpg", correct: "He's from out of town." },
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
  { id: 376, level: "easy", title: "Campfire", image: "card_376.jpg", correct: "Don't. They'll want to do this forever." },
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
  { id: 403, level: "easy", title: "Uneven Match", image: "card_403.jpg", correct: "Physics is more of a suggestion with him." },
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
  { id: 327, adult: true, level: "medium", title: "Just a Trim", image: "card_327.jpg", correct: "The usual?" },
  { id: 328, spicy: true, level: "medium", title: "The Check", image: "card_328.jpg", correct: "Shall I just leave this with the chair, sir?" },
  { id: 329, level: "medium", title: "Delivery", image: "card_329.jpg", correct: "Do you take returns?" },
  { id: 330, adult: true, level: "easy", title: "Weekend", image: "card_330.jpg", correct: "He swears they were biting last Tuesday." },
  { id: 331, spicy: true, level: "medium", title: "Patience", image: "card_331.jpg", correct: "Give it till the second lap." },
  { id: 332, level: "medium", title: "Head Count", image: "card_332.jpg", correct: "Four, five, six, and a chance of showers." },
  { id: 333, adult: true, level: "medium", title: "Feeding Time", image: "card_333.jpg", correct: "Not now. They're checking the markets." },
  { id: 334, spicy: true, level: "easy", title: "Dinner", image: "card_334.jpg", correct: "Gerald had a procedure. We don't ask." },
  { id: 422, level: "medium", title: "Self-Portrait", image: "card_422.jpg", correct: "He says it's a self-portrait. I say it's a cry for help." },
  { id: 423, spicy: true, level: "easy", title: "Office Party", image: "card_423.jpg", correct: "Wait till you see what the copier did." },
  { id: 424, spicy: true, level: "medium", title: "Lookout Point", image: "card_424.jpg", correct: "Even he has his limits." },
  { id: 425, spicy: true, level: "hard", title: "Wrong Hole", image: "card_425.jpg", correct: "He insisted on room to grow." },
  { id: 426, spicy: true, level: "hard", title: "Dusty Wait", image: "card_426.jpg", correct: "They said the doctor would be right with me." },
  { id: 427, adult: true, level: "hard", title: "Safe Cracker", image: "card_427.jpg", correct: "Three to the left, two to the right, and it orders more paper towels." },
  { id: 428, level: "easy", title: "Downpour", image: "card_428.jpg", correct: "Forecast said scattered showers. Nobody mentioned breeds." },
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

// Shown on everyone's screen when the table votes a cartoon off
const MULLIGAN_QUIPS = [
  'Thank you for your submission.',
  'The table has spoken.',
  'Noted, and declined.',
  'The cartoonist has been informed.',
  'Politely, firmly, no.',
  'Into the shredder it goes.',
  'Not even the artist liked that one.',
  'Cartoon fired. Security will walk it out.',
];
// How the rejected cartoon meets its end (every phone plays the same one)
const EXECUTIONS = ['punch', 'tear', 'fire', 'flush', 'stomp', 'shred'];

// The steal shows. 'full': the night's first steal, then about one steal in four, at random — never decided by
// where the chip was, so the show can't hint at the answer. One of the heists below, drawn in public/heists.js in
// this same order (index = act). A room deals them like a deck, so nobody sees a repeat until all have played.
// Every other steal is 'short': a transfer-of-ownership stamp (RECEIPTS).
// House rule for every line here: a caption. Short, specific, deadpan, one beat. Every line is used once.
const HEISTS = [
  { name: 'The Claw', gloats: ['Skill game.', 'First try, too.'] },
  { name: 'The Butler', gloats: ['Will that be all?', 'I’ve put it with the good silver.'] },
  { name: 'The Magician', gloats: ['Is this your chip? Not anymore.', 'No, you may not examine it.'] },
  { name: 'Grandma', gloats: ['You can visit it on holidays.', 'I’ll keep it somewhere safe. You’ll never find it.'] },
  { name: 'The Cat', gloats: ['If I sat on it, it’s mine.', 'Next time, don’t leave it out.'] },
  { name: 'The Auctioneer', gloats: ['Sold, to the dealer.', 'No other bids.'] },
  { name: 'The Raccoon', gloats: ['Rinsed it. Mine now.', 'Found it in the open. Basically garbage.'] },
  { name: 'The Accountant', gloats: ['For tax purposes, it’s mine.', 'It balances now.'] },
  { name: 'The Mime', gloats: ['(Pockets it. Says nothing.)', '(Points at you. Shrugs.)'] },
  { name: 'The Frog', gloats: ['It looked like a fly. Still mine.', 'It was moving slowly. That’s on you.'] },
  { name: 'The Octopus', gloats: ['I had seven free hands. Do the math.', 'Eight arms. Zero apologies.'] },
];
// The short show is paperwork: a transfer-of-ownership stamp and one typed line. {name} = whose chip it was.
const RECEIPTS = [
  'Received from {name}. Condition: used.',
  'Received from {name}. No receipt.',
  'Transferred from {name}. Signed for.',
  'Formerly {name}’s. Condition: fair.',
];
// Callbacks: the same player robbed twice in one game
// A chip stolen off a fake caption pays its owner this much (the steal's cost)
const STEAL_CAUGHT_PTS = 1;
// How long each steal show runs on the phones (public/steal.js FULL_MS / SHORT_MS); the flip waits for it
const STEAL_FULL_MS = 12400, STEAL_SHORT_MS = 6000, STEAL_FULL_SHARE = 0.25;
// Blind bets: everyone at once. The clock catches anyone idle; the last chip in gets a beat (to take it back),
// then every chip drops onto the table together and the table gets a look before the steal (or the flip).
const BLIND_MS = 45000, ALL_IN_BEAT_MS = 1500, DROP_HOLD_MS = 3200;
// The Late Edition card (the last trip around the table: double points); the writers get the time back
const LATE_MS = 3500;
const AGAIN_FULL = 'We meet again, {name}.';
const AGAIN_SHORT = 'Received from {name}. Again.';
const firstNameOf = (game, pid) => { const p = game.players.find(q => q.id === pid); return (String(p ? p.name : '').trim().split(/\s+/)[0]) || 'you'; };
// Next heist off the room's deck; a fresh shuffle never opens with the one that just played
function nextHeist(game) {
  // a room restored from an older server may hold a deck from the old 31-heist list: keep only acts that still exist
  if (Array.isArray(game.heistDeck)) game.heistDeck = game.heistDeck.filter(i => Number.isInteger(i) && i >= 0 && i < HEISTS.length);
  if (!Array.isArray(game.heistDeck) || !game.heistDeck.length) {
    let d = shuffleArray(HEISTS.map((_, i) => i));
    if (d.length > 1 && d[0] === game.lastHeist) d.push(d.shift());
    game.heistDeck = d;
  }
  const act = game.heistDeck.shift();
  game.lastHeist = act;
  return act;
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
    flags: [],                      // Frame It picks, recorded when each round's framing resolves: { fromId, round, target, at }
    framePicks: {},                 // this round's secret picks while framing: { playerId: target | 'pass' }
    frameVoters: [],                // who was here when framing began (late joiners may pick, never block)
    frameResult: null,              // once framing resolves: { at, framed: [target], counts: { key: n }, endsAt }
    inducted: [],                   // 'round|target' keys already inducted this game
    lastInduction: null,            // the latest induction, for the celebration: { n, round, target, caption, ... }
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
    reactions: {},        // { [targetKey]: { [playerId]: kind } } — this round only
    reel: null,           // the answer screen's reveal reel: { order: [targetKey...], step }
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
function setReelStep(game, step) { game.reel.step = step; game.stepAt = Date.now(); }

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
  if (game.lateFrom === game.round && !options.sameRound && game.timerEnd) game.timerEnd += LATE_MS;   // the Late Edition card never eats writing time
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
  game.roundBadges = [];
  game.framePicks = {};
  game.frameVoters = [];
  game.frameResult = null;
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
  return { ok: true, allIn: allCaptionsIn(game) };
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
  if (game.timerEnd) game.timerEnd += 4500;   // the execution plays over the new cartoon: give that time back ([settings] no timer: nothing to give)
  game.mulliganEvent = { n: game.mulliganCount, quip: pick(MULLIGAN_QUIPS), kind: pick(EXECUTIONS), image: oldImage, at: Date.now() };
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
  setPhase(game, PHASES.READING);
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
// The face-down card turns over at `at` (server time): every phone flips it together
function startFlip(game, at) {
  game.flipAt = at;
  setPhase(game, PHASES.REVEAL);
  return { ok: true };
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
  const robbedBefore = game.history.some(h => h.steal && h.steal.victimId === bet.playerId);
  const vname = firstNameOf(game, bet.playerId);
  let act = null, actName = null, gloat;
  if (stealShow === 'full') {   // only a full show deals a heist off the deck, so they stay a treat
    act = nextHeist(game); actName = HEISTS[act].name;
    gloat = robbedBefore ? AGAIN_FULL.replace('{name}', vname) : pick(HEISTS[act].gloats);
  } else {
    gloat = (robbedBefore ? AGAIN_SHORT : pick(RECEIPTS)).replace('{name}', vname);
  }
  const at = Date.now();
  game.steal = { victimId: bet.playerId, target: bet.target, stage: bet.stage, betIndex: Number(betIndex), onCorrect, act, actName, gloat, again: robbedBefore, stealShow, seed: Math.floor(Math.random() * 1e9), at, show: game.stealShows };
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
    game.reel = { order, step: 1, nobody: k >= 2 && k < order.length ? k : 0 }; }   // #24: the captions nobody bit on share one step
  game.stepAt = game.phaseAt;
  // Badges never break the answer: if anything goes wrong, the round just has none
  try { awardBadges(game); } catch (e) { console.error('badges', e); game.roundBadges = []; }

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
    reelOrder: [...game.reel.order],
    badges: JSON.parse(JSON.stringify(game.roundBadges)),
  });
}

// The recap is done: "Anything frame-worthy?"
function moveToFraming(game) {
  if (game.phase !== PHASES.ANSWER) return { error: 'Too late — the game moved on' };
  if (game.reel && game.reel.step < game.reel.order.length + 1) return { error: 'Finish the reveal first' };
  game.framePicks = {};
  game.frameVoters = game.players.filter(isPresent).map(p => p.id);
  game.frameResult = null;
  setPhase(game, PHASES.FRAMING);
  return { ok: true };
}
// Framing over (resolving it first if the dealer moves on early): the scoreboard
function moveToScoreboard(game) {
  if (game.phase === PHASES.ANSWER) return { error: 'Frame It comes first' };
  if (game.phase !== PHASES.FRAMING) return { error: 'Too late — the game moved on' };
  if (!game.frameResult) resolveFraming(game);
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
  if (isGameOver(game)) settleRating(game);
  return { ok: true };
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

/* ── Frame It: after every answer, one secret pick per player per cartoon, every round (no limit per game) ──
   A caption is FRAMED when a majority of the other players (everyone but its writer) pick it (inductNeed):
   player-written ones join The Gallery deck. */
function authorOf(game, target) { return target === 'closed' ? game.closedPlayerId : (game.openCaptions[target] || {}).playerId; }
// Pick a caption (not your own) or 'pass'. Changeable until the framing resolves.
function pickFrame(game, playerId, target) {
  if (game.phase !== PHASES.FRAMING) return { error: 'Framing happens after the answer' };
  if (game.frameResult) return { error: 'The frames are in' };
  if (!game.players.some(p => p.id === playerId)) return { error: 'Player not in game' };
  let t = 'pass';
  if (target !== 'pass') {
    const v = validateTarget(game, target);
    if (v.error) return v;
    if (authorOf(game, v.target) === playerId) return { error: 'You can’t frame your own caption' };
    if (isBetOnCorrect(game, { target: v.target })) return { error: 'The real caption can’t be framed' };
    t = v.target;
  }
  (game.framePicks = game.framePicks || {})[playerId] = t;
  return { ok: true, allIn: allFramesIn(game) };
}
// Everyone who was here when framing began, and is still here, has decided (a dropped phone stops counting after the grace)
function allFramesIn(game) {
  const picks = game.framePicks || {};
  const voters = new Set(game.frameVoters || []);
  return game.players.filter(p => voters.has(p.id) && isPresent(p)).every(p => p.id in picks);
}
// The ceremony's beats (server clock): each framed caption gets a slot, then the scoreboard
const FRAME_LEAD_MS = 900, FRAME_SLOT_MS = 10000, FRAME_NONE_MS = 3600;   // a framing gets time to be admired before the scoreboard
// Count the picks; every caption with enough is framed (most picks first). Happens once per round.
function resolveFraming(game) {
  if (game.phase !== PHASES.FRAMING) return { error: 'Too late — the game moved on' };
  if (game.frameResult) return { ok: true, noop: true };
  const at = Date.now(), counts = {}, by = {};
  const order = game.openCaptions.map((_, i) => String(i)).concat('closed');
  for (const [pid, t] of Object.entries(game.framePicks || {})) {
    if (t === 'pass' || !game.players.some(p => p.id === pid)) continue;
    const k = String(t);
    counts[k] = (counts[k] || 0) + 1;
    (by[k] = by[k] || []).push(pid);
  }
  // Every pick is kept (the night's 'Most Framed' award and the Gallery's 'framed by' read them)
  game.flags = (game.flags || []).filter(f => f.round !== game.round);
  for (const k of order) for (const pid of by[k] || []) game.flags.push({ fromId: pid, round: game.round, target: k === 'closed' ? 'closed' : Number(k), at });
  const need = inductNeed(game);
  const framed = Object.keys(counts).filter(k => counts[k] >= need).sort((x, y) => counts[y] - counts[x] || order.indexOf(x) - order.indexOf(y));
  game.inducted = game.inducted || [];
  const items = [];
  framed.forEach((k, i) => {
    const target = k === 'closed' ? 'closed' : Number(k), key = game.round + '|' + target;
    if (!game.inducted.includes(key)) game.inducted.push(key);
    const fl = game.flags.filter(f => f.round === game.round && String(f.target) === k);
    try { const it = induct(game, target, fl, counts[k], at + FRAME_LEAD_MS + i * FRAME_SLOT_MS); if (it) items.push(it); } catch (e) { console.error('induction', e); }
  });
  if (items.length) {
    const n = ((game.lastInduction && game.lastInduction.n) || game.inductionCount || 0) + 1;
    game.lastInduction = { ...items[0], n, list: items };
  }
  const endsAt = framed.length ? at + FRAME_LEAD_MS + framed.length * FRAME_SLOT_MS : at + FRAME_NONE_MS;
  game.frameResult = { at, framed: framed.map(k => (k === 'closed' ? 'closed' : Number(k))), counts, endsAt };
  return { ok: true, framed: game.frameResult.framed, endsAt };
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

/* ── Emoji reactions: one per person per caption, counts only until the answer ── */
const REACTION_KINDS = ['laugh', 'up', 'fire', 'huh', 'dead', 'roll'];
const REACT_FACE_UP = [PHASES.READING, PHASES.FIRST_BETS, PHASES.STEAL];   // the Closed Caption is still face-down (#8: the steal comes before the flip)
const REACT_ALL = [PHASES.REVEAL, PHASES.SECOND_BETS];                 // open captions and the Closed Caption
function react(game, playerId, target, kind) {
  const early = REACT_FACE_UP.includes(game.phase);
  if (!early && !REACT_ALL.includes(game.phase)) return { error: 'Reactions close once the bets are in' };
  if (!game.players.some(p => p.id === playerId)) return { error: 'Player not in game' };
  if (!REACTION_KINDS.includes(kind)) return { error: 'That didn’t take. Try again.' };
  const v = validateTarget(game, target);
  if (v.error) return v;
  if (early && v.target === 'closed') return { error: 'The Closed Caption is still face-down' };
  const key = String(v.target);
  const map = game.reactions[key] || (game.reactions[key] = {});
  if (map[playerId] === kind) delete map[playerId];   // same one again takes it back
  else map[playerId] = kind;                          // a different one replaces it
  return { ok: true };
}
// { [targetKey]: { [kind]: n } } — never who, or it would give away who wrote what
function reactionCounts(game) {
  const out = {};
  for (const [key, map] of Object.entries(game.reactions || {})) {
    const c = {};
    for (const kind of Object.values(map)) c[kind] = (c[kind] || 0) + 1;
    if (Object.keys(c).length) out[key] = c;
  }
  return out;
}
function myReactions(game, playerId) {
  const out = {};
  for (const [key, map] of Object.entries(game.reactions || {})) if (map[playerId]) out[key] = map[playerId];
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
// The dealer steps through the reel one caption at a time; the last step is the round recap
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
  game.frameVoters = [];
  game.frameResult = null;
  game.inducted = [];
  game.realCredit = null;
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
    lastInduction: game.lastInduction ? { ...game.lastInduction, flaggers: [...game.lastInduction.flaggers], list: (game.lastInduction.list || []).map(x => ({ ...x, flaggers: [...x.flaggers] })) } : null,   // only made when framing resolves
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

  // Before the answer: how many of each reaction, never who; after: the full picture
  if (REACT_FACE_UP.includes(game.phase) || REACT_ALL.includes(game.phase) || game.phase === PHASES.STEAL) {
    base.reactionCounts = reactionCounts(game);
    base.myReactions = myReactions(game, playerId);
  }
  if (ANSWERED.includes(game.phase)) {
    base.reactions = JSON.parse(JSON.stringify(game.reactions || {}));
    base.reel = game.reel ? { order: [...game.reel.order], step: game.reel.step, nobody: game.reel.nobody || 0 } : null;
    base.roundBadges = (game.roundBadges || []).map(b => ({ ...b }));
  }

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

  // Frame It: who has decided (never who picked what, or how many) until it resolves
  if (game.phase === PHASES.FRAMING) {
    const picks = game.framePicks || {}, r = game.frameResult;
    base.framing = {
      voters: [...(game.frameVoters || [])],
      decided: Object.keys(picks),
      myPick: playerId in picks ? picks[playerId] : null,
      resolved: !!r,
      result: r ? { at: r.at, framed: [...r.framed], counts: { ...r.counts }, endsAt: r.endsAt } : null,
    };
  }

  if (game.phase === PHASES.SCORES) {
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
    if (g.phase === PHASES.FIRST_BETS && !g.dropAt && g.blindEnd) g.blindEnd = Math.max(g.blindEnd, Date.now() + 20000);   // bettors get a fair 20 s back
    g.usedCartoonIds = (g.usedCartoonIds || []).filter(id => !isRetiredId(id));
    if (g.cartoon && isRetiredId(g.cartoon.id)) resetForNewGame(g);   // a room from before the retirement: back to the lobby
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
  addTime, undoBet, freshest, createGame, updateSettings, addPlayer, kickPlayer, moveSeat, setSeen, pickFrame, allFramesIn, resolveFraming, hallOfFame, planBlock, ensurePlan,
  inductNeed, deckCartoons, dealCartoon, store, syncGallery, setPlayerSeen, seenCounts,
  startRound, submitCaption, voteMulligan, finishWriting, allCaptionsIn,
  moveToFirstBets, placeBet, skipCurrentBetter, dropBlind, afterBlinds, moveFromReveal, moveFromSecondBets, eligibleSecondBetters,
  standing, fooledTally, isLate, lapsOf, BLIND_MS, ALL_IN_BEAT_MS, DROP_HOLD_MS, STEAL_FULL_MS, STEAL_SHORT_MS, LATE_MS,
  openFinale, voteFinale, resolveFinale, finaleAllIn,
  setVoice, clearVoice,
  stealChip, revealAnswer, moveToFraming, moveToScoreboard, isGameOver, resetForNewGame, isPresent,
  REACTION_KINDS, react, reelStep, reelOrder, votesOn, awardBadges, setCareer, closeVerdicts, OPEN_MS,
  currentBetterId, pendingBetters, nextDealerIndex, getPlayerView, generateRoomCode,
};
