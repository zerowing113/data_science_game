import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type SetStateAction } from 'react';
import { readJourney } from './save-schema';

const saveKey = 'little-goods-journey';

class Journey {
  values: Record<string, unknown> = {};
  raw: string | null = null;
  blocked = false;
  ready = false;
  readOnly = true;
  error = '';
  revision = 0;
  saveQueued = false;
  listeners = new Set<() => void>();

  load() {
    try {
      this.raw = localStorage.getItem(saveKey);
      if (this.raw !== null) this.values = readJourney(this.raw);
    } catch {
      this.blocked = true;
      this.error = 'Your saved journey could not be read or uses an incompatible format. It has not been changed. Download a backup before starting over, or reopen a compatible game version.';
    }
    this.ready = true;
    this.readOnly = false;
    this.changed();
  }

  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  snapshot = () => this.revision;
  changed() { ++this.revision; this.listeners.forEach((listener) => listener()); }
  encode() { return JSON.stringify({ version: 1, values: this.values }); }

  save() {
    if (this.blocked || this.readOnly) return;
    try {
      if (localStorage.getItem(saveKey) !== this.raw) throw new Error('Another tab changed the saved journey. Download your current work, then reload to resume that save.');
      const next = this.encode();
      localStorage.setItem(saveKey, next);
      this.raw = next;
      this.error = '';
    } catch (error) {
      this.error = error instanceof Error && error.message.startsWith('Another tab') ? error.message : 'Progress could not be saved. Your current work remains in this tab; the previous save is unchanged. Free browser storage or allow site storage, then Retry saving. Download a backup before closing.';
    }
  }

  set<T,>(key: string, action: SetStateAction<T>, fallback: T) {
    if (this.blocked || this.readOnly) return;
    const current = Object.hasOwn(this.values, key) ? this.values[key] as T : fallback;
    const next = typeof action === 'function' ? (action as (value: T) => T)(current) : action;
    if (Object.is(current, next)) return;
    if (next === undefined) delete this.values[key];
    else this.values[key] = next;
    // One browser action can update the source, runtime, and evidence together.
    // Persist them in one atomic storage write after its synchronous updates,
    // so a quota failure cannot leave half of a run paired with older evidence.
    if (!this.error && !this.saveQueued) {
      this.saveQueued = true;
      queueMicrotask(() => {
        this.saveQueued = false;
        if (this.blocked || this.error) return;
        this.save();
        this.changed();
      });
    }
    this.changed();
  }

  clear() {
    if (this.readOnly) return false;
    try {
      if (localStorage.getItem(saveKey) !== this.raw) throw new Error('changed');
      localStorage.removeItem(saveKey);
      this.values = {};
      this.raw = null;
      this.blocked = false;
      this.error = '';
      this.changed();
      return true;
    } catch {
      this.error = 'Start over could not clear the save. It may have changed in another tab, or browser storage is unavailable. Your journey has not been reset. Reload or restore storage access and try again.';
      this.changed();
      return false;
    }
  }
}

const JourneyContext = createContext<Journey | null>(null);
function useJourney() {
  const journey = useContext(JourneyContext);
  if (!journey) throw new Error('JourneyProvider is required.');
  return journey;
}

export function useSavedState<T>(key: string, initial: T | (() => T)): [T, (action: SetStateAction<T>) => void];
export function useSavedState<T>(key: string): [T | undefined, (action: SetStateAction<T | undefined>) => void];
export function useSavedState<T>(key: string, initial?: T | (() => T)) {
  const journey = useJourney();
  const [fallback] = useState(initial);
  const value = useSyncExternalStore(journey.subscribe, () => Object.hasOwn(journey.values, key) ? journey.values[key] as T : fallback);
  const set = useCallback((action: SetStateAction<T | undefined>) => journey.set(key, action, fallback), [journey, key, fallback]);
  return [value, set];
}

function download(contents: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'little-goods-journey-backup.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [journey] = useState(() => new Journey());
  const [generation, setGeneration] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const startButton = useRef<HTMLButtonElement>(null);
  useSyncExternalStore(journey.subscribe, journey.snapshot);
  useEffect(() => {
    let disposed = false;
    let release: (() => void) | undefined;
    const block = (message: string) => {
      if (disposed) return;
      journey.ready = true;
      journey.blocked = true;
      journey.error = message;
      journey.changed();
    };
    // Hold one writer lock for the document lifetime. Comparing localStorage
    // alone cannot prevent two tabs from both passing a read-before-write check.
    if (navigator.locks) {
      void navigator.locks.request(saveKey, { ifAvailable: true }, async (lock) => {
        if (disposed) return;
        if (!lock) { block('Another tab is using this journey. Continue there, or close it and reload this tab to resume.'); return; }
        journey.load();
        await new Promise<void>((resolve) => { release = resolve; });
      }).catch(() => block('The browser could not open your saved journey safely. Close other game tabs and reload in Chrome or Edge.'));
    } else block('This browser cannot safely save the journey. Open the game in Chrome or Edge.');
    return () => { disposed = true; journey.readOnly = true; release?.(); };
  }, [journey]);
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (!journey.readOnly && (event.key === saveKey || event.key === null) && event.newValue !== journey.raw) {
        journey.error = 'Another tab changed the saved journey. Download your current work, then reload to resume that save.';
        journey.changed();
      }
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, [journey]);
  return <JourneyContext.Provider value={journey}>
    <aside className="offline-banner" aria-label="Saved journey">
      <span>{!journey.ready ? 'Opening saved journey...' : journey.error ? 'Saving needs attention' : 'Progress saves automatically in this browser.'}</span>
      <button ref={startButton} className="text-button" disabled={journey.readOnly} onClick={() => setConfirming(true)}>Start over</button>
      {journey.error && <div role="alert"><p>{journey.error}</p>
        {(!journey.blocked || journey.raw !== null) && <button onClick={() => download(journey.blocked ? journey.raw! : journey.encode())}>Download journey backup</button>}
        {!journey.blocked && <button onClick={() => { journey.save(); journey.changed(); }}>Retry saving</button>}
      </div>}
      {confirming && <div role="alertdialog" aria-label="Start a new journey"><p>Delete this browser's saved code, experiments, and mission progress and start a clean mission? This cannot be undone.</p>
        <button autoFocus onClick={() => { setConfirming(false); startButton.current?.focus(); }}>Keep my journey</button>
        <button onClick={() => {
          if (!journey.clear()) return;
          setConfirming(false);
          setGeneration((value) => value + 1);
        }}>Delete journey and start over</button>
      </div>}
    </aside>
    {journey.ready && !journey.blocked && <div key={generation}>{children}</div>}
  </JourneyContext.Provider>;
}
