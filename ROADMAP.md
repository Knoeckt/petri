# Petri — Long-Term Roadmap

**Last updated:** 2026-09-16  
**Current version:** v0.11.6  
**Current stage:** Pre-alpha / balance & polish  
**Immediate milestone:** Make Chapter 1 fun at real timings without ads.

---

How the docs fit together:

| Doc | Answers |
|---|---|
| `ROADMAP.md` (this file) | Where the project is going, what phase it is in, what not to build yet |
| `DEVELOPMENT.md` | The current work order in detail: the next few items, open decisions, save/time behaviour |
| `GAME_DESIGN.md` | Why the game is the way it is: mechanics, numbers, story, art spec, prototype history |
| `README.md` | How to run, test and ship |

When a version ships, update the header above and the state table in section 1. When
priorities change, change this file first, then `DEVELOPMENT.md`. This text was drafted
with ChatGPT from the repository's real state and is maintained here.

---

# 1. Current State

Petri is a complete, playable idle game available as an installable web app.

**Current stack:**

- Vite
- TypeScript
- No frontend framework
- Pure simulation layer
- Data-driven content/balance
- Installable web app
- Offline support
- Automated test suite (~120 tests)

The game's major systems are already implemented.

Phase by phase, against the original generic idle-game roadmap:

| Original roadmap phase | State in the repo (v0.11.4) |
|---|---|
| 0 Foundation | **Done.** `src/sim` (pure, DOM-free, tested), `src/data` (all content and balance values), `src/ui`, `src/runtime` (lifecycle, storage), `build/` (offline shell), `tests/` |
| 1 Core loop | **Done.** Dish → harvest colonies → biomass and catalog → upgrades and bench equipment ranked with Notes from field trips |
| 2 Clinic & story | **Done.** Three chapters authored (9, 7 and 7 requests), each request gates an unlock; side quests; the first-run guide |
| 3 Save system | **Done.** Save v5, migration from every mockup save, validation, backup snapshot, recovery archive, progress download. No player-facing reset yet (dev cheats only) |
| 4 Offline progression | **Done.** Chronological catch-up, production cap from Storage research, Night shift efficiency, welcome-back sheet, double-it ad |
| 5 Balance foundation | **Partial.** All values live in `src/data/content.ts`; dev cheats exist. No prototype-vs-playtest balance split, no measured time-to-unlock. This is the current work |
| 6 UI/UX polish | **Partial.** Palette tokens, icon set, portraits, station scenes, sound. No consistency pass, empty/error states or unlock animations |
| 7 Mobile-first pass | **Mostly done.** Fixed portrait frame, safe areas, iOS home-screen quirks solved, offline shell with integrity checks. Physical-phone lifecycle checks still manual |
| 8–11 Secondary systems, brewing, automation, long-term progression | **Done as systems.** Apothecary (brewing), Lab (research incl. auto-harvest), Splicer, field trips, tickets/pipette/artifacts, outbreaks, Scale-up ladder, Genesis (the prestige loop). None tuned against real play |
| 12 Content | **Partial.** Tiers 1–3 rosters drawn and authored; tiers 4–7 are names only; chapters 2–3 written but unplayed at real timings |
| 13 Audio & haptics | **Audio done, haptics not started** |
| 14–15 Capacitor / iOS lifecycle | **Not started.** The web lifecycle (`src/runtime/session.ts`) is the model for it |
| 16 Analytics | **Not started** |
| 17 Monetization | **Stand-ins only.** Rewarded ad placements play a 3-second placeholder; the Shop is a stand-in. No SDK, no IAP |
| 18–28 TestFlight, store, launch, live | **Not started** |

This roadmap therefore does **not** treat major system implementation as the primary development problem.

The current challenge is:

> Turn the existing complete game into a balanced, polished, testable, native-ready product.

The development priority has shifted from **feature construction** to:

```text
BALANCE
↓
PLAYTEST
↓
POLISH
↓
CONTENT
↓
NATIVE IOS
↓
INSTRUMENTATION
↓
MONETIZATION
↓
BETA
↓
SHIP
↓
ITERATE
```

Do not add major systems simply because they sound interesting.

The existing systems need to prove themselves first.

---

# 2. Existing Architecture

The project is intentionally separated into major areas.

