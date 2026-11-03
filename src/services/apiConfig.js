/**
 * apiConfig.js
 * Konfigurationsdatei für die API-Integration
 */


// Überprüfen, ob wir auf einem Mobilgerät sind oder in einer Produktionsumgebung
//const isMobileOrProduction = typeof window !== 'undefined' && 
//  (/iPhone|iPad|iPod|Android/i.test(navigator?.userAgent) || 
//   window.location.hostname !== 'localhost');

// API-Basis-URL
// Für lokale Entwicklung: 'http://localhost:3001/api'
// Für Produktionsumgebung: 'https://one.madmoench.de/api'
// Relativ: nginx (Produktion) bzw. Vite-Proxy (Entwicklung) leiten /api an den API-Server weiter
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
//export const API_BASE_URL = isMobileOrProduction 
//  ? 'https://one.madmoench.de/api' 
//  : 'http://localhost:3001/api';

