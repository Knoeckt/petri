// Runs the balance bots (src/bot/cli.ts). Node cannot load the TypeScript sources with their extensionless
// imports directly, so this bundles the CLI with Vite into node_modules/.cache and runs the result.
import { build } from 'vite';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const outDir = resolve('node_modules/.cache/petri-bot');
await build({
  configFile: false, logLevel: 'error',
  build: { ssr: 'src/bot/cli.ts', outDir, emptyOutDir: true, minify: false, target: 'node20', rollupOptions: { output: { entryFileNames: 'cli.mjs', format: 'es' } } },
});
const { main } = await import(pathToFileURL(resolve(outDir, 'cli.mjs')).href);
await main(process.argv.slice(2), { write: (path, text) => writeFileSync(path, text) });
