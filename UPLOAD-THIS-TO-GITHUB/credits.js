// credits.js — the words for the end of the night (server only; night.js picks them, so every phone shows the same).
//
// LINES: the end credits (Nick, Oct 20 2026: "the actual payoff… like the end of Animal House, individual closure
// with a joke"). One epilogue per player, earned from how they played. Nick's rule from his scoring: open with what
// they did tonight, then one simple picturable future, then a short concrete kicker as the last beat.
// The first lines under a few keys are his 9–10 samples (credits/scores.json), each given that opening clause; the
// rest are the round-2 pool (credits/pool_round2.json), 6 per trigger.
//   {name} the player · {other} another player (who they fooled most / robbed twice) · {n} the count, written out
//   ("{n} times" becomes once / twice / three times; one fake, two fakes; rating points stay digits)
//   adult: true  = never in a Family game
//   need: 'second' = only for a player who finished exactly second
// Lines are remembered by a 6-character hash of the text (rating.js lineKey): editing a line makes it a new line;
// adding, removing or reordering lines is safe. No phone hears the same line twice until it has heard them all.
'use strict';

const LINES = {
  won: [
    { text: "{name} won tonight and went on to treat it as a lifetime appointment. Still signs every email ’Reigning Champion.’" },
    { text: "{name} won tonight and went on to hold a postgame press conference in the driveway. Took questions for forty minutes. Nobody asked any." },
    { text: "Fresh off tonight’s win, {name} went on to dump a Gatorade bucket over their own head at every family party since. Including the baby’s first birthday." },
    { text: "After winning tonight, {name} went on to present it as a poster at every science conference for twenty years. Same poster. Laminated now." },
    { text: "Having won tonight, {name} went on to get their name added to the town welcome sign. Just below the population. Slightly larger." },
    { text: "{name} won tonight and went on to have everything from it bronzed. The scorecard. The chair. Half a pretzel." },
    { text: "After tonight’s win, {name} went on to bring it up in every speech for thirty years. Weddings. Retirements. Their own divorce hearing.", adult: true },
  ],
  tiedFirst: [
    { text: "Tied for first tonight, {name} went on to demand overtime at every family dinner since. Thanksgiving now has a fifth quarter." },
    { text: "{name} tied for first tonight and went on to share a Nobel Prize. One medal. They take turns wearing it to the grocery store." },
    { text: "{name} tied for first tonight and went on to serve as co-grand marshal of the Fourth of July parade. One convertible. Both drove." },
    { text: "After tying for first tonight, {name} went on to share Employee of the Month at the hardware store. One parking space. They carpool now." },
    { text: "After tying for first tonight, {name} went on to co-discover a new beetle and name it after both finders. The beetle is half an inch long. The name is longer." },
    { text: "After tying for first tonight, {name} went on to demand a tiebreaker in the hotel lounge. Darts. Arm wrestling. Karaoke. Security broke the tie.", adult: true },
  ],
  last: [
    { text: "After finishing dead last with total conviction, {name} went on to coach Little League to a perfect 0-and-40 season. The town threw a parade anyway." },
    { text: "{name} finished dead last tonight and went on to manage a Little League team that never won a game. Led the league in orange slices." },
    { text: "After finishing last tonight, {name} went on to bowl in the same league for thirty years without a strike. The alley named a gutter after them." },
    { text: "{name} finished last tonight and went on to run for town dog catcher. Lost to the dog." },
    { text: "After finishing last tonight, {name} went on to spend thirty years as the control group at the state university. Nothing was ever done to {name}. Cited in forty journals." },
    { text: "{name} finished last tonight and went on to lose on every game show on television. Nineteen appearances. Owns nineteen home editions." },
    { text: "After finishing last tonight, {name} went on to explain how close it was to a cruise-ship bartender for thirty years. Same stool. Same story. Four bartenders.", adult: true },
  ],
  middle: [
    { text: "{name} finished middle of the pack tonight and went on to a twenty-year career as a backup quarterback. Never threw a pass. Excellent with a clipboard." },
    { text: "{name} finished dead center tonight and went on to bowl exactly 150, every game, for thirty years. The league finds it unsettling." },
    { text: "{name} finished right in the middle tonight and went on to serve forty years on the library board. Never made a motion. Seconded all of them." },
    { text: "After finishing squarely in the middle tonight, {name} went on to be named the town’s most average resident. There was a plaque. It was medium-sized." },
    { text: "After finishing in the middle tonight, {name} went on to be the second act at a Catskills resort for twenty years. Right after the juggler. Right before the bingo." },
    { text: "{name} finished right in the middle tonight and went on to be the middle name on four hundred science papers. Never first. Never last. Business cards just say ’et al.’" },
  ],
  comeback: [
    { text: "Dead last after two rounds, {name} clawed back to second, and went on to inspire a sports movie. Training montage. Museum steps. Gray sweatsuit. And awful body odor.", need: 'second' },
    { text: "Dead last after round two, {name} stormed back tonight and went on to replay it at every family gathering since. In slow motion. Does the crowd noise." },
    { text: "Down and out after two rounds, {name} rallied tonight and went on to live like the underdog forever. Still hums the Rocky theme walking into the DMV." },
    { text: "After climbing out of last place tonight, {name} went on to star in a three-part Gazette series. Part one ran on page nine. Part three made the front page." },
    { text: "Dead last after two rounds, {name} rallied tonight and went on to win the library summer reading contest. Didn’t start until Labor Day. Won by a pamphlet." },
    { text: "Dead last after round two, {name} rallied tonight and went on to build a science-fair volcano ten minutes before judging. First place. The gym still smells like vinegar." },
    { text: "After coming back from dead last tonight, {name} went on to show up two hours late to every party for forty years. Closed every one. Left with the band." },
  ],
  collapse: [
    { text: "Leading at the half tonight, {name} went on to dunk on the whole league in warm-ups for twenty years. Then the game started." },
    { text: "Up big at halftime tonight, {name} went on to grow the most promising culture in lab history. Six undefeated weeks. Then the janitor washed the dish." },
    { text: "{name} led at halfway tonight and went on to lead the Fourth of July parade for one block. Then turned into the car wash." },
    { text: "After leading at halfway tonight, {name} went on to grow the biggest pumpkin in the county by July. By the fair, it was a cucumber." },
    { text: "After leading at halfway tonight, {name} went on to kill for twenty minutes a night in a hotel lounge. The act was forty-five minutes." },
    { text: "{name} led at halfway tonight and went on to be the best first date in town history. Right up through the breadsticks." },
  ],
  fooledMany: [
    { text: "After fooling {other} {n} times tonight, {name} went on to sell {other} the Brooklyn Bridge. Twice. They still exchange Christmas cards." },
    { text: "After faking out {other} {n} times tonight, {name} went on to a long career as a pump-fake specialist. {other} is still in the air." },
    { text: "{name} fooled {other} {n} times tonight and went on to sell {other} season tickets to a team that doesn’t exist. Thirty seasons. {other} has never missed a game." },
    { text: "After fooling {other} {n} times tonight, {name} went on to write the Gazette’s April Fools’ column for thirty years. {other} has believed every one. Especially the moose." },
    { text: "After fooling {other} {n} times tonight, {name} went on to send thirty years of research to {other} for peer review. {other} approved all of it. One was a meatloaf recipe." },
    { text: "After fooling {other} {n} times tonight, {name} went on to ring {other}’s doorbell and run every Halloween for forty years. {other} still answers. With candy." },
    { text: "{name} fooled {other} {n} times tonight and went on to serve {other} boxed wine for twenty years. Called it ’a little vineyard outside Paris.’ {other} has asked to visit.", adult: true },
  ],
  fooledNobody: [
    { text: "After fooling nobody all night, {name} went deep undercover for the FBI. The whole cul-de-sac knew by Tuesday." },
    { text: "After fooling no one tonight, {name} went on to spend forty years as a wildlife biologist in full camouflage. Every bird saw {name} coming. Some waved." },
    { text: "{name} fooled nobody all night and went on to anchor the county hide-and-seek team for twenty years. Found in four seconds, every game. Same lamppost." },
    { text: "{name} fooled nobody tonight and went on to plan every surprise party in town for thirty years. Not one surprise. The guest of honor usually brings the cake." },
    { text: "After fooling no one tonight, {name} went on to play the culprit in every community-theater whodunit for twenty years. The ushers guess it while seating people." },
    { text: "{name} fooled nobody tonight and went on to a long career as a magician at a lake resort. Shows you the card first. Very relaxing act." },
    { text: "After fooling nobody all night, {name} went on to tell every hotel bartender in the Catskills they were thirty-nine. Then asked for the senior discount.", adult: true },
  ],
  gotFooled: [
    { text: "After falling for {n} fakes tonight, {name} went on to buy every perpetual motion machine sold online. Owns eleven. None of them move." },
    { text: "{name} fell for {n} fakes tonight and went on to buy a signed baseball from every guy in the stadium parking lot. Forty different Babe Ruths. One in crayon." },
    { text: "{name} fell for {n} fake captions tonight and went on to believe every rumor at the diner for thirty years. Still waiting on the Olive Garden." },
    { text: "After falling for {n} fakes tonight, {name} went on to buy a ’genuine Revolutionary War musket’ at every yard sale in the county. Owns nine. Two are umbrellas." },
    { text: "{name} got fooled {n} times tonight and went on to discover nine new species under a microscope. All nine were the same eyelash." },
    { text: "After getting fooled {n} times tonight, {name} went on to believe every lounge singer in the Poconos was singing just to them. Proposed four times. Once to the piano player.", adult: true },
  ],
  foundMany: [
    { text: "After sniffing out the real caption {n} times tonight, {name} went on to authenticate paintings for a major museum. Never missed a forgery. Was eventually asked to stop doing it at weddings." },
    { text: "After finding the real caption {n} times tonight, {name} went on to run quality control at a chemical plant. Never passed a bad batch. Also rejects the break-room coffee. In writing." },
    { text: "{name} found the real caption {n} times tonight and went on to pick every Super Bowl winner in August for thirty years. Banned from every office pool." },
    { text: "{name} found the real caption {n} times tonight and went on to judge the county fair pie contest for thirty years. Can spot a store-bought crust from the parking lot." },
    { text: "After finding the real caption {n} times tonight, {name} went on to run the lie detector for the county sheriff. Retired undefeated. Family dinners got very quiet." },
    { text: "After finding the real caption {n} times tonight, {name} went on to taste-test every buffet in the Catskills. Can spot frozen shrimp from across the room. Ruins brunch." },
    { text: "{name} found the real caption {n} times tonight and went on to attend weddings for forty years, knowing exactly which couples would last. Writes it in the card.", adult: true },
  ],
  neverFound: [
    { text: "Zero-for-the-night on the real caption, {name} went on to bat leadoff in the town softball league for twenty years. No hits. One walk. Still talks about the walk." },
    { text: "After going 0-for-tonight on the real caption, {name} went on to call heads on every coin toss for thirty years. Tails, every single time. Scientists have been notified." },
    { text: "{name} never once found the real caption tonight and went on to run the town lost-and-found for thirty years. Never located a single thing. Including the lost-and-found." },
    { text: "Having never found the real caption tonight, {name} went on to staff the town visitor booth for twenty years. Gave directions to everything. Everyone ended up at the dump." },
    { text: "After missing the real caption all night, {name} went on to spend forty summers walking into the wrong family reunion. Stayed for dinner every time. Made the group photo twice." },
    { text: "{name} never found the real caption tonight and went on to spend forty years at an observatory searching for new stars. Found none. Did eventually find the lens cap." },
  ],
  blindMany: [
    { text: "After betting blind on the face-down card {n} times tonight, {name} went on to bowl for thirty years with their eyes closed. Averaged 140. Nobody’s sure which lane." },
    { text: "{name} kept betting the face-down card tonight and went on to pick a favorite team by throwing a dart at the TV. Hit the weather report. Still roots for sunny." },
    { text: "{name} bet blind on the face-down card {n} times tonight and went on to buy every mystery box at the town auction for twenty years. Mostly doorknobs. One canoe." },
    { text: "After betting blind {n} times tonight, {name} went on to run a chemistry lab without reading a single label. Forty years. Three new colors. One new smell." },
    { text: "{name} bet the face-down card all night and went on to volunteer, sight unseen, for every act on every cruise ship. Sawed in half four times. Still volunteers first." },
    { text: "After betting blind {n} times tonight, {name} went on to say yes to every blind date in the Catskills. Married one. Still not sure which.", adult: true },
  ],
  longShot: [
    { text: "After hitting the long shot on the face-down card tonight, {name} went on to find a dinosaur bone while walking the dog. The museum named a wing after {name}. And the dog." },
    { text: "{name} won a long shot on the face-down card tonight and went on to catch a home run ball in a tray of nachos. Still has the ball. Still has the nachos." },
    { text: "After winning a long shot on the face-down card tonight, {name} went on to win the county fair jellybean guess three years running. Never counted once. The jar now has a deputy." },
    { text: "{name} won a long shot on the face-down card tonight and went on to win the fire department raffle with a ticket found on the sidewalk. Riding mower. Lives in an apartment." },
    { text: "{name} hit a long shot on the face-down card tonight and went on to invent a new plastic by spilling coffee on an experiment. Now spills coffee on purpose. Nothing." },
    { text: "{name} hit the long shot on the face-down card tonight and went on to win a Catskills talent show doing bird calls. Beat a professional juggler. The juggler still writes letters." },
  ],
  stoleMany: [
    { text: "After pocketing {n} chips as dealer tonight, {name} went on to serve as PTA treasurer for nineteen years. Beloved by every parent. The audit is ongoing." },
    { text: "{name} swiped {n} chips as dealer tonight and went on to lead the league in stolen bases for twenty years. Also stolen bats. Also the scoreboard." },
    { text: "After pocketing {n} chips as dealer tonight, {name} went on to work stadium security for thirty years. The stadium is missing four hundred seats. {name}’s basement has stadium seating." },
    { text: "{name} skimmed {n} chips as dealer tonight and went on to serve as treasurer of the garden club. The club now owns one rake. {name} owns a greenhouse." },
    { text: "After skimming {n} chips as dealer tonight, {name} went on to run the coat check at the Elks Lodge for thirty years. Every coat came back. Slightly lighter." },
    { text: "{name} stole {n} chips as dealer tonight and went on to win an eleven-million-dollar grant for a new microscope. Lovely microscope. Sleeps six." },
    { text: "After skimming {n} chips as dealer tonight, {name} went on to tend bar at a Poconos resort. Heavy pours. Light change. Retired to Florida at thirty-eight.", adult: true },
  ],
  robbedTwice: [
    { text: "{name} robbed {other} twice as dealer tonight and went on to pick {other}’s pocket in every pickup game for twenty years. Steals the ball. Steals the water bottle. Steals the ride home." },
    { text: "After robbing {other} twice as dealer tonight, {name} went on to share a lab bench with {other} for thirty years. Took {other}’s beakers. {other}’s stool. {other}’s name off the patent." },
    { text: "{name} robbed {other} twice as dealer tonight and went on to borrow {other}’s lawn mower. Then {other}’s ladder. Then {other}’s lawn." },
    { text: "After robbing {other} twice as dealer tonight, {name} went on to beat {other} for a seat on the zoning board by one vote. {other}’s." },
    { text: "After robbing {other} twice as dealer tonight, {name} went on to sell {other} their own grill at a yard sale. Twice. {other} haggled." },
    { text: "{name} robbed {other} twice as dealer tonight and went on to steal {other}’s seat at every wedding for forty years. Ate {other}’s chicken. Danced with {other}’s date.", adult: true },
  ],
  robbedMany: [
    { text: "{name} got robbed {n} times tonight and went on to catch for the town softball team for twenty years. Every runner stole second. One stole the glove." },
    { text: "After getting robbed {n} times tonight, {name} went on to host the tailgate at every home game for thirty years. Grills forty hot dogs a week. Has never eaten one." },
    { text: "{name} had chips stolen {n} times tonight and went on to grow the finest tomatoes in the county. Never tasted one. The neighbors say they’re excellent." },
    { text: "After getting robbed {n} times tonight, {name} went on to bring a casserole to every town potluck for thirty years. Never got the dish back. Now brings it in a bucket." },
    { text: "{name} got robbed {n} times tonight and went on to make three major scientific discoveries. Colleagues published all three first. {name} is thanked in a footnote. Spelled wrong." },
    { text: "After getting robbed {n} times tonight, {name} went on to spend forty years at resort bars without finishing a single martini. Turns to say hello. It’s gone.", adult: true },
  ],
  framedMine: [
    { text: "After getting {n} captions framed tonight, {name} went on to open a Hall of Fame for them. It’s the garage. Tours on Saturdays. Mandatory for in-laws." },
    { text: "{name} got {n} captions framed tonight and went on to give the funniest talk in the history of chemistry conferences. Standing ovation. Previous record: one polite cough." },
    { text: "{name} got {n} captions framed tonight and went on to write the sign outside the hardware store. People drive in from three towns to read it. Nobody buys a hammer." },
    { text: "After getting {n} captions framed tonight, {name} went on to write the captions in a high school biology textbook. Funniest book in the building. Nobody learned a thing about frogs." },
    { text: "{name} got {n} captions framed tonight and went on to headline every resort in the Catskills for forty years. The waiters stopped serving to listen. The soup got cold." },
    { text: "After getting {n} captions framed tonight, {name} went on to give a wedding toast so funny the best man, a professional comic, quit the business. Plumbing now. Very happy." },
  ],
  framedOthers: [
    { text: "{name} framed {n} other people’s captions tonight and went on to start the wave at every ballgame for forty years. Every inning. Usually a wave of one." },
    { text: "After framing {n} of everyone else’s captions tonight, {name} went on to hand out the trophies at the youth soccer banquet. Every kid got one. So did the bus driver." },
    { text: "{name} framed {n} other people’s captions tonight and went on to write a glowing letter to the editor every week for thirty years. The parade. The library. Especially the new stop sign." },
    { text: "After framing {n} captions tonight, {name} went on to judge the county fair and gave every entry a blue ribbon. Every pie. Every quilt. One very confused goat." },
    { text: "{name} framed {n} other people’s captions tonight and went on to review research grants for thirty years. Funded every one. Including ’Do Ducks Enjoy Jazz?’ They do." },
    { text: "After framing {n} captions tonight, {name} went on to leave a five-star review for everything. Jury duty. The DMV. The tow truck that took their car." },
  ],
  lastSecond: [
    { text: "After submitting at the last second all night, {name} went on to show up to their own wedding during the toasts. Gave one anyway. It killed." },
    { text: "{name} beat the buzzer every round tonight and went on to file taxes at 11:59 p.m. every April 15th for forty years. Drives to the post office in a bathrobe." },
    { text: "After submitting with one second left all night, {name} went on to arrive at every ballgame on the last note of the anthem. Thirty years. Sits down on ’brave.’" },
    { text: "{name} submitted at the last second all night and went on to run a chemistry lab where every reaction finished with one second left. The fire department sends a holiday card." },
    { text: "After waiting until the last second every round tonight, {name} went on to cast the deciding vote at every town meeting. Walks in as the gavel comes down. Holding a sandwich." },
    { text: "{name} submitted at the last second all night and went on to catch every cruise ship by leaping from the dock. Forty years. Never once spilled the shrimp cocktail." },
    { text: "After submitting at the buzzer all night, {name} went on to hit last call at every hotel bar in the Catskills with one second to spare. Forty years. Orders two.", adult: true },
  ],
  firstIn: [
    { text: "{name} submitted first every round tonight and went on to arrive at every ballgame before the grounds crew. Helps chalk the lines. Nobody asked." },
    { text: "After locking in first every round tonight, {name} went on to tee off at 5 a.m. every day for thirty years. Done before sunrise. Never once found the ball." },
    { text: "{name} submitted first every round tonight and went on to stake out a spot for every solar eclipse. Set up the telescope in March. The eclipse was in August." },
    { text: "After submitting first every round tonight, {name} went on to have the first snowblower out on the street every year. In October. On grass." },
    { text: "{name} submitted first every round tonight and went on to arrive at every wedding before the caterer. Before the bride. Before the couple had met." },
    { text: "After submitting first every round tonight, {name} went on to arrive at a science conference a full year early. Gave the talk anyway. The hotel was still being built." },
  ],
  skips: [
    { text: "{name} called for {n} do-overs tonight and went on to chair the HOA design committee. Rejected 412 paint colors. Approved beige." },
    { text: "{name} called for {n} skips tonight and went on to call timeout before every free throw in rec league for twenty years. Games now end at breakfast." },
    { text: "After asking to skip {n} cartoons tonight, {name} went on to change the channel during every big game for thirty years. Seen four thousand kickoffs. Never once seen a final score." },
    { text: "{name} skipped {n} cartoons tonight and went on to try on every pair of shoes at the town shoe store for thirty years. Bought the first pair. Every time." },
    { text: "After asking for {n} skips tonight, {name} went on to rerun every lab experiment until the results looked nicer. Thirty years. Still on experiment number one." },
    { text: "{name} asked to skip {n} cartoons tonight and went on to send back every dish at every resort in the Catskills. The chef keeps a framed photo of {name}. On a dartboard." },
    { text: "After calling for {n} skips tonight, {name} went on to ask for a different table in every hotel dining room for forty years. Has eaten at every table. Usually the same night." },
  ],
  ratingUp: [
    { text: "{name}’s rating jumped {n} points tonight, and {name} went on to hire an agent to renegotiate household chores. Now does dishes on a three-year deal. Trash is a separate contract." },
    { text: "After their rating climbed {n} points tonight, {name} went on to demand a reserved parking spot at home. Painted the lines. The family parks on the street." },
    { text: "{name}’s rating rose {n} points tonight, and {name} went on to have the number painted on the town water tower. Tourists think it’s the population." },
    { text: "After their rating jumped {n} points tonight, {name} went on to publish it in a peer-reviewed journal. Forty pages. All three reviewers were cousins." },
    { text: "{name}’s rating went up {n} points tonight, and {name} went on to demand top billing at every family reunion. Name on the cake. Bigger than the birthday kid’s." },
    { text: "After their rating climbed {n} points tonight, {name} went on to print business cards with the new number. Hands them out at every buffet. Lovely cards. Embossed." },
  ],
  ratingDown: [
    { text: "{name}’s rating dropped {n} points tonight, and {name} went on to get sent down to the minors. Of the family. Now sits at the kids’ table." },
    { text: "After their rating fell {n} points tonight, {name} went on to be traded to the neighbors for a leaf blower. The neighbors want the leaf blower back." },
    { text: "{name}’s rating fell {n} points tonight, and {name} went on to be moved from the town hall Wall of Fame to the hallway by the restrooms. Same frame. Smaller nail." },
    { text: "After their rating dropped {n} points tonight, {name} went on to get the Pluto treatment. Downgraded from planet to dwarf planet. Still shows up to the planet reunions." },
    { text: "{name}’s rating sank {n} points tonight, and {name} went on to slide from headliner to opening act to folding napkins at a Poconos resort. Beautiful napkins. Swans." },
    { text: "After their rating dropped {n} points tonight, {name} went on to be removed from the family group chat, the holiday card, and the fridge." },
  ],
  groans: [
    { text: "{name} drew {n} groans tonight, most at the table, and went on to write the puns for a minor-league scoreboard for thirty years. The mascot asked to be traded." },
    { text: "After leading the table in groans tonight, {name} went on to write the puns on the safety posters at a chemical plant. Safety’s up. Morale’s down." },
    { text: "{name} drew {n} groans tonight and went on to name every new business on Main Street. The barbershop is ’Hair Today.’ The funeral home politely declined." },
    { text: "After drawing {n} groans tonight, {name} went on to host story hour at the library. Every story ends in a pun. The children have formed a committee." },
    { text: "{name} got {n} groans tonight and went on to emcee at a lake resort for forty years. Puns only. The pool was always packed during the show." },
    { text: "After drawing {n} groans tonight, {name} went on to tell the same pun at every hotel bar in the Catskills. Bartenders kept cutting {name} off. {name} was drinking ginger ale.", adult: true },
  ],
  quiet: [
    { text: "{name} flew under the radar tonight and went on to referee for thirty years without anyone noticing. Highest honor in the sport. Even {name}’s mother thought it was someone else." },
    { text: "After a quiet game tonight, {name} went on to sit in the same stadium seat for forty years. Made the jumbotron once. Was asleep." },
    { text: "{name} kept a low profile tonight and went on to appear in the Gazette exactly once, in the background of a photo of a very large zucchini. Slightly out of focus." },
    { text: "After keeping quiet tonight, {name} went on to spend forty years alone at a research station in Antarctica. The penguins found {name} a little quiet." },
    { text: "{name} had a quiet one tonight and went on to sit at the same table at a Catskills resort every summer for forty years. The waiters think {name} is a centerpiece." },
    { text: "After a quiet game tonight, {name} went on to attend forty years of weddings without anyone knowing who invited them. Nobody did. Great dancer.", adult: true },
  ],
};

