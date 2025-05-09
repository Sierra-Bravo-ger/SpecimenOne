/**
 * EinheitenService.jsx
 * Service für Einheiten-Daten
 * Aktualisiert für die Verwendung mit PostgreSQL über die API
 */

import { useState, useEffect } from 'react';
import { einheitenApi } from './apiClient';

/**
 * Hook für Einheiten-Funktionalitäten
 * @returns {Object} - Einheiten und zugehörige Funktionen
 */
export const useEinheitenService = () => {
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
   * Holt die Einheit zu einer Einheit-ID
   * @param {string} einheitId - Die Einheit-ID
   * @returns {Object|null} - Die Einheit oder null, wenn nicht gefunden
   */
  const getEinheit = (einheitId) => {
    return window.einheitenCache?.[einheitId] || null;
  };

  /**
   * Formatiert eine Einheit für die Anzeige
   * @param {string} einheitId - Die Einheit-ID
   * @returns {string} - Formatierte Darstellung
   */
  const formatEinheit = (einheitId) => {
    const einheit = window.einheitenCache?.[einheitId];
    if (!einheit) return einheitId;
    
    return einheit.bezeichnung || einheit.si_einheit || einheitId;
  };

  return {
    isLoading,
    error,
    getEinheit,
    formatEinheit
  };
};

export default useEinheitenService;
