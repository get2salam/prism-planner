/*
 * A thin wrapper around localStorage that:
 *   - namespaces keys so the planner can coexist with other apps on file://
 *   - never throws on quota / private-mode failure (returns sensible defaults)
 *   - is injectable via createStorage(backend) so tests can use an in-memory map
 *
 * No global side effects — call createStorage() to bind to a backend.
 */

const NAMESPACE = "prism-planner:v1";

export function createStorage(backend) {
  const key = (k) => `${NAMESPACE}:${k}`;

  return {
    get(k, fallback = null) {
      try {
        const raw = backend.getItem(key(k));
        return raw == null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(k, value) {
      try {
        backend.setItem(key(k), JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    remove(k) {
      try {
        backend.removeItem(key(k));
        return true;
      } catch {
        return false;
      }
    },
  };
}

export function memoryBackend() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
}
