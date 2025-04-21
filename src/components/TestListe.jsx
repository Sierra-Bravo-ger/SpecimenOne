import React, { useState } from 'react'
import TestDetails from './TestDetails'
import './TestListe.css'
import '@material/web/ripple/ripple.js'
import '@material/web/elevation/elevation.js'
import * as MaterialDesign from "react-icons/md"

function TestListe({ tests }) {
  const [selectedTest, setSelectedTest] = useState(null)
  // Die Filterung erfolgt jetzt in der App.jsx und die gefilterten Tests werden direkt übergeben

  const handleTestClick = (test) => {
    setSelectedTest(test)
  }

  const handleCloseDetails = () => {
    setSelectedTest(null)
  }
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
              className="test-karte md-elevation-2"
              onClick={() => handleTestClick(test)}
            >              <md-ripple></md-ripple>              <div className="test-header">
                <h3 className={`test-titel kategorie-text-${test.kategorie ? test.kategorie.toLowerCase().replace(/\s+/g, '-') : 'nicht definiert'}`}>
                  {test.name || 'Kein Name'}
                </h3>
                {/* Sortier-Nummer für Endbenutzer ausgeblendet 
                {test.sortierNummer !== undefined && (
                  <span className="sortier-nummer">{test.sortierNummer}</span>
                )}
                */}
              </div>
              <p className={`kategorie kategorie-${test.kategorie ? test.kategorie.toLowerCase().replace(/\s+/g, '-') : 'nicht definiert'}`}>
                {test.kategorie || 'Keine Kategorie'}
              </p>
              <div className="test-karte-material">
                <strong>Material:</strong> {test.material.join(', ')}
              </div>
              {test.synonyme?.length > 0 && (
                <div className="synonyme">
                  <small>{test.synonyme.join(', ')}</small>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedTest && (
        <TestDetails 
          test={selectedTest} 
          onClose={handleCloseDetails} 
        />
      )}
    </div>
  )
}

export default TestListe