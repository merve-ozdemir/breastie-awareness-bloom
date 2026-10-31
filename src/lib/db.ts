// On-device storage only (IndexedDB). Sessions are written only after Confirm.
import { validateEntry, type Session } from "./schema";

const DB = "breast-check";
const STORE = "sessions";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSession(s: Session): Promise<void> {
  if (!s.confirmed || s.entries.some(e => e.location_unclear)) throw new Error("unconfirmed");
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(s);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listSessions(): Promise<Session[]> {
  const db = await open();
  const all = await new Promise<Session[]>((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as Session[]);
    req.onerror = () => reject(req.error);
  });
  // Normalize legacy bilateral records without rewriting the user's saved data.
  const migrated = all.map(s => ({ ...s, general_note: s.general_note ?? "", entries: s.entries.flatMap(e => {
    const raw = e as unknown as Record<string, unknown>;
    const sides = raw["breast"] === "both" ? ["left", "right"] as const : [e.breast];
    return sides.map(breast => validateEntry({ ...e, mentioned: raw["mentioned"] !== false }, { breast, zone: e.zone }));
  }) }));
  return migrated.sort((a, b) => b.check_date.localeCompare(a.check_date));
}
