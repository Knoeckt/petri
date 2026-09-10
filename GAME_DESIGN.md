# Petri / Orbit — Game Design

A classic idle game with one hook: a **dish** that produces drops of rising rarity as it
levels, and **ads that pass time** on anything that has a timer. You buy upgrades that make
the dish yield more, cycle faster, and roll rarer. Filling the catalog lets you scale the dish
up to the next size of thing, and the whole game repeats one order of magnitude bigger.

The mechanics are theme-neutral and the mockup ships with two skins, switchable live:

| | **Petri** (biology) | **Orbit** (space) |
|---|---|---|
| The dish | Petri dish → aquarium → terrarium → biome dome → living planet → seeded system → living galaxy | Gravel bed → asteroid belt → planetary system → star cluster → galaxy → supercluster → universe → multiverse |
| Currency | Biomass | Matter |
| A drop | a colony / specimen | a find / body |
| Yield upgrade | Nutrient agar | Wider aperture |
| Speed upgrade | Incubator heat | Scan rate |
| Luck upgrade | Selective medium | Spectral filter |
| Passive income | Culture vats | Mining drones |

**Recommendation: Petri.** The first draft of this doc leaned Orbit on portfolio grounds
(Field Station already owns xenobiology). That flipped once the strains became characters
(section 3a): the game's appeal is now the same thing that makes My Singing Monsters work,
a cast with faces and temperaments that you collect and watch, and that only lands when the
things in the dish are creatures. Points of light can't be fuzzy guys. Orbit stays in the
mockup as a working skin and the mechanics are still theme-neutral, but the art direction,
the roster and the danger mechanic are built for Petri.

---

## 1. Pitch

You have a dish. Every cycle it produces a few things. At level one they are all common. By
level ten, one in seven is uncommon and one in thirty is rare. By level fifty a legendary
turns up now and then, and you can see it coming: something gold is growing in the corner of
the dish before the cycle ends. Everything you find goes in the catalog and makes the dish a
little better forever. Duplicates sell. When the catalog is nearly full you scale up, the dish
becomes an aquarium (or the gravel bed becomes an asteroid belt), everything is worth five
times more, and the cycle takes longer, which is exactly when the ads start earning their
place.

**Genre:** classic idle. Portrait, one thumb, one screen.
**The screen:** the vessel is the whole screen, flanked by six brass side buttons (Quests,
Tickets and Splicer on the left; Shop, Decor and Brewery on the right), with its buttons and
the ad row on a wooden board under it and a specimen shelf below that. Upgrades, Lab
(research), Clinic, Catalog and Scale up are the bottom tabs; tabs and side buttons alike
open panels that slide up with overshoot and cover about 65% of the screen, rows staggering
in behind. Tapping the dimmed vessel, the close button, or the same tab again closes the
panel. The vessel never leaves view.
**The goal:** each tier is a chapter of the town's story. Finish the chapter's requests,
survive the outbreak at the end, and the next scale of dish opens with the next chapter.
**The number:** biomass or matter, spent on upgrades and dish levels.
**The verb:** buy the upgrade that fixes the current bottleneck; decide what to spend an ad on.
**The goal:** fill each catalog, climb the ladder, reach the last tier.

---

## 2. The loop

```
dish cycle runs → drops roll rarity from the level table → new find: catalog + permanent bonus
                                                        → duplicate: sells for currency AND becomes stock
                       currency → level the dish (rarity table shifts) / upgrades (yield, speed, luck, income)
   the Clinic (the spine): townsfolk ask for tonics → tonics eat stock → pay currency + advance the story
                       story hands you the Splicer → hybrids from two duplicates → seed one in the dish for a perk
                       chapter ends in an Outbreak fought in the dish → chapter complete → scale up → ×5, new catalog, next chapter
   ads: finish research · finish a brew · finish a splice · +1 hour · 2× for a while · double offline
```

Online, the player collects cycles by tap (until auto-harvest is researched), checks the
Clinic to see who is waiting and what they need, and spends. The story is what tells you
which strain to hunt next. Offline, the dish keeps cycling and duplicates keep selling.
Coming back shows what arrived and offers to double it for an ad.

---

## 3. The dish

Each dish runs a **cycle**. At the start of a cycle its drops are rolled and shown growing
in the dish, colored by rarity, so the player watches the result form. When the cycle ends
the drops are collected: a **new find** goes into the catalog and grants its bonus, a
**duplicate** sells for its value.

### Six rarities, one bar

Common (beige), Uncommon (green), Rare (blue), Very rare (red), Exotic (purple), Mythic
(gold). The player never sees a percentage: under the vessel is an **odds bar**, a stacked
strip in those colours that is solid beige at level 1 and fills in from the right as the
level climbs, with a small legend for anything above half a percent. The dish-level upgrade
shows a "now" bar and a "next" bar so a level is a visible change, not a number.

