import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

const EVT = "persistentCollection:update";

function emit(key: string) {
  try { window.dispatchEvent(new CustomEvent(EVT, { detail: key })); } catch { /* ignore */ }
}

export function usePersistentCollection<T>(
  key: string,
  seed: T[],
  delayMs = 250,
): [T[], Dispatch<SetStateAction<T[]>>, boolean] {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const skipNextWrite = useRef(false);

  // Hydrate from storage (or seed) once.
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(key);
        setRows(raw ? JSON.parse(raw) : seed);
      } catch {
        setRows(seed);
      }
      setHydrated(true);
      setLoading(false);
    }, delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs, key, seed]);

  // Persist when rows change, then notify others in the same tab.
  useEffect(() => {
    if (!hydrated) return;
    if (skipNextWrite.current) { skipNextWrite.current = false; return; }
    try { window.localStorage.setItem(key, JSON.stringify(rows)); } catch { /* ignore */ }
    emit(key);
  }, [hydrated, key, rows]);

  // Listen for updates from other tabs (storage) AND from same-tab pages (custom event).
  useEffect(() => {
    if (!hydrated) return;
    const reload = () => {
      try {
        const raw = window.localStorage.getItem(key);
        const next = raw ? JSON.parse(raw) : seed;
        skipNextWrite.current = true; // avoid echo
        setRows(next);
      } catch { /* ignore */ }
    };
    const onStorage = (e: StorageEvent) => { if (e.key === key) reload(); };
    const onCustom = (e: Event) => { if ((e as CustomEvent).detail === key) reload(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener(EVT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVT, onCustom);
    };
  }, [hydrated, key, seed]);

  return [rows, setRows, loading];
}