// The cast list at the end of the credits: each player's part, from the credit they got
const ROLES = {
  won: 'The Champion', tiedFirst: 'Co-Champion', last: 'The Underdog', middle: 'Middle Management', comeback: 'The Comeback',
  collapse: 'The Early Leader', fooledMany: 'The Liar', fooledNobody: 'The Honest One', gotFooled: 'The Believer',
  foundMany: 'The Detective', neverFound: 'The Optimist', blindMany: 'The Gambler', longShot: 'The Long Shot',
  stoleMany: 'The Treasurer', robbedTwice: 'The Repeat Offender', robbedMany: 'The Mark', framedMine: 'The Writer',
  framedOthers: 'The Patron', lastSecond: 'The Buzzer Beater', firstIn: 'The Early Bird', skips: 'The Critic',
  ratingUp: 'The Climber', ratingDown: 'The Downgrade', groans: 'The Punster', quiet: 'The Extra',
};

/* "Previously on Closed Caption": the cold open when most of the table played together last time. One grudge,
   dry, from the last game's facts ({a}, {b} names; {n} a count, written out like the credits). The game picks the
   most grudge-worthy fact whose people are all here tonight. */
const GRUDGES = [
  { k: 'robbed', text: '{a} stole from {b} {n} times. {b} has not forgotten.' },
  { k: 'robbed', text: '{a} robbed {b} {n} times. {b} counted their chips before sitting down tonight.' },
  { k: 'robbed', text: '{b} lost a chip to {a}. {b} would like to discuss it after the game.' },
  { k: 'fooled', text: '{a} fooled {b} {n} times. {b} has asked that it not come up.' },
  { k: 'fooled', text: '{a} fooled {b} {n} times. {b} says they were being polite.' },
  { k: 'fooled', text: '{b} believed {a} {n} times. {b} has been reading the fine print ever since.' },
  { k: 'fooled', text: '{a} fooled {b} {n} times. {b} now reads every caption twice.' },
  { k: 'tie', text: '{a} and {b} tied for first. Neither has accepted it.' },
  { k: 'monkey', text: 'A monkey throwing darts found the real caption more often than {a}. The monkey was not invited back.' },
  { k: 'collapse', text: '{a} led at halfway. {a} remembers the first half fondly.' },
  { k: 'comeback', text: '{a} came back from dead last. {a} now tells it with a soundtrack.' },
  { k: 'gotFooled', text: '{a} fell for {n} fakes. {a} has promised to be more suspicious, and believes it.' },
  { k: 'nobody', text: '{a} fooled nobody. {a} has been working on a poker face. It’s the same face.' },
  { k: 'never', text: '{a} never found the real caption. {a} maintains it was well hidden.' },
  { k: 'sharp', text: '{a} found the real caption {n} times. Nobody plays cards with {a} anymore.' },
  { k: 'framed', text: '{a} got a caption into the Gallery. {a} has been back to visit.' },
  { k: 'blind', text: '{a} bet the face-down card {n} times. {a} calls it a system.' },
  { k: 'skips', text: '{a} asked to skip {n} cartoons. The cartoonist has been told.' },
  { k: 'lastSecond', text: '{a} submitted at the last second every round. {a} will be along shortly.' },
  { k: 'last', text: '{a} finished last. {a} calls it a rebuilding year.' },
  { k: 'last', text: '{a} finished last, and took it very well in public.' },
  { k: 'won', text: '{a} won. {a} has mentioned it.' },
];
// Most grudge-worthy first (the cold open picks among the first few that fit tonight's table)
const GRUDGE_ORDER = ['robbed', 'fooled', 'tie', 'monkey', 'collapse', 'comeback', 'gotFooled', 'nobody', 'never', 'sharp', 'framed', 'blind', 'skips', 'lastSecond', 'last', 'won'];

// The one awards slide (#27): Best Lie and Nobody Bit are quoted; Best Liar keeps what the old hat measured
const NOBODY_BIT = ['Their loss.', 'It deserved better.', 'Still a fine sentence.', 'Ahead of its time.', 'A collector’s item.'];
const NOBODY_BIT_FRAMED = 'The table framed it anyway.';
const NOBODY_BIT_HA = 'Loved, and nobody bet on it.';
const GROANS_LINE = ['Unrepentant.', 'No regrets.', 'Proud of every one.'];

// The Remote: the table's traveling trophy, held by the last winner (Nick, Oct 20 2026)
const REMOTE = {
  first: 'First game at this table. The Remote goes to {w}.',
  retained: 'Retained. Nobody touches the Remote.',
  handover: '{h}, hand over the Remote.',
  jointKept: 'Joint custody. Nobody else touches the remote.',
  jointNew: '{h}, hand over the remote. Joint custody.',
};

module.exports = { LINES, ROLES, GRUDGES, GRUDGE_ORDER, NOBODY_BIT, NOBODY_BIT_FRAMED, NOBODY_BIT_HA, GROANS_LINE, REMOTE };