| Level | Common | Uncommon | Rare | Very rare | Exotic | Mythic |
|------:|-------:|---------:|-----:|----------:|-------:|-------:|
| 1     | 100    | 0        | 0    | 0         | 0      | 0 |
| 10    | 85     | 12       | 3    | 0         | 0      | 0 |
| 20    | 68     | 20       | 9    | 3         | 0      | 0 |
| 35    | 50     | 25       | 14   | 7         | 3      | 1 |
| 50    | 34     | 26       | 18   | 11        | 7      | 4 |

Weights interpolate between rows. Effective level is dish level plus everything that adds
to it (tiered rarity upgrades, a seeded Glowfuzz, placed artifacts).

### Per-rarity numbers (tier 1; ×5 per tier)

| Rarity | In catalog per tier | Duplicate value | Catalog bonus when found |
|---|---:|---:|---:|
| Common | 5 | 3 | +1% income |
| Uncommon | 3 | 12 | +3% |
| Rare | 2 | 60 | +8% |
| Very rare | 1 | 400 | +20% |
| Exotic | 1 | 3,000 | +50% |
| Mythic | 1 | 20,000 | +100% |

Thirteen entries per tier. Catalog bonuses are permanent across scale-ups, so the catalog is
the prestige currency in disguise: you never lose what you found. Mythics are one per tier
(Genesis Bloom, Leviathan fry, Root Mother) and carry an orbiting sparkle wherever they are
drawn.

### Rarity is worn, not written

Everything that holds a specimen looks like its rarity. Shelf jars: plain glass and a cork
for commons; green glass for uncommon; blue glass with a brass lid for rare; red glass with
brass bands and a soft glow for very rare; purple glass with a moving shimmer for exotic;
gold glass with a rotating sparkle, a gem on the lid and a pulsing glow for mythic. Catalog
cards for exotic and mythic glow too. The hybrid jar is teal.

### Cycle time

Tier 1 starts at **2 minutes** (mockup: 20 s). Speed upgrades cut 6% per rank, floored at a
quarter of the base. Each tier's base cycle is 1.5× the previous: bigger things take longer,
which keeps the finish-now ad worth watching all the way up the ladder.

### Multiple dishes

Research adds a second and a third dish. They roll independently, share the level and
upgrades, and each has its own finish-now ad. More dishes is the mid-game width lever the
way outposts were in Field Station.

---

## 3a. Strains are characters

Every catalog entry is a creature with a name, a one-line bio, a look and a temperament.
They are drawn in code from a small part list (body shape, colour, eyes, fuzz, tail, teeth,
glow, halo, spots) so a new strain is one line of data, and they idle with squash-and-stretch,
blink, and look around. Most of them are **fuzzy guys**: harmless, cute, the reason you keep
the catalog open. A few **bite**.

### The tier 1 roster

| Rarity | Strain | Temperament | Bio |
|---|---|---|---|
| Common | Blubb | friendly | Sleeps through most cycles. Harmless and a little damp. |
| Common | Fuzzwald | friendly | Just a fuzzy guy. Wants to be your friend. |
| Common | Dotto | friendly | Three of them. They never agree on a direction. |
| Common | Wiggly | friendly | A rod with a tail. Wiggles. That is the whole deal. |
| Common | Moldy Pete | friendly | A ring of mold with a lot of opinions. |
| Uncommon | Glowbert | friendly | Lights up when nobody is looking. Everybody is looking. |
| Uncommon | Spirally | friendly | Corkscrews around the dish. Gets dizzy. Keeps going. |
| Uncommon | **Nibbler** | danger 1 | Small and bitey. Eats one neighbour, then feels bad about it. |
| Rare | Mirror Mike | friendly | Reflective in every sense. |
| Rare | **Gulp** | danger 2 | One eye, all mouth. Eats a neighbour every five seconds until quarantined. |
| Very rare | **The Wipe** | danger 3 | Wipes the dish clean if you let it. Contain it fast. Worth a fortune. |
| Exotic | The First Cell | friendly | Where it all started. Calm. Glowing. Slightly smug. |
| Mythic | Genesis Bloom | friendly | Nobody has seen one twice. It hums the tune the bread used to sing. |

Tier 2 (Aquarium) and tier 3 (Terrarium) have full rosters in the mockup, with one or two
biters each (Blue planarian, Orchid mantis, Sundew, and the Corpse flower as a legendary
that bites). Later tiers use generated placeholders until they are written.

### Dangerous strains

A dangerous strain spawns early in the cycle (never later than 30% in) with a red aura and
red pupils, and it **eats**: after a short delay it lunges at the nearest living neighbour,
which dies on the spot (grey, X eyes, fades). Eaten colonies give nothing at harvest. The
dangerous strain itself is still collected and is worth a lot, so it is a good drop that
costs you the rest of the dish if you ignore it.

| Level | Behaviour | Damage if ignored in a 20 s cycle |
|---|---|---|
| 1 | eats once, then stops | one colony |
| 2 | eats one every 5 s | three or four colonies |
| 3 | eats one every 2.5 s | everything else |

