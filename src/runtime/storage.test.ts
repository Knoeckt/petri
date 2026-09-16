import { describe, expect, it } from 'vitest';
import { fresh, migrate, SAVE_VERSION } from '../sim/state';
import { BACKUP_KEY, RECOVERY_KEY, SAVE_KEY, SaveStore, type SaveStorage } from './storage';

class MemoryStorage implements SaveStorage {
  values = new Map<string, string>();
  failRead = false;
  failWrite: string | 'all' | null = null;
  getItem(key: string) { if (this.failRead) throw new Error('blocked'); return this.values.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (this.failWrite === 'all' || this.failWrite === key) throw new Error('full');
    this.values.set(key, value);
  }
  removeItem(key: string) { this.values.delete(key); }
}
const saved = (cur: number) => JSON.stringify({ ...fresh(1_000_000), cur });
const storeFor = (storage: MemoryStorage) => new SaveStore(() => storage, () => 1_000_000);

describe('save storage', () => {
  it('keeps a previous validated snapshot and does not alter the simulated timestamp', () => {
    const storage = new MemoryStorage(), store = storeFor(storage);
    expect(store.load().state).toBeNull();
    const state = fresh(42); state.cur = 10;
    expect(store.save(state)).toBeNull();
    state.cur = 20;
    expect(store.save(state)).toBeNull();
    expect(JSON.parse(storage.getItem(SAVE_KEY)!)).toMatchObject({ cur: 20, last: 42 });
    expect(JSON.parse(storage.getItem(BACKUP_KEY)!)).toMatchObject({ cur: 10, last: 42 });
  });

  it.each(['{broken', JSON.stringify({ dishes: [] }), JSON.stringify({ ...fresh(0), trip: { site: 'missing' } })])(
    'recovers a backup and retains the exact invalid primary: %s', raw => {
      const storage = new MemoryStorage(); storage.setItem(SAVE_KEY, raw); storage.setItem(BACKUP_KEY, saved(120));
      const store = storeFor(storage), loaded = store.load();
      expect(loaded.state!.cur).toBe(120);
      expect(loaded.message).toContain('recovered');
      expect(store.save(loaded.state!)).toBeNull();
      expect(JSON.parse(storage.getItem(RECOVERY_KEY)!)).toContainEqual({ key: SAVE_KEY, raw });
      expect(JSON.parse(storage.getItem(BACKUP_KEY)!).cur).toBe(120);
      expect(migrate(JSON.parse(storage.getItem(SAVE_KEY)!))).not.toBeNull();
    },
  );

  it('does not replace an unreadable save if its recovery archive cannot be written', () => {
    const storage = new MemoryStorage(); storage.setItem(SAVE_KEY, 'broken');
    const store = storeFor(storage); expect(store.load().state).toBeNull();
    storage.failWrite = RECOVERY_KEY;
    expect(store.save(fresh(0))).toContain('unavailable');
    expect(storage.getItem(SAVE_KEY)).toBe('broken');
    expect(JSON.parse(store.recoveryExport(fresh(0))).rejected).toEqual([{ key: SAVE_KEY, raw: 'broken' }]);
  });

  it('retains primary and backup through a failed primary write, then retries successfully', () => {
    const storage = new MemoryStorage(); storage.setItem(SAVE_KEY, saved(12));
    const store = storeFor(storage), state = store.load().state!; state.cur = 15;
    storage.failWrite = SAVE_KEY;
    expect(store.save(state)).toContain('unavailable');
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).cur).toBe(12);
    expect(JSON.parse(storage.getItem(BACKUP_KEY)!).cur).toBe(12);
    storage.failWrite = null;
    expect(store.save(state)).toBeNull();
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).cur).toBe(15);
  });

  it('refuses to replace a good save with invalid in-memory progress', () => {
    const storage = new MemoryStorage(); storage.setItem(SAVE_KEY, saved(12));
    const store = storeFor(storage), state = store.load().state!; state.cur = NaN;
    expect(store.save(state)).toContain('protected');
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).cur).toBe(12);
  });

  it('does not overwrite progress it could not read, even if storage access returns', () => {
    const storage = new MemoryStorage(); storage.setItem(SAVE_KEY, saved(12)); storage.failRead = true;
    const store = storeFor(storage);
    expect(store.load().message).toContain('could not be read');
    storage.failRead = false;
    expect(store.save(fresh(0))).toContain('paused');
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).cur).toBe(12);
  });

  it('handles browsers that throw when localStorage itself is accessed', () => {
    const store = new SaveStore(() => { throw new Error('access denied'); });
    expect(store.load().state).toBeNull();
    expect(store.save(fresh(0))).toContain('paused');
    expect(JSON.parse(store.recoveryExport(fresh(0))).state.cur).toBe(0);
  });

  it('does not downgrade a future save', () => {
    const storage = new MemoryStorage(), future = JSON.stringify({ ...fresh(0), v: SAVE_VERSION + 1 });
    storage.setItem(SAVE_KEY, future); storage.setItem(BACKUP_KEY, saved(12));
    const store = storeFor(storage), loaded = store.load();
    expect(loaded.message).toContain('newer version');
    expect(store.save(loaded.state!)).toContain('paused');
    expect(storage.getItem(SAVE_KEY)).toBe(future);
  });

  it('falls back to an older valid version without modifying its source', () => {
    const storage = new MemoryStorage(), old = JSON.stringify({ ...fresh(0), v: 3, lv: 8, cur: 90 });
    storage.setItem(SAVE_KEY, 'broken'); storage.setItem('petri-v3', old);
    const store = storeFor(storage), loaded = store.load();
    expect(loaded.state).toMatchObject({ cur: 90, eq: { dish: 7 }, v: SAVE_VERSION });
    expect(store.save(loaded.state!)).toBeNull();
    expect(storage.getItem('petri-v3')).toBe(old);
  });

  it('does not resurrect a legacy save after reset or delete the separate mockup', () => {
    const storage = new MemoryStorage(), old = saved(900);
    storage.setItem('petri-orbit-mock-v2', old); storage.setItem(SAVE_KEY, saved(20)); storage.setItem(BACKUP_KEY, saved(10));
    const store = storeFor(storage); store.load(); store.reset();
    expect(storeFor(storage).load().state).toBeNull();
    expect(storage.getItem('petri-orbit-mock-v2')).toBe(old);
  });
});
