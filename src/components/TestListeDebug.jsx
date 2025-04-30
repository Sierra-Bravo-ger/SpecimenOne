/**
 * Debug-Wrapper für den normalen TestListe-Komponenten.
 * Fügt Logging und Fehlerbehandlung hinzu.
 */
import React, { useState, useCallback, memo } from 'react';
import TestListe from './TestListe';

// Debug-Wrapper-Komponente für bessere Fehleranalyse
const TestListeDebug = ({ 
  tests, 
  onTestClick, 
  selectedTests, 
  onTestSelect,
  sortOption = 'id',
  sortDirection = 'asc'
}) => {
  // Sicherstellen, dass selectedTests immer ein Array ist
  const safeSelectedTests = selectedTests || [];
  
  // State für lokale Zwischenspeicherung - hilft Zyklen zu identifizieren
  const [lastSelectedTests, setLastSelectedTests] = useState(safeSelectedTests);
    // Wrapped onTestSelect-Funktion mit umfangreichem Logging
  const handleTestSelect = useCallback((newSelectedTests) => {
    console.group('TestListeDebug: handleTestSelect');
    console.log('Vorheriger Zustand:', safeSelectedTests);
    console.log('Neuer Zustand:', newSelectedTests);
    
    // Tiefe Kopie erstellen, um Referenzprobleme zu vermeiden
    const safeNewTests = Array.isArray(newSelectedTests) ? 
      JSON.parse(JSON.stringify(newSelectedTests)) : [];
    
    // Überprüfen auf Veränderung (tiefe Gleichheit für Objekte)
    const hasChanged = 
      safeSelectedTests.length !== safeNewTests.length || 
      safeSelectedTests.some((test, i) => {
        return test.id !== (safeNewTests[i] || {}).id;
      });
    
    if (!hasChanged) {
      console.log('Keine Änderung erkannt, ignoriere Update');
      console.groupEnd();
      return;
    }
    
    // Änderungen im Detail protokollieren
    if (safeNewTests.length > safeSelectedTests.length) {
      const added = safeNewTests.filter(
        test => !safeSelectedTests.some(t => t.id === test.id)
      );
      console.log('Hinzugefügte Tests:', added);
    } else {
      const removed = safeSelectedTests.filter(
        test => !safeNewTests.some(t => t.id === test.id)
      );
      console.log('Entfernte Tests:', removed);
    }
    
    // Lokalen State für Vergleichszwecke aktualisieren
    // Wichtig: Dies muss BEVOR wir den Parent-State aktualisieren geschehen
    setLastSelectedTests(safeNewTests);
    
    // Prüfe Konsistenz mit dem Parent-State
    if (onTestSelect) {
      try {
        // Die tiefe Kopie an den Parent übergeben
        onTestSelect(safeNewTests);
        console.log('onTestSelect erfolgreich aufgerufen mit:', safeNewTests);
      } catch (error) {
        console.error('Fehler beim Aufruf von onTestSelect:', error);
      }
    } else {
      console.warn('onTestSelect ist nicht definiert');
    }
      // Nach dem Update einen Timeout setzen, um zu prüfen ob die Aktualisierung erfolgreich war
    setTimeout(() => {
      if (selectedTests) {
        console.log('selectedTests nach Aktualisierung:', selectedTests);
        
        // Prüfen ob die Aktualisierung tatsächlich erfolgte
        const updateSuccessful = 
          selectedTests.length === safeNewTests.length &&
          safeNewTests.every((test) => 
            selectedTests.some(t => t.id === test.id)
          );
        
        if (!updateSuccessful) {
          console.warn('Aktualisierung wurde möglicherweise nicht übernommen!');
          console.warn('Erwartete Tests:', safeNewTests);
          console.warn('Tatsächliche Tests:', selectedTests);
          
          // Bei Fehler nochmals aktualisieren
          if (onTestSelect) {
            console.info('Versuche erneut zu aktualisieren...');
            onTestSelect([...safeNewTests]); // Neue Kopie erstellen
          }
        } else {
          console.log('Update wurde erfolgreich angewendet!');
        }
      }
    }, 100);
    
    console.groupEnd();
  }, [safeSelectedTests, onTestSelect, selectedTests]);
  
  // ErrorBoundary-ähnliches Verhalten für den TestClick-Handler
  const handleTestClick = useCallback((test) => {
    console.log('TestListeDebug: handleTestClick', test);
    try {
      onTestClick(test);
    } catch (error) {
      console.error('Fehler beim Öffnen des Test-Details:', error);
    }
  }, [onTestClick]);
    // Verwenden des lokalen States für die Darstellung
  // Dies sorgt für konsistente UI, auch wenn der Parent-State
  // nicht sofort aktualisiert wird
  const localSelectedTests = lastSelectedTests.length > 0 ? lastSelectedTests : safeSelectedTests;

  // Die Komponente mit verbesserten Event-Handlern rendern
  return (
    <TestListe 
      tests={tests}
      onTestClick={handleTestClick}
      selectedTests={localSelectedTests}
      onTestSelect={handleTestSelect}
      sortOption={sortOption}
      sortDirection={sortDirection}
    />
  );
};

export default memo(TestListeDebug);
