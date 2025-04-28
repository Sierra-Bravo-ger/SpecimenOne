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

  // Funktion zum Umschalten der Profil-Expansion
  const toggleProfile = (profilId) => {
    if (expandedProfiles.includes(profilId)) {
      setExpandedProfiles(expandedProfiles.filter(id => id !== profilId));
    } else {
      setExpandedProfiles([...expandedProfiles, profilId]);
    }
  };

  // Sortiere Profile nach sortierNummer (falls vorhanden) oder nach ID als Fallback
  const sortedProfiles = [...profile].sort((a, b) => {
    // Primär nach sortierNummer sortieren, falls vorhanden
    if (a.sortierNummer !== undefined && b.sortierNummer !== undefined) {
      return a.sortierNummer - b.sortierNummer;
    }
    // Sekundär nach ID sortieren
    return a.id.localeCompare(b.id);
  });

  return (
    <div className={tailwindBtn.classes.profileList.container}>
      {profile.length === 0 ? (
        <p className={tailwindBtn.classes.profileList.noProfilesMessage}>Keine Profile gefunden.</p>
      ) : (
        sortedProfiles.map(profil => {
          const isExpanded = expandedProfiles.includes(profil.id);
          const profilTests = tests.filter(test => 
            profil.tests.includes(test.id)
          );

          return (
            <div key={profil.id} className={`${tailwindBtn.classes.profileList.card} md-elevation-2`}>
              <div className={tailwindBtn.classes.profileList.header} onClick={() => toggleProfile(profil.id)}>
                <md-ripple></md-ripple>
                <div className={tailwindBtn.classes.profileList.info}>
                  <div className={tailwindBtn.classes.profileList.titleRow}>
                    <h3 className={`${tailwindBtn.classes.profileList.title} kategorie-text-${profil.kategorie.toLowerCase().replace(/\s+/g, '-')}`}>{profil.name}</h3>
                  </div>
                  <p className={tailwindBtn.classes.profileList.description}>{profil.beschreibung}</p>
                  <p className={`${tailwindBtn.classes.profileList.category} kategorie-badge kategorie-${profil.kategorie.toLowerCase().replace(/\s+/g, '-')}`}>{profil.kategorie}</p>
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
