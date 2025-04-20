import React, { useEffect, useRef } from 'react'
import './TestDetails.css'
import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/divider/divider.js'
import '@material/web/elevation/elevation.js'
import * as MaterialDesign from "react-icons/md"

function TestDetails({ test, onClose }) {
  // Ref für den Ausdruck
  const printContentRef = useRef(null);
  
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
    };  }, [onClose]);
  
  // Handler für Klicks außerhalb der Karte  
  const handleOverlayClick = (event) => {
    // Nur ausführen wenn der Klick direkt auf dem Overlay war, nicht auf seinen Kindern
    if (event.target.className === 'test-details-overlay') {
      onClose();
    }
  };
    // Verbesserte Druckfunktion
  const handlePrint = () => {
    try {
      // Eindeutigen Namen für das Popup-Fenster erstellen
      const windowName = `print_${test.id}_${Date.now()}`;
      
      // Erstelle ein neues Fenster für den Druck mit spezifischem Namen und Parametern
      const printWindow = window.open('', windowName, 'width=800,height=600,toolbar=0,scrollbars=1,status=0');
      
      if (!printWindow) {
        alert("Popup wurde blockiert. Bitte erlauben Sie Popups für diese Seite.");
        return;
      }
        // Basierend auf dem Testinhalt einen sauberen HTML-String erstellen
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${test.name} - Labortest</title>
          <style>
            @page { margin: 1cm; }
            body { 
              font-family: Arial, sans-serif; 
              max-width: 100%;
              margin: 0;
              padding: 0;
              background-color: white;
              color: black;
            }
            .header {
              display: flex;
              align-items: center;
              margin-bottom: 1cm;
              border-bottom: 1px solid #ccc;
              padding-bottom: 0.5cm;
            }
            .logo {
              height: 60px;
              width: auto;
              margin-right: 15px;
            }
            h1 {
              font-size: 18pt;
              margin: 0;
            }h2 {
              font-size: 14pt;
              margin: 1cm 0 0.3cm 0;
              border-bottom: 1px solid #aaa;
              padding-bottom: 0.2cm;
            }
            .section {
              margin: 0.5cm 0;
              page-break-inside: avoid;
            }
            p { 
              margin: 0.2cm 0;
              font-size: 11pt;
            }
            ul {
              margin: 0.2cm 0;
              padding-left: 1cm;
            }
            li {
              margin-bottom: 0.2cm;
            }
            .print-controls {
              position: fixed;
              top: 10px;
              right: 10px;
              background: #f8f8f8;
              border: 1px solid #ddd;
              border-radius: 4px;
              padding: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              display: flex;
              gap: 10px;
            }
            .print-button, .close-button {
              padding: 5px 10px;
              border: none;
              background: #6abf7b;
              color: white;
              border-radius: 3px;
              cursor: pointer;
              font-weight: bold;
              font-size: 12px;
              transition: background 0.3s;
            }
            .close-button {
              background: #999;
            }
            .print-button:hover {
              background: #5aa96a;
            }
            .close-button:hover {
              background: #777;
            }
            @media print {
              .print-controls {
                display: none;
              }
            }
          </style>
        </head>        <body>
          <div class="print-controls">
            <button class="print-button" onclick="window.print();">Drucken</button>
            <button class="close-button" onclick="window.close();">Schließen</button>
          </div>
          <div class="header">
            <img src="/images/icon-512x512.png" alt="SpecimenOne Logo" class="logo">
            <h1>${test.name}</h1>
          </div>
          
          ${test.synonyme?.length > 0 ? `
          <div class="section">
            <h2>Synonyme</h2>
            <p>${test.synonyme.join(', ')}</p>
          </div>` : ''}
          
          <div class="section">
            <h2>Allgemeine Informationen</h2>
            <p><strong>ID:</strong> ${test.id}</p>
            <p><strong>LOINC:</strong> ${test.loinc}</p>
            <p><strong>Kategorie:</strong> ${test.kategorie}</p>
            ${test.einheit ? `<p><strong>Einheit:</strong> ${test.einheit}</p>` : ''}
          </div>
          
          <div class="section">
            <h2>Probenanforderungen</h2>
            <p><strong>Material:</strong> ${test.material.join(', ')}</p>
            <p><strong>Mindestmenge:</strong> ${test.mindestmenge_ml} ml</p>
            <p><strong>Lagerung:</strong> ${test.lagerung}</p>
          </div>
          
          <div class="section">
            <h2>Durchführung und Befundung</h2>
            <p><strong>Durchführung:</strong> ${test.durchführung}</p>
            <p><strong>Befundzeit:</strong> ${test.befundzeit}</p>
          </div>
          
          ${(test.ebm || test.goae) ? `
          <div class="section">
            <h2>Abrechnung</h2>
            ${test.ebm ? `<p><strong>EBM:</strong> ${test.ebm}</p>` : ''}
            ${test.goae ? `<p><strong>GOÄ:</strong> ${test.goae}</p>` : ''}
          </div>` : ''}
          
          ${test.hinweise?.length > 0 ? `
          <div class="section">
            <h2>Hinweise</h2>
            <ul>
              ${test.hinweise.map(hinweis => `<li>${hinweis}</li>`).join('')}
            </ul>
          </div>` : ''}
          
          ${test.dokumente?.length > 0 ? `
          <div class="section">
            <h2>Dokumente</h2>
            <ul>
              ${test.dokumente.map(doc => `<li>${doc.titel}</li>`).join('')}
            </ul>
          </div>` : ''}
        </body>
        </html>
      `;
      
      // Inhalt in das neue Fenster schreiben
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Event-Handler für das Schließen des Fensters
      printWindow.addEventListener('beforeunload', function() {
        // Nichts besonderes zu tun beim Schließen, da das Hauptfenster erhalten bleibt
      });
      
      // Fokus auf das neue Fenster setzen
      printWindow.focus();
    } catch (error) {
      console.error('Fehler beim Drucken:', error);
      alert('Beim Drucken ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.');
    }
  };
  return (
    <div className="test-details-overlay" onClick={handleOverlayClick}>      <div className="test-details-container md-elevation-5">
        <md-text-button className="close-button" onClick={onClose}>
          <MaterialDesign.MdClose style={{fontSize: "24px"}} />
        </md-text-button>
        
        <h2 className={`kategorie-text-${test.kategorie.toLowerCase().replace(/\s+/g, '-')}`}>{test.name}</h2>
        
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
        )}        <div className="actions">
          <md-filled-button onClick={handlePrint}>Drucken</md-filled-button>
          <md-filled-button onClick={onClose}>Schließen</md-filled-button>
        </div>
      </div>
    </div>
  )
}

export default TestDetails