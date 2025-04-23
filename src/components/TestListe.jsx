import React, { useState } from 'react'
import './TestListe.css'
import TestCheckbox from './TestCheckbox'
import '@material/web/ripple/ripple.js'
import '@material/web/elevation/elevation.js'
import * as MaterialDesign from "react-icons/md"
import { useMaterialService } from '../services/MaterialService'
import MaterialBadge from './MaterialBadge'

function TestListe({ tests, onTestClick, selectedTests = [], onTestSelect = () => {} }) {
  const [selectedTest, setSelectedTest] = useState(null)
  const [touchStartTime, setTouchStartTime] = useState(0)
  const [touchTimeout, setTouchTimeout] = useState(null)
  const [touchedTestId, setTouchedTestId] = useState(null)
  const longPressDuration = 600 // ms
  const { convertMaterialIdsToNames, isLoading: materialsLoading } = useMaterialService()
  
  const handleTestClick = (test, e) => {
    // Wenn auf die Checkbox oder deren Label geklickt wurde,
    // erlauben wir dem nativen Click-Event durchzugehen und keine weitere Aktion auszuführen
    if (e && (e.target.closest('.test-checkbox') || e.target.classList.contains('test-cb-label') || 
              e.target.classList.contains('test-cb-input'))) {
      return;
    }
    onTestClick(test);
  }
  
  // Long-Press für die gesamte Test-Karte  
  const handleTouchStart = (test, e) => {
    // Wenn auf die Checkbox oder deren Label getippt wurde, lassen wir das native Event durch
    if (e && (e.target.closest('.test-checkbox') || e.target.classList.contains('test-cb-label') || 
              e.target.classList.contains('test-cb-input'))) {
      return; // Keine Aktion, native Touch-Events können durchgehen
    }
    
    // Verhindern der Standard-Kontextmenü-Aktion und damit auch der System-Vibration
    // aber nur, wenn nicht auf die Checkbox getippt wurde
    if (e) {
      e.preventDefault();
    }
    
    setTouchStartTime(Date.now())
    setTouchedTestId(test.id)
    
    const timeout = setTimeout(() => {
      // Long press erkannt
      handleLongPress(test)
    }, longPressDuration)
    
    setTouchTimeout(timeout)
  }
  
  const handleTouchEnd = (e) => {
    // Wenn auf die Checkbox oder deren Label getippt wurde, lassen wir das native Event durch
    if (e && (e.target.closest('.test-checkbox') || e.target.classList.contains('test-cb-label') || 
              e.target.classList.contains('test-cb-input'))) {
      return; // Keine Aktion, native Touch-Events können durchgehen
    }
    
    // Verhindern der Standard-Aktion, aber nur wenn nicht auf die Checkbox getippt wurde
    if (e) {
      e.preventDefault();
    }
    
    if (touchTimeout) {
      clearTimeout(touchTimeout)
      setTouchTimeout(null)
    }
    setTouchedTestId(null)
  }

  // Prüfen, ob ein Test ausgewählt ist
  const isTestSelected = (test) => {
    return selectedTests.some(selectedTest => selectedTest.id === test.id);
  };

  // Test-Auswahl umschalten
  const toggleTestSelection = (test) => {
    if (isTestSelected(test)) {
      // Test entfernen, wenn bereits ausgewählt
      onTestSelect(selectedTests.filter(t => t.id !== test.id));
    } else {
      // Test hinzufügen, wenn nicht ausgewählt
      onTestSelect([...selectedTests, test]);
    }
  };
  
  const handleLongPress = (test) => {
    // Beim Long-Press wird die Auswahl umgeschaltet (toggle)
    if (isTestSelected(test)) {
      // Wenn bereits ausgewählt, Markierung entfernen
      onTestSelect(selectedTests.filter(t => t.id !== test.id));
    } else {
      // Wenn nicht ausgewählt, Markierung hinzufügen
      onTestSelect([...selectedTests, test]);
    }
    
    // Haptisches Feedback auf unterstützten Geräten - für beide Aktionen (Hinzufügen/Entfernen)
    if (navigator.vibrate) {
      navigator.vibrate(50); // 50ms Vibration für sanftes Feedback
    }
  };

  // Sortiere Tests nach sortierNummer (falls vorhanden) oder nach ID als Fallback
  const sortedTests = [...tests].sort((a, b) => {
    // Primär nach sortierNummer sortieren, falls vorhanden
    if (a.sortierNummer !== undefined && b.sortierNummer !== undefined) {
      return a.sortierNummer - b.sortierNummer;
    }
    // Sekundär nach ID sortieren
    return a.id.localeCompare(b.id);
  });
  
  return (
    <div className="test-liste-container">
      {tests.length === 0 ? (
        <p className="keine-tests">Keine Tests gefunden.</p>
      ) : (
        <div className="tests-grid">
          {sortedTests.map(test => (
            <div 
              key={test.id} 
              className={`test-karte md-elevation-2 ${isTestSelected(test) ? 'selected' : ''} ${touchedTestId === test.id ? 'touch-active' : ''}`}
              onClick={(e) => handleTestClick(test, e)}
              onTouchStart={(e) => handleTouchStart(test, e)}
              onTouchEnd={(e) => handleTouchEnd(e)}
              onTouchCancel={(e) => handleTouchEnd(e)}
            >
              <TestCheckbox 
                test={test} 
                isSelected={isTestSelected(test)} 
                onToggle={toggleTestSelection}
              />
              <md-ripple></md-ripple>
              <div className="test-header">
                <h3 className={`test-titel kategorie-text-${test.kategorie ? test.kategorie.toLowerCase().replace(/\s+/g, '-') : 'unknown'}`}>
                  {test.name || 'Kein Name'}
                </h3>
                {/* Sortier-Nummer für Endbenutzer ausgeblendet 
                {test.sortierNummer !== undefined && (
                  <span className="sortier-nummer">{test.sortierNummer}</span>
                )}
                */}
              </div>
              <p className={`kategorie kategorie-${test.kategorie ? test.kategorie.toLowerCase().replace(/\s+/g, '-') : 'unknown'}`}>
                {test.kategorie || 'Keine Kategorie'}
              </p>
              <div className="test-karte-material">
                <strong>Material:</strong>
                {test.material && test.material.length > 0 ? (
                  <div className="material-badges-container">
                    {test.material.map((materialId, index) => (
                      <MaterialBadge key={index} materialId={materialId} mini={true} />
                    ))}
                  </div>
                ) : (
                  <span className="keine-material-info">Keine Angabe</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TestListe;