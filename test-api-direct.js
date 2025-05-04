// Debug-File zur Überprüfung der API-Verbindung
// Dieses Script testet direkt die API-Verbindung

// API-Endpunkte
const API_BASE_URL = 'http://localhost:3001/api';
const TEST_ENDPOINTS = [
  '/health',
  '/tests?limit=10',
  '/tests/T0041',
  '/material',
  '/einheiten',
  '/profiles'
];

// Logge Header
console.log('=== API-Verbindungstest ===');
console.log(`Testzeit: ${new Date().toISOString()}`);
console.log(`Base URL: ${API_BASE_URL}`);
console.log('-------------------------');

// Teste alle Endpoints
async function testEndpoints() {
  for (const endpoint of TEST_ENDPOINTS) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Teste: ${url}`);
    
    try {
      const startTime = performance.now();
      const response = await fetch(url);
      const endTime = performance.now();
      const timeMs = (endTime - startTime).toFixed(2);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✓ Status: ${response.status}, Zeit: ${timeMs}ms`);
        
        // Zeige Datensatzanzahl an, wenn vorhanden
        if (data.tests) console.log(`  Tests: ${data.tests.length}`);
        if (data.profile) console.log(`  Profile: ${data.profile.length}`);
        if (data.materialien) console.log(`  Materialien: ${data.materialien.length}`);
        if (data.einheiten) console.log(`  Einheiten: ${data.einheiten.length}`);
      } else {
        console.log(`✗ Status: ${response.status}, Zeit: ${timeMs}ms`);
      }
    } catch (error) {
      console.log(`✗ Fehler: ${error.message}`);
    }
    
    console.log('-------------------------');
  }
}

// Ausführen
testEndpoints();