```text
src/
├── sim/       Pure simulation/game logic
├── data/      Content and balance configuration
├── ui/        Presentation
└── runtime/   Lifecycle, persistence, platform behavior

build/
└── Offline/installable web shell

tests/
└── Automated tests

docs/
├── index.html   Frozen single-file mockup (reference build, GitHub Pages /petri/)
└── app/         Production build, committed, shipped at /petri/app/
```

Important architectural rule:

> `src/sim` should remain deterministic, DOM-free, and independently testable wherever practical.

Platform integrations should not leak unnecessarily into simulation logic.

Native iOS functionality should eventually enter through the runtime/platform boundary rather than being scattered throughout the game.

---

# 3. Implemented Game Systems

The following systems already exist and should generally be treated as **implemented but potentially untuned**:

- Dish
- Colony harvesting
- Biomass
- Catalog
- Upgrades
- Bench equipment
- Notes
- Field trips
- Clinic
- Three story chapters
- Side quests
- First-run guide
- Save system
- Save migration
- Save validation
- Backup snapshots
- Recovery archive
- Progress export
- Offline progression
- Storage-based offline cap
- Night Shift
- Welcome-back flow
- Rewarded-ad placeholders
- Apothecary
- Brewing
- Lab
- Research
- Auto-harvest
- Splicer
- Tickets
- Pipette
- Artifacts
- Outbreaks
- Scale-up
- Genesis/prestige

Do not recreate these systems.

When working in these areas, inspect the existing implementation first.

---

# 4. Immediate Milestone — Chapter 1 Balance

## Objective

Create a Chapter 1 experience that is fun at real-world timings **without requiring advertisements**.

This is the project's highest priority.

Do not prioritize Chapters 2–3, monetization, native iOS work, or additional systems until Chapter 1 has a credible balance baseline.

---

# 5. Define the Intended Chapter 1 Experience

Before changing individual numbers, define the desired progression curve.

Determine target ranges for:

- First meaningful purchase
- First equipment purchase
- First Clinic request
- First meaningful unlock
- First automation
- First reason to leave the game
- First meaningful offline return
- Chapter midpoint
- Chapter completion

Do not optimize individual costs independently.

Balance the chapter as a progression curve.

---

# 6. Create Balance Profiles

The game currently stores balance values in:

`src/data/content.ts`

Introduce a deliberate distinction between:

### Development / Fast Profile

Used for:

- Feature testing
- Regression testing
- UI testing
- Quickly reaching late-game systems

### Real / Playtest Profile

Used for:

- Actual progression testing
- Real-world timing
- TestFlight
- Production

Avoid maintaining two entirely separate games.

The same formulas and systems should operate under both profiles wherever possible.

Only relevant tuning constants should differ.

---

# 7. Add Progression Instrumentation

Before attempting serious balancing, make progression measurable.

Create development instrumentation capable of reporting major milestones.

Example:

```text
00:00 Game started
00:18 First harvest
01:42 First upgrade
04:17 Clinic request #1
08:51 Equipment unlocked
14:22 Apothecary unlocked
...
```

Track events such as:

- Resource thresholds
- Upgrade purchases
- Equipment purchases
- Clinic request completion
- Research unlocks
- System unlocks
- Field trips
- Automation unlocks
- Scale-up milestones
- Genesis availability

The developer should be able to answer:

> "How long did it take to reach X?"

without estimating from memory.

---

# 8. Build Balance Simulation Tools

Petri already has a pure simulation layer.

Use that architectural advantage.

Create tooling that can simulate progression under different player behaviors.

Possible player profiles:

### Active

Checks frequently and makes reasonably efficient purchases.

### Casual

Returns periodically and does not optimize heavily.

### Idle

Relies significantly on offline production.

### Optimizer

Makes near-optimal upgrade choices.

These simulations do not need to perfectly imitate humans.

Their purpose is to identify obvious economic problems.

Examples:

- 4-hour progression wall
- Upgrade with impossible ROI
- Research that is never worth buying
- Resource becoming irrelevant
- Runaway exponential scaling
- Prestige available far too early
- Prestige taking dramatically too long

Simulation complements human playtesting.

It does not replace it.

---

# 9. Establish Balance Metrics

Track useful economic metrics.

For upgrades:

```text
Cost
Production before
Production after
Absolute increase
Percentage increase
Estimated payback time
```

For progression gates:

```text
Expected arrival time
Required resources
Required systems
Expected waiting time
Unlock consequence
```

For major systems:

