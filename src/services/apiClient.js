/**
 * API Client für die Kommunikation mit dem Backend-Server
 */

import { API_BASE_URL } from './apiConfig';

/**
 * Generischer Fetch-Wrapper mit Fehlerbehandlung
 * @param {string} endpoint - API-Endpunkt
 * @param {Object} options - Fetch-Optionen
 * @returns {Promise<any>} - Geparste API-Antwort
 */
export async function fetchFromApi(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`API-Anfrage an: ${url}`);
    
    // Erweiterte Debugging-Informationen für Mobilgeräte
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      console.log(`Mobiles Gerät erkannt: ${navigator.userAgent}`);
      console.log(`API-Modus: ${API_MODE}, URL: ${url}`);
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP Fehler! Status: ${response.status}`);
    }

    return await response.json();
  }  catch (error) {
    console.error(`API-Fehler (${endpoint}):`, error);
    
    // Detailliertere Fehlerinformationen für Debugging
    console.error(`Request URL: ${API_BASE_URL}${endpoint}`);
    console.error(`Browser: ${navigator.userAgent}`);
      // Mobile-Alert für Debugging mit detaillierten Informationen
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && !window._hasShownApiErrorAlert) {
      window._hasShownApiErrorAlert = true;
      setTimeout(() => {
        // Führe einen einfachen Verbindungstest durch
        fetch(`${API_BASE_URL}/tests?limit=1`)
          .then(resp => resp.ok ? 'OK' : `Status: ${resp.status}`)
          .catch(err => `Verbindungsfehler: ${err.message}`)
          .then(connStatus => {
            alert(`API-Fehler: ${error.message}\nURL: ${API_BASE_URL}${endpoint}\nVerbindungstest: ${connStatus}\nNavigator: ${navigator.userAgent}\nBitte melden Sie diesen Fehler oder versuchen Sie es später erneut.`);
          });
      }, 1000);
    }
    throw error;
  }
}

/**
 * Material-API-Funktionen
 */
export const materialApi = {
  getAll: () => fetchFromApi('/material'),
  getById: (id) => fetchFromApi(`/material/${id}`)
};

/**
 * Einheiten-API-Funktionen
 */
export const einheitenApi = {
  getAll: () => fetchFromApi('/einheiten'),
  getById: (id) => fetchFromApi(`/einheiten/${id}`)
};

/**
 * Tests-API-Funktionen
 */
export const testsApi = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Parameter für Paginierung und Suche
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    return fetchFromApi(`/tests${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => fetchFromApi(`/tests/${id}`)
};

/**
 * Profile-API-Funktionen
 */
export const profileApi = {
  getAll: () => fetchFromApi('/profile'),
  getById: (id) => fetchFromApi(`/profile/${id}`)
};

/**
 * Farben-API-Funktionen
 */
export const farbenApi = {
  getAll: () => fetchFromApi('/farben'),
  getById: (id) => fetchFromApi(`/farben/${id}`)
};
