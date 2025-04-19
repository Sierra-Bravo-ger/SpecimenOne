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
  
  return (
    <div className="test-liste-container">      
      {tests.length === 0 ? (
        <p className="keine-tests">Keine Tests gefunden.</p>
      ) : (
        <div className="tests-grid">
          {tests.map(test => (
            <div 
              key={test.id} 
              className="test-karte md-elevation-2"
              onClick={() => handleTestClick(test)}
            >
              <md-ripple></md-ripple>
              <h3>{test.name}</h3>
              <p className="kategorie">{test.kategorie}</p>
              <div className="test-karte-material">
                <strong>Material:</strong> {test.material.join(', ')}
              </div>
              {test.synonyme.length > 0 && (
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