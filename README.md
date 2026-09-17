# Petri

A petri-dish idle game built with TypeScript, Canvas, and DOM UI.

- `ROADMAP.md` is the long-term plan and where the project stands; every assistant starts there.
- `GAME_DESIGN.md` records the design and prototype history.
- `DEVELOPMENT.md` tracks the current work order, open decisions, and save/time behavior.
- `docs/` holds the original reference mockup; `docs/app/` is the current playable build.

On an iPhone: open the site in Safari, tap Share, then "Add to Home Screen". Five taps
on the title sign open the playtest cheats. The web app saves locally with a backup.
Open it online once to install the offline app. When an update is downloaded, close all
Petri windows and reopen; the new build waits until the old game is closed.

## Development

The single-file mockup in `docs/` stays live on GitHub Pages as the reference build. The
real build lives beside it:

```
src/data/      hand-maintained game content and definitions
src/sim/       state, rules, actions, live/offline simulation, migration and validation
src/runtime/   session lifecycle and storage/backup recovery (testable without a DOM)
src/ui/        game screens, Canvas art, sound, tutorial and storage notices
src/main.ts    browser startup, lifecycle wiring and rendering loop
build/         offline worker generation from the production build
tests/         worker lifecycle and build-integration regressions
```

```bash
npm install
npm test          # simulation, lifecycle, migration and storage regressions
npm run bot       # scripted players play chapter 1 at playtest pace and report milestone timings
npm run dev       # game at http://localhost:5173
npm run build     # typecheck + production build to dist/
```

Supported saves from the mockup and v3 are migrated to v4. All saves are validated before
use. If the primary cannot load, the game tries its backup and earlier supported sources;
unreadable data is retained for recovery. Storage failures show an on-screen notice with
a progress download, rather than silently discarding progress.

## Balance bots

`npm run bot` plays fresh saves with four scripted players and prints when each progression
milestone landed, against the target table in `DEVELOPMENT.md` §3 (ROADMAP §7 and §8).
Sessions run on the live tick; the gaps between them go through the game's own offline
catch-up, so the numbers are what a phone would show. Wall time counts from the first
session; play time counts only time in sessions.

```bash
npm run bot -- --profile active --seeds 3 --days 3 --verbose   # one profile, each run's timeline
npm run bot -- --pace proto                                     # prototype timings
npm run bot -- --json runs.json                                 # every run's milestones and end state
```

The profiles are in `src/bot/policies.ts`: **active** (eight short looks a day), **casual**
(three, keeps a quarter of its biomass back), **idle** (one evening session), **optimizer**
(active schedule, best-payback purchases, perfect pipette drops). None of them watches ads,
buys from the Shop, studies specimens or splices. Milestones are `src/bot/milestones.ts`,
targets `src/bot/targets.ts`. A bot finds economic problems (a wall, a dead upgrade, a
resource with nothing to buy); whether it is fun is still the dogfood pass.

`npm run build:pages` builds the new app into `docs/app/`, so it ships to GitHub Pages with
the mockup: the mockup stays at `/petri/`, the new build is at `/petri/app/`. Commit the
built files along with the source.

Each build pre-caches its HTML, scripts, styles, manifest, and icons together. Failed or
incomplete downloads leave the previous offline build active. External fonts are optional.
The generated files preserve exact bytes in Git for the worker's integrity checks.