**Counterplay is a tap.** Tap the strain and it is quarantined: a dashed ring, a frown, and
it stops. Free, instant, but you have to be looking. The status line under the dish turns
red while something is eating. **Antibiotic wash** is a repeatable research: each rank adds
a 5% chance a dangerous strain is quarantined the moment it arrives, online and offline,
and twenty ranks make it certain. A seeded Sentinel adds 40% on top. Until the chance is
100% the welcome-back sheet reports how many colonies were eaten while you were away. Buying
the ranks one at a time keeps the biters a live threat for most of a chapter while giving
the player a lever they can feel move.

The rule of thumb: danger is a rarity-gated attention tax, never a punishment for being
away. Level 1 exists so the player meets the mechanic around dish level 8 with something
harmless before Gulp shows up.

### Life in the dish

Colonies wander the agar at their own pace, steering back from the rim. Rods and spirals
turn to face where they're going; blobs flip. When two friendly strains bump into each other
they stop, hop at each other with an emote (♥ ♪ ! ? ☺) for a second and a half, then wander
off, with a cooldown so it stays occasional. Friendly strains run from an uncontained biter.
An attack is a sequence, not an instant: the biter shakes and swells with its mouth open
for 0.6 s while the victim freezes with a red "!", then it lunges, the victim dies in a burst
of crumbs with an impact ring and a short canvas shake, and the biter slinks back to where
it was. Quarantining during the wind-up cancels the attack and frees the victim.

### Art direction

The reference is My Singing Monsters: a cast you collect and watch, drawn chunky and
cheerful. In the UI that means a rounded display face (Fredoka), thick dark outlines on
everything, bevelled buttons that press down, overshoot easing on pops and sheets, glossy
agar in the dish, and catalog cards with live portraits and dark silhouettes for what you
haven't found.

The material palette is "a lab built into a treehouse", and it is used consistently:
**wood** (procedural grain, knots, nails) for the title sign, the board, the shelf and the
menu plank; **brass** for the currency pill, the pager arrows and the dish rim; **glass**
for the dish, jars and the splicer; **cream paper** with a fine grain for every card, row,
chip, strip, sheet and panel body; **dark teal** with a faint diagonal weave for panel
headers; **amber** for primary buttons and the active tab; **purple with brushed stripes**
for ad buttons. Behind everything is a mossy noise texture with a soft vignette. The menu
is a wooden plank with each tab's icon in a cream medallion; the active one lifts and turns
amber. The Orbit skin swaps wood for brushed steel and moss for a starfield and keeps the
same structure. Below the dish sits a **wooden board**, hand-cut rather than machined: uneven
corners, a half-degree tilt, procedural grain from a turbulence filter that breathes slowly,
knots, crooked plank seams, corner nails and a passing sheen. It holds the status line, the
buttons, the recent-drops strip, extra dishes and the ad row. Between the board and the menu
the board's cream strip holds the **shelf**: the last five harvests in jars styled by
rarity, with a NEW tag on first finds, above the catalog bar. It replaced both a separate
shelf plank and a row of text chips, which had said the same thing twice and pushed the ad
row off the screen. The Orbit skin inherits the chunky UI but keeps its glow-dot rendering.

---

## 3b. The Clinic (the spine)

Mossbrook is a small town with one pond, one bakery and one lab, which is yours. People turn
up with problems and you brew them something. This is the second item set (**tonics**), the
second area (**the request board**), and the main goal (**the chapter**) in one system, and
it is the system the game leans on hardest.

### Stock

A duplicate still sells for biomass at harvest, and it also counts as **stock**: the catalog
count minus the one you keep. Tonics and splices consume stock. You can never lose a found
entry, only spares. This gives every duplicate a second use without touching the income
curve, and it means the Clinic is what tells you which strain to hunt.

### Medicines and the Apothecary

Samples are material, not currency. Spare strains brew into **medicines**, and requests
want medicines in quantity. That is the chain: harvest strains, brew medicines, deliver.

- Every tonic in the story and the side pool is a medicine with a recipe of strains and a
  brew time (20 to 50 s in the mockup, minutes in the real game). Fizz-Fix is two Blubb;
  Hush syrup is two Fuzzwald and a Dotto; Contained sample is a Gulp, a Glowbert and three
  Blubb. Recipes are `[rarity, index, quantity]` against the tier's catalog, so a chapter's
  ingredients climb the rarity ladder: commons first, then an uncommon, then rares, then the
  biter itself.
- The **Apothecary** is its own area behind the Brewery side button, built like the splicer:
  the **Copper Kettle**, a cauldron over a brick hearth with a live fire, liquid tinted by
  whatever is brewing with bubbles and rising steam, a copper pipe into a spiral condenser
  with drips travelling it into a bottle that fills with the brew's progress, a thermometer
  that climbs, and a rack of six bottles for the medicines that matter right now (needed now,
  needed next, wanted by a side quest, or already on the shelf) with counts. Tap a rack bottle
  to put it on the fire, press Brew, tap the fire to hurry a brew by a fraction of a second.
  Under the kettle each medicine lists its recipe against your stock. One brew at a time; the
  timer has an ad. The Clinic keeps a button through to it.