```text
Time unlocked
Immediate usefulness
Time until meaningful usefulness
Impact on existing loop
```

Balance should increasingly be based on observable numbers rather than intuition alone.

---

# 10. Chapter 1 Dogfood Pass

The developer should complete Chapter 1 from a fresh production-speed save.

Rules:

- No dev cheats
- No manually changing timestamps
- No rewarded ads
- No debug resource grants
- No editing the save
- Normal phone/browser usage
- Offline periods allowed naturally

Keep notes.

Record moments of:

- Boredom
- Confusion
- Excessive waiting
- Too many simultaneous unlocks
- Meaningless purchases
- Obvious best choices
- Resources with no purpose
- Exciting unlocks
- Good pacing
- Desire to return

Do not rebalance every five minutes during the run.

Complete meaningful sections before changing numbers so the entire progression curve can be observed.

---

# 11. Chapter 1 Balance Passes

Expect multiple passes.

### Pass A — Gross Problems

Fix:

- Extreme waits
- Instant progression
- Dead upgrades
- Broken scaling
- Resource starvation
- Resource flooding

### Pass B — Progression Rhythm

Tune:

```text
activity
↓
reward
↓
purchase
↓
growth
↓
goal
↓
unlock
↓
new decision
```

Avoid long stretches where nothing changes.

### Pass C — Choice Quality

Evaluate whether upgrades create actual decisions.

If one purchase is always mathematically dominant, determine whether that is intentional.

### Pass D — Offline Experience

Test:

- 5 minutes
- 30 minutes
- 2 hours
- Overnight
- Offline cap

Returning should feel rewarding without making active play irrelevant.

### Pass E — Full Chapter Run

Start over.

Play Chapter 1 again.

Do not declare Chapter 1 balanced solely because the final section feels correct.

---

# 12. Chapter 1 Exit Criteria

Chapter 1 is ready for external testing when:

- [ ] Full chapter completed at production timings
- [ ] No ads required
- [ ] No progression blockers
- [ ] No extreme unintended waiting walls
- [ ] Offline progression feels useful
- [ ] Automation arrives at an appropriate point
- [ ] Major systems have a reason to exist
- [ ] Clinic requests provide understandable goals
- [ ] Economy remains understandable
- [ ] Major unlocks feel meaningful
- [ ] Chapter length is within the intended range
- [ ] Fresh-save replay confirms improvements

Only after this point should Chapter 2 become a serious balancing target.

---

# 13. External Chapter 1 Playtest

Recruit a small number of testers.

Initially, approximately:

**5–10 people**

is enough to discover major problems.

Do not teach them how to play unless they become completely blocked.

Observe where the game fails to communicate.

Collect:

- Session duration
- Progression milestones
- Confusion points
- Where players stop
- Systems ignored
- Favorite mechanics
- Frustrating mechanics
- Return behavior

Separate:

**"I personally don't like this"**

from:

**"Multiple players consistently fail here."**

Prioritize repeated patterns.

---

# 14. UI/UX Consistency Pass

Once Chapter 1's mechanics are reasonably stable, perform a deliberate UI pass.

Audit:

- Typography
- Spacing
- Buttons
- Cards
- Sheets
- Dialogs
- Icons
- Portraits
- Station scenes
- Navigation
- Disabled states
- Selected states
- Loading states
- Empty states
- Error states
- Confirmation states
- Resource formatting
- Long-number formatting

Do not redesign functioning interfaces merely for novelty.

The goal is consistency and clarity.

---

# 15. Unlock Presentation

Major unlocks should feel significant.

Add presentation for:

- New station
- New mechanic
- New research category
- New resource
- New field trip
- Major Clinic milestone
- Scale-up
- Genesis

Possible tools:

- Animation
- Sound
- Modal/sheet
- Highlighting
- Short explanatory copy

Avoid making every minor unlock dramatic.

Reserve stronger presentation for progression milestones.

---

# 16. Player-Facing Save Management

The underlying save system is already sophisticated.

Expose appropriate controls.

Add:

- [ ] Reset progress
- [ ] Reset confirmation
- [ ] Export/download progress
- [ ] Import/restore where appropriate
- [ ] Recovery messaging
- [ ] Save failure messaging

Destructive actions should require deliberate confirmation.

---

# 17. Chapter 2 Balance

After Chapter 1 is stable:

Repeat the same process for Chapter 2.

