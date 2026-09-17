# Development priorities

The near-term work order. `ROADMAP.md` holds the long-term plan and the phase this sits in.

Work through these in order, with playtest/iteration loops on reliability and the first
chapter before native beta or store preparation. The reference mockup is retained as-is.

## 1. Reliable progress — implemented, ready for playtesting

- [x] Preserve the last simulated timestamp through hidden autosaves and lifecycle events.
- [x] Save catch-up immediately and prevent repeated resume events from replaying it.
- [x] Validate saves before use; recover a previous valid snapshot and retain unreadable sources.
- [x] Show storage failures persistently and provide a progress/recovery download.
- [x] Apply boost expiry, research completion, discoveries, and extra dishes chronologically.
- [x] Advance research, trips, brewing, splicing, and cooldowns beyond the production cap.
- [x] Retain progress on short interruptions without showing the welcome sheet.
- [x] Roll spawn protection once; preserve prior bites and bite timers through catch-up.
- [x] Cover lifecycle, storage failures, migration, and offline boundaries with regression tests.

Validation for v0.11.2: 92 tests pass; the production Pages build passes typechecking.
Browser smoke checks confirmed persisted progress after reload, no console errors, and
the persistent save warning and its download callback at a 390 × 844 viewport.

Next manual checks: close/reopen during research and a trip; background during a boost;
return after the production cap; check a saved game after an update. Physical-phone
lifecycle behavior still needs testing when a device is available.

v0.11.4: the first-run guide now lets go of a prompt once its panel has been opened (the
"Someone at the Clinic needs you" hand used to dim the whole screen forever), stands down
while a results/ad sheet is open, only spotlights the very first harvest, and keeps its
caption on screen at the left and right edges. The offline worker also deletes the
pre-0.11.3 `petri-app-v1` cache on activation.

## 2. Pipette and offline app shell — implemented, ready for phone playtesting

- [x] Update the pipette at animation-frame cadence and score its last displayed position.
- [x] Prevent duplicate starts and duplicate rewards; align the colored zones with scoring.
- [x] Keep Field trips open after 1-1 while pipette play and ticket ads/purchases wait until after 1-5.
- [x] Hide ticket badges and show the unlock requirement before tickets open.
- [x] Generate a versioned offline shell containing every built asset, manifest, and icon.
- [x] Check asset integrity before installing a new build; keep the prior build on failed downloads.
- [x] Isolate each app registration's cache; fix the mockup's cleanup so it preserves the app cache.
- [x] Keep an installed page and its scripts together, including on hosts using `Vary: Origin`.

Validation for v0.11.3: 113 tests pass, including cache failure/update cases and build-manifest
generation. Browser playtesting confirmed the locked/unlocked Field UI, moving marker,
single ticket charge, and artifact reward. The final production app cold-launched with
its server stopped, including a start-URL query string and restored progress. The
download/wait/close/reopen update flow was also verified. Native iOS/Android testing remains manual.

Phone playtest: open `/petri/app/` online and check version 0.11.3. When an update is
downloaded, close all Petri windows (including its Safari tabs) and reopen. After installation,
try airplane mode and a cold launch. Fonts loaded from Google are optional; the game uses
system fallbacks when those fonts are unavailable offline. Browser storage eviction can
still require another online launch.

