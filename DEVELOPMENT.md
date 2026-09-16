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

1. Separate prototype and intended-playtest balance settings.
2. Measure a complete first chapter without ads across random seeds and human playtests.
3. Improve the opening discoveries and prioritize affordable early upgrades.
4. Decide how earlier catalogs become complete and make extra dishes visible/useful.
5. Tune ads, offline efficiency, request cadence, and the first scale-up from that evidence.
6. Improve shared accessibility, content validation, documentation, and automated build checks.

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
- The current key is `petri-v4`; `petri-v4-backup` stores the previous valid snapshot.
  `petri-v4-recovery` retains unreadable source text before any replacement. Future-version
  saves and saves that could not be read are protected from writes until reload/update.
- The progress download includes the current state and available recovery material. It is
  a development/support recovery file; an in-game file-import interface is not implemented.