Evaluate particularly whether Chapter 2 feels like meaningful expansion rather than simply larger numbers.

Ask:

- What new decisions exist?
- Which old activities become automated?
- Which existing resources gain new uses?
- Does the game meaningfully change?
- Are systems introduced at understandable rates?

---

# 18. Chapter 3 Balance

Repeat for Chapter 3.

At this point, evaluate the entire game arc rather than Chapter 3 independently.

Specifically evaluate:

- Long-term pacing
- System interaction
- Economy inflation
- Automation
- Scale-up
- Genesis
- Replay behavior

---

# 19. Genesis / Prestige Validation

Genesis exists technically.

Now determine whether it works psychologically.

Evaluate:

- When Genesis becomes available
- Whether the player understands why they should use it
- What is retained
- What is lost
- How quickly the second run progresses
- Whether the second run feels meaningfully different
- Whether permanent progression feels worthwhile

The first Genesis should feel like a major achievement.

It should not feel like:

> "The game just deleted everything."

---

# 20. Tier 4–7 Content

Do not prioritize drawing and authoring all remaining content until the progression curve demonstrates that players can realistically reach it.

Once justified:

- [ ] Finalize Tier 4 roster
- [ ] Art
- [ ] Descriptions
- [ ] Balance
- [ ] Unlock conditions

Then repeat for Tiers 5–7.

Avoid creating months of content for progression that may still change substantially.

---

# 21. Haptics

Add a small native-capable haptic abstraction.

Potential uses:

- Major purchase
- Important unlock
- Rare event
- Genesis
- Major Clinic completion

Do not trigger haptics for high-frequency production events.

Keep the simulation independent from the actual haptic implementation.

---

# 22. Native Platform Boundary

Before Capacitor integration, formalize platform-dependent behavior.

Example conceptual interface:

```ts
interface PlatformServices {
  haptic(type: HapticType): void;
  showRewardedAd(placement: AdPlacement): Promise<AdResult>;
  purchase(product: ProductId): Promise<PurchaseResult>;
  restorePurchases(): Promise<void>;
  track(event: AnalyticsEvent): void;
}
```

The exact implementation may differ.

The important architectural rule is:

> Game systems should request platform behavior without depending directly on Capacitor, StoreKit, or an advertising SDK.

This allows web stand-ins and native implementations to coexist.

---

# 23. Capacitor

Once the web experience is stable:

- [ ] Install Capacitor
- [ ] Configure iOS
- [ ] Generate Xcode project
- [ ] Configure bundle identifier
- [ ] Configure signing
- [ ] Configure app icons
- [ ] Configure splash/launch behavior
- [ ] Handle safe areas
- [ ] Handle status bar
- [ ] Install on physical iPhone

## Milestone

Petri launches from its own icon on an iPhone without Safari or the PWA installation flow.

---

# 24. iOS Lifecycle

Use:

`src/runtime/session.ts`

as the behavioral model.

Verify native behavior for:

```text
launch
↓
foreground
↓
background
↓
suspension
↓
termination
↓
relaunch
```

Test:

- Home gesture
- Screen lock
- Phone call interruption
- Force quit
- Device restart
- Long background period
- Low-memory termination where practical

Ensure offline rewards are never granted twice.

---

# 25. Native Save Validation

Do not assume browser storage behavior maps perfectly to the native wrapper.

Test:

- Fresh install
- Upgrade
- App restart
- Force quit
- Device restart
- App update
- Low storage conditions where practical
- Corrupt save
- Recovery snapshot
- Progress export

**Save loss is a release-blocking defect.**

---

# 26. Analytics

Only add analytics once the events worth measuring are understood.

Create an analytics abstraction rather than scattering SDK calls throughout the codebase.

Core events should include:

- Session start
- Session end where measurable
- Clinic request completion
- System unlock
- Upgrade purchase
- Equipment purchase
- Research purchase
- Field trip
- Offline return
- Scale-up
- Genesis
- Rewarded ad offer
- Rewarded ad completion
- Shop view
- IAP purchase

Do not collect data merely because the SDK allows it.

---

# 27. Balance Telemetry

Once analytics exists, measure actual progression.

Key metrics:

- Time to first upgrade
- Time to Clinic milestones
- Time to automation
- Chapter completion time
- Time to first Genesis
- Session duration
- Return frequency
- Offline duration
- Progression abandonment points

Human player data should eventually supersede assumptions from simulations.

---

