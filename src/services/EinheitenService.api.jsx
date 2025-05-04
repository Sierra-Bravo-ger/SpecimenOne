/**
 * EinheitenService.jsx
 * Service für die Einheiten-Funktionalität, der mit der PostgreSQL-API kommuniziert
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { einheitenApi } from './apiClient';

// Context für den EinheitenService
const EinheitenServiceContext = createContext();

/**
 * Provider für den EinheitenService
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Provider component
 */
export const EinheitenServiceProvider = ({ children }) => {
  const einheitenService = useEinheitenServiceInternal();
  return (
    <EinheitenServiceContext.Provider value={einheitenService}>
      {children}
    </EinheitenServiceContext.Provider>
  );
};

/**
 * Hook für die Nutzung des EinheitenService-Context
 * @returns {Object} - EinheitenService-Objekt
 */
export const useEinheitenService = () => {
  const context = useContext(EinheitenServiceContext);
  if (!context) {
    return useEinheitenServiceInternal();
  }
  return context;
};

/**
 * Interner Hook für Einheiten-Funktionalitäten
 * @returns {Object} - Einheiten und zugehörige Funktionen
 */
const useEinheitenServiceInternal = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Einheiten-Cache im Window-Objekt initialisieren
  useEffect(() => {
    const initializeCache = async () => {
      try {
        // Cache nur initialisieren, wenn er noch nicht existiert
        if (!window.einheitenCache) {
          window.einheitenCache = {};
          
          // Einheiten über die API laden
          const data = await einheitenApi.getAll();
          if (data && data.einheiten) {
            console.log('Einheiten-Daten von API geladen:', data.einheiten.length);
            // Cache mit Einheiten-Daten füllen
            data.einheiten.forEach(einheit => {
              window.einheitenCache[einheit.einheit_id] = {
                bezeichnung: einheit.bezeichnung || "",
                si_einheit: einheit.si_einheit || "",
                kategorie: einheit.kategorie || ""
              };
            });
          }
        }
      } catch (err) {
        console.error('Fehler beim Laden der Einheiten:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCache();
  }, []);

  /**
   * Gibt die Einheit zu einer Einheit-ID zurück
   * @param {string} einheitId - Die Einheit-ID
   * @returns {Object|null} - Einheit-Objekt oder null, wenn nicht gefunden
   */
  const getEinheit = (einheitId) => {
    if (!einheitId) return null;
    return window.einheitenCache?.[einheitId] || null;
  };

  /**
   * Formatiert eine Einheit für die Anzeige
   * @param {string} einheitId - Die Einheit-ID
   * @returns {string} - Formatierte Darstellung
   */
  const formatEinheit = (einheitId) => {
    if (!einheitId) return "";
    const einheit = window.einheitenCache?.[einheitId];
    if (!einheit) return einheitId;
    
    return einheit.bezeichnung || einheit.si_einheit || einheitId;
  };

  /**
   * Gibt alle Einheiten als Array zurück
   * @returns {Array} - Array mit allen Einheiten
   */
  const getAllEinheiten = () => {
    return Object.entries(window.einheitenCache || {}).map(([id, einheit]) => ({
      id,
      ...einheit
    }));
  };

  return {
    isLoading,
    error,
    getEinheit,
    formatEinheit,
    getAllEinheiten
  };
};

export default useEinheitenService;
