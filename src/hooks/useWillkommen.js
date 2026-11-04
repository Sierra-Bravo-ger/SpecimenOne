/**
 * useWillkommen.js
 * Merkt in localStorage, ob der Willkommenshinweis für Erstbesucher ausgeblendet wurde.
 */
import { useCallback, useState } from 'react';

export const WILLKOMMEN_KEY = 'specimenOne.willkommenAusgeblendet';

function istAusgeblendet() {
  try {
    return localStorage.getItem(WILLKOMMEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function useWillkommen() {
  const [sichtbar, setSichtbar] = useState(() => !istAusgeblendet());

  const ausblenden = useCallback(() => {
    setSichtbar(false);
    try { localStorage.setItem(WILLKOMMEN_KEY, '1'); } catch { /* Speicher gesperrt: nur für diese Sitzung */ }
  }, []);

  const einblenden = useCallback(() => {
    setSichtbar(true);
    try { localStorage.removeItem(WILLKOMMEN_KEY); } catch { /* s.o. */ }
  }, []);

  return { sichtbar, ausblenden, einblenden };
}
