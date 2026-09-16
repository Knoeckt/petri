import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import type { Plugin } from 'vite';

/** Generate the worker from the actual output, so a renamed chunk cannot be omitted. */
export function offlineShell(): Plugin {
  let publicDir: string;
  const template = readFileSync(new URL('../src/runtime/service-worker.js', import.meta.url), 'utf8');
  return {
    name: 'petri-offline-shell', apply: 'build', enforce: 'post',
    configResolved(config) { publicDir = config.publicDir; },
    generateBundle(_options, bundle) {
      const files = new Map<string, string | Uint8Array>();
      for (const [name, output] of Object.entries(bundle)) files.set(name, output.type === 'chunk' ? output.code : output.source);
      for (const entry of readdirSync(publicDir, { recursive: true, withFileTypes: true })) {
        if (!entry.isFile()) continue;
        const path = resolve(entry.parentPath, entry.name);
        files.set(relative(publicDir, path).replaceAll('\\', '/'), readFileSync(path));
      }
      const shell = [...files].sort(([a], [b]) => a.localeCompare(b)).map(([url, content]) => ({
        url: './' + url, integrity: 'sha256-' + createHash('sha256').update(content).digest('base64'),
      }));
      const manifest = JSON.stringify(shell);
      const build = createHash('sha256').update(template).update(manifest).digest('hex').slice(0, 16);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: template.replace('__SHELL_MANIFEST__', manifest).replace('__BUILD_ID__', build) });
    },
  };
}
