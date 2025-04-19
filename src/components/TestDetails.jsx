import React, { useEffect } from 'react'
import './TestDetails.css'
import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/divider/divider.js'
import '@material/web/elevation/elevation.js'
import * as MaterialDesign from "react-icons/md"

function TestDetails({ test, onClose }) {
  // Unterstützung für den Zurück-Button des Browsers
  useEffect(() => {
    // Fügt Zustand zum Browser-Verlauf hinzu
    window.history.pushState({ testDetail: true }, "");
    
    // Event-Handler für den Zurück-Button
    const handlePopState = (event) => {
      onClose();
    };
    
    // Event-Listener registrieren
    window.addEventListener("popstate", handlePopState);
    
    // Aufräumen beim Entfernen der Komponente
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [onClose]);  // Handler für Klicks außerhalb der Karte
  const handleOverlayClick = (event) => {
    // Nur ausführen wenn der Klick direkt auf dem Overlay war, nicht auf seinen Kindern
    if (event.target.className === 'test-details-overlay') {
      onClose();
    }
  };

  return (
    <div className="test-details-overlay" onClick={handleOverlayClick}>      <div className="test-details-container md-elevation-5">
        <md-text-button className="close-button" onClick={onClose}>
          <MaterialDesign.MdClose style={{fontSize: "24px"}} />
        </md-text-button>
        
        <h2>{test.name}</h2>
        
        {test.synonyme.length > 0 && (
          <div className="details-section">
            <h3>Synonyme</h3>
            <p>{test.synonyme.join(', ')}</p>
            <md-divider></md-divider>
          </div>
        )}
          <div className="details-section">
          <h3>Allgemeine Informationen</h3>
          <p><strong>ID:</strong> {test.id}</p>
          <p><strong>LOINC:</strong> {test.loinc}</p>
          <p><strong>Kategorie:</strong> {test.kategorie}</p>
          {test.einheit && <p><strong>Einheit:</strong> {test.einheit}</p>}
          <md-divider></md-divider>
        </div>
        
        <div className="details-section">
          <h3>Probenanforderungen</h3>
          <p><strong>Material:</strong> {test.material.join(', ')}</p>
          <p><strong>Mindestmenge:</strong> {test.mindestmenge_ml} ml</p>
          <p><strong>Lagerung:</strong> {test.lagerung}</p>
          <md-divider></md-divider>
        </div>
          <div className="details-section">
          <h3>Durchführung und Befundung</h3>
          <p><strong>Durchführung:</strong> {test.durchführung}</p>
          <p><strong>Befundzeit:</strong> {test.befundzeit}</p>
          <md-divider></md-divider>
        </div>
        
        {(test.ebm || test.goae) && (
          <div className="details-section">
            <h3>Abrechnung</h3>
            {test.ebm && <p><strong>EBM:</strong> {test.ebm}</p>}
            {test.goae && <p><strong>GOÄ:</strong> {test.goae}</p>}
            <md-divider></md-divider>
          </div>
        )}
        
        {test.hinweise.length > 0 && (
          <div className="details-section">
            <h3>Hinweise</h3>
            <ul>
              {test.hinweise.map((hinweis, index) => (
                <li key={index}>{hinweis}</li>
              ))}
            </ul>
            <md-divider></md-divider>
          </div>
        )}
        
        {test.dokumente.length > 0 && (
          <div className="details-section">
            <h3>Dokumente</h3>
            <ul>
              {test.dokumente.map((dokument, index) => (
                <li key={index}>
                  <a href={dokument.url} target="_blank" rel="noopener noreferrer">
                    {dokument.titel}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="actions">
          <md-filled-button onClick={onClose}>Schließen</md-filled-button>
        </div>
      </div>
    </div>
  )
}

export default TestDetails