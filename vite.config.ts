import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { offlineShell } from './build/offline.ts';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  base: './',
  plugins: [offlineShell()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: { outDir: 'dist', target: 'es2022' },
  test: { include: ['src/**/*.test.ts', 'tests/**/*.test.mjs'] },
});
