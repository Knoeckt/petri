import { migrate, SAVE_VERSION, type State } from '../sim/state';

export const SAVE_KEY = `petri-v${SAVE_VERSION}`;
export const BACKUP_KEY = `${SAVE_KEY}-backup`;
export const RECOVERY_KEY = `${SAVE_KEY}-recovery`;
const LEGACY_KEY = 'petri-orbit-mock-v2';
const RESET_KEY = 'petri-fresh-start';
const previousKeys = Array.from({ length: SAVE_VERSION - 3 }, (_, i) => `petri-v${SAVE_VERSION - i - 1}`);

export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface RejectedSave { key: string; raw: string }
export interface LoadedSave { state: State | null; message: string | null }

/** The provider may throw too (for example when the browser blocks localStorage entirely). */
export class SaveStore {
  private lastGood: string | null = null;
  private rejected: RejectedSave[] = [];
  private blocked: string | null = null;
  private loaded = false;

  constructor(private storage: () => SaveStorage, private now: () => number = () => Date.now()) {}

  load(): LoadedSave {
    this.loaded = true;
    try {
      const storage = this.storage();
      const ignoreLegacy = storage.getItem(RESET_KEY) === '1';
      const keys = [SAVE_KEY, BACKUP_KEY, ...(ignoreLegacy ? [] : [...previousKeys, LEGACY_KEY])];
      for (const key of keys) {
        const raw = storage.getItem(key);
        if (raw === null) continue;
        let parsed: unknown;
        try { parsed = JSON.parse(raw); } catch { /* Retain the exact unreadable text below. */ }
        if (parsed && typeof parsed === 'object' && 'v' in parsed && typeof parsed.v === 'number' && parsed.v > SAVE_VERSION) {
          this.blocked = 'This save needs a newer version of Petri. Saving is paused to protect it.';
        }
        const state = migrate(parsed, this.now());
        if (state) {
          this.lastGood = raw;
          const message = this.blocked || (this.rejected.length || key === BACKUP_KEY
            ? 'Your last working save was recovered. The unreadable save has been kept for recovery.'
            : key === LEGACY_KEY ? 'Your save was brought across from the old build.' : null);
          return { state, message };
        }
        this.rejected.push({ key, raw });
      }
      return { state: null, message: this.blocked || (this.rejected.length
        ? 'Saved progress could not be loaded. A new game is running; the original saves are kept for recovery.'
        : null) };
    } catch {
      // Never overwrite an existing save that we could not read, even if storage later becomes writable.
      this.blocked = 'Saved progress could not be read. Saving is paused; reopen Petri when storage is available.';
      return { state: null, message: this.blocked };
    }
  }

  /** Returns a player-facing failure, or null after a successful write. */
  save(state: State): string | null {
    if (!this.loaded) return 'Saving is paused until existing progress has been checked.';
    if (this.blocked) return this.blocked;
    if (!migrate(state, this.now())) return 'Progress could not be saved. Your last working save is protected.';
    try {
      const storage = this.storage();
      const raw = JSON.stringify(state);
      if (this.rejected.length) {
        // Archive before replacing any bad source. If this fails, the source remains untouched.
        const old = storage.getItem(RECOVERY_KEY);
        const archived: unknown = old ? JSON.parse(old) : [];
        if (!Array.isArray(archived)) throw new Error('Unreadable recovery archive');
        const entries = [...archived];
        for (const entry of this.rejected) {
          if (!entries.some(e => e?.key === entry.key && e?.raw === entry.raw)) entries.push(entry);
        }
        storage.setItem(RECOVERY_KEY, JSON.stringify(entries));
        this.rejected = [];
      }
      // The backup always contains a validated previous snapshot, never a corrupt primary.
      if (this.lastGood !== null) storage.setItem(BACKUP_KEY, this.lastGood);
      storage.setItem(SAVE_KEY, raw);
      this.lastGood = raw;
      return null;
    } catch {
      return 'Saving is unavailable. Keep Petri open or download your progress before leaving.';
    }
  }

  recoveryExport(state: State): string {
    let archived: string | null = null;
    try { archived = this.storage().getItem(RECOVERY_KEY); } catch { /* In-memory progress is still downloadable. */ }
    return JSON.stringify({ exportedAt: this.now(), state, rejected: this.rejected, archived }, null, 2);
  }

  reset() {
    const storage = this.storage();
    // Do not resurrect an older save on reload, or delete the separate mockup's progress.
    storage.setItem(RESET_KEY, '1');
    for (const key of [SAVE_KEY, BACKUP_KEY, ...previousKeys]) storage.removeItem(key);
  }
}
