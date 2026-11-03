// Debug-Ausgaben nur im Entwicklungsmodus (vite dev); im Produktions-Build ein No-Op.
export function debugLog(...args) {
  if (import.meta.env.DEV) console.log(...args);
}
