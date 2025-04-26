import { useState, useRef, useEffect } from 'react';
import * as MaterialDesign from "react-icons/md";
import { useAuth0 } from '@auth0/auth0-react';
import { sendProfilByFormSubmit, sendProfilToDiscord, getServiceStatus } from '../services/ServiceClient';
import tailwindBtn from './tailwindBtn';

function ProfilErstellungDialog({ selectedTests, onClose, onPrint }) {
  // Auth0 Hook für Authentifizierungsstatus
  const { isAuthenticated, loginWithRedirect, user } = useAuth0();
  
  // Sicherstellen, dass selectedTests immer ein Array ist
  const safeSelectedTests = Array.isArray(selectedTests) ? selectedTests : [];
  
  const [profilName, setProfilName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const dialogRef = useRef(null);

  // Profil-Objekt erstellen
  const createProfil = () => {
    return {
      profilName,
      userName,
      email,
      tests: safeSelectedTests,
      erstelltAm: new Date().toLocaleDateString('de-DE')
    };
  };
  const handlePrint = () => {
    if (onPrint) onPrint(createProfil());
  };
  
  const handleSendEmail = async () => {
    // Wenn Benutzer nicht eingeloggt ist, Login-Dialog anzeigen
    if (!isAuthenticated) {
      if (!isRedirecting) {
        setIsRedirecting(true);
        // Speichere Seitenzustand vor Weiterleitung
        const returnUrl = window.location.pathname + window.location.search;
        // Zum Login weiterleiten
        loginWithRedirect({
          appState: { returnTo: returnUrl }
        });
      }
      return;
    }
    
    // Normales Verhalten wenn Benutzer eingeloggt ist
    if (!profilName.trim()) {
      alert('Bitte geben Sie einen Profilnamen ein.');
      return;
    }
    
    try {
      setIsSending(true);
      setEmailStatus({ type: 'info', message: 'Profil wird übermittelt...' });
      
      // Wenn Benutzer eingeloggt ist, E-Mail-Adresse aus Profil verwenden
      const profilData = createProfil();
      if (user?.email && !email) {
        profilData.email = user.email;
      }
      
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-[var(--md-sys-color-surface)] rounded-2xl shadow-xl w-[90%] max-w-[600px] max-h-[85vh] flex flex-col animate-slideIn" ref={dialogRef}>
        <div className="flex justify-between items-center p-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <h2 className="text-xl font-medium text-[var(--md-sys-color-on-surface)] m-0">Neues Profil erstellen</h2>
          <button className={tailwindBtn.close} onClick={handleDialogClose}>
            <MaterialDesign.MdClose />
          </button>
        </div>
          <div className="p-6 overflow-y-auto flex-1">          <div className="mb-4">
            <label htmlFor="profil-name" className="block mb-2 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Profilname:</label>
            <input 
              type="text" 
              id="profil-name"
              value={profilName}
              onChange={(e) => setProfilName(e.target.value)}
              placeholder="z.B. Notfall-Panel" 
              required
              className="w-full px-4 py-2 rounded-md border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
            />
          </div>
            <div className="mb-4">
            <label htmlFor="user-name" className="block mb-2 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Ihr Name:</label>
            <input 
              type="text"
              id="user-name" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Vor- und Nachname"
              className="w-full px-4 py-2 rounded-md border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]" 
            />
          </div>
            <div className="mb-4">
            <label htmlFor="user-email" className="block mb-2 text-sm font-medium text-[var(--md-sys-color-on-surface)]">E-Mail:</label>
            <input 
              type="email"
              id="user-email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="beispiel@labor.de"
              className="w-full px-4 py-2 rounded-md border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]" 
            />
            <small className="block mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">Wird benötigt, wenn Sie das Profil per E-Mail erhalten möchten.</small>
          </div>
            <div className="mt-6">
            <h3 className="text-lg font-medium mb-2 text-[var(--md-sys-color-on-surface)]">Ausgewählte Tests ({safeSelectedTests.length}):</h3>
            <ul className="max-h-48 overflow-y-auto border rounded-md border-[var(--md-sys-color-outline-variant)] divide-y divide-[var(--md-sys-color-outline-variant)]">
              {safeSelectedTests.map(test => (
                <li key={test.id} className="flex justify-between items-center p-2 hover:bg-[var(--md-sys-color-surface-variant)]">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{test.id}</span>
                    <span className="text-sm">{test.name}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${test.kategorie ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]' : 'bg-gray-200 text-gray-700'}`}>
                    {test.kategorie || 'Keine Kategorie'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>          <div className="flex justify-between items-center mt-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
          <button 
            className={tailwindBtn.cancel} 
            onClick={handleDialogClose}
          >
            Abbrechen
          </button>
          
          <div className="flex gap-2">
            <button 
              className={tailwindBtn.secondary}
              onClick={handleSendEmail}
              disabled={!profilName.trim() || isSending}
            >
              <MaterialDesign.MdEmail className="mr-2" />
              {isSending ? 'Wird gesendet...' : 'Per E-Mail senden'}
            </button>
            
            <button 
              className={tailwindBtn.primary}
              onClick={handlePrint}
              disabled={!profilName.trim()}
            >
              <MaterialDesign.MdPrint className="mr-2" />
              Profil drucken
            </button>
          </div>
        </div>
          {emailStatus && (
          <div className={`flex items-center p-3 mt-4 rounded-md ${
            emailStatus.type === 'success' ? 'bg-green-100 text-green-800' :
            emailStatus.type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            <span className="text-xl mr-2">
              {emailStatus.type === 'success' && <MaterialDesign.MdCheckCircle />}
              {emailStatus.type === 'error' && <MaterialDesign.MdError />}
              {emailStatus.type === 'info' && <MaterialDesign.MdInfo />}
            </span>
            <span className="text-sm">{emailStatus.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilErstellungDialog;