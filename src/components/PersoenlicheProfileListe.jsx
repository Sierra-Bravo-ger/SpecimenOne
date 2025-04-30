import React, { useState, useEffect, useRef, useMemo } from 'react';
import TestDetails from './TestDetails';
import * as MaterialDesign from "react-icons/md";
import '@material/web/ripple/ripple.js';
import '@material/web/elevation/elevation.js';
import { useMaterialService } from '../services/MaterialService';
import MaterialBadge from './MaterialBadge';
import tailwindBtn from './tailwindBtn';
import '../styles/kategorie-badges.css';
import { sendProfilToDiscord } from '../services/ServiceClient';

function PersoenlicheProfileListe() {
  const [persoenlicheProfile, setPersoenlicheProfile] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProfiles, setExpandedProfiles] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [allTests, setAllTests] = useState([]);
  const { isLoading: materialsLoading } = useMaterialService();
  
  // Laden der persönlichen Profile und aller Tests (für vollständige Details) beim Komponenten-Mount
  useEffect(() => {
    const geladeneProfile = JSON.parse(localStorage.getItem('persoenlicheProfile') || '[]');
    setPersoenlicheProfile(geladeneProfile);
    
    // Lade auch die vollständigen Testdaten für Materialanzeige usw.
    const fetchAllTests = async () => {
      try {
        const response = await fetch('/tests.json');
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Tests');
        }
        
        const testsData = await response.json();
        setAllTests(testsData);
      } catch (error) {
        console.error('Fehler beim Laden der Testdetails:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllTests();
  }, []);
  
  // Funktion zum Umschalten der Profil-Expansion
  const toggleProfile = (profilId) => {
    if (expandedProfiles.includes(profilId)) {
      setExpandedProfiles(expandedProfiles.filter(id => id !== profilId));
    } else {
      setExpandedProfiles([...expandedProfiles, profilId]);
    }
  };
  
  // Test-Details anzeigen
  const handleTestClick = (test) => {
    // Versuche, die vollständigen Testdetails zu bekommen
    const fullTest = allTests.find(t => t.id === test.id);
    setSelectedTest(fullTest || test);
  };

  // Test-Details schließen
  const handleCloseDetails = () => {
    setSelectedTest(null);
  };
  
  // Profil löschen
  const profilLoeschen = (profilId, e) => {
    // Verhindern, dass der Click auf den Button auch das Profil expandiert
    e.stopPropagation();
    
    if (window.confirm('Möchten Sie dieses Profil wirklich löschen?')) {
      const aktualisierteListe = persoenlicheProfile.filter(profil => profil.id !== profilId);
      setPersoenlicheProfile(aktualisierteListe);
      localStorage.setItem('persoenlicheProfile', JSON.stringify(aktualisierteListe));
    }
  };
    // Profil-Antrag drucken
  const handleProfilDrucken = (profil, e) => {
    // Verhindern, dass der Click auf den Button auch das Profil expandiert
    e.stopPropagation();
    
    try {
      // Discord-Webhook aufrufen mit anonymisierten Daten
      const profilData = {
        profilName: profil.name,
        tests: profil.tests,
        erstelltAm: new Date().toLocaleDateString('de-DE'),
        kategorie: profil.kategorie || 'Keine Kategorie',
        beschreibung: profil.beschreibung || '',
        anonymous: true // DSGVO-konform
      };
        // Discord-Webhook aufrufen
      sendProfilToDiscord(profilData)
        .then(() => {
          console.log("Profil-Antrag erfolgreich gesendet");
          alert("Profil-Antrag erfolgreich übermittelt und wird zum Drucken vorbereitet...");
        })
        .catch(error => {
          console.error("Fehler beim Senden des Profil-Antrags:", error);
          alert("Profil-Antrag wird zum Drucken vorbereitet...");
        });
    } catch (error) {
      console.error("Fehler beim Verarbeiten des Profil-Antrags:", error);
      alert("Es ist ein Fehler beim Verarbeiten des Profil-Antrags aufgetreten.");
    }
  };
  // Exportieren und Importieren
  const exportProfile = () => {
    // Formatierte JSON mit Einrückung für bessere Lesbarkeit
    // und Tests nur als ID-Array (wie in Standard-Profilen)
    const profilesToExport = persoenlicheProfile.map(profil => {
      return {
        ...profil,
        tests: profil.tests.map(test => test.id) // Nur Test-IDs exportieren, nicht ganze Testobjekte
      };
    });
    
    const dataStr = "data:text/json;charset=utf-8," + 
      encodeURIComponent(JSON.stringify(profilesToExport, null, 2)); // null, 2 fügt schöne Formatierung hinzu
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "meine_profile.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
    const importProfile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedProfiles = JSON.parse(e.target.result);
        
        if (Array.isArray(importedProfiles)) {
          // Konvertiere die importierten Profile ins richtige Format
          // Falls nur Test-IDs importiert wurden, erstelle passende Test-Objekte
          const formattedProfiles = importedProfiles.map(profile => {
            // Stelle sicher, dass das tests-Feld im richtigen Format ist
            let formattedTests = profile.tests;
            
            // Wenn tests nur ein Array von Strings (IDs) ist, konvertiere zu Objekten
            if (Array.isArray(profile.tests) && profile.tests.length > 0 && typeof profile.tests[0] === 'string') {
              formattedTests = profile.tests.map(testId => {
                // Versuche, den vollständigen Test zu finden
                const fullTest = allTests.find(t => t.id === testId);
                // Falls nicht gefunden, erstelle minimales Testobjekt
                return {
                  id: testId,
                  name: fullTest ? fullTest.name : testId // Fallback auf ID als Name
                };
              });
            }
            
            return {
              ...profile,
              tests: formattedTests
            };
          });
          
          setPersoenlicheProfile(formattedProfiles);
          localStorage.setItem('persoenlicheProfile', JSON.stringify(formattedProfiles));
        } else {
          throw new Error('Ungültiges Format: Keine Array-Struktur');
        }
      } catch (error) {
        alert('Fehler beim Importieren: ' + error.message);
      }
    };
    reader.readAsText(file);
  };
  
  // Helper-Funktion, um die vollständigen Testdetails zu einem Test zu finden
  const getFullTestDetails = (testId) => {
    return allTests.find(test => test.id === testId) || null;
  };
  
  if (loading) {
    return <div className={tailwindBtn.classes.loading}>Lädt persönliche Profile...</div>;
  }
  
  return (
    <div className={tailwindBtn.classes.profileList?.container || "w-full"}>
      {/* Import/Export-Buttons */}
      <div className="flex justify-end gap-2 mb-4">
        <button 
          className={tailwindBtn.secondary || "flex items-center justify-center gap-2 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"}
          onClick={() => document.getElementById('profileImport').click()}
        >
          <MaterialDesign.MdFileUpload /> Profile importieren
        </button>
        <input
          id="profileImport"
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={importProfile}
        />
        
        <button 
          className={tailwindBtn.secondary || "flex items-center justify-center gap-2 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"}
          onClick={exportProfile}
          disabled={persoenlicheProfile.length === 0}
        >
          <MaterialDesign.MdFileDownload /> Profile exportieren
        </button>
      </div>
      
      {persoenlicheProfile.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <MaterialDesign.MdBookmarkBorder style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">Keine persönlichen Profile</p>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
            Sie haben noch keine persönlichen Profile gespeichert. 
            Wählen Sie Tests in der Test-Ansicht aus und speichern Sie sie als persönliches Profil.
          </p>
        </div>
      ) : (
        persoenlicheProfile.map(profil => {
          const isExpanded = expandedProfiles.includes(profil.id);
          
          return (            <div key={profil.id} className={`${tailwindBtn.classes.profileList?.card || "bg-[var(--md-sys-color-surface-variant,#E7E0EC)] dark:bg-[var(--md-sys-color-surface-variant,#49454F)] rounded-lg shadow-sm mb-4"} md-elevation-2`}>
              <div className={tailwindBtn.classes.profileList?.header || "flex justify-between items-start p-4 cursor-pointer relative overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"} 
                   onClick={() => toggleProfile(profil.id)}>
                <md-ripple></md-ripple>
                <div className={tailwindBtn.classes.profileList?.info || "flex-grow"}>
                  <div className={tailwindBtn.classes.profileList?.titleRow || "flex justify-between"}>
                    <h3 className={`${tailwindBtn.classes.profileList?.title || "font-medium text-lg text-gray-800 dark:text-gray-200"} ${
                      profil.kategorie 
                        ? `kategorie-text-${profil.kategorie.toLowerCase().replace(/\s+/g, '-')}` 
                        : ''
                    }`}>
                      {profil.name}
                    </h3>
                    <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs font-medium px-2 py-1 rounded-full">
                      {profil.tests.length} Test{profil.tests.length !== 1 ? 'e' : ''}
                    </span>
                  </div>
                  <p className={tailwindBtn.classes.profileList?.description || "text-sm text-gray-600 dark:text-gray-400"}>
                    {profil.beschreibung || 'Keine Beschreibung'}
                  </p>
                  {/* Kategorie-Badge */}
                  {profil.kategorie && (
                    <p className={`kategorie-badge kategorie-${profil.kategorie.toLowerCase().replace(/\s+/g, '-')}`}>
                      {profil.kategorie}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Erstellt am {new Date(profil.erstelltAm).toLocaleDateString('de-DE')}
                  </p>
                  {/* Aktionsbuttons */}
                  <div className="mt-2 flex gap-2">                    <button 
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      onClick={(e) => handleProfilDrucken(profil, e)}
                      aria-label="Profil-Antrag drucken"
                    >
                      <MaterialDesign.MdPrint className="text-gray-700 dark:text-gray-300" />
                    </button>
                    
                    <button 
                      className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                      onClick={(e) => profilLoeschen(profil.id, e)}
                      aria-label="Profil löschen"
                    >
                      <MaterialDesign.MdDelete />
                    </button>
                  </div>
                </div>
                <div className={tailwindBtn.classes.profileList?.expandIcon || "ml-4 flex-none"}>
                  {isExpanded ? 
                    <MaterialDesign.MdExpandLess style={{fontSize: "24px"}} /> : 
                    <MaterialDesign.MdExpandMore style={{fontSize: "24px"}} />
                  }
                </div>
              </div>
              {isExpanded && (
                <div className={tailwindBtn.classes.profileList?.tests || "p-4 pt-0 border-t border-gray-200 dark:border-gray-700"}>
                  <p className={tailwindBtn.classes.profileList?.testsHeader || "font-medium my-2"}>Enthaltene Tests:</p>
                  {profil.tests.length === 0 ? (
                    <p className={tailwindBtn.classes.profileList?.noTestsMessage || "text-sm italic text-gray-500"}>
                      Keine Tests in diesem Profil gefunden.
                    </p>
                  ) : (
                    <div className={tailwindBtn.classes.profileList?.testsGrid || "grid gap-2"}>
                      {profil.tests.map(test => {
                        // Wir verwenden die auf höherer Ebene geladenen Tests
                        const testDetails = getFullTestDetails(test.id) || test;
                        
                        return (
                          <div 
                            key={test.id} 
                            className={tailwindBtn.classes.profileList?.testItem || "p-3 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-750 cursor-pointer"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestClick(test);
                            }}
                          >
                            <md-ripple></md-ripple>
                            <div className={tailwindBtn.classes.profileList?.testName || "font-medium"}>
                              {test.name}
                            </div>
                            <div className={tailwindBtn.classes.profileList?.testDetail || "text-sm text-gray-600 dark:text-gray-400 mt-1"}>
                              <span>Material: </span>
                              {testDetails.material && testDetails.material.length > 0 ? (
                                <div className={tailwindBtn.classes.profileList?.materialBadgesContainer || "flex flex-wrap gap-1 mt-1"}>
                                  {testDetails.material.map((materialId, index) => (
                                    <MaterialBadge key={index} materialId={materialId} mini={true} />
                                  ))}
                                </div>
                              ) : (
                                <span className={tailwindBtn.classes.profileList?.noMaterialInfo || "italic text-gray-500"}>Keine Angabe</span>
                              )}
                            </div>
                            {testDetails.synonyme?.length > 0 && (
                              <div className={tailwindBtn.classes.profileList?.testSynonyms || "text-sm italic text-gray-500 mt-1"}>
                                <small>{testDetails.synonyme.join(', ')}</small>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
      
      {/* Test-Details Dialog */}
      {selectedTest && (
        <TestDetails 
          test={selectedTest} 
          onClose={handleCloseDetails} 
        />
      )}
    </div>
  );
}

export default PersoenlicheProfileListe;
