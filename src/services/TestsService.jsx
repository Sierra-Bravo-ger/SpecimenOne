/**
 * TestsService.jsx
 * Service für Tests-Daten
 * Implementiert für die Verwendung mit PostgreSQL über die API
 */

import { useState, useEffect } from 'react';
import { testsApi } from './apiClient';

/**
 * Hook für Tests-Funktionalitäten
 * @returns {Object} - Tests und zugehörige Funktionen
 */
export const useTestsService = () => {
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0
  });
  /**
   * Lädt Tests mit Paginierung und optionaler Suche
   * @param {Object} params - Parameter für die API-Anfrage
   */
  const loadTests = async (params = {}) => {
    console.log('TestsService.loadTests aufgerufen mit:', params);
    setIsLoading(true);
    try {
      const response = await testsApi.getAll(params);
      setTests(response.tests);
      setPagination(response.pagination);
      
      // Kategorien extrahieren, wenn noch nicht geladen
      if (categories.length === 0) {
        const uniqueCategories = [...new Set(response.tests.map(test => test.kategorie))].filter(Boolean);
        setCategories(['Alle', ...uniqueCategories.sort()]);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Tests:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };  // Initial-Ladung der ersten Seite
  useEffect(() => {
    console.log('TestsService: Initial-Ladung der Tests wird ausgeführt');
    // Wir laden nur initial, wenn keine Tests vorhanden sind
    if (tests.length === 0) {
      loadTests({ page: 1, limit: 50 });
    }
  }, []);

  /**
   * Lädt einen einzelnen Test anhand seiner ID
   * @param {string} id - Die Test-ID
   * @returns {Promise<Object>} - Der Test mit Referenzwerten
   */
  const getTestById = async (id) => {
    try {
      return await testsApi.getById(id);
    } catch (err) {
      console.error(`Fehler beim Laden des Tests ${id}:`, err);
      throw err;
    }
  };
  /**
   * Wechselt zur angegebenen Seite
   * @param {number} page - Seitennummer
   */
  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    loadTests({ ...pagination, page });
  };

  /**
   * Führt eine Suche nach Tests durch
   * @param {string} query - Suchbegriff
   */
  const searchTests = (query) => {
    loadTests({ page: 1, limit: pagination.limit, search: query });
  };

  /**
   * Filtert Tests nach Kategorie (clientseitig)
   * @param {string} category - Kategorie
   * @param {Array} testsList - Tests-Array (optional, verwendet sonst den State)
   * @returns {Array} - Gefilterte Tests
   */
  const filterByCategory = (category, testsList = tests) => {
    if (!category || category === 'Alle') return testsList;
    return testsList.filter(test => test.kategorie === category);
  };

  /**
   * Lädt alle Tests auf einmal (ohne Paginierung) für Visualisierungen
   * @returns {Promise<Array>} - Alle Tests als Array
   */
  const loadAllTestsAtOnce = async () => {
    console.log('TestsService: Lade ALLE Tests für Visualisierungen');
    setIsLoading(true);
    
    try {
      // Direkter Aufruf an API mit hohem Limit
      const response = await testsApi.getAll({ limit: 5000 });
      console.log(`TestsService: ${response.tests.length} Tests auf einmal geladen`);
      
      // Aktualisiere den State
      setTests(response.tests);
      setPagination(response.pagination);
      
      // Kategorien extrahieren, wenn noch nicht geladen
      if (categories.length === 0) {
        const uniqueCategories = [...new Set(response.tests.map(test => test.kategorie))].filter(Boolean);
        setCategories(['Alle', ...uniqueCategories.sort()]);
      }
      
      // Das Ergebnis direkt zurückgeben
      return response.tests;
    } catch (err) {
      console.error('Fehler beim Laden aller Tests:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    tests,
    isLoading,
    error,
    categories,
    pagination,
    loadTests,
    loadAllTestsAtOnce,  // Neue Methode exportieren
    getTestById,
    goToPage,
    searchTests,
    filterByCategory
  };
};

export default useTestsService;
