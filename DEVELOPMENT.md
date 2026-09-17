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
     1-3 (harvest 1.5 min, Mayor 6 min, Lab 19.5 min); 1-4 takes 3.5 h on the wall but only
     31 min of play, and the chapter finishes on day 2 rather than day 3–5, because auto-harvest
     and the second dish arrive in the first two hours. Not measured: ads, Shop, studies.
   - [ ] The dogfood run (ROADMAP §10), with the in-game milestone log the bot shares.
3. Improve the opening discoveries and prioritize affordable early upgrades.
4. Decide how earlier catalogs become complete and make extra dishes visible/useful.
5. Tune ads, offline efficiency, request cadence, and the first scale-up from that evidence.
6. Improve shared accessibility, content validation, documentation, and automated build checks.

### Chapter 1 targets at playtest pace (proposed 2026-09-16, to confirm before tuning)

Ranges the balance passes aim at, from GAME_DESIGN §8 ("a decision every 30 s in the first
session", "day 1–2: rares, second dish, first scale-up") and the playtest profile (90 s
cycles, pond ten minutes away, research 7–8 min, brewing 3–6 min). Session = 10–20 min.

| Moment | Target | Why |
|---|---|---|
| First harvest | 1–1.5 min | one cycle, stirring shortens it |
| First upgrade (Bigger vats, 25) | inside 5 min | first spend before the first delivery |
| 1-1 Mayor delivered (2 Blubb) | 3–6 min | two or three cycles |
| First trip sent / back | 5 min / 15 min | the first reason to put the phone down |
| First equipment rank (3 notes) | 15–20 min | end of session 1 |
| 1-2 Ida (5 of anything) | 10–15 min | never a stall |
| 1-3 Ferro (2 Fuzzwald, 1 Dotto), Lab opens | 15–25 min | still commons, no wall; first research started within a minute of opening |
| 1-4 Pip (an uncommon) | 30–60 min, session 2 | the first designed wait; Notes and dish ranks carry it (swapped ahead of Ferro 2026-09-16 because the uncommon took 15+ min of play) |
| 1-5 Ferro, Apothecary opens | 1.5–2.5 h of play, day 1–2 | first brew waits 3–6 min |
| First overnight return | day 1 → 2 | offline cap 4 h bites; the welcome-back is worth reading |
| Auto-harvest researched | day 2 | the automation milestone before the midpoint |
| 1-6 Gran Moss (a rare) | day 2–3 | the midpoint; the second stall, rank ups carry it |
| 1-9 outbreak, chapter done | day 3–5, 5–8 sessions | Scale-up opens |

Instrumentation (ROADMAP §7) measures these; then Pass A fixes anything an order of
magnitude off.

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
