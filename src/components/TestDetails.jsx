import React, { useEffect, useRef, useState } from 'react'
import './TestDetails.css' // Diese Datei behalten wir vorerst für Druckstile & Tabellenstile
// TestDetails-Badge.css nicht mehr erforderlich, da wir Tailwind verwenden
// import './TestDetails-Badge.css'
import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/divider/divider.js'
import '@material/web/elevation/elevation.js'
import * as MaterialDesign from "react-icons/md"
import { useMaterialService } from '../services/MaterialService'
import { useEinheitenService } from '../services/EinheitenService'
import MaterialBadge from './MaterialBadge'
import tailwindBtn from './tailwindBtn' // Importiere unsere zentrale Styling-Bibliothek

function TestDetails({ test, onClose }) {
  // Ref für den Ausdruck
  const printContentRef = useRef(null);  // State für Referenzwerte
  const [referenzwerte, setReferenzwerte] = useState([]);
  // Material-Service für die Anzeige der Materialbezeichnungen
  const { convertMaterialIdsToNames, isLoading: materialsLoading } = useMaterialService();
  // Einheiten-Service für die Anzeige der Einheitsbezeichnungen
  const { getEinheitBezeichnung, isLoading: einheitenLoading } = useEinheitenService();
  
  // Laden der Referenzwerte beim Mounten der Komponente
  useEffect(() => {
    const fetchReferenzwerte = async () => {
      try {
        const response = await fetch('/referenzwerte.json');
        if (!response.ok) {
          throw new Error('Netzwerkantwort war nicht ok');
        }
        const data = await response.json();
        // Prüfen ob Referenzwerte für diesen Test existieren
        if (data[test.id]) {
          setReferenzwerte(data[test.id]);
        } else {
          setReferenzwerte([]);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Referenzwerte:', error);
        setReferenzwerte([]);
      }
    };

    fetchReferenzwerte();
  }, [test.id]);
  
  // Übersetzt die Geschlechter-IDs in lesbare Bezeichnungen
  const getGeschlechtText = (geschlechtId) => {
    switch (geschlechtId) {
      case 1000: return 'Männlich';
      case 2000: return 'Weiblich';
      case 3000: return 'Alle';
      default: return '';
    }
  };
  
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
          <title>${test.name} - Labortest</title>          <style>
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
            .material-badges {
              display: flex;
              flex-wrap: wrap;
              gap: 5px;
              margin-bottom: 10px;
            }
            .print-material-badge {
              font-size: 10pt;
              font-weight: bold;
            }
            /* Farbdefinitionen für Material-Badges */
            :root {
              --material-color-1: #FFD700; /* Gelb */
              --material-color-2: #28a745; /* Grün */
              --material-color-3: #dc3545; /* Rot */
              --material-color-4: #007bff; /* Blau */
              --material-color-8: #8B4513; /* Braun */
              --material-color-10: #9932CC; /* Lila */
              --material-color-14: #FF1493; /* Fuchsia */
              --material-color-124: #FFA500; /* Orange */
              --material-color-128: #808080; /* Grau */
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
            <img src="/images/icons/icon_512x512.png" alt="SpecimenOne Logo" class="logo">
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
            ${test.einheit_id ? `<p><strong>Einheit:</strong> ${getEinheitBezeichnung(test.einheit_id)}</p>` : ''}
          </div>
            <div class="section">
            <h2>Probenanforderungen</h2>
            <p><strong>Material:</strong></p>
            <div class="material-badges">
              ${test.material.map(materialId => {                // Hole die Material-Informationen aus dem Cache (falls verfügbar)
                const materialItem = window.materialCache?.[materialId] || { bezeichnung: materialId, kurz: "", farbenId: "0" };
                const materialColor = materialItem.farbenId ? `var(--material-color-${materialItem.farbenId})` : 'gray';
                return `<span class="print-material-badge" style="background-color: ${materialColor}; color: white; padding: 2px 8px; border-radius: 4px; margin-right: 8px; display: inline-block; margin-bottom: 5px;">
                  ${materialId}
                </span>`;
              }).join('')}
            </div>
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
          
          ${referenzwerte?.length > 0 ? `
          <div class="section">
            <h2>Referenzwerte</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #f3f3f3;">
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Gruppe</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Alter</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Geschlecht</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Referenzbereich</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Bedingung</th>
                </tr>
              </thead>
              <tbody>
                ${referenzwerte.map(ref => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${
                      ref.Besondere_Bedingung || 
                      (ref.Alter_von === 0 && ref.Alter_bis === 1 ? "Neugeborene" : 
                       ref.Alter_von === 0 && ref.Alter_bis < 18 ? "Kinder" : 
                       ref.Alter_von >= 1 && ref.Alter_bis < 18 ? "Kinder/Jugendliche" : 
                       "Erwachsene")
                    }</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${
                      ref.Alter_von === 0 && ref.Alter_bis === 99 ? "Alle" : 
                      `${ref.Alter_von}-${ref.Alter_bis} Jahre`
                    }</td>
<td style="padding: 8px; border: 1px solid #ddd;">${
                      ref.Geschlecht === 1000 ? "Männlich" : 
                      ref.Geschlecht === 2000 ? "Weiblich" : 
                      ref.Geschlecht === 3000 ? "Alle" : ""
                    }</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${
                      ref.Anzeige_Label 
                        ? `${ref.Anzeige_Label} ${getEinheitBezeichnung(test.einheit_id)}`
                        : (ref.Wert_untere_Grenze !== null && ref.Wert_obere_Grenze !== null)
                          ? `${ref.Wert_untere_Grenze} - ${ref.Wert_obere_Grenze} ${getEinheitBezeichnung(test.einheit_id)}`
                          : ref.Wert_untere_Grenze !== null
                            ? `> ${ref.Wert_untere_Grenze} ${getEinheitBezeichnung(test.einheit_id)}`
                            : ref.Wert_obere_Grenze !== null
                              ? `< ${ref.Wert_obere_Grenze} ${getEinheitBezeichnung(test.einheit_id)}`
                              : "-"
                    }</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${ref.Schwangerschaft ? `Schwangerschaft (${ref.Besondere_Bedingung})` : ref.Besondere_Bedingung || "-"}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
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
  };  return (
    <div className="test-details-overlay" onClick={handleOverlayClick}>      
      <div className={`test-details-container md-elevation-5 ${tailwindBtn.classes.cardBg}`}>
        <md-text-button className={`close-button ${tailwindBtn.classes.textMuted}`} onClick={onClose}>
          <MaterialDesign.MdClose style={{fontSize: "24px"}} />
        </md-text-button>
          <h2 className={`${tailwindBtn.classes.text} ${test.kategorie ? `kategorie-text-${test.kategorie.toLowerCase().replace(/\s+/g, '-')}` : ''}`}>{test.name}</h2>
        
        {(() => {
          // Debug-Check für fehlendes synonyme-Feld
          if (!test.synonyme) {
            console.warn(`[SpecimenOne Debug] Fehlendes Feld 'synonyme' in Test ${test.id}: ${test.name}`);
            return null;
          }          return test.synonyme.length > 0 && (
            <div className="details-section">
              <h3 className={`${tailwindBtn.classes.headingSecondary}`}>Synonyme</h3>
              <p className={`${tailwindBtn.classes.text}`}>{test.synonyme.join(', ')}</p>
              <md-divider></md-divider>
            </div>
          );
        })()}          <div className="details-section">
          <h3 className={`${tailwindBtn.classes.headingSecondary}`}>Allgemeine Informationen</h3>
          <p className={`${tailwindBtn.classes.text}`}><strong>ID:</strong> {test.id}</p>
          <p className={`${tailwindBtn.classes.text}`}><strong>LOINC:</strong> {(() => {
            if (!test.loinc) {
              console.warn(`[SpecimenOne Debug] Fehlendes Feld 'loinc' in Test ${test.id}: ${test.name}`);
              return 'N/A';
            }            return test.loinc;
          })()}</p>
          <p className={`${tailwindBtn.classes.text}`}><strong>Kategorie:</strong> {(() => {
            if (!test.kategorie) {
              console.warn(`[SpecimenOne Debug] Fehlendes Feld 'kategorie' in Test ${test.id}: ${test.name}`);
              return 'Keine Kategorie';
            }
            return test.kategorie;
          })()}</p>
          {(() => {            if (!test.einheit_id) {
              console.warn(`[SpecimenOne Debug] Fehlendes Feld 'einheit_id' in Test ${test.id}: ${test.name}`);
            }
            return test.einheit_id && <p className={`${tailwindBtn.classes.text}`}><strong>Einheit:</strong> {getEinheitBezeichnung(test.einheit_id)}</p>;
          })()}
          <md-divider></md-divider>
        </div>        <div className="details-section">
          <h3 className={`${tailwindBtn.classes.headingSecondary}`}>Probenanforderungen</h3>          <div className={`${tailwindBtn.classes.badge.materialRow}`}>
            <p className={`${tailwindBtn.classes.text} ${tailwindBtn.classes.badge.materialRowText}`}><strong>Material:</strong></p>
            {(() => {              if (!test.material) {
                console.warn(`[SpecimenOne Debug] Fehlendes Feld 'material' in Test ${test.id}: ${test.name}`);
                return <span className={`${tailwindBtn.classes.badge.noMaterialInfo}`}>Keine Angabe</span>;
              }              return test.material && test.material.length > 0 ? (
                <div className={`${tailwindBtn.classes.badge.badgesContainer}`}>
                  {test.material.map((materialId, index) => (
                    <MaterialBadge key={index} materialId={materialId} showKurzbezeichnung={true} mini={false} />
                  ))}
                </div>
              ) : (
                <span className={`${tailwindBtn.classes.badge.noMaterialInfo}`}>Keine Angabe</span>
              );
            })()}
          </div>
          <p><strong>Mindestmenge:</strong> {(() => {
            if (test.mindestmenge_ml === undefined || test.mindestmenge_ml === null) {
              console.warn(`[SpecimenOne Debug] Fehlendes Feld 'mindestmenge_ml' in Test ${test.id}: ${test.name}`);
              return 'Keine Angabe';
            }
            return `${test.mindestmenge_ml} ml`;
          })()}</p>
          <p><strong>Lagerung:</strong> {(() => {
            if (!test.lagerung) {
              console.warn(`[SpecimenOne Debug] Fehlendes Feld 'lagerung' in Test ${test.id}: ${test.name}`);
              return 'Keine Angabe';
            }
            return test.lagerung;
          })()}</p>
          <md-divider></md-divider>
        </div>          <div className="details-section">
          <h3>Durchführung und Befundung</h3>
          <p><strong>Durchführung:</strong> {(() => {
            if (!test.durchführung) {
              console.warn(`[SpecimenOne Debug] Fehlendes Feld 'durchführung' in Test ${test.id}: ${test.name}`);
              return 'Keine Angabe';
            }
            return test.durchführung;
          })()}</p>
          <p><strong>Befundzeit:</strong> {(() => {
            if (!test.befundzeit) {
              console.warn(`[SpecimenOne Debug] Fehlendes Feld 'befundzeit' in Test ${test.id}: ${test.name}`);
              return 'Keine Angabe';
            }
            return test.befundzeit;
          })()}</p>
          <md-divider></md-divider>
        </div>
          {(() => {
          // Debug-Check für fehlende Abrechnungsfelder
          if (test.ebm === undefined) {
            console.warn(`[SpecimenOne Debug] Fehlendes Feld 'ebm' in Test ${test.id}: ${test.name}`);
          }
          if (test.goae === undefined) {
            console.warn(`[SpecimenOne Debug] Fehlendes Feld 'goae' in Test ${test.id}: ${test.name}`);
          }
          return (test.ebm || test.goae) && (
            <div className="details-section">
              <h3>Abrechnung</h3>
              {test.ebm && <p><strong>EBM:</strong> {test.ebm}</p>}
              {test.goae && <p><strong>GOÄ:</strong> {test.goae}</p>}
              <md-divider></md-divider>
            </div>
          );
        })()}
          {(() => {
          // Debug-Check für fehlende Felder
          if (!test.hinweise) {
            console.warn(`[SpecimenOne Debug] Fehlendes Feld 'hinweise' in Test ${test.id}: ${test.name}`);
          }
          return test.hinweise && test.hinweise.length > 0 && (
            <div className="details-section">
              <h3>Hinweise</h3>
              <ul>
                {test.hinweise.map((hinweis, index) => (
                  <li key={index}>{hinweis}</li>
                ))}
              </ul>
              <md-divider></md-divider>
            </div>
          );
        })()}          {(() => {
          // Debug-Check für fehlendes dokumente-Feld
          if (!test.dokumente) {
            console.warn(`[SpecimenOne Debug] Fehlendes Feld 'dokumente' in Test ${test.id}: ${test.name}`);
            return null;
          }
          return test.dokumente.length > 0 && (
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
              <md-divider></md-divider>
            </div>
          );
        })()}
        
        {referenzwerte.length > 0 && (
          <div className="details-section">
            <h3>Referenzwerte</h3>
            <table className="referenzwerte-tabelle">
              <thead>
                <tr>
                  <th>Gruppe</th>
                  <th>Alter</th>
                  <th>Geschlecht</th>
                  <th>Referenzbereich</th>
                  <th>Bedingung</th>
                </tr>
              </thead>
              <tbody>
                {referenzwerte.map((ref, index) => (
                  <tr key={index}>
                    <td>
                      {ref.Besondere_Bedingung || 
                       (ref.Alter_von === 0 && ref.Alter_bis === 1 ? "Neugeborene" : 
                        ref.Alter_von === 0 && ref.Alter_bis < 18 ? "Kinder" : 
                        ref.Alter_von >= 1 && ref.Alter_bis < 18 ? "Kinder/Jugendliche" : 
                        "Erwachsene")}
                    </td>
<td>
                      {ref.Alter_von === 0 && ref.Alter_bis === 99 ? "Alle" : 
                       `${ref.Alter_von}-${ref.Alter_bis} Jahre`}
                    </td>
                    <td>{getGeschlechtText(ref.Geschlecht)}</td>
                    <td>
                      {ref.Anzeige_Label 
                        ? `${ref.Anzeige_Label} ${getEinheitBezeichnung(test.einheit_id)}`
                        : (ref.Wert_untere_Grenze !== null && ref.Wert_obere_Grenze !== null)
                          ? `${ref.Wert_untere_Grenze} - ${ref.Wert_obere_Grenze} ${getEinheitBezeichnung(test.einheit_id)}`
                          : ref.Wert_untere_Grenze !== null
                            ? `> ${ref.Wert_untere_Grenze} ${getEinheitBezeichnung(test.einheit_id)}`
                            : ref.Wert_obere_Grenze !== null
                              ? `< ${ref.Wert_obere_Grenze} ${getEinheitBezeichnung(test.einheit_id)}`
                              : "-"
                      }
                    </td>
                    <td>{ref.Schwangerschaft ? `Schwangerschaft (${ref.Besondere_Bedingung})` : ref.Besondere_Bedingung || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <md-divider></md-divider>
          </div>
        )}        <div className="actions">
          <md-filled-button onClick={handlePrint} class={tailwindBtn.classes.mdButton}>Drucken</md-filled-button>
          <md-filled-button onClick={onClose} class={tailwindBtn.classes.mdButton}>Schließen</md-filled-button>
        </div>
      </div>
    </div>
  )
}

export default TestDetails