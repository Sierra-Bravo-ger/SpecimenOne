/**
 * Hook für das Leistungsverzeichnis
 * Kombiniert die API-Services für eine zentrale Nutzung in Komponenten
 */

import { useState, useCallback } from 'react';
import { useTestsService } from '../services/TestsService';
import { useMaterialService } from '../services/MaterialService.api';
import { useEinheitenService } from '../services/EinheitenService.api';

/**
 * Zentraler Hook für alle Leistungsverzeichnis-Funktionalitäten
 */
export default function useLeistungsverzeichnis() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Services laden
  const testsService = useTestsService();
  const materialService = useMaterialService();
  const einheitenService = useEinheitenService();
  
  // Lädt Tests basierend auf aktuellen Filtern
  const loadFilteredTests = useCallback(() => {
    const params = { 
      search: searchQuery 
    };
    testsService.loadTests(params);
  }, [searchQuery, testsService]);
  
  // Suchanfrage aktualisieren
  const updateSearch = useCallback((query) => {
    setSearchQuery(query);
    testsService.searchTests(query);
  }, [testsService]);
  
  // Kategorie-Filter aktualisieren
  const updateCategoryFilter = useCallback((category) => {
    setSelectedCategory(category);
    loadFilteredTests();
  }, [loadFilteredTests]);
  
  // Diese Funktion lädt einen Test mit allen Details (inkl. Referenzwerten)
  const loadTestDetails = useCallback(async (testId) => {
    try {
      const test = await testsService.getTestById(testId);
      
      // Formatierungen hinzufügen
      if (test) {
        // Material-Bezeichnungen hinzufügen
        if (test.material && Array.isArray(test.material)) {
          test.materialBezeichnungen = materialService.convertMaterialIdsToNames(test.material);
        }
        
        // Einheit-Bezeichnung hinzufügen
        if (test.einheit_id) {
          const einheit = einheitenService.getEinheit(test.einheit_id);
          test.einheitBezeichnung = einheit ? einheit.bezeichnung : test.einheit_id;
        }
        
        // Referenzwerte nach Geschlecht gruppieren
        if (test.referenzwerte && Array.isArray(test.referenzwerte)) {
          test.groupedReferenzwerte = {
            allgemein: test.referenzwerte.filter(r => r.geschlecht === '3000'),
            männlich: test.referenzwerte.filter(r => r.geschlecht === '1000'),
            weiblich: test.referenzwerte.filter(r => r.geschlecht === '2000'),
          };
        }
      }
      
      return test;
    } catch (error) {
      console.error(`Fehler beim Laden der Testdetails (${testId}):`, error);
      throw error;
    }
  }, [testsService, materialService, einheitenService]);
  
  /**
   * Formatiert eine Material-ID zu lesbarem Text
   */
  const formatMaterial = useCallback((materialId) => {
    return materialService.formatMaterialForDisplay(materialId);
  }, [materialService]);

  /**
   * Formatiert eine Einheit-ID zu lesbarem Text
   */
  const formatEinheit = useCallback((einheitId) => {
    return einheitenService.formatEinheit(einheitId);
  }, [einheitenService]);
  
  return {
    // Test-bezogene Funktionen und Status
    tests: testsService.tests,
    testsLoading: testsService.isLoading,
    testsError: testsService.error,
    categories: testsService.categories,
    pagination: testsService.pagination,
    goToPage: testsService.goToPage,
    loadFilteredTests,
    loadTestDetails,
    
    // Suche und Filter
    searchQuery,
    selectedCategory,
    updateSearch,
    updateCategoryFilter,
    
    // Formatierungsfunktionen
    formatMaterial,
    formatEinheit
  };
}