- **Batches** are the scaling lever. Batch size starts at 1 and research raises it to 3 (Bigger
  cauldron) and 6 (Vat cauldron); Hot cauldron halves brew time. A batch of n takes √n times
  a single brew. So the first medicines are a wait, and the last dozen of a chapter go fast.

### Requests

Two kinds sit on the board:

- **Story requests**, one at a time in chapter order. Each names a character, a problem, the
  medicines they want, and a payout. Quantities climb through the chapter and are generated
  from the step order: a step wants 2, 3, 3, 4, 5 then 3 of its own medicine, plus the
  previous step's medicine (1, 2, 2, 3, 4) and from step five the one before that (1, 2).
  So 1-1 is two Fizz-Fix; 1-2 is three Hush syrup and one Fizz-Fix; 1-5 is five Mirror wash,
  three Bitters and one Dimmer drops. Delivering pays, logs a line of story, and opens the
  next request. Some deliveries hand you something: Doc Ferro lends you the splicer.
- **Side requests**, two at a time, repeatable, drawn from a pool. One or two of a simple
  medicine, small pay, delivered instantly. They keep the board alive between story beats and
  give commons a use. The pool is indexed by rarity and slot, so it works in every tier.

### Chapter 1: Something in the water

| # | Who | Problem | Tonic | Recipe | Pays | Afterwards |
|---|---|---|---|---|---|---|
| 1 | Mayor Bramble | The tap water has gone fizzy | Fizz-Fix | 2 Blubb | 40 | "A triumph of local science." |
| 2 | Ida the baker | The bread is singing, in four parts | Hush syrup | 2 Fuzzwald, 1 Dotto | 90 | Ida seems almost disappointed. |
| 3 | Pip | The cat glows at night, not Pip's fault | Dimmer drops | 1 Glowbert, 2 Blubb | 160 | The cat is still faintly green. |
| 4 | Doc Ferro | Purple spots, six patients since Tuesday | Bitters | 1 Nibbler, 2 Wiggly | 260 | "This is not a bug. Something is spreading." **Gives the splicer.** |
| 5 | Gran Moss | The pond has gone black | Mirror wash | 1 Mirror Mike, 2 Moldy Pete | 520 | Something moved under the surface. |
| 6 | Doc Ferro | It is in the water supply; bring a live culture | Contained sample | 1 Gulp, 1 Glowbert, 3 Blubb | 900 | "We called it The Wipe. It blooms." |
| 7 | Doc Ferro | It is blooming in your dish | **Outbreak** | fight it in the dish | 2000 | "Downstream is the pond, and the pond is where we go next." |

### Chapter 2: The pond (Aquarium)

The Wipe drained into the pond at the end of chapter 1, so every pond creature is the
consequence of that. Ferro spends the chapter trying to see the whole thing at once.

| # | Who | Problem | Tonic | Recipe | Pays | Afterwards |
|---|---|---|---|---|---|---|
| 1 | Gran Moss | The ducks came back purple | Duck rinse | 2 Duckweed, 1 Water flea | 200 | One duck stays purple by request. |
| 2 | Old Bill | The arguing fish has a choir now | Choir syrup | 2 Algae thread, 1 Rotifer | 450 | Bill hums their songs when nobody's listening. |
| 3 | Pip | A snail in the boot, a different boot each day | Snail-be-gone | 1 Hydra, 2 Pond snail | 800 | Zero snails. Then one, in a hat. |
| 4 | Doc Ferro | Clinic tap water runs against the flow | Still water | 1 Diatom lattice, 2 Water flea | 1,300 | "It is learning the pipes." |
| 5 | Marla the lifeguard | Cut a thing in half; now there are two | Planarian salve | 1 Blue planarian, 1 Copepod swarm, 2 Duckweed | 2,600 | Marla moves her chair up the beach. |
| 6 | Doc Ferro | It hides from light; light the whole pond floor | Lantern draught | 1 Glass shrimp, 1 Hydra, 3 Algae thread | 4,500 | The floor lights up like a town. "Then we bring it up." |
| 7 | Doc Ferro | It is coming up through the pond | **Outbreak**, 45 HP, 28 s | fight it in the dish | 10,000 | It sinks into the mud. The mud goes to the garden beds. |

### Chapter 3: The garden (Terrarium)

Pond mud dredged into the garden beds. Some of what grew is lovely, some bites, and Ferro
finds the cure in it. The chapter's boss is the tier's own legendary, the Corpse flower.

