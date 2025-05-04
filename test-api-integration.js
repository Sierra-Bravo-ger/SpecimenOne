// API-Integration-Tests
// Diese Skripte testen die API-Integration

// API-Konfiguration laden
import { API_MODE, API_BASE_URL, ENABLE_FALLBACK } from './src/services/apiConfig';
import { fetchFromApi } from './src/services/apiClient';

console.log('===== API-INTEGRATION-TESTS =====');
console.log(`API-Modus: ${API_MODE ? 'Aktiv' : 'Inaktiv'}`);
console.log(`API-URL: ${API_BASE_URL}`);
console.log(`Fallback aktiviert: ${ENABLE_FALLBACK ? 'Ja' : 'Nein'}`);
console.log('--------------------------------');

// Tests ausführen
async function runTests() {
  try {
    // Test 1: Health-Check
    console.log('Test 1: Health-Check');
    const health = await fetchFromApi('/health');
    console.log('Ergebnis:', health.status);
    console.log('Test 1: ' + (health.status === 'ok' ? 'BESTANDEN ✓' : 'FEHLGESCHLAGEN ✗'));
    
    // Test 2: Material-Abfrage
    console.log('\nTest 2: Material-Abfrage');
    const material = await fetchFromApi('/material');
    console.log('Anzahl der Materialien:', material.materialien.length);
    console.log('Test 2: ' + (material.materialien.length > 0 ? 'BESTANDEN ✓' : 'FEHLGESCHLAGEN ✗'));
    
    // Test 3: Einheiten-Abfrage
    console.log('\nTest 3: Einheiten-Abfrage');
    const einheiten = await fetchFromApi('/einheiten');
    console.log('Anzahl der Einheiten:', einheiten.einheiten.length);
    console.log('Test 3: ' + (einheiten.einheiten.length > 0 ? 'BESTANDEN ✓' : 'FEHLGESCHLAGEN ✗'));
    
    // Test 4: Tests-Abfrage mit Paginierung
    console.log('\nTest 4: Tests-Abfrage mit Paginierung');
    const tests = await fetchFromApi('/tests?page=1&limit=10');
    console.log('Anzahl der Tests auf Seite 1:', tests.tests.length);
    console.log('Gesamtanzahl Tests:', tests.pagination.totalCount);
    console.log('Test 4: ' + (tests.tests.length > 0 ? 'BESTANDEN ✓' : 'FEHLGESCHLAGEN ✗'));
    
    // Test 5: Tests-Suche
    console.log('\nTest 5: Tests-Suche (nach "glucose")');
    const searchResults = await fetchFromApi('/tests?search=glucose');
    console.log('Anzahl gefundener Tests:', searchResults.tests.length);
    console.log('Test 5: ' + (searchResults.tests.length > 0 ? 'BESTANDEN ✓' : 'FEHLGESCHLAGEN ✗'));
    
    // Test 6: Test-Details
    console.log('\nTest 6: Test-Details abfragen');
    if (tests.tests.length > 0) {
      const testId = tests.tests[0].id;
      console.log(`Details für Test-ID ${testId} abfragen...`);
      const testDetails = await fetchFromApi(`/tests/${testId}`);
      console.log('Name des Tests:', testDetails.name);
      console.log('Anzahl der Referenzwerte:', testDetails.referenzwerte ? testDetails.referenzwerte.length : 0);
      console.log('Test 6: ' + (testDetails.id === testId ? 'BESTANDEN ✓' : 'FEHLGESCHLAGEN ✗'));
    } else {
      console.log('Test 6: ÜBERSPRUNGEN (keine Tests gefunden)');
    }
    
    console.log('\n===== TESTS ABGESCHLOSSEN =====');
  } catch (error) {
    console.error('FEHLER BEI TESTS:', error);
  }
}

runTests();
