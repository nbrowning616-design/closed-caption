#!/usr/bin/env python3
"""Variety tags for the deal (Nick, Oct 19 2026: "always well shuffled ... no really similar in a row").

  python3 tools/card_meta.py --id 430 --style 2 --voice sitcom --scene "In a doctor's waiting room ..."

Upserts UPLOAD-THIS-TO-GITHUB/card_meta.json: {id: {style, voice, tags}}. Tags (setting + subject) are derived from
the scene text. game.js uses them so neighbouring cards in a game don't share a creator voice, a drawing style, a
setting or a subject. Never stores captions.
"""
import argparse, json, os, re
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'UPLOAD-THIS-TO-GITHUB')
META = os.path.join(ROOT, 'card_meta.json')
TAGS = {
 # settings
 'office': r'office|cubicle|desk|conference|boss|coworker|meeting|org chart|break room|new-hire|employee',
 'bar': r'\bbar\b|bartender|pub\b|pint|cocktail',
 'restaurant': r'restaurant|waiter|diner\b|menu|table for|chef|the check|bill to',
 'dinner': r'dinner|dining|banquet|thanksgiving|turkey dinner|holiday dinner',
 'kitchen': r'kitchen|stove|oven|fridge|refrigerator|sink|toaster|teapot|breakfast',
 'home': r'living room|sofa|couch|armchair|fireplace|hallway|front door|doorway|porch|attic|basement',
 'bedroom': r'\bbed\b|bedroom|pillow|pajama|nightstand|motel',
 'bathroom': r'bath|tub|toilet|shower|restroom|stall',
 'medical': r'doctor|hospital|nurse|patient|exam table|x-ray|surgeon|dentist|vet\b|veterinar|waiting room',
 'therapy': r'therapist|psychiatrist|analyst',
 'beach': r'beach|sand\b|sunbather|lifeguard|surf|swim trunks|seashore|tide',
 'sea': r'\bsea\b|ocean|boat|ship|sailor|island|pier|harbor|lake|rowboat|canoe',
 'park': r'\bpark\b|bench|playground|seesaw',
 'street': r'street|sidewalk|crosswalk|curb|city|bus stop|lamppost|street lamp|parking',
 'road': r'\bcar\b|cars\b|road|highway|driveway|gas station|minivan|truck|traffic|red light|convertible',
 'farm': r'farm|barn|field|pasture|tractor|scarecrow|shepherd|cow\b|cows\b',
 'forest': r'forest|woods|tree\b|trees|camp|tent|hiker|trail|cave',
 'mountain': r'mountain|cliff|summit|peak|ridge|ski',
 'desert': r'desert|cactus|dune',
 'space': r'space|astronaut|moon|planet|rocket|alien|ufo|star\b',
 'sky': r'\bsky\b|cloud|airplane|plane\b|parachute|balloon|high dive|ladder|rooftop|power line',
 'airport': r'airport|security|check-in|luggage|suitcase|flight|pilot',
 'shop': r'store|shop|counter|clerk|cashier|checkout|pawn|hardware|grocery|salon|barber',
 'church': r'church|priest|wedding|bride|groom|altar|funeral|cemetery|grave',
 'school': r'school|classroom|teacher|student|homework|library|librarian',
 'sports': r'golf|tennis|football|baseball|basketball|referee|stadium|gym|weight|race|marathon|jog|coach|mascot|fans',
 'party': r'party|guests|host\b|cocktail party|birthday|reunion',
 'court': r'court|judge|jury|lawyer|police|detective|prison|jail|interrogation',
 'garden': r'garden|lawn|yard|hedge|mower|backyard|flower',
 'museum': r'museum|gallery|statue|painting|artist|easel',
 'stage': r'stage|circus|theater|audience|podium|concert|piano|orchestra|quartet|microphone',
 # subjects
 'dog': r'\bdog|puppy|leash|hydrant',
 'cat': r'\bcat\b|cats\b|kitten',
 'bird': r'bird|robin|pigeon|crow|owl|parrot|duck|goose|geese|chicken|rooster|penguin|flamingo|stork|vulture|pelican|eagle|turkey',
 'fish': r'\bfish|goldfish|shark|whale|octopus|lobster|crab|mermaid',
 'bear': r'\bbear',
 'rodent': r'mouse|mice|rat\b|squirrel|beaver|hamster',
 'bigbeast': r'elephant|hippo|giraffe|lion|tiger|rhino|zebra|gorilla|camel|kangaroo|moose|horse|deer|alligator|crocodile',
 'bug': r'\bbee\b|\bbees\b|\bants?\b|\bmoth|\bflies\b|housefly|\ba fly\b|butterfl|spider|beetle|caterpillar|snail|worm|firefly|bedbug',
 'farmanimal': r'sheep|\bcow|\bpig\b|goat|llama',
 'reptile': r'snake|tortoise|turtle|lizard|frog',
 'tiny': r'tiny man|tiny woman|tiny person|doll-sized|miniature',
 'giant': r'\bgiant\b|enormous',
 'death': r'grim reaper|skeleton|ghost|death\b',
 'fantasy': r'dragon|wizard|knight|\bking\b|\bqueen\b|princess|fairy|witch|unicorn|superhero|robot|caveman|viking|\bangel\b|\bdevil\b',
 'kids': r'\bchild|\bkids?\b|\bboy\b|\bgirl\b|\bbaby\b',
 'elderly': r'grandmother|grandfather|granny|old man|old woman|elderly|old lad|retired|retiree',
 'couple': r'husband|wife|couple|first date|newlywed|bride|his date|her date',
}
def tags_for(text):
    t = text.lower()
    return sorted(k for k, rx in TAGS.items() if re.search(rx, t))

def main():
    a = argparse.ArgumentParser()
    a.add_argument('--id', type=int, required=True); a.add_argument('--style', type=int, required=True)
    a.add_argument('--voice', required=True); a.add_argument('--scene', required=True); a.add_argument('--title', default='')
    x = a.parse_args()
    meta = json.load(open(META)) if os.path.exists(META) else {}
    # a new or redrawn picture: keep 'word' (it comes from the caption), drop 'odd' (circles were placed on the old picture)
    keep = {k: v for k, v in meta.get(str(x.id), {}).items() if k in ('word', 'sequelOf', 'regular', 'holiday', 'decoys', 'banned')}
    meta[str(x.id)] = {'style': x.style, 'voice': x.voice, 'tags': tags_for(x.title + ' ' + x.scene), **keep}
    json.dump(dict(sorted(meta.items(), key=lambda kv: int(kv[0]))), open(META, 'w'), indent=0, separators=(',', ':'))
    print(x.id, meta[str(x.id)])

if __name__ == '__main__': main()
