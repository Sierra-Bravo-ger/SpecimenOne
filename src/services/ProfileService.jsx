/**
 * ProfileService.api.jsx
 * Service für Profile-Daten
 * Implementiert für die Verwendung mit PostgreSQL über die API
 */

import { useState, useEffect } from 'react';
import { profileApi } from './apiClient';

/**
 * Hook für Profile-Funktionalitäten
 * @returns {Object} - Profile und zugehörige Funktionen
 */
export const useProfileService = () => {
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  // Funktion zum Laden der Profile
  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const response = await profileApi.getAll();
      setProfiles(response.profile);
      
      // Kategorien extrahieren, wenn noch nicht geladen
      if (categories.length === 0) {
        const uniqueCategories = [...new Set(response.profile.map(profile => profile.kategorie))].filter(Boolean);
        setCategories(['Alle', ...uniqueCategories.sort()]);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Profile:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial-Ladung der Profile
  useEffect(() => {
    loadProfiles();
  }, []);

  /**
   * Holt ein Profil anhand seiner ID
   * @param {string} id - Die Profil-ID
   * @returns {Object|null} - Das Profil oder null, wenn nicht gefunden
   */
  const getProfileById = (id) => {
    return profiles.find(profile => profile.id === id) || null;
  };

  /**
   * Filtert Profile nach Kategorie
   * @param {string} kategorie - Die Kategorie
   * @returns {Array} - Gefilterte Profile
   */
  const getProfilesByCategory = (kategorie) => {
    if (!kategorie || kategorie === 'Alle') return profiles;
    return profiles.filter(profile => profile.kategorie === kategorie);
  };

  /**
   * Extrahiert alle Tests aus einem Profil
   * @param {string} profileId - Die Profil-ID
   * @returns {Array} - Array von Test-IDs
   */
  const getTestsFromProfile = (profileId) => {
    const profile = getProfileById(profileId);
    if (!profile || !profile.tests) return [];
    
    // String zu Array konvertieren, wenn nötig
    if (typeof profile.tests === 'string') {
      return profile.tests.split('|');
    }
    
    return profile.tests;
  };

  /**
   * Sucht Profile anhand eines Suchbegriffs (clientseitig)
   * @param {string} query - Suchbegriff
   * @returns {Array} - Gefilterte Profile
   */
  const searchProfiles = (query) => {
    if (!query) return profiles;
    
    const normalizedQuery = query.toLowerCase();
    return profiles.filter(profile => 
      profile.name?.toLowerCase().includes(normalizedQuery) || 
      profile.beschreibung?.toLowerCase().includes(normalizedQuery) ||
      profile.id?.toLowerCase().includes(normalizedQuery)
    );
  };

  /**
   * Erstellt ein neues persönliches Profil (wäre eine POST-Anfrage an die API)
   * @param {Object} profileData - Profil-Daten
   * @returns {Promise<Object>} - Das erstellte Profil
   */
  const createPersonalProfile = async (profileData) => {
    try {
      // Hier müsste eine echte API-Anfrage erfolgen
      // Da wir noch keinen Endpoint dafür haben, simulieren wir es
      console.log('Persönliches Profil erstellen:', profileData);
      
      // Simulieren einer erfolgreichen Erstellung
      const newProfile = {
        id: `P${Math.floor(Math.random() * 10000)}`,
        ...profileData,
        aktiv: true,
        kategorie: 'Persönlich'
      };
      
      // Lokalen State aktualisieren
      setProfiles(prevProfiles => [...prevProfiles, newProfile]);
      
      return newProfile;
    } catch (err) {
      console.error('Fehler beim Erstellen des Profils:', err);
      throw err;
    }
  };

  return {
    profiles,
    isLoading,
    error,
    categories,
    loadProfiles,
    getProfileById,
    getProfilesByCategory,
    getTestsFromProfile,
    searchProfiles,
    createPersonalProfile
  };
};

export default useProfileService;
