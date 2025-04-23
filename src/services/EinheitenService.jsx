import React, { createContext, useState, useContext, useEffect } from 'react';

// Erstellen eines React Context für den Einheitenservice
const EinheitenServiceContext = createContext();

/**
 * Provider-Komponente für den EinheitenService
 * Stellt Funktionen zur Verfügung, um Einheiten-Informationen abzurufen
 * 
 * @param {Object} props - Component properties 
 */
export function EinheitenServiceProvider({ children }) {
  const [einheiten, setEinheiten] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Einheiten laden beim ersten Rendern der Komponente
  useEffect(() => {
    const fetchEinheiten = async () => {
      try {
        const response = await fetch('/einheiten.json');
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Einheiten-Daten');
        }
        const data = await response.json();
        setEinheiten(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Fehler im EinheitenService:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchEinheiten();
  }, []);

  /**
   * Sucht eine Einheit anhand ihrer ID
   * @param {string} einheitId - Die ID der gesuchten Einheit
   * @returns {Object|null} Das gefundene Einheiten-Objekt oder null
   */
  const getEinheitById = (einheitId) => {
    if (!einheitId || isLoading) return null;
    return einheiten.find(einheit => einheit.einheit_id === einheitId) || null;
  };

  /**
   * Gibt die Bezeichnung einer Einheit anhand ihrer ID zurück
   * @param {string} einheitId - Die ID der gesuchten Einheit
   * @returns {string} Die Bezeichnung der Einheit oder '?' wenn nicht gefunden
   */
  const getEinheitBezeichnung = (einheitId) => {
    const einheit = getEinheitById(einheitId);
    return einheit ? einheit.bezeichnung : '?';
  };

  /**
   * Gibt die Beschreibung einer Einheit anhand ihrer ID zurück
   * @param {string} einheitId - Die ID der gesuchten Einheit
   * @returns {string} Die Beschreibung der Einheit oder '?' wenn nicht gefunden
   */
  const getEinheitBeschreibung = (einheitId) => {
    const einheit = getEinheitById(einheitId);
    return einheit ? einheit.beschreibung : '?';
  };

  /**
   * Gibt die Kategorie einer Einheit anhand ihrer ID zurück
   * @param {string} einheitId - Die ID der gesuchten Einheit
   * @returns {string} Die Kategorie der Einheit oder '?' wenn nicht gefunden
   */
  const getEinheitKategorie = (einheitId) => {
    const einheit = getEinheitById(einheitId);
    return einheit ? einheit.kategorie : '?';
  };

  /**
   * Konvertiert eine Einheitsbezeichnung in ihre ID
   * @param {string} bezeichnung - Die Bezeichnung der gesuchten Einheit
   * @returns {string|null} Die ID der Einheit oder null wenn nicht gefunden
   */
  const getEinheitIdByBezeichnung = (bezeichnung) => {
    if (!bezeichnung || isLoading) return null;
    const einheit = einheiten.find(einheit => einheit.bezeichnung === bezeichnung);
    return einheit ? einheit.einheit_id : null;
  };

  /**
   * Hilfsfunktion zur Migration: Konvertiert alle Einheitsbezeichnungen in ihrer IDs
   * Kann in Konvertierungsskripten verwendet werden
   * @returns {Object} Ein Mapping von Bezeichnungen zu IDs
   */
  const getAllEinheitenMap = () => {
    if (isLoading) return {};
    return einheiten.reduce((map, einheit) => {
      if (einheit.bezeichnung) {
        map[einheit.bezeichnung] = einheit.einheit_id;
      }
      return map;
    }, {});
  };

  // Context-Werte, die für Konsumenten des Contexts verfügbar sein sollen
  const contextValue = {
    einheiten,
    isLoading,
    error,
    getEinheitById,
    getEinheitBezeichnung,
    getEinheitBeschreibung,
    getEinheitKategorie,
    getEinheitIdByBezeichnung,
    getAllEinheitenMap
  };

  return (
    <EinheitenServiceContext.Provider value={contextValue}>
      {children}
    </EinheitenServiceContext.Provider>
  );
}

/**
 * Custom Hook für den einfachen Zugriff auf den EinheitenService
 * @returns {Object} Die EinheitenService-Funktionen und -Status
 */
export function useEinheitenService() {
  return useContext(EinheitenServiceContext);
}
