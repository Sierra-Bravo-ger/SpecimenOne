import React from 'react';
import TestDetails from './TestDetails';
import * as MaterialDesign from "react-icons/md";
import '@material/web/ripple/ripple.js';
import '@material/web/elevation/elevation.js';
import { useMaterialService } from '../services/MaterialService';
import MaterialBadge from './MaterialBadge';
import tailwindBtn from './tailwindBtn';

// Diese Komponente enthält die extrahierte Funktionalität
// aus der ursprünglichen ProfilListe für Standard-Profile
function StandardProfileListe({ tests, profile, expandedProfiles, setExpandedProfiles, onTestClick }) {
  const { isLoading: materialsLoading } = useMaterialService();
    // Stellen Sie sicher, dass profile immer ein Array ist
  const profileArray = Array.isArray(profile) ? profile : [];
  
  // Debug-Ausgabe für empfangene Profile
  console.log("StandardProfileListe: Profile empfangen:", {
    count: profileArray.length,
    isArray: Array.isArray(profile),
    firstItem: profileArray.length > 0 ? profileArray[0] : null
  });

  // Funktion zum Umschalten der Profil-Expansion
  const toggleProfile = (profilId) => {
    if (expandedProfiles.includes(profilId)) {
      setExpandedProfiles(expandedProfiles.filter(id => id !== profilId));
    } else {
      setExpandedProfiles([...expandedProfiles, profilId]);
    }
  };
  
  // Sortiere Profile nach sortiernummer (falls vorhanden) oder nach ID als Fallback
  // Nur sortieren, wenn es Profile gibt
  const sortedProfiles = profileArray.length > 0 
    ? [...profileArray].sort((a, b) => {
        // Primär nach sortiernummer sortieren, falls vorhanden
        if (a.sortiernummer !== undefined && b.sortiernummer !== undefined) {
          return a.sortiernummer - b.sortiernummer;
        }
        // Sekundär nach ID sortieren
        return a.id.localeCompare(b.id);
      })
    : [];
  return (
    <div className={tailwindBtn.classes.profileList.container}>
      {profileArray.length === 0 ? (
        <p className={tailwindBtn.classes.profileList.noProfilesMessage}>Keine Profile gefunden.</p>
      ) : (
        sortedProfiles.map(profil => {          const isExpanded = expandedProfiles.includes(profil.id);          
          
          // Konvertiere tests-Eigenschaft zu einem Array von Test-IDs
          let testIdsArray = [];
          
          if (Array.isArray(profil.tests)) {
            // Fall 1: Tests ist ein Array mit pipe-getrennten Test-IDs in einem Element
            if (profil.tests.length === 1 && typeof profil.tests[0] === 'string' && profil.tests[0].includes('|')) {
              testIdsArray = profil.tests[0].split('|');
            } 
            // Fall 2: Tests ist ein Array mit einzelnen Test-IDs als Elemente
            else {
              testIdsArray = profil.tests;
            }
          } 
          // Fall 3: Tests ist ein pipe-getrennter String
          else if (typeof profil.tests === 'string') {
            testIdsArray = profil.tests.split('|');
          }
          
          console.log(`Profil ${profil.name}: TestIDs gefunden:`, testIdsArray);
          
          const profilTests = tests.filter(test => 
            testIdsArray.includes(test.id)
          );

          return (
            <div key={profil.id} className={`${tailwindBtn.classes.profileList.card} md-elevation-2`}>
              <div className={tailwindBtn.classes.profileList.header} onClick={() => toggleProfile(profil.id)}>
                <md-ripple></md-ripple>
                <div className={tailwindBtn.classes.profileList.info}>                  <div className={tailwindBtn.classes.profileList.titleRow}>
                    <h3 className={`${tailwindBtn.classes.profileList.title} kategorie-text-${profil.kategorie?.toLowerCase().replace(/\s+/g, '-') || ''}`}>{profil.name}</h3>
                  </div>
                  <p className={tailwindBtn.classes.profileList.description}>{profil.beschreibung}</p>
                  <p className={`inline-block px-2 py-1 rounded-full text-sm kategorie-badge ${
                    profil.kategorie 
                      ? `kategorie-${profil.kategorie.toLowerCase().replace(/\s+/g, '-')}` 
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {profil.kategorie || 'Keine Kategorie'}
                  </p>
                </div>
                <div className={tailwindBtn.classes.profileList.expandIcon}>
                  {isExpanded ? 
                    <MaterialDesign.MdExpandLess style={{fontSize: "24px"}} /> : 
                    <MaterialDesign.MdExpandMore style={{fontSize: "24px"}} />
                  }
                </div>
              </div>
              {isExpanded && (
                <div className={tailwindBtn.classes.profileList.tests}>
                  <p className={tailwindBtn.classes.profileList.testsHeader}>Enthaltene Tests:</p>
                  {profilTests.length === 0 ? (
                    <p className={tailwindBtn.classes.profileList.noTestsMessage}>Keine Tests in diesem Profil gefunden.</p>
                  ) : (
                    <div className={tailwindBtn.classes.profileList.testsGrid}>
                      {profilTests.map(test => (
                        <div 
                          key={test.id} 
                          className={tailwindBtn.classes.profileList.testItem}
                          onClick={() => onTestClick(test)}
                        >
                          <md-ripple></md-ripple>
                          <div className={tailwindBtn.classes.profileList.testName}>{test.name}</div>
                          <div className={tailwindBtn.classes.profileList.testDetail}>
                            <span>Material: </span>
                            {test.material && test.material.length > 0 ? (
                              <div className={tailwindBtn.classes.profileList.materialBadgesContainer}>
                                {test.material.map((materialId, index) => (
                                  <MaterialBadge key={index} materialId={materialId} mini={true} />
                                ))}
                              </div>
                            ) : (
                              <span className={tailwindBtn.classes.profileList.noMaterialInfo}>Keine Angabe</span>
                            )}
                          </div>
                          {test.synonyme?.length > 0 && (
                            <div className={tailwindBtn.classes.profileList.testSynonyms}>
                              <small>{test.synonyme.join(', ')}</small>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default StandardProfileListe;