| # | Who | Problem | Tonic | Recipe | Pays | Afterwards |
|---|---|---|---|---|---|---|
| 1 | Gran Moss | The tomatoes are humming | Quiet mulch | 2 Moss cushion, 1 Clover | 1,000 | Suspiciously quiet. |
| 2 | Coach Dabb | The grass on the pitch is bouncing | Flat grass | 2 Springtail, 1 Fern shoot | 2,200 | He loses anyway and blames the grass. |
| 3 | Ida the baker | Ferns growing out of the ovens | Oven weed | 1 Jumping spider, 2 Pill bug | 4,000 | Ida keeps one fern. It has a name. |
| 4 | Mayor Bramble | Something pretty on the town sign bit the postman | Mantis balm | 1 Orchid mantis, 2 Clover | 6,500 | Postie Lark bit it back. |
| 5 | Doc Ferro | A slug in the clinic that isn't entirely there | Ghost trap | 1 Ghost slug, 1 Sundew, 2 Moss cushion | 13,000 | "The Wipe is not a strain any more. It is a place. It is this garden." |
| 6 | Pip | A beetle worth more than the school | Jewel tincture | 1 Jewel beetle, 1 Jumping spider, 3 Fern shoot | 22,000 | "With this I can make a cure. I need one thing more, and it only blooms once." |
| 7 | Doc Ferro | The corpse flower is opening | **Outbreak**, Corpse flower, 60 HP, 30 s | fight it in the dish | 50,000 | Ferro has a cure. Past the garden wall there is a whole dome of the stuff. |

