import { useEffect } from 'react';
import './ProfilDruckAnsicht.css';

function ProfilDruckAnsicht({ profil, onClose }) {
  const handlePrint = () => {
    try {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${profil.profilName} - SpecimenOne Testprofil</title>
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
            }
            h2 {
              font-size: 14pt;
              margin: 1cm 0 0.3cm 0;
              border-bottom: 1px solid #aaa;
              padding-bottom: 0.2cm;
            }
            .meta-info {
              margin: 0.5cm 0;
              padding: 0.5cm;
              background-color: #f8f8f8;
              border-radius: 4px;
            }
            .meta-row {
              display: flex;
              margin-bottom: 0.2cm;
            }
            .meta-label {
              font-weight: bold;
              width: 150px;
            }
            .meta-value {
              flex: 1;
            }
            .tests-table {
              width: 100%;
              border-collapse: collapse;
              margin: 0.5cm 0;
            }
            .tests-table th, .tests-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .tests-table th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .test-details {
              margin: 0.5cm 0;
              page-break-inside: avoid;
            }
            .test-detail-card {
              border: 1px solid #ddd;
              border-radius: 8px;
              margin-bottom: 0.5cm;
              overflow: hidden;
            }
            .test-detail-header {
              background-color: #f2f2f2;
              padding: 10px 15px;
              border-bottom: 1px solid #ddd;
              display: flex;
              align-items: center;
            }
            .test-id {
              background-color: #6abf7b;
              color: white;
              padding: 3px 6px;
              border-radius: 4px;
              margin-right: 10px;
              font-size: 0.8em;
            }
            .test-detail-content {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              padding: 15px;
            }
            .detail-group {
              margin-bottom: 15px;
            }
            .detail-group h4 {
              margin: 0 0 8px 0;
              font-size: 12pt;
              color: #666;
            }
            .detail-group p {
              margin: 0 0 6px 0;
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
            footer {
              margin-top: 1cm;
              padding-top: 0.5cm;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 9pt;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="print-controls">
            <button class="print-button" onclick="window.print();">Drucken</button>
            <button class="close-button" onclick="window.close();">Schließen</button>
          </div>
          
          <div class="header">
            <img src="/images/icon-512x512-new.png" alt="SpecimenOne Logo" class="logo">
            <h1>${profil.profilName}</h1>
          </div>
          
          <div class="meta-info">
            <div class="meta-row">
              <span class="meta-label">Erstellt von:</span>
              <span class="meta-value">${profil.userName || 'Nicht angegeben'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">E-Mail:</span>
              <span class="meta-value">${profil.email || 'Nicht angegeben'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Erstellungsdatum:</span>
              <span class="meta-value">${profil.erstelltAm}</span>
            </div>
          </div>
          
          <h2>Testübersicht (${profil.tests.length} Tests)</h2>
          <table class="tests-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Kategorie</th>
                <th>Material</th>
                <th>Mindestmenge</th>
              </tr>
            </thead>
            <tbody>
              ${profil.tests.map(test => `
                <tr>
                  <td>${test.id}</td>
                  <td>${test.name}</td>
                  <td>${test.kategorie || 'Keine Angabe'}</td>
                  <td>${test.material ? test.material.join(', ') : 'Keine Angabe'}</td>
                  <td>${test.mindestmenge_ml ? `${test.mindestmenge_ml} ml` : 'Keine Angabe'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>Detailinformationen</h2>
          <div class="test-details">
            ${profil.tests.map(test => `
              <div class="test-detail-card">
                <div class="test-detail-header">
                  <span class="test-id">${test.id}</span>
                  <span>${test.name}</span>
                </div>
                <div class="test-detail-content">
                  <div class="left-column">
                    <div class="detail-group">
                      <h4>Allgemein</h4>
                      <p><strong>Kategorie:</strong> ${test.kategorie || 'Keine Angabe'}</p>
                      ${test.loinc ? `<p><strong>LOINC:</strong> ${test.loinc}</p>` : ''}
                      ${test.synonyme && test.synonyme.length > 0 ? 
                        `<p><strong>Synonyme:</strong> ${test.synonyme.join(', ')}</p>` : ''}
                      ${test.einheit ? `<p><strong>Einheit:</strong> ${test.einheit}</p>` : ''}
                    </div>
                    
                    <div class="detail-group">
                      <h4>Probenanforderung</h4>
                      <p><strong>Material:</strong> ${test.material ? test.material.join(', ') : 'Keine Angabe'}</p>
                      ${test.mindestmenge_ml ? `<p><strong>Mindestmenge:</strong> ${test.mindestmenge_ml} ml</p>` : ''}
                      ${test.lagerung ? `<p><strong>Lagerung:</strong> ${test.lagerung}</p>` : ''}
                    </div>
                  </div>
                  
                  <div class="right-column">
                    <div class="detail-group">
                      <h4>Durchführung</h4>
                      ${test.durchführung ? `<p><strong>Durchführung:</strong> ${test.durchführung}</p>` : ''}
                      ${test.befundzeit ? `<p><strong>Befundzeit:</strong> ${test.befundzeit}</p>` : ''}
                    </div>
                    
                    ${(test.ebm || test.goae) ? `
                    <div class="detail-group">
                      <h4>Abrechnung</h4>
                      ${test.ebm ? `<p><strong>EBM:</strong> ${test.ebm}</p>` : ''}
                      ${test.goae ? `<p><strong>GOÄ:</strong> ${test.goae}</p>` : ''}
                    </div>
                    ` : ''}
                    
                    ${test.hinweise && test.hinweise.length > 0 ? `
                    <div class="detail-group">
                      <h4>Hinweise</h4>
                      <ul>
                        ${test.hinweise.map(hinweis => `<li>${hinweis}</li>`).join('')}
                      </ul>
                    </div>
                    ` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <footer>
            <p>Automatisch erstellt mit SpecimenOne - ${new Date().toLocaleDateString('de-DE')}</p>
          </footer>
        </body>
        </html>
      `;
      
      // Neues Fenster öffnen und Inhalt einfügen
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        alert("Popup wurde blockiert. Bitte erlauben Sie Popups für diese Seite.");
        return;
      }
      
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Warten bis das Dokument vollständig geladen ist und dann drucken
      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      });
      
    } catch (error) {
      console.error('Druckfehler:', error);
      alert('Beim Drucken ist ein Fehler aufgetreten: ' + error.message);
    }
  };
  
  // Automatisch drucken nach dem Rendern
  useEffect(() => {
    handlePrint();
  }, []);
  // Diese Komponente rendert jetzt nur noch minimale UI
  return (
    <div className="bg-white text-black p-8 min-h-screen font-sans">
      <div className="fixed top-5 right-5 flex gap-2 z-50">
        <button 
          className="px-4 py-2 bg-[var(--md-sys-color-primary,#6abf7b)] text-white rounded font-medium border-none cursor-pointer" 
          onClick={handlePrint}
        >
          Drucken
        </button>
        <button 
          className="px-4 py-2 bg-gray-600 text-white rounded font-medium border-none cursor-pointer" 
          onClick={onClose}
        >
          Schließen
        </button>
      </div>
      <div className="max-w-[210mm] mx-auto">
        <p className="text-center text-gray-600 mt-20">Druckvorschau wird in einem neuen Fenster geöffnet...</p>
      </div>
    </div>
  );
}

export default ProfilDruckAnsicht;