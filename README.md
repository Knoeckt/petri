# Petri

A petri-dish idle game, designed and prototyped as a single-file web app.

- `GAME_DESIGN.md` is the design.
- `docs/` is the playable build, served as an installable web app (GitHub Pages from `/docs`).

On an iPhone: open the site in Safari, tap Share, then "Add to Home Screen". It runs fullscreen, saves in place, and works offline after the first load. Five taps on the title sign open the playtest cheats.

## The real build (in progress)

The single-file mockup in `docs/` stays live on GitHub Pages as the reference build. The
real build lives beside it:

```
src/data/      game data (strains, story, research, artifacts…) — generated.ts is produced
               from the mockup by `npm run gen:data`; index.ts holds the hand-written bits
src/sim/       the simulation: plain state, pure rules, actions, tick/simulate, save migration.
               No DOM. `npm test` runs its vitest suite.
src/main.ts    a headless dev harness until the UI lands
```

```bash
npm install
npm test          # sim tests
npm run dev       # harness at http://localhost:5173
npm run build     # typecheck + production build to dist/
```

Saves from the mockup import as-is: `migrate()` in `src/sim/state.ts` accepts every shape
the mockup ever wrote.

`npm run build:pages` builds the new app into `docs/app/`, so it ships to GitHub Pages with
the mockup: the mockup stays at `/petri/`, the new build is at `/petri/app/`. Commit the
built files along with the source.
