/**
 * DetailDataContext.jsx
 * Lädt beim Start einmal alle Referenzwerte und Versandinfos (/api/referenzwerte,
 * /api/versandinfos) und stellt sie je Test bereit. Der Service-Worker cacht beide
 * Antworten, dadurch sind die Testdetails auch offline vollständig – auch für Tests,
 * die online nie geöffnet wurden.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../services/apiConfig';
import { groupReferenzwerte, groupVersandinfos, testNrFromId } from '../utils/detailData';

const LEER = [];

// Ohne Provider (z.B. in Komponententests) gilt der Stand „error“:
// TestDetails fällt dann auf /api/tests/:id zurück.
const DetailDataContext = createContext({
  status: 'error',
  getReferenzwerte: () => LEER,
  getVersandinfos: () => LEER,
});

async function fetchJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

export function DetailDataProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', referenzwerte: {}, versandinfos: {} });

  useEffect(() => {
    let aktiv = true;
    Promise.all([fetchJson('/referenzwerte'), fetchJson('/versandinfos')])
      .then(([ref, versand]) => {
        if (!aktiv) return;
        setState({
          status: 'ready',
          referenzwerte: groupReferenzwerte(ref.referenzwerte),
          versandinfos: groupVersandinfos(versand.versandinfos),
        });
      })
      .catch((err) => {
        // Kein console.error: Offline ohne Cache ist ein erwarteter Zustand.
        console.warn('Detaildaten nicht verfügbar, TestDetails lädt einzeln nach:', err.message);
        if (aktiv) setState((s) => ({ ...s, status: 'error' }));
      });
    return () => { aktiv = false; };
  }, []);

  const value = useMemo(() => ({
    status: state.status,
    getReferenzwerte: (testId) => state.referenzwerte[testId] || LEER,
    getVersandinfos: (testId) => state.versandinfos[testNrFromId(testId)] || LEER,
  }), [state]);

  return <DetailDataContext.Provider value={value}>{children}</DetailDataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDetailData = () => useContext(DetailDataContext);
