/**
 * Hook für das Leistungsverzeichnis
 * Kombiniert alle Services für eine zentrale Nutzung in Komponenten
 */

import { useState, useCallback } from 'react';
import { useTestsService } from '../services/TestsService';
import { useProfileService } from '../services/ProfileService.api';
import { useMaterialService } from '../services/MaterialService.api';
import { useEinheitenService } from '../services/EinheitenService.api';

/**
 * Zentraler Hook für alle Leistungsverzeichnis-Funktionalitäten
 */
export default function useLeistungsverzeichnis() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  
  // Services laden
  const testsService = useTestsService();
  const profileService = useProfileService();
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
    // Hier könnte man später eine API-Abfrage mit Kategorie-Filter implementieren
    loadFilteredTests();
  }, [loadFilteredTests]);
  
  // Material-Filter aktualisieren
  const updateMaterialFilter = useCallback((material) => {
    setSelectedMaterial(material);
    // Hier könnte man später eine API-Abfrage mit Material-Filter implementieren
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
  
  // Profile mit Testdetails laden
  const loadProfileWithTests = useCallback(async (profileId) => {
    try {
      const profile = profileService.getProfileById(profileId);
      if (!profile) return null;
      
      // Alle Tests des Profils laden
      const testIds = profileService.getTestsFromProfile(profileId);
      const testPromises = testIds.map(id => testsService.getTestById(id));
      const tests = await Promise.all(testPromises);
      
      return {
        ...profile,
        tests
      };
    } catch (error) {
      console.error(`Fehler beim Laden des Profils (${profileId}):`, error);
      throw error;
    }
  }, [profileService, testsService]);
  
  // Erstellt ein neues persönliches Profil
  const createPersonalProfile = useCallback(async (profileData) => {
    try {
      return await profileService.createPersonalProfile(profileData);
    } catch (error) {
      console.error('Fehler beim Erstellen des persönlichen Profils:', error);
      throw error;
    }
  }, [profileService]);
  
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
    
    // Profil-bezogene Funktionen und Status
    profiles: profileService.profiles,
    profilesLoading: profileService.isLoading,
    profilesError: profileService.error,
    getProfileById: profileService.getProfileById,
    getProfilesByCategory: profileService.getProfilesByCategory,
    loadProfileWithTests,
    createPersonalProfile,
    
    // Suche und Filter
    searchQuery,
    selectedCategory,
    selectedMaterial,
    updateSearch,
    updateCategoryFilter,
    updateMaterialFilter,
    
    // Material-Funktionen
    materialLoading: materialService.isLoading,
    materialError: materialService.error,
    formatMaterial: materialService.formatMaterialForDisplay,
    
    // Einheiten-Funktionen
    einheitenLoading: einheitenService.isLoading,
    einheitenError: einheitenService.error,
    formatEinheit: einheitenService.formatEinheit
  };
}
