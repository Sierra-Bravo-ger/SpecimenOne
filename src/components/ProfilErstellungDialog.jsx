import { useState, useRef, useEffect } from 'react';
import './ProfilErstellungDialog.css';
import * as MaterialDesign from "react-icons/md";
import { sendProfilByFormSubmit } from '../services/FormSubmitService';
import { sendProfilToDiscord } from '../services/DiscordService';

function ProfilErstellungDialog({ selectedTests, onClose, onPrint }) {
  const [profilName, setProfilName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const dialogRef = useRef(null);

  // Profil-Objekt erstellen
  const createProfil = () => {
    return {
      profilName,
      userName,
      email,
      tests: selectedTests,
      erstelltAm: new Date().toLocaleDateString('de-DE')
    };
  };

  const handlePrint = () => {
    if (onPrint) onPrint(createProfil());
  };  const handleSendEmail = async () => {
    if (!profilName.trim()) {
      alert('Bitte geben Sie einen Profilnamen ein.');
      return;
    }
    
    try {
      setIsSending(true);
      setEmailStatus({ type: 'info', message: 'Profil wird übermittelt...' });
      
      const profilData = createProfil();
      
      // Versuche zuerst, das Profil über Discord zu senden
      try {
        await sendProfilToDiscord(profilData);
        setEmailStatus({ type: 'success', message: 'Profil erfolgreich übermittelt!' });
        
        // Dialog nach kurzer Verzögerung schließen
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
        return;
      } catch (discordError) {
        console.log('Discord-Übermittlung fehlgeschlagen, versuche FormSubmit als Fallback', discordError);
        
        // Discord fehlgeschlagen, versuche FormSubmit als Fallback
        const result = await sendProfilByFormSubmit(profilData);
        
        if (result.status === 'success') {
          setEmailStatus({ type: 'success', message: 'E-Mail erfolgreich gesendet!' });
          
          setTimeout(() => {
            if (onClose) onClose();
          }, 2000);
        } else {
          throw new Error('Unerwartete Antwort beim Versand');
        }
      }
      
    } catch (error) {
      console.error('Fehler beim Übermitteln des Profils:', error);
      setEmailStatus({ 
        type: 'error', 
        message: `Fehler beim Senden: ${error.message || 'Unbekannter Fehler'}`
      });
    } finally {
      setIsSending(false);
    }
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
          
          <div className="action-buttons">
            <button 
              className="email-button"
              onClick={handleSendEmail}
              disabled={!profilName.trim() || isSending}
            >
              <MaterialDesign.MdEmail style={{marginRight: '8px'}} />
              {isSending ? 'Wird gesendet...' : 'Per E-Mail senden'}
            </button>
            
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
        
        {emailStatus && (
          <div className={`email-status ${emailStatus.type}`}>
            <span className="status-icon">
              {emailStatus.type === 'success' && <MaterialDesign.MdCheckCircle />}
              {emailStatus.type === 'error' && <MaterialDesign.MdError />}
              {emailStatus.type === 'info' && <MaterialDesign.MdInfo />}
            </span>
            <span className="status-message">{emailStatus.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilErstellungDialog;