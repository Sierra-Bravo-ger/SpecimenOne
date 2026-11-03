/**
 * TestsService.jsx
 * Service für Tests-Daten
 * Implementiert für die Verwendung mit PostgreSQL über die API
 */

import { useState, useEffect } from 'react';
import { testsApi } from './apiClient';
import { debugLog } from '../utils/debug';

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
    debugLog('TestsService.loadTests aufgerufen mit:', params);
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
    debugLog('TestsService: Initial-Ladung der Tests wird ausgeführt');
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
    debugLog('TestsService: Lade ALLE Tests für Visualisierungen');
    setIsLoading(true);
    
    try {
      // Seitenweise mit dem API-Maximum (2000 pro Seite) laden, bis alle Tests da sind
      const API_MAX_LIMIT = 2000;
      let response = await testsApi.getAll({ limit: API_MAX_LIMIT, page: 1 });
      const allTests = [...response.tests];
      const totalPages = response.pagination?.totalPages || 1;
      for (let page = 2; page <= totalPages; page++) {
        response = await testsApi.getAll({ limit: API_MAX_LIMIT, page });
        allTests.push(...response.tests);
      }
      response = { ...response, tests: allTests };
      debugLog(`TestsService: ${response.tests.length} Tests auf einmal geladen`);
      
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