The worker template is `src/runtime/service-worker.js`; `build/offline.ts` generates `sw.js`
from the actual build output. Never hand-edit the generated worker. `docs/app/**` preserves
exact file bytes through Git so Windows line-ending conversion cannot break integrity hashes.
Updates deliberately wait for old windows to close, following the
[service-worker lifecycle](https://web.dev/articles/service-worker-lifecycle).

## 3. First chapter and progression

1. [x] Separate prototype and intended-playtest balance settings. `src/data/pace.ts` holds two
   profiles; the game context carries one (`g.pace`) and every duration goes through it
   (`cycleTime`, `resTime`, `tripTime`, `brewTime`, `studyTime`, `spliceTime`, `boostLen`,
   `adLen`, `adCooldown`, biter intervals). Costs and yields are shared. The default is still
   `proto`; a device switches with `?pace=real` (remembered) or the dev sheet, and the corner
   tag reads "· playtest". Add a profile by adding an entry, never by forking constants.
2. Measure a complete first chapter without ads across random seeds and human playtests.
   - [x] Scripted players (`npm run bot`, `src/bot/`): four habit profiles play fresh saves at
     playtest pace across seeds, sessions on the live tick and the gaps through offline
     catch-up, and report every milestone against the target table below (ROADMAP §7–8).
     First reading, 2026-09-16, active profile: the first session lands on target through
     1-3 (harvest 1.5 min, Mayor 6 min, Lab 19.5 min); 1-4 took 3.5 h on the wall (31 min of
     play) because the uncommon was 0% until level 1 and only 6% at level 15; the chapter then
     finished in one day with every upgrade bought and 96k biomass idle. Not measured: ads,
     Shop, studies.
   - [x] Pass A (same day): uncommon odds ramp in from level 1 (6% by level 6, 10% by 15);
     rares stay under 1% until level 30; bench growth ×1.25–1.3; research auto 3,000/40 min,
     luck 250, storage 1,500, second dish 2,500, fast 6,000, third dish 20,000; upgrade
     tiers 2–4 ×1.5, ×4, ×8. After: active reaches 1-4 in 31 min of play (2 h on the wall,
     the gap to its second session), 1-6 on day 1.3, chapter done day 2.0 after 3 h of play;
     casual 1-6 day 3.5, done day 5.2; optimizer done day 1.1; idle stalls at 1-6. Auto-harvest
     lands at 10 h (target day 1–2). "Days" are calendar days from the first session, not play
     time; the active profile plays about 95 minutes a day.
   - [ ] The dogfood run (ROADMAP §10), with the in-game milestone log the bot shares.
3. Improve the opening discoveries and prioritize affordable early upgrades.
4. Decide how earlier catalogs become complete and make extra dishes visible/useful.
5. Tune ads, offline efficiency, request cadence, and the first scale-up from that evidence.
6. Improve shared accessibility, content validation, documentation, and automated build checks.
7. [ ] Pass B: world 1 in about 1.5 h of play (table above), by the bots then a dogfood run.
   Update `src/bot/targets.ts` to the table first.
8. [ ] The loop (ROADMAP §4b, GAME_DESIGN §7b): per-world pacing knobs and bot targets for
   worlds 2–3; Genome accrues during the run (`gen.pending`, lifetime biomass, save v7);
   the gate at 2-5 or the biomass threshold; the Genome shop with the new perks and cost
   curve; the pending counter, its intro card and the Genesis confirm sheet; a bot policy that
   loops and a report across loops.

### Chapter 1 targets (revised 2026-09-16 for a 1.5 h world 1, ROADMAP §4b)

Targets are in **play time** (hands-on, the bots' `play` column) unless marked wall. A session
is 10–20 min; an active player's day is about 95 min of play, a casual one's about 30. The
previous table (day 3–5 for the chapter) is superseded; `src/bot/targets.ts` mirrors this one.

| Moment | Target (play) | Notes |
|---|---|---|
| First harvest | 1–1.5 min | one cycle, stirring shortens it |
| First upgrade (Bigger vats, 25) | inside 5 min | first spend before the first delivery |
| 1-1 Mayor delivered (5 of anything) | 3–6 min | two or three cycles |
| First trip sent / due back | 6 min / 16 min | the first reason to put the phone down |
| 1-2 Ida (2 Fuzzwald) | 10–15 min | never a stall |
| First paid equipment rank (3 notes) | 15–20 min | end of session 1 |
| 1-3 Ferro, Research opens | 15–25 min | still commons; first research within a minute |
| 1-4 Pip (an uncommon) | 25–40 min | the first designed wait, usually session 2 |
| 1-5 Ferro, Apothecary opens | 35–50 min | first brew waits 6 min |
| First overnight return | day 1 → 2 wall | offline cap 4 h bites; the welcome-back is worth reading |
| Auto-harvest researched | 45–75 min | the automation milestone, around the midpoint |
| 1-6 Gran Moss (a rare) | 55–75 min | the midpoint; the second stall, rank ups carry it |
| 1-7 Ferro, Splicer | 70–85 min | |
| 1-8 Ferro (three medicines) | 80–95 min | the third stall: two rares and seven brews |
| 1-9 outbreak, chapter done | **80–100 min**, 5–8 sessions | Scale-up opens |
| 2-5 delivered, Genesis opens | about 4 h cumulative | ROADMAP §4b |

The bots (`npm run bot`) measure these; Pass B (item 7 below) tunes to them.

## Later — after the early game is satisfying

Native iOS/Android development builds, platform storage and lifecycle verification,
real rewarded-ad failure cases, device performance, measured beta, launch content,
privacy/support information, and store submission.

## Time and save behavior

- `State.last` means progress has been accounted for through that wall-clock timestamp.
  It is not the time of the most recent storage write.
- Live updates stop while hidden. Resume accounts for the absence once and saves it.
- Absences shorter than 20 seconds advance progress quietly. Longer ones show results.
- The production cap is taken from the equipment/research at departure. Dish cycles and
  passive income stop at that cap; other timers still consume the full absence.
- Time warps use full production efficiency. Offline progress uses Night shift efficiency.
- Offline harvests remain automatic before auto-harvest research, matching the prototype.
- Outbreaks wait for the player during catch-up. Offline bite resolution omits visual
  wind-up/travel animations; it retains biological bite timers and only eats spawned prey.
- The current key is `petri-v6`; `petri-v6-backup` stores the previous valid snapshot.
  `petri-v6-recovery` retains unreadable source text before any replacement. v6 (0.11.8) adds
  `iap`, the real-money purchase record, kept through Scale-up and Genesis. v5 (0.11.6)
  dissolved the catalog's keeper copy: a count is what sits on the Shelf, 0 means found and
  empty, and migration subtracts one from every pre-v5 count so usable stock is unchanged. Future-version
  saves and saves that could not be read are protected from writes until reload/update.
- The progress download includes the current state and available recovery material. It is
  a development/support recovery file; an in-game file-import interface is not implemented.
