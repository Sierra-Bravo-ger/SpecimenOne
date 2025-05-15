import { useState, useRef, useEffect } from 'react';
import * as MaterialDesign from "react-icons/md";
// Auth0 vorübergehend deaktiviert
// import { useAuth0 } from '@auth0/auth0-react';
import { sendProfilByFormSubmit, sendProfilToDiscord, getServiceStatus } from '../services/ServiceClient';
import tailwindBtn from './tailwindBtn';

/**
 * Gemeinsamer Dialog für das Erstellen und Speichern von Profilen
 * 
 * @param {Object} props - Komponenten-Properties
 * @param {Array|number} props.selectedTests - Die ausgewählten Tests oder deren Anzahl
 * @param {Function} props.onClose - Callback beim Schließen des Dialogs
 * @param {Function} [props.onPrint] - Callback für Druckfunktion (nur im Erstellungsmodus)
 * @param {Function} [props.onSpeichern] - Callback zum Speichern als persönliches Profil (nur im Speichernmodus)
 * @param {('create'|'save')} [props.mode="create"] - Modus des Dialogs: "create" für Standard-Profile oder "save" für persönliche Profile
 * @returns {JSX.Element} Der Dialog zum Erstellen oder Speichern von Profilen
 */
function ProfilErstellungDialog({ 
  selectedTests, 
  onClose, 
  onPrint, 
  onSpeichern,
  mode = "create" // Standard-Modus ist Profil erstellen 
}) {
  // Auth0 vorübergehend deaktiviert - simuliere angemeldeten Zustand
  // const { isAuthenticated, loginWithRedirect, user } = useAuth0();
  const isAuthenticated = true; // Simuliere authentifizierten Status
  const user = { name: "Testbenutzer", email: "test@example.com" }; // Simulierter Benutzer
  const loginWithRedirect = () => console.log("Login-Funktion vorübergehend deaktiviert");
  
  // Sicherstellen, dass selectedTests immer ein Array ist
  const safeSelectedTests = Array.isArray(selectedTests) ? selectedTests : 
                          typeof selectedTests === 'number' ? Array(selectedTests).fill({}) : [];
  
  const [profilName, setProfilName] = useState('');  // DSGVO-konform: Keine Zustandsvariablen für persönliche Daten mehr
  const [beschreibung, setBeschreibung] = useState('');
  const [kategorie, setKategorie] = useState('Klinische Chemie');
  const [verfuegbareKategorien] = useState([
    'Klinische Chemie', 'Hämatologie','Gerinnung', 'Immunologie', 
    'Elektrophorese', 'Immunologie', 'Infektserologie',
    'Urinstatus', 'Toxikologie', 'Keine Kategorie'
  ]);
  const [isSending, setIsSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const dialogRef = useRef(null);
  // Profil-Objekt erstellen (DSGVO-konform ohne persönliche Daten)
  const createProfil = () => {
    return {
      profilName,
      tests: safeSelectedTests,
      erstelltAm: new Date().toLocaleDateString('de-DE'),
      kategorie: kategorie || 'Keine Kategorie',
      beschreibung: beschreibung || ''
    };
  };
    const handlePrint = async () => {
    try {
      // Zuerst das Profil an Discord senden (ohne persönliche Daten)
      const profilData = createProfil();
      
      // Als anonymisiertes Profil kennzeichnen
      profilData.anonymous = true;
      
      // Discord-Webhook aufrufen
      try {
        await sendProfilToDiscord(profilData);
        console.log('Profil-Antrag erfolgreich an Discord gesendet');
      } catch (discordError) {
        console.error('Fehler beim Senden an Discord:', discordError);
        // Fehler nicht an Benutzer zeigen, nur loggen
      }
      
      // Druckfunktion immer aufrufen, unabhängig vom Discord-Ergebnis
      if (onPrint) onPrint(profilData);
    } catch (error) {
      console.error('Fehler beim Verarbeiten des Profil-Antrags:', error);
      // Trotzdem drucken bei Fehlern
      if (onPrint) onPrint(createProfil());
    }
  };
  
  // Funktion zum Speichern eines persönlichen Profils
  const handleSpeichern = (e) => {
    e.preventDefault();
    if (!profilName.trim()) return;
    
    if (mode === "save" && onSpeichern) {
      onSpeichern(profilName.trim(), beschreibung.trim(), kategorie);
    }
    handleDialogClose();
  };
    const handleSendEmail = async (e) => {
    if (e) e.preventDefault();
    
    // Auth0-Prüfung vorübergehend deaktiviert
    /*
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
    */
    
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
      <div className="bg-[var(--md-sys-color-surface)] rounded-2xl shadow-xl w-[90%] max-w-[600px] max-h-[85vh] flex flex-col animate-slideIn" ref={dialogRef}>        <div className="flex justify-between items-center p-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <h2 className="text-xl font-medium text-[var(--md-sys-color-on-surface)] m-0">
            {mode === "create" ? "Profil-Antrag erstellen" : "Persönliches Profil speichern"}
          </h2>
          <button className={tailwindBtn.close} onClick={handleDialogClose}>
            <MaterialDesign.MdClose />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={mode === "save" ? handleSpeichern : handleSendEmail}>
            <div className="mb-4">
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
            
            {mode === "save" && (
              <div className="mb-4">
                <label htmlFor="beschreibung" className="block mb-2 text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                  Beschreibung (optional):
                </label>
                <textarea
                  id="beschreibung"
                  placeholder="Eine kurze Beschreibung des Profils"
                  rows="3"
                  className="w-full px-4 py-2 rounded-md border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                  value={beschreibung}
                  onChange={(e) => setBeschreibung(e.target.value)}
                ></textarea>
              </div>
            )}
            
            {mode === "save" && (
              <div className="mb-4">
                <label htmlFor="kategorie" className="block mb-2 text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                  Kategorie:
                </label>
                <select
                  id="kategorie"
                  className="w-full px-4 py-2 rounded-md border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                  value={kategorie}
                  onChange={(e) => setKategorie(e.target.value)}
                >
                  {verfuegbareKategorien.map((kat) => (
                    <option key={kat} value={kat}>{kat}</option>
                  ))}
                </select>
              </div>
            )}
              {/* DSGVO-konform: Keine Erfassung von Namen oder E-Mail-Adressen */}
            {mode === "create" && (
              <>
                <div className="mb-4">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-700 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700">
                    <p className="text-sm">
                      <strong>Hinweis:</strong> Aus Datenschutzgründen werden keine persönlichen Informationen wie Namen oder E-Mail-Adressen erfasst.
                    </p>
                    <p className="text-sm mt-2">
                      Nach dem Drucken und Ausfüllen des Profil-Antrags können Sie ihn per E-Mail Versenden an den Outlook Verteiler: #Laborauskunft
                    </p>
                  </div>
                </div>
              </>
            )}
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2 text-[var(--md-sys-color-on-surface)]">
                Ausgewählte Tests ({safeSelectedTests.length}):
              </h3>
              <ul className="max-h-48 overflow-y-auto border rounded-md border-[var(--md-sys-color-outline-variant)] divide-y divide-[var(--md-sys-color-outline-variant)]">
                {Array.isArray(selectedTests) && selectedTests.length > 0 ? selectedTests.map(test => (
                  <li key={test.id} className="flex justify-between items-center p-2 hover:bg-[var(--md-sys-color-surface-variant)]">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{test.id}</span>
                      <span className="text-sm">{test.name}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${test.kategorie ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]' : 'bg-gray-200 text-gray-700'}`}>
                      {test.kategorie || 'Keine Kategorie'}
                    </span>
                  </li>
                )) : (
                  <li className="p-3 text-[var(--md-sys-color-on-surface-variant)] italic">
                    {safeSelectedTests.length} Test{safeSelectedTests.length !== 1 ? 'e' : ''} ausgewählt
                  </li>
                )}
              </ul>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
              <button 
                type="button"
                className={tailwindBtn.cancel} 
                onClick={handleDialogClose}
              >
                Abbrechen
              </button>
              
              <div className="flex gap-2">
                {mode === "create" ? (
                  <>                    {/* Der E-Mail-Button wurde gemäß DSGVO-Anforderungen entfernt */}
                    
                    <button 
                      type="button"
                      className={tailwindBtn.primary}
                      onClick={handlePrint}
                      disabled={!profilName.trim()}
                    >
                      <MaterialDesign.MdPrint className="mr-2" />
                      Profil-Antrag drucken
                    </button>
                  </>
                ) : (
                  <button 
                    type="submit"
                    className={tailwindBtn.primary}
                    disabled={!profilName.trim()}
                  >
                    <MaterialDesign.MdSave className="mr-2" />
                    Profil speichern
                  </button>
                )}
              </div>
            </div>
          </form>
          
          {emailStatus && (
            <div className={`animate-fade-in-down flex items-center p-3 mt-4 rounded-md border-l-4 ${
              emailStatus.type === 'success' ? 'bg-green-100 text-green-800 border-green-500 dark:bg-green-900 dark:text-green-100 dark:border-green-700' :
              emailStatus.type === 'error' ? 'bg-red-100 text-red-800 border-red-500 dark:bg-red-900 dark:text-red-100 dark:border-red-700' :
              'bg-blue-100 text-blue-800 border-blue-500 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700'
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
    </div>
  );
}

export default ProfilErstellungDialog;