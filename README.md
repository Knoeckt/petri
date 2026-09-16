# Petri

A petri-dish idle game built with TypeScript, Canvas, and DOM UI.

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
npm run dev       # game at http://localhost:5173
npm run build     # typecheck + production build to dist/
```

Supported saves from the mockup and v3 are migrated to v4. All saves are validated before
use. If the primary cannot load, the game tries its backup and earlier supported sources;
unreadable data is retained for recovery. Storage failures show an on-screen notice with
a progress download, rather than silently discarding progress.

`npm run build:pages` builds the new app into `docs/app/`, so it ships to GitHub Pages with
the mockup: the mockup stays at `/petri/`, the new build is at `/petri/app/`. Commit the
built files along with the source.

Each build pre-caches its HTML, scripts, styles, manifest, and icons together. Failed or
incomplete downloads leave the previous offline build active. External fonts are optional.
The generated files preserve exact bytes in Git for the worker's integrity checks.
