import { useState, useRef } from 'react';
import './ProfilErstellungDialog.css';
import * as MaterialDesign from "react-icons/md";

function ProfilErstellungDialog({ selectedTests, onClose, onPrint }) {
  const [profilName, setProfilName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const dialogRef = useRef(null);

  const handlePrint = () => {
    // Erstellt ein Objekt mit allen Profilinfos
    const profil = {
      profilName,
      userName,
      email,
      tests: selectedTests,
      erstelltAm: new Date().toLocaleDateString('de-DE')
    };
    
    if (onPrint) onPrint(profil);
  };

  // Animation für Dialog Entry/Exit
  const handleDialogClose = () => {
    if (dialogRef.current) {
      dialogRef.current.classList.add('closing');
      setTimeout(() => {
        if (onClose) onClose();
      }, 300); // Animation Zeit
    } else {
      if (onClose) onClose();
    }
  };

  return (
    <div className="profile-dialog-overlay">
      <div className="profile-dialog" ref={dialogRef}>
        <div className="profile-dialog-header">
          <h2>Neues Profil erstellen</h2>
          <button className="close-button" onClick={handleDialogClose}>
            <MaterialDesign.MdClose />
          </button>
        </div>
        
        <div className="profile-dialog-content">
          <div className="form-group">
            <label htmlFor="profil-name">Profilname:</label>
            <input 
              type="text" 
              id="profil-name"
              value={profilName}
              onChange={(e) => setProfilName(e.target.value)}
              placeholder="z.B. Notfall-Panel" 
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="user-name">Ihr Name:</label>
            <input 
              type="text"
              id="user-name" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Vor- und Nachname" 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="user-email">E-Mail:</label>
            <input 
              type="email"
              id="user-email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="beispiel@labor.de" 
            />
          </div>
          
          <div className="selected-tests">
            <h3>Ausgewählte Tests ({selectedTests.length}):</h3>
            <ul className="selected-tests-list">
              {selectedTests.map(test => (
                <li key={test.id} className="selected-test-item">
                  <div className="test-info">
                    <span className="test-id">{test.id}</span>
                    <span className="test-name">{test.name}</span>
                  </div>
                  <span className={`test-category category-${test.kategorie ? test.kategorie.toLowerCase().replace(/\s+/g, '-') : 'unknown'}`}>
                    {test.kategorie || 'Keine Kategorie'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="profile-dialog-footer">
          <button className="cancel-button" onClick={handleDialogClose}>Abbrechen</button>
          <button 
            className="print-button"
            onClick={handlePrint}
            disabled={!profilName.trim()}
          >
            <MaterialDesign.MdPrint style={{marginRight: '8px'}} />
            Profil drucken
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilErstellungDialog;