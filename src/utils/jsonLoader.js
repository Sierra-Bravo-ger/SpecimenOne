/**
 * utils/jsonLoader.js
 * Dienstprogramm zum Laden von JSON/JSONL-Dateien
 */

/**
 * Lädt JSON-Daten von einer URL und unterstützt sowohl JSON als auch JSONL-Format.
 * @param {string} url - Die URL der zu ladenden JSON/JSONL-Datei
 * @returns {Promise<Array>} Ein Array mit den geladenen Objekten
 */
export async function loadJsonData(url) {
  try {
    // Datei als Text laden, um das Format zu erkennen
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Fehler! Status: ${response.status}`);
    }
    
    const text = await response.text();
    
    // Leere Antwort früh erkennen
    if (!text || text.trim() === '') {
      console.warn('Die geladene Datei ist leer');
      return [];
    }
    
    // Kommentarzeilen entfernen (beginnen mit //)
    const cleanedText = text.split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n');
    
    // Versuchen, als Standard-JSON zu parsen
    try {
      return JSON.parse(cleanedText);
    } catch (jsonError) {
      console.info('Konnte nicht als Standard-JSON parsen, versuche JSONL-Format...');
      
      // Als JSONL (eine JSON-Zeile pro Zeile) parsen
      try {
        const jsonlObjects = [];
        const lines = cleanedText.split('\n');
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine && trimmedLine !== '') {
            try {
              jsonlObjects.push(JSON.parse(trimmedLine));
            } catch (lineError) {
              console.warn(`Konnte Zeile nicht parsen: ${trimmedLine.substring(0, 50)}...`);
              // Fehlerhafte Zeilen ignorieren, aber fortfahren
            }
          }
        }
        
        if (jsonlObjects.length > 0) {
          console.info(`JSONL erfolgreich geparst: ${jsonlObjects.length} Objekte geladen`);
          return jsonlObjects;
        } else {
          throw new Error('Keine gültigen JSON-Objekte in der JSONL-Datei gefunden');
        }
      } catch (jsonlError) {
        // Beide Parsing-Versuche sind fehlgeschlagen
        console.error('Konnte weder als JSON noch als JSONL parsen:', jsonError);
        throw new Error(`Ungültiges Dateiformat: ${jsonError.message}`);
      }
    }
  } catch (error) {
    console.error('Fehler beim Laden der Daten:', error);
    throw error;
  }
}