# 28. Monetization Design Validation

Before integrating SDKs, decide exactly what monetization is supposed to accomplish.

Petri should remain enjoyable without paying or watching advertisements.

Current rewarded-ad placeholders should be evaluated as game mechanics first.

Questions:

- Is the reward attractive?
- Is it optional?
- Is it too powerful?
- Does the base game feel intentionally slow without it?
- Does repeated use break progression?
- Is the player constantly prompted?

The desired answer to:

> "Can I comfortably play Petri without watching ads?"

should be **yes**.

---

# 29. Rewarded Ads

After placements are validated:

- [ ] Select provider
- [ ] Add native integration
- [ ] Replace placeholders
- [ ] Handle unavailable ads
- [ ] Handle cancellation
- [ ] Handle failure
- [ ] Grant rewards only after valid completion
- [ ] Prevent duplicate rewards
- [ ] Test offline behavior

Never make progression depend on ad availability.

---

# 30. In-App Purchases

Define a small initial product catalog.

Potential categories:

- Remove ads
- Supporter purchase
- Permanent convenience upgrade
- Optional bundles

Avoid launching with an unnecessarily complicated store.

Implement:

- [ ] Native purchases
- [ ] Restore purchases
- [ ] Purchase persistence
- [ ] Pending transactions
- [ ] Failed transactions
- [ ] Cancellation
- [ ] Reinstallation behavior
- [ ] Sandbox testing

Never trust client UI state alone as proof of a successful purchase.

---

# 31. Privacy & Store Compliance

Audit every SDK.

Document:

- Data collected
- Analytics behavior
- Advertising behavior
- Tracking
- Identifiers
- Purchase processing
- External network requests

Prepare:

- Privacy policy
- App Store privacy disclosures
- Support page
- Age rating answers

Minimize unnecessary collection.

---

# 32. TestFlight Alpha

First native distribution milestone.

Start small.

Target:

**5–15 testers**

Primary goals:

- Installation
- Device compatibility
- Save reliability
- Lifecycle behavior
- Crashes
- UI problems
- Progression

This is not yet primarily a growth test.

---

# 33. TestFlight Beta

Expand once serious technical problems are resolved.

Possible target:

**25–100 testers**

Measure:

- Retention
- Progression
- Session patterns
- Genesis behavior
- Ad engagement
- Purchase behavior
- Chapter completion

At this stage, stop relying primarily on developer intuition for balance.

---

# 34. Release Candidate

Freeze major features.

The release candidate period is for:

```text
bugs
balance
stability
performance
compatibility
copy
store preparation
```

Not:

```text
new progression systems
new currencies
large UI redesigns
new architectural experiments
```

Release blockers include:

- Save loss
- Progression blockers
- Purchase loss
- Crashes
- Broken offline progression
- Broken lifecycle handling
- Serious layout failures
- Required monetization to progress

---

# 35. App Store Preparation

Prepare:

- App name
- Subtitle
- Description
- Keywords
- Category
- App icon
- Screenshots
- Privacy policy
- Support URL
- Privacy disclosures
- Age rating
- Review notes
- IAP products

Screenshots should communicate the progression fantasy rather than merely show random screens.

---

# 36. Version 1.0

Version 1.0 should ship when the existing game is:

- Balanced
- Understandable
- Stable
- Polished
- Native
- Tested
- Instrumented
- Monetized appropriately

Do **not** delay 1.0 because additional systems could theoretically be added.

Petri already has enough systems.

The challenge is making them good.

---

# 37. Post-Launch

For the first weeks after launch, prioritize observation.

Monitor:

- Crashes
- Save failures
- Reviews
- Retention
- Progression
- Chapter completion
- Genesis usage
- Ad behavior
- Purchases
- Player feedback

Do not immediately react to every individual review.

Look for repeated patterns.

---

# 38. Version 1.1

Primarily:

- Bug fixes
- Balance changes
- UX improvements
- Tutorial improvements
- Quality-of-life improvements

Small content additions are acceptable.

Avoid introducing a massive new system immediately after launch.

---

# 39. Version 1.2+

Once real players demonstrate demand for more:

- Additional content
- New organisms
- Expanded field trips
- Additional research
- New Clinic content
- Genesis expansion
- Events
- Collections
- Achievements
- New progression layers

New features should respond to demonstrated player needs or clearly improve the game.

---

# 40. Android

Evaluate Android after iOS stabilizes.

