/**
 * useOnlineStatus.js
 * Erkennt, ob die App gerade ohne Verbindung zum Server läuft.
 *
 * navigator.onLine allein reicht nicht: Bei „Lie-Fi“ oder einem nicht erreichbaren
 * Server meldet der Browser weiterhin „online“. Deshalb zusätzlich eine kurze
 * Erreichbarkeitsprüfung gegen /api/health (vom Service-Worker nicht gecacht, siehe
 * vite.config.js) mit Timeout. Gelingt sie, ist der Cache gerade aufgefrischt worden
 * (StaleWhileRevalidate) und der Zeitpunkt landet in localStorage.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../services/apiConfig';

export const LAST_SYNC_KEY = 'specimenOne.lastOnlineSync';
// Ergebnis der letzten Prüfung ('0' = nicht erreichbar). Damit erscheint das Banner
// beim nächsten Start sofort und nicht erst nach Ablauf des Timeouts.
const REACHABLE_KEY = 'specimenOne.serverReachable';
const PROBE_TIMEOUT_MS = 3000;
const RETRY_OFFLINE_MS = 15000;

function readLastSync() {
  try {
    const v = Number(localStorage.getItem(LAST_SYNC_KEY));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

function readReachable() {
  try {
    return localStorage.getItem(REACHABLE_KEY) !== '0';
  } catch {
    return true;
  }
}

/** Prüft, ob der API-Server antwortet (true/false), ohne Fehler zu werfen. */
export async function probeServer(timeoutMs = PROBE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store', signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @returns {{ offline: boolean, lastSync: number|null }}
 *   offline: Browser offline oder Server nicht erreichbar
 *   lastSync: Zeitpunkt (ms) des letzten erfolgreichen Online-Ladens
 */
export function useOnlineStatus() {
  const [browserOnline, setBrowserOnline] = useState(() => navigator.onLine !== false);
  const [serverReachable, setServerReachable] = useState(readReachable);
  const [lastSync, setLastSync] = useState(readLastSync);
  const laufend = useRef(false);

  const pruefen = useCallback(async () => {
    if (laufend.current) return;
    laufend.current = true;
    const ok = navigator.onLine !== false && await probeServer();
    laufend.current = false;
    setServerReachable(ok);
    try { localStorage.setItem(REACHABLE_KEY, ok ? '1' : '0'); } catch { /* privater Modus */ }
    if (ok) {
      const now = Date.now();
      try { localStorage.setItem(LAST_SYNC_KEY, String(now)); } catch { /* privater Modus */ }
      setLastSync(now);
    }
  }, []);

  useEffect(() => {
    const onOnline = () => { setBrowserOnline(true); pruefen(); };
    const onOffline = () => { setBrowserOnline(false); setServerReachable(false); };
    const onVisible = () => { if (document.visibilityState === 'visible') pruefen(); };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisible);
    pruefen();
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pruefen]);

  const offline = !browserOnline || !serverReachable;

  // Solange offline: regelmäßig erneut prüfen, damit das Banner von selbst verschwindet
  useEffect(() => {
    if (!offline) return undefined;
    const id = setInterval(pruefen, RETRY_OFFLINE_MS);
    return () => clearInterval(id);
  }, [offline, pruefen]);

  return { offline, lastSync };
}
