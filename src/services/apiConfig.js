/**
 * apiConfig.js
 * Konfigurationsdatei für die API-Integration
 */

// API-Modus aktivieren (true) oder deaktivieren (false)
export const API_MODE = true;

// Überprüfen, ob wir auf einem Mobilgerät sind oder in einer Produktionsumgebung
//const isMobileOrProduction = typeof window !== 'undefined' && 
//  (/iPhone|iPad|iPod|Android/i.test(navigator?.userAgent) || 
//   window.location.hostname !== 'localhost');

// API-Basis-URL
// Für lokale Entwicklung: 'http://localhost:3001/api'
// Für Produktionsumgebung: 'https://one.madmoench.de/api'
export const API_BASE_URL = 'https://one.madmoench.de/api' 
//export const API_BASE_URL = isMobileOrProduction 
//  ? 'https://one.madmoench.de/api' 
//  : 'http://localhost:3001/api';

// Fallback-Modus, falls API nicht erreichbar ist
export const ENABLE_FALLBACK = true;