Capacitor should allow significant code reuse.

Android should not delay the initial iOS launch.

---

# 41. Backend / Cloud Features

Do not build a backend merely because a commercial mobile game "should" have one.

Introduce backend infrastructure only when a feature requires it.

Possible future reasons:

- Cloud saves
- Cross-device progression
- Accounts
- Remote configuration
- Live events
- Server-authoritative purchases
- Leaderboards
- Social features

Every backend feature creates permanent operational cost and complexity.

Earn that complexity through actual player demand.

---

# 42. Feature Freeze Rule

Until Version 1.0:

**Default answer to a new major system is "not yet."**

Before implementing one, determine whether it solves a release-critical problem.

Prefer:

```text
making Apothecary better
```

over:

```text
adding another crafting system
```

Prefer:

```text
making Genesis satisfying
```

over:

```text
adding another prestige layer
```

Prefer:

```text
making Chapter 1 fun
```

over:

```text
writing Chapter 4
```

---

# 43. AI Agent Rules

Claude Code, Codex, and other coding agents should treat this file as long-term product context.

Before modifying the repository:

1. Inspect existing code.
2. Identify the affected system.
3. Read relevant tests.
4. Determine whether the requested functionality already exists.
5. Preserve the architecture unless there is a concrete reason not to.
6. Do not recreate existing systems.
7. Do not silently change game balance outside the requested scope.

After modifying the repository:

1. Run relevant tests.
2. Run the full suite when appropriate.
3. Check TypeScript/build errors.
4. Verify existing behavior.
5. Add tests for new simulation behavior.
6. Consider save compatibility.
7. Consider offline progression.
8. Consider mobile behavior.
9. Consider production balance impact.
10. Report exactly what changed.

Concretely, in this repository:

```bash
npm test            # 120 tests: sim, guide, lifecycle, storage, offline worker
npm run typecheck
npm run build:pages # only when shipping: bump package.json first, commit docs/app/** with the source
```

Check the game in a browser at a phone viewport (390–430 px wide) with a fresh save and an
existing one, and watch the console. Saves: bump `SAVE_VERSION` and extend `migrate()` and
`validState()` together. UI: patch live values in place; never rebuild DOM on a timer.

---

# 44. Balance Change Rules for AI Agents

Balance changes require particular care.

Never respond to:

> "This feels slow."

by randomly lowering costs.

Instead:

1. Identify the progression bottleneck.
2. Determine what controls it.
3. Measure current timing.
4. Determine intended timing.
5. Modify the smallest relevant set of values.
6. Simulate/test the result.
7. Check downstream effects.

A change to early production can affect the entire game.

Treat balance as a connected economy.

---

# 45. Current Priority Queue

Unless explicitly instructed otherwise, development priority is:

### P0 — Chapter 1 Balance

Real timings. No ads.

### P1 — Balance Instrumentation

Make progression measurable and repeatable.

### P2 — Chapter 1 Playtesting

Developer dogfood followed by external players.

### P3 — UI/UX Consistency

Polish the experience that survived balancing.

### P4 — Chapters 2–3

Validate existing content at production timings.

### P5 — Genesis

Validate the complete progression loop.

### P6 — Remaining Content

Finish Tiers 4–7 only after progression justifies it.

### P7 — Native iOS

Capacitor + Xcode + lifecycle.

### P8 — Analytics

Real player telemetry.

### P9 — Monetization

Replace stand-ins only after base pacing works without them.

### P10 — TestFlight

Real-device external testing.

### P11 — App Store

Ship Version 1.0.

---

# 46. Current Definition of Success

The next milestone is **not**:

> "Petri has more features."

It is:

> "A person can start a fresh Petri save, play Chapter 1 at real production timings without ads or cheats, understand what they are doing, enjoy the progression, leave naturally, return later, make meaningful progress, and want to continue into Chapter 2."

Until that is true, that is the product problem.

---

# 47. Long-Term North Star

Petri has moved beyond proving that its systems can be built.

The question is now whether those systems combine into a game people actually want to keep playing.

The path to Version 1.0 is therefore:

```text
Measure
↓
Balance
↓
Play
↓
Observe
↓
Adjust
↓
Polish
↓
Package
↓
Test
↓
Ship
↓
Learn
```

Do not confuse more code with more progress.

From v0.11.4 onward, **quality of the existing game is more important than quantity of new systems.**