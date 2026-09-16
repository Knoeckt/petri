import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { offlineShell } from '../build/offline.ts';

const template = readFileSync(new URL('../src/runtime/service-worker.js', import.meta.url), 'utf8');
const scope = 'https://example.test/petri/app/';
const prefix = `petri-app:${encodeURIComponent(scope)}:`;
const source = version => template.replace('__BUILD_ID__', version).replace('__SHELL_MANIFEST__', JSON.stringify([
  { url: './index.html', integrity: 'sha256-page' }, { url: './assets/game.js', integrity: 'sha256-script' },
]));

// Execute the real worker handlers with an in-memory browser CacheStorage and network.
function browser(cacheData = new Map(), version = 'new') {
  const handlers = {}, network = new Map([
    [scope + 'index.html', { body: '<html>new</html>', integrity: 'sha256-page' }],
    [scope + 'assets/game.js', { body: 'new script', integrity: 'sha256-script' }],
  ]);
  let claims = 0;
  const key = request => typeof request === 'string' ? request : request.url;
  const fetch = async request => {
    const entry = network.get(key(request));
    if (!entry || (request.integrity && request.integrity !== entry.integrity)) throw new Error('Unavailable or mismatched asset');
    return new Response(entry.body);
  };
  const caches = {
    keys: async () => [...cacheData.keys()],
    delete: async name => cacheData.delete(name),
    open: async name => {
      if (!cacheData.has(name)) cacheData.set(name, new Map());
      const data = cacheData.get(name);
      return {
        match: async (request, options) => {
          const response = data.get(key(request));
          if (!options?.ignoreVary && response?.headers.get('vary') === 'Origin' && request.headers?.get('origin')) return undefined;
          return response?.clone();
        },
        addAll: async requests => {
          const responses = await Promise.all(requests.map(fetch));
          requests.forEach((request, i) => data.set(key(request), responses[i]));
        },
      };
    },
  };
  runInNewContext(source(version), {
    URL, Request, caches, fetch,
    self: { registration: { scope }, clients: { claim: async () => { claims++; } },
      addEventListener: (type, handler) => { handlers[type] = handler; } },
  });
  return {
    cacheData, network, claims: () => claims,
    async lifecycle(type) { let work; handlers[type]({ waitUntil: promise => { work = promise; } }); await work; },
    async request(url, mode = 'navigate', method = 'GET') {
      let result; handlers.fetch({ request: { url, mode, method, headers: new Headers(mode === 'cors' ? { origin: new URL(scope).origin } : {}) }, respondWith: response => { result = response; } });
      return result ? (await result).text() : undefined;
    },
  };
}

describe('offline app shell', () => {
  it('pre-caches the script before it is requested and cold-launches offline with query strings', async () => {
    const b = browser(); await b.lifecycle('install'); await b.lifecycle('activate'); b.network.clear();
    expect(await b.request(scope + '?from=homescreen')).toBe('<html>new</html>');
    expect(await b.request(scope + 'index.html')).toBe('<html>new</html>');
    expect(await b.request(scope + 'assets/game.js', 'cors')).toBe('new script');
    expect(b.claims()).toBe(1);
  });

  it('keeps pages and chunks from one build even while a newer deployment is online', async () => {
    const b = browser(); await b.lifecycle('install');
    b.network.set(scope + 'index.html', { body: '<html>next build</html>' });
    expect(await b.request(scope)).toBe('<html>new</html>');
    expect(await b.request(scope + 'assets/game.js', 'cors')).toBe('new script');
  });

  it('serves integrity-pinned modules offline when the host adds Vary: Origin', async () => {
    const b = browser(); await b.lifecycle('install'); b.network.clear();
    b.cacheData.get(prefix + 'new').get(scope + 'assets/game.js').headers.set('vary', 'Origin');
    expect(await b.request(scope + 'assets/game.js', 'cors')).toBe('new script');
  });

  it('deletes only obsolete caches belonging to its own registration scope, plus the pre-0.11.3 cache', async () => {
    const other = ['petri-v20', 'another-game', 'petri-app:https%3A%2F%2Fexample.test%2Fother%2F:old'];
    const b = browser(new Map([...other, 'petri-app-v1', prefix + 'old'].map(name => [name, new Map()])));
    await b.lifecycle('install'); await b.lifecycle('activate');
    expect([...b.cacheData.keys()].sort()).toEqual([...other, prefix + 'new'].sort());
  });

  it.each(['missing', 'mismatched'])('retains the old offline build when a new asset is %s', async failure => {
    const old = browser(undefined, 'old'); await old.lifecycle('install'); await old.lifecycle('activate');
    const update = browser(old.cacheData);
    if (failure === 'missing') update.network.delete(scope + 'assets/game.js');
    else update.network.set(scope + 'index.html', { body: 'wrong deployment', integrity: 'sha256-wrong' });
    await expect(update.lifecycle('install')).rejects.toThrow();
    expect(update.claims()).toBe(0);
    old.network.clear();
    expect(await old.request(scope)).toBe('<html>new</html>');
    expect(await old.request(scope + 'assets/game.js', 'cors')).toBe('new script');
  });

  it('does not intercept unrelated sites, paths, fonts, or writes', async () => {
    const b = browser(); await b.lifecycle('install');
    for (const url of ['https://example.test/petri/', 'https://elsewhere.test/petri/app/', scope + 'missing.html', 'https://fonts.googleapis.com/css2']) {
      expect(await b.request(url)).toBeUndefined();
    }
    expect(await b.request(scope, 'navigate', 'POST')).toBeUndefined();
  });

  it('lets the legacy mockup remove only its own caches', async () => {
    const keys = ['petri-v19', 'petri-v20', prefix + 'new', 'petri-app-v1', 'other'];
    const deleted = []; let activate;
    runInNewContext(readFileSync(new URL('../docs/sw.js', import.meta.url), 'utf8'), {
      self: { addEventListener: (type, fn) => { if (type === 'activate') activate = fn; }, clients: { claim: async () => {} } },
      caches: { keys: async () => keys, delete: async key => { deleted.push(key); } },
    });
    let work; activate({ waitUntil: promise => { work = promise; } }); await work;
    expect(deleted).toEqual(['petri-v19']);
  });
});

describe('offline build integration', () => {
  it('includes every output and public asset with integrity, changing the worker when content changes', () => {
    const emit = bundle => {
      const plugin = offlineShell(); plugin.configResolved({ publicDir: fileURLToPath(new URL('../public', import.meta.url)) });
      let worker; plugin.generateBundle.call({ emitFile: asset => { worker = asset.source; } }, {}, bundle);
      return worker;
    };
    const bundle = { 'index.html': { type: 'asset', source: 'page' }, 'assets/game-abc.js': { type: 'chunk', code: 'script' }, 'assets/style.css': { type: 'asset', source: 'styles' } };
    const worker = emit(bundle);
    for (const file of [...Object.keys(bundle), 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png']) expect(worker).toContain(`./${file}`);
    expect(worker).toContain('sha256-' + createHash('sha256').update('script').digest('base64'));
    expect(worker).not.toContain('__SHELL_MANIFEST__');
    expect(worker).not.toContain('__BUILD_ID__');
    expect(emit(bundle)).toBe(worker);
    bundle['index.html'].source = 'next page';
    expect(emit(bundle)).not.toBe(worker);
  });
});
