/**
 * API Client für die Kommunikation mit dem Backend-Server
 */

import { API_BASE_URL, API_MODE, ENABLE_FALLBACK } from './apiConfig';
import { loadJsonData } from '../utils/jsonLoader';

/**
 * Generischer Fetch-Wrapper mit Fehlerbehandlung und Fallback
 * @param {string} endpoint - API-Endpunkt
 * @param {Object} options - Fetch-Optionen
 * @returns {Promise<any>} - Geparste API-Antwort
 */
export async function fetchFromApi(endpoint, options = {}) {
  // Wenn API-Modus nicht aktiv ist, direkt zum Fallback
  if (!API_MODE) {
    return fetchFromJsonFiles(endpoint);
  }

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
      // Wenn Fallback aktiviert und verfügbar ist
    if (ENABLE_FALLBACK) {
      console.warn(`Versuche Fallback für ${endpoint}...`);
      
      try {
        return await fetchFromJsonFiles(endpoint);
      } catch (fallbackError) {
        console.error('Fallback fehlgeschlagen:', fallbackError);
        
        // Notfall-Daten für kritische Endpunkte
        if (endpoint === '/tests' || endpoint.startsWith('/tests/')) {
          console.warn('Verwende Notfall-Testdaten');
          return endpoint.includes('/') ? 
            { id: "T0001", name: "Offline-Modus aktiv", kategorie: "System" } : 
            [{ id: "T0001", name: "Offline-Modus aktiv", kategorie: "System" }];
        }
        
        if (endpoint === '/profile') {
          console.warn('Verwende Notfall-Profildaten');
          return { profile: [{ id: "P0001", name: "Offline-Modus" }], pagination: { totalCount: 1 } };
        }
      }
    }
    
    throw error;
  }
}

/**
 * Fallback-Methode zum Laden von JSON-Dateien
 * @param {string} endpoint - API-Endpunkt (wird für Mapping auf JSON-Datei verwendet)
 * @returns {Promise<any>} - Geparste JSON-Daten
 */
async function fetchFromJsonFiles(endpoint) {
  console.log(`Fallback: Lade Daten aus JSON-Dateien für ${endpoint}`);
  
  // Endpunkt-zu-Datei-Mapping
  const endpointMap = {
    '/material': '/material.json',
    '/einheiten': '/einheiten.json',
    '/tests': '/tests.json',
    '/profile': '/profile.json',
    '/farben': '/farben.json'
  };
  
  // Wenn ein Test-Detail angefragt wird
  if (endpoint.startsWith('/tests/')) {
    const testId = endpoint.split('/').pop();
    const testsData = await loadJsonData('/tests.json');
    const test = testsData.find(t => t.id === testId);
    
    if (!test) {
      throw new Error(`Test mit ID ${testId} nicht gefunden`);
    }
    
    // Referenzwerte aus referenzwerte.json laden und filtern
    const refWerte = await loadJsonData('/referenzwerte.json');
    const testRefWerte = refWerte.filter(r => r.test_id === testId);
    
    return {
      ...test,
      referenzwerte: testRefWerte
    };
  }
  
  // Für alle anderen Endpunkte die passende JSON-Datei laden
  const jsonFile = endpointMap[endpoint.split('?')[0]];
  
  if (!jsonFile) {
    throw new Error(`Kein Fallback für Endpunkt ${endpoint} verfügbar`);
  }
  
  const data = await loadJsonData(jsonFile);
  
  // Für Tests-Endpunkt Pagination simulieren
  if (endpoint.startsWith('/tests')) {
    // Parameter aus Endpoint extrahieren falls vorhanden
    const urlParams = new URLSearchParams(endpoint.includes('?') ? endpoint.split('?')[1] : '');
    const page = parseInt(urlParams.get('page') || '1');
    const limit = parseInt(urlParams.get('limit') || '50');
    const search = urlParams.get('search') || '';
    
    // Suche anwenden wenn vorhanden
    let filteredData = data;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = data.filter(t => 
        t.name?.toLowerCase().includes(searchLower) || 
        t.id?.toLowerCase().includes(searchLower) ||
        t.synonyme?.some(s => s.toLowerCase().includes(searchLower))
      );
    }
    
    // Paginierung anwenden
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    return {
      tests: paginatedData,
      pagination: {
        page,
        limit,
        totalCount: filteredData.length,
        totalPages: Math.ceil(filteredData.length / limit)
      }
    };
  }
  
  // Default Format je nach Endpunkt
  if (endpoint === '/material') {
    return { materialien: data };
  } else if (endpoint === '/einheiten') {
    return { einheiten: data };
  } else if (endpoint === '/profile') {
    return { profile: data };
  } else if (endpoint === '/farben') {
    return { farben: data };
  }
  
  // Fallback: Daten direkt zurückgeben
  return data;
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