Chapter 3 ends the written story. The Biome dome and later tiers have generated rosters
and no chapter yet; there the board shows side requests only and scale-up falls back to
the level and catalog rule. Each chapter's outbreak has its own health and clock, and the
boss can be any strain (chapter 3 uses the tier's legendary), so later chapters can escalate
without new code.

### The arc

Chapter 1 names the thing. Chapter 2 finds out it's learning and hiding. Chapter 3 finds
out it isn't a creature any more but a place, and gets the cure. The hook into a chapter 4
is the dome past the garden wall: a whole enclosed biome of it, which is exactly what the
tier 4 dish is.

### Side request pool

Farmer Tuck (the cows are humming, in key), Postie Lark (love letters sticking together),
Old Bill (a fish that argues, and is winning), Nurse Ona (the waiting room smells of lemons),
Coach Dabb (the football rolls uphill).

### The Clinic is story only

Side requests do not live on the Clinic board. The Clinic shows the chapter's current
request, the brew, the story log, and a **Coming up** card that lists the next two
requests' ingredients, so the player always knows what to hunt before the request arrives.
Odd jobs moved to the Quests button beside the vessel.

---

## 3b½. The side buttons

Six brass medallions flank the vessel, three a side. They open panels like the tabs do.

### What opens when

Most areas start locked and open as chapter 1 delivers, so the first ten minutes are dish
and Clinic only and every delivery hands the player a new place. A locked button dims to
greyscale with a padlock on the medallion and a pill saying which chapter-step opens it;
tapping it says who to help. The delivery that opens something announces it.

| Opens after | Area |
|---|---|
| 1-1 (the Mayor) | Quests, Shop |
| 1-2 (Ida) | Tickets, Decor |
| 1-3 (Pip) | Lab (research) |
| 1-4 (Doc Ferro) | Splicer |
| always | Upgrades, Clinic, Brewery, Catalog, Scale up |

The story log lives at the bottom of the Clinic, so there is no separate Notes button.

| Button | What it is |
|---|---|
| **Quests** (left) | the odd jobs that used to clutter the Clinic: two at a time, small recipes, instant delivery, a fresh one when you finish one. A badge counts the ones you can deliver. |
| **Tickets** (left) | the pipette mini-game, below. The badge is today's ticket count. |
| **Splicer** (left) | the Splice-o-matic, its own area. Badge when a hybrid is waiting in the chamber. |
| **Shop** (right) | paid in biomass, nothing you can't also earn: an extra ticket (price climbs each purchase, resets daily), a mystery pebble (random common artifact), a 2× boost without the ad. |
| **Decor** (right) | place up to three artifacts in the enclosure. Only placed ones count. A badge counts unplaced artifacts. |
| **Brewery** (right) | the Apothecary's Copper Kettle, its own area. Badge when something can be brewed. Open from the start, since 1-1 needs it. |

### Tickets and the pipette

Three tickets a day, plus one per ad or one from the Shop. A ticket plays **Pipette drop**:
a marker sweeps back and forth across a bar with a green centre; tap to drop. The closer to
the middle, the rarer the artifact:

| Grade | Distance from centre | Common / Uncommon / Rare / Epic |
|---|---|---|
| Miss | > 36% | 85 / 15 / 0 / 0 |
| Close | ≤ 36% | 55 / 35 / 9 / 1 |
| Nice | ≤ 20% | 25 / 45 / 25 / 5 |
| Perfect | ≤ 8% | 5 / 25 / 45 / 25 |

It is thirty seconds of skill a day that moves the rarity table, which is the "work you can
do to improve your odds" the dish alone doesn't offer. The real game can rotate the
mini-game weekly (the culturing dish from Field Station is a candidate) as long as each is
under thirty seconds and pays in artifacts.

### Artifacts

| Artifact | Rarity | Perk while placed |
|---|---|---|
| Lucky pebble | common | +1 effective level |
| Warm lamp | common | −5% cycle time |
| Agar sprinkles | common | +10% duplicate value |
| Prism | uncommon | +2 effective levels |
| Wind chime | uncommon | +10% income |
| Moon shard | rare | +4 effective levels |
| Old key | rare | +1 colony per cycle |
| Golden bell | epic | +6 effective levels |

Three slots per vessel, drawn on the vessel at spots that suit it (on the gravel, on the
soil, under the dome). Duplicates stack if you place more than one copy. The rarity perks
are deliberately the strongest, since rarity is what the player asked the mini-game for.

---

## 3c. The Splicer (supporting)

Doc Ferro's splicer arrives with request 4. It is a place, not a list: the **Splicer** side
button opens its own area with the **Splice-o-matic** at the top, a chunky cartoon machine
with two glass intake tubes, pipes into a glass chamber with electrodes, two gauges, a row
of lights, a lever, and a rack of five jars, with the controls and your hybrids underneath.
Until Ferro hands it over it sits under a dim lock. The button shows a badge when something
is waiting in the chamber.

- **Load:** tap a tube to pick any strain you have a spare of. Any two can go in.
- **Pull the lever** (or the button on the board): one spare of each parent and a little
  biomass go in, and a 60 s timer starts (an hour in the real game, ad-skippable). The
  parents shrink and get sucked down the pipes as blobs, the chamber swirls in both
  parents' colours, arcs crackle between the electrodes, the gauges climb, and it flashes.
- **Collect:** if the pair reacts, the hybrid pops out in the chamber with a burst; tap it
  and it goes into a jar. If it doesn't, the machine spits the parents back out in a puff
  of smoke and refunds half the biomass. Five pairs react; discovering which is the game.
- **Seed:** tap a jar (or its chip on the board) to seed that hybrid in the dish for its
  perk. One seed slot.

Hybrids show in the catalog as a separate group, silhouettes until made.

Hybrids matter because one can be **seeded** in the dish: it lives there as a resident,
drawn on a little pedestal, and gives a perk while seeded. One seed slot.

| Hybrid | Parents | Perk while seeded |
|---|---|---|
| Glowfuzz | Fuzzwald + Glowbert | +3 effective levels on the rarity table |
| Blobbly | Blubb + Wiggly | +1 colony per cycle |
| Dizzy Dots | Dotto + Spirally | −15% cycle time |
| Polish | Moldy Pete + Mirror Mike | +50% duplicate value |
| Sentinel | Nibbler + Glowbert | +40% chance biters are quarantined on arrival; bites the bloom |

Five is the whole tree for tier 1. It is deliberately small: the Clinic is the spine and the
splicer is a tool the story hands you, not a second grind.

---

## 3d. Outbreaks (punctuation)

Each chapter ends with The Wipe blooming in your dish. The player presses "Face the bloom"
on the Clinic board, the cycle pauses, and a giant Wipe fills the dish with a health bar and
a 25 s clock (mockup numbers). Every tap takes a point of health; a seeded Sentinel chews
through it on its own; every three seconds a spore kills one of your colonies. Break it and
the chapter completes with the big payout and the closing line. Run out of time and it pulls
back, no penalty beyond the eaten colonies, and you can try again from the board. It's a
30-second burst of frantic tapping at the end of a calm chapter, which is the punctuation.

---

## 4. Upgrades

**Dish level** stays repeatable (cost × 1.22 per level) and is the main sink: it shifts the
rarity table. Everything else is a **one-time upgrade in a tier**, Egg Inc style: five per
tier, each a bigger version of the classic lever, and buying enough in a tier opens the next.
Upgrades reset on scale-up. The Upgrades tab shows a red dot whenever one is affordable.

| Tier | Opens after | Yield | Speed | Income | Rarity | Value |
|---|---|---|---|---|---|---|
| 1 Basics | start | Richer agar +1 colony (30) | Warm incubator −12% (40) | Bigger vats ×1.5 (25) | Sharp eyes +1 lv (50) | Sales pitch +20% (45) |
| 2 Instruments | 3 of tier 1 | Double agar +2 (200) | Hot incubator −15% (240) | Vat farm ×2 (180) | Selective medium +2 lv (300, needs the luck research) | Auctioneer +30% (260) |
| 3 Precision | 4 of tier 2 | Triple agar +2 (1,200) | Cryo-timer −18% (1,500) | Industrial vats ×2.5 (1,000) | Rare lens +3 lv (1,800) | Collector's market +40% (1,400) |
| 4 Legendary gear | all of tier 3 | Endless agar +2 (8,000) | Time dilation −20% (10,000) | Vat empire ×3 (7,000) | Golden lens +5 lv (12,000) | Museum deal +60% (9,000) |

Costs are tier-1 mockup numbers and scale ×5 per dish tier. Fully bought, that is 8
colonies a cycle, cycle time at half, income ×22.5, +11 effective levels and value ×3.5.
Yield adds, speed and income multiply, rarity adds, value adds. Every row shows its effect
and cost and greys when unaffordable; locked tiers say how many more to buy.

---

## 5. Ads — the focus

Every timer in the game has a rewarded-ad button next to it. The rule is: **an ad never
gives something you couldn't get by waiting**; it only moves time.

| Placement | Where | Reward | Real-game value |
|---|---|---|---|
| **Finish research** | on the active research | completes it | 10 min to 8 h |
| **Finish brew / splice** | on the Clinic brew and the splicer | completes it | 10 min to 1 h |
| **Time warp** | main screen | +1 hour applied to income and every dish (cycles roll, finds count) | 1 h; research raises to 2 h, 4 h |
| **Boost** | main screen | 2× income and 2× dish speed for 10 minutes | 10 min of doubled play |
| **Double it** | the welcome-back sheet | doubles offline currency (not finds) | up to the offline cap |

Guard rails: one ad at a time, a **2 minute cooldown** shared across placements, and a soft
cap of **20 rewarded ads a day**. The mockup uses a 20 s cooldown and a 3 s fake ad so you
can feel the loop.

**No finish-now on the dish.** An early cycle is shorter than the ad, so a skip button there
is a tax rather than a favour, and the progress ring around the vessel already says how long
is left, so there is no countdown either. While a cycle runs the board shows the **objective
line**: the chapter-step number as a badge (1-3), the tonic and who wants it, and the
ingredients as rarity dots with have/need counts, turning teal as they fill. It reads
"Brewing…", "Deliver to Pip", "Face the bloom" or "Chapter done, scale up" as the state
moves, lights amber when you can act, and tapping it opens the Clinic. When a cycle
finishes the line becomes the Harvest button. If a late tier's cycles ever run to hours,
time warp is the skip.

Why this shape: time warp is the "I have one ad in me, make it count" button. Boost is for
people who want to sit and play for ten minutes. Double-offline is the one everybody
watches. Research, brews and splices are the timers long enough to be worth an ad.

---

## 6. Research

Timed, one at a time, costs currency, skippable by ad. Research persists across scale-ups.

| Research | Time (real) | Unlocks |
|---|---:|---|
| Selective medium / Spectral filter | 10 min | the luck upgrade |
| Auto-harvest / Auto-catalog | 20 min | cycles collect themselves online |
| Antibiotic wash / Debris shield (repeatable, 20 ranks) | 10 min, +3 min per rank | each rank adds a 5% chance a biter is quarantined on arrival, online and offline; cost ×1.3 per rank |
| Second dish / Second field | 45 min | a second dish |
| Cold storage / Deep storage | 1 h | offline cap 4 h → 8 h |
| Fast incubator / Fast scanner | 2 h | −25% base cycle time |
| Third dish / Third field | 4 h | a third dish |
| Bigger cauldron | 15 min | brew 3 medicines at once |
| Hot cauldron | 30 min | medicines brew in half the time |
| Vat cauldron | 1 h | brew 6 medicines at once |
| Long warp | 3 h | time warp gives 2 h (later 4 h) |

Order matters: auto-harvest before the second dish, so the player never has three things
to tap.

---

## 7. Scaling up (the ladder)

**Requirement:** the tier's chapter complete (the outbreak beaten) and 10 of 12 catalog
entries found. Tiers without a written chapter fall back to dish level ≥ 50 (mockup: 25).
**Effect:** currency, level and upgrades reset; research and catalog persist; every value
and income is ×5; the base cycle is ×1.5; a new catalog of twelve.

| Tier | Petri | Orbit |
|---|---|---|
| 1 | Petri dish (microbes) | Gravel bed (pebbles) |
| 2 | Aquarium (pond life) | Asteroid belt |
| 3 | Terrarium (plants and bugs) | Planetary system |
| 4 | Biome dome | Star cluster |
| 5 | Living planet | Galaxy |
| 6 | Seeded system | Supercluster |
| 7 | Living galaxy | Universe |
| 8 | — | Multiverse |

Tiers 1–3 are hand-named in the mockup; later tiers use generated names until content is
written.

### Each tier is a different vessel

Scaling up changes what you are looking at, not just the numbers. Every tier has its own
**vessel**: a shape, an animated environment, a frame, and a palette that retints the
backdrop, the wood and the panel headers. The critters live inside the vessel's bounds, and
the progress ring follows the vessel's outline.

| Tier | Vessel | Shape | Environment |
|---|---|---|---|
| 1 | Petri dish | disc | glossy agar, brass rim |
| 2 | Aquarium | tank | water gradient, wobbling surface, light rays, gravel and pebbles, swaying plants, rising bubbles, dark frame with brass corners |
| 3 | Terrarium | glass box | warm light with a sun spot, back foliage, soil with roots and stones, moss tufts, a swaying fern, drifting pollen, wooden frame and lid |
| 4 | Biome dome | dome | hex-glass dome over grass with little trees and drifting mist, night sky outside |
| 5 | Living planet | globe | ocean, lobed continents, drifting clouds, atmosphere rim |
| 6+ | Cosmos | disc | nebula, two spiral arms of stars slowly turning |

Vessels are data plus a draw function, so a new tier is one entry. Later tiers can get
their own vessel once their roster and chapter exist; until then they share the Cosmos. Each tier's legendary should be a *known thing*: the First Cell, an eyeless newt, a
corpse flower; the pebble that fell from the sky, Ceres, a blue marble.

---

## 8. Offline and pacing

- Offline the dish cycles and sells duplicates; new finds still count. Cap 4 h, 8 h with
  storage. Welcome-back sheet lists time away, currency, cycles, and finds by name, with
  Double it.
- **First session:** level 1 → 10 in ten minutes; the first uncommon around level 6; the
  first research started. A decision every 30 s.
- **Day 1–2:** rares appear, luck unlocked, second dish, first scale-up.
- **Week 1:** tier 3, three dishes, cycles measured in hours, ads clearly worth it.
- The ladder is meant to take a month. If the first scale-up isn't satisfying, the rest
  won't fix it.

---

## 9. Tech

Same stack as Field Station: TypeScript, Canvas for the dish, DOM for everything else,
Capacitor for iOS and Android with AdMob rewarded ads. The sim is a pure `step(state, dt)`;
offline catch-up and time warp are the same function with a big `dt`. Themes, tiers, items,
upgrades and research are JSON, so Petri and Orbit are data, and a third skin costs no code.

### Phone budget

The first phone build ran hot within thirty seconds. Rules learned, kept for the real build:
no animated SVG filters (an animated turbulence grain on the wood was the main cost); no CSS
`filter` on elements whose canvas changes every frame (a drop-shadow on the dish was
re-blurred sixty times a second); animate only transform and opacity, never box-shadow;
cap canvas drawing at 30 fps, 15 fps while a panel covers the vessel, and side canvases
(jars, portraits) at 12 fps. The sim ticks every frame regardless; drawing is what costs.

Second round, still warm: bake every SVG noise texture and the wood filter to PNG once at
startup (Safari re-runs SVG filters on repaint); paint each vessel's static scenery into an
offscreen bitmap once and draw only the moving parts over it; never leave a CSS animation
running forever (the board's sheen sweeps once every 24 s instead); dish at 24 fps, 12 with a
panel open, side canvases at 8.

---

## 10. Milestones

| # | Milestone | Done when |
|---|---|---|
| 0 | Design + mockup | This doc; `docs/index.html` with both skins, all seven ad placements, offline, three tiers, the tier 1–3 rosters drawn in code, dangerous strains with quarantine, chapter 1 of the Clinic, the five-hybrid splicer, the outbreak |
| 1 | Play chapter 1 | Play it start to finish at mockup speed; decide if the request cadence and the outbreak feel right; then write chapters 2 and 3 and tiers 4+ rosters; decide whether the code-drawn critters ship or become the brief for real art |
| 2 | Real build | TS port, real timings, save, offline, AdMob test ads, tuned to days |
| 3 | Mobile | Capacitor, notifications on cycle done / research done, store listing |
| 4 | Polish | Art pass on catalog entries, sound, tutorial, ending at the last tier |

---

## 11. Open questions

- **Petri or Orbit.** See the top. Decide from the mockup, not the doc.
- **Manual collect.** The mockup makes you tap to collect until auto-harvest is researched.
  Is that a nice early verb or a chore? Field Station's rule was "never make them tap
  everything"; here it's one tap per cycle and it goes away.
- **Luck as pure rarity.** Luck raises the rarity table only. Should it also carry a tiny
  income effect so it never feels wasted after a catalog is full?
- **Ad cap.** Twenty a day is a guess. Watch where the finish-now button gets pressed most;
  that's the timer to tune.
- **Cycle ×1.5 per tier.** It makes late tiers slow on purpose. If it reads as a wall, make
  the third dish come earlier instead of shortening cycles.
- **Danger tuning.** Gulp at one bite per 5 s and The Wipe at one per 2.5 s are set for a
  20 s mockup cycle. Real cycles are minutes; scale the intervals with cycle time so a
  Wipe still empties a dish you ignore, and a Gulp still costs about a third of it.
- **Should quarantine cost something?** Free tap keeps it an attention mechanic. A small
  biomass cost would make Antibiotic wash more valuable but risks feeling like a fine.
- **Code-drawn critters vs. art.** The part-list renderer is good enough to ship a
  prototype and generates later tiers for free. The MSM look eventually wants hand art.
- **Story pacing.** Seven requests per chapter, climbing the rarity ladder, means the
  chapter's length is set by how fast the dish reaches rares. If request 5 stalls for a day
  that is either the hook or the wall; watch it.
- **Double-dipping duplicates.** A duplicate both sells and becomes stock. Simple, but it
  means the Clinic never competes with income. If the economy needs tension later, make
  stock and sale exclusive (hold or sell at harvest).
- **Outbreak difficulty.** 30 taps in 25 s with a Sentinel doing a third of the work is
  easy on purpose for the first chapter. Later chapters can add spores that need tapping too.
- **Where the Wipe goes next.** Chapter 1 ends with it draining into the pond. Chapter 2
  should start with the pond life already changed by it, so the tier 2 roster is the
  consequence of chapter 1, not a reset.
