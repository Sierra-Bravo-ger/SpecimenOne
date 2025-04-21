import React, { useState } from 'react'
import './TestListe.css'
import TestCheckbox from './TestCheckbox'
import '@material/web/ripple/ripple.js'
import '@material/web/elevation/elevation.js'
import * as MaterialDesign from "react-icons/md"

function TestListe({ tests, onTestClick, selectedTests = [], onTestSelect = () => {} }) {
  const [selectedTest, setSelectedTest] = useState(null)

  const handleTestClick = (test, e) => {
    // Wenn kein Element mit den angegebenen Klassen geklickt wurde, 
    // dann ist es wahrscheinlich die Checkbox oder ein anderes UI-Element
    if (e && (e.target.closest('.test-checkbox') || e.target.classList.contains('test-cb-label'))) {
      return;
    }
    onTestClick(test);
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
    // Beim Long-Press immer auswählen, unabhängig vom aktuellen Zustand
    if (!isTestSelected(test)) {
      onTestSelect([...selectedTests, test]);
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
  });  return (
    <div className="test-liste-container">
      {tests.length === 0 ? (
        <p className="keine-tests">Keine Tests gefunden.</p>
      ) : (
        <div className="tests-grid">
          {sortedTests.map(test => (
            <div 
              key={test.id} 
              className={`test-karte md-elevation-2 ${isTestSelected(test) ? 'selected' : ''}`}
              onClick={(e) => handleTestClick(test, e)}
            >
              <TestCheckbox 
                test={test} 
                isSelected={isTestSelected(test)} 
                onToggle={toggleTestSelection}
                onLongPress={handleLongPress}
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
                <strong>Material:</strong> {test.material ? test.material.join(', ') : 'Keine Angabe'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TestListe;