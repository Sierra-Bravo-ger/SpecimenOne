import React, { useState } from 'react'
import './TestListe.css'
import TestCheckbox from './TestCheckbox'
import '@material/web/ripple/ripple.js'
import '@material/web/elevation/elevation.js'
import * as MaterialDesign from "react-icons/md"
import { useMaterialService } from '../services/MaterialService'
import MaterialBadge from './MaterialBadge'

function TestListe({ 
  tests, 
  onTestClick, 
  selectedTests, 
  onTestSelect = () => {},
  sortOption = 'id',
  sortDirection = 'asc'
}) {
  // Sicherstellen, dass selectedTests immer ein Array ist
  const safeSelectedTests = selectedTests || [];
  const [selectedTest, setSelectedTest] = useState(null);
  const [activeTest, setActiveTest] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const { convertMaterialIdsToNames, isLoading: materialsLoading } = useMaterialService();
  
  // Konvertiere ms in Sekunden für CSS-Variable
  const longPressDuration = 600; // ms
  
  // Standard Click-Handler für Desktop-Nutzung und zur Anzeige der Details
  const handleTestClick = (test, e) => {
    // Wenn auf die Checkbox oder deren Label geklickt wurde, nichts tun
    if (e && (e.target.closest('.test-checkbox') || e.target.classList.contains('test-cb-label') || 
              e.target.classList.contains('test-cb-input'))) {
      return;
    }

    // Prüfen, ob es sich um ein Touch-Gerät handelt
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Wenn Long-Press aktiv war, keinen Test öffnen (nur für Touch-Geräte)
    if (isTouchDevice && isLongPress) {
      setIsLongPress(false);
      return;
    }

    // Test-Details öffnen (für Desktop oder einfachen Touch)
    onTestClick(test);
  };
  
  // Moderner Pointer-Down Handler (statt touchStart)
  const handlePointerDown = (test, e) => {
    // Ignorieren bei Checkbox-Interaktionen
    if (e.target.closest('.test-checkbox') || e.target.classList.contains('test-cb-label') || 
        e.target.classList.contains('test-cb-input')) {
      return;
    }
    
    // Long-Press nur bei Touch aktivieren, nicht bei Maus
    if (e.pointerType === 'touch') {
      setActiveTest(test);

      // Timer für Long-Press starten
      const timer = setTimeout(() => {
        toggleTestSelection(test);
        setIsLongPress(true);
        
        // Haptisches Feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, longPressDuration);
      
      setLongPressTimer(timer);
    }
  };

  // Pointer-Up Handler (statt touchEnd)
  const handlePointerUp = (e) => {
    // Timer löschen
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Nach einer Weile den Long-Press-Status zurücksetzen
    if (isLongPress) {
      setTimeout(() => {
        setIsLongPress(false);
      }, 300);
    }
    
    setActiveTest(null);
  };

  // Pointer-Cancel Handler (z.B. bei Scroll)
  const handlePointerCancel = () => {
    // Timer löschen
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    setActiveTest(null);
  };
    // Prüfen, ob ein Test ausgewählt ist
  const isTestSelected = (test) => {
    return safeSelectedTests.some(selectedTest => selectedTest.id === test.id);
  };

  // Test-Auswahl umschalten
  const toggleTestSelection = (test) => {
    if (isTestSelected(test)) {
      // Test entfernen, wenn bereits ausgewählt
      onTestSelect(safeSelectedTests.filter(t => t.id !== test.id));
    } else {
      // Test hinzufügen, wenn nicht ausgewählt
      onTestSelect([...safeSelectedTests, test]);
    }
  };
  // Flexibel sortieren basierend auf den übergebenen Sortieroptionen
  const sortedTests = [...tests].sort((a, b) => {
    let comparison = 0;
    
    switch (sortOption) {
      case 'name':
        // Nach Namen sortieren
        comparison = (a.name || '').localeCompare(b.name || '');
        break;
      case 'kategorie':
        // Nach Kategorie sortieren, dann nach Namen
        comparison = (a.kategorie || '').localeCompare(b.kategorie || '');
        if (comparison === 0) {
          comparison = (a.name || '').localeCompare(b.name || '');
        }
        break;
      case 'material':
        // Nach dem ersten Material sortieren (falls vorhanden), dann nach Namen
        const aMaterial = a.material && a.material.length > 0 ? a.material[0] : '';
        const bMaterial = b.material && b.material.length > 0 ? b.material[0] : '';
        comparison = aMaterial.localeCompare(bMaterial);
        if (comparison === 0) {
          comparison = (a.name || '').localeCompare(b.name || '');
        }
        break;
      case 'id':
      default:
        // Nach ID sortieren (Standard)
        comparison = a.id.localeCompare(b.id);
        break;
    }
    
    // Sortierrichtung anwenden (aufsteigend oder absteigend)
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  return (
    <div className="test-liste-container">      {tests.length === 0 ? (
        <p className="keine-tests">Keine Tests gefunden.</p>
      ) : (
        <div className="tests-grid">
          {sortedTests.map(test => (
            <div 
              key={test.id} 
              className={`test-karte md-elevation-2 ${isTestSelected(test) ? 'selected' : ''} ${activeTest?.id === test.id ? 'touch-active' : ''}`}
              onClick={(e) => handleTestClick(test, e)}
              onPointerDown={(e) => handlePointerDown(test, e)}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              style={{"--long-press-duration": `${longPressDuration/1000}s`}}
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
              </p>              <div className="test-karte-material">
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
              {test.synonyme && test.synonyme.length > 0 && (
                <div className="test-karte-synonyme">
                  <span className="synonyme-text">{test.synonyme.join(', ')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TestListe;