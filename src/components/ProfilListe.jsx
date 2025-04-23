import React, { useState } from 'react';
import './ProfilListe.css';
import TestDetails from './TestDetails';
import * as MaterialDesign from "react-icons/md";
import '@material/web/ripple/ripple.js';
import '@material/web/elevation/elevation.js';
import { useMaterialService } from '../services/MaterialService';
import MaterialBadge from './MaterialBadge';

function ProfilListe({ tests, profile }) {
  const [expandedProfiles, setExpandedProfiles] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const { convertMaterialIdsToNames, isLoading: materialsLoading } = useMaterialService();

  // Funktion zum Umschalten der Profil-Expansion
  const toggleProfile = (profilId) => {
    if (expandedProfiles.includes(profilId)) {
      setExpandedProfiles(expandedProfiles.filter(id => id !== profilId));
    } else {
      setExpandedProfiles([...expandedProfiles, profilId]);
    }
  };

  const handleTestClick = (test) => {
    setSelectedTest(test);
  };

  const handleCloseDetails = () => {
    setSelectedTest(null);
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
    <div className="profil-liste-container">
      {profile.length === 0 ? (
        <p className="keine-profile">Keine Profile gefunden.</p>
      ) : (
        sortedProfiles.map(profil => {
          const isExpanded = expandedProfiles.includes(profil.id);
          const profilTests = tests.filter(test => 
            profil.tests.includes(test.id)
          );
          
          return (
            <div key={profil.id} className="profil-karte md-elevation-2">
              <div className="profil-header" onClick={() => toggleProfile(profil.id)}>                <md-ripple></md-ripple>                <div className="profil-info">                  <div className="profil-title-row">
                    <h3 className={`kategorie-text-${profil.kategorie.toLowerCase().replace(/\s+/g, '-')}`}>{profil.name}</h3>
                    {/* Sortier-Nummer für Endbenutzer ausgeblendet 
                    {profil.sortierNummer !== undefined && (
                      <span className="sortier-nummer">{profil.sortierNummer}</span>
                    )}
                    */}
                  </div>
                  <p className="profil-beschreibung">{profil.beschreibung}</p>
                  <p className={`profil-kategorie kategorie-${profil.kategorie.toLowerCase().replace(/\s+/g, '-')}`}>{profil.kategorie}</p>
                </div>
                <div className="profil-expand-icon">
                  {isExpanded ? 
                    <MaterialDesign.MdExpandLess style={{fontSize: "24px"}} /> : 
                    <MaterialDesign.MdExpandMore style={{fontSize: "24px"}} />
                  }
                </div>
              </div>
              
              {isExpanded && (
                <div className="profil-tests">
                  <p className="profil-tests-header">Enthaltene Tests:</p>
                  {profilTests.length === 0 ? (
                    <p className="keine-tests-info">Keine Tests in diesem Profil gefunden.</p>
                  ) : (
                    <div className="profil-tests-grid">
                      {profilTests.map(test => (
                        <div 
                          key={test.id} 
                          className="profil-test-item"
                          onClick={() => handleTestClick(test)}
                        >
                          <md-ripple></md-ripple>                          <div className="profil-test-name">{test.name}</div>
                          <div className="profil-test-detail">
                            <span>Material: </span>
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
                          {test.synonyme?.length > 0 && (
                            <div className="profil-test-synonyme">
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

      {selectedTest && (
        <TestDetails 
          test={selectedTest} 
          onClose={handleCloseDetails} 
        />
      )}
    </div>
  );
}

export default ProfilListe;
