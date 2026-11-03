# Implementierung der "Persönliche Profile" Komponente

## Überblick

Die "Persönliche Profile" Komponente erweitert die bestehende Profil-Funktionalität und ermöglicht Benutzern das Speichern, Verwalten und Wiederverwenden eigener Test-Profile. Die Komponente wird als Sub-Tab innerhalb des bestehenden Profile-Tabs integriert, ohne zusätzliche Hauptnavigationselemente hinzuzufügen.

## UI-Struktur

```
+----------------------------------------------------------+
|                       SpecimenOne                    🌙☀️ |
+----------------------------------------------------------+
|                                                          |
| 🔍 [Testname, Synonym, Materialname, ... suchen...    ]  |
|                                                          |
| Sortieren nach: [Kategorie ▼]                           |
|                                                          |
+----------------------------------------------------------+
|  Tests  |  Profile  |  Tabelle  |                        |
+----------------------------------------------------------+
|                                                          |
| | Standard-Profile | Persönliche Profile |               |
| +------------------+---------------------+               |
|                                                          |
| [Profil-Inhalte basierend auf ausgewähltem Tab]          |
|                                                          |
```

## Implementierungsschritte

### 1. Erweitern der ProfilListe.jsx mit Sub-Tab Navigation

```jsx
// In ProfilListe.jsx
import React, { useState } from 'react';
import tailwindBtn from './tailwindBtn';
// ...weitere Imports

function ProfilListe() {
  // Bestehender State
  const [activeSubTab, setActiveSubTab] = useState('standard');
  // ...weitere State-Variablen

  return (
    <div className={tailwindBtn.classes.container}>
      {/* Suchleiste und Sortierung bleiben unverändert */}
      
      {/* Neue Sub-Tab Navigation */}
      <div className={tailwindBtn.classes.tabContainer}>
        <button 
          className={`${tailwindBtn.classes.tab} ${activeSubTab === 'standard' ? tailwindBtn.classes.activeTab : ''}`}
          onClick={() => setActiveSubTab('standard')}>
          Standard-Profile
        </button>
        <button 
          className={`${tailwindBtn.classes.tab} ${activeSubTab === 'persoenlich' ? tailwindBtn.classes.activeTab : ''}`}
          onClick={() => setActiveSubTab('persoenlich')}>
          Persönliche Profile
        </button>
      </div>
      
      {/* Bedingt zu rendernder Inhalt */}
      {activeSubTab === 'standard' ? (
        // Bestehende Standard-Profile-Komponente
        <StandardProfileListe />
      ) : (
        // Neue Persönliche Profile-Komponente
        <PersoenlicheProfileListe />
      )}
    </div>
  );
}
```

### 2. Erstellen der PersoenlicheProfileListe Komponente

```jsx
// Neue Komponente in PersoenlicheProfileListe.jsx
import React, { useState, useEffect } from 'react';
import tailwindBtn from './tailwindBtn';
// ...weitere Imports

function PersoenlicheProfileListe() {
  const [persoenlicheProfile, setPersoenlicheProfile] = useState([]);
  
  // Laden der persönlichen Profile aus dem LocalStorage beim Komponenten-Mount
  useEffect(() => {
    const gespeicherteProfile = localStorage.getItem('persoenlicheProfile');
    if (gespeicherteProfile) {
      setPersoenlicheProfile(JSON.parse(gespeicherteProfile));
    }
  }, []);
  
  // Profil löschen
  const profilLoeschen = (profilId) => {
    const aktualisierteListe = persoenlicheProfile.filter(profil => profil.id !== profilId);
    setPersoenlicheProfile(aktualisierteListe);
    localStorage.setItem('persoenlicheProfile', JSON.stringify(aktualisierteListe));
  };
  
  return (
    <div className="persoenliche-profile-container">
      {persoenlicheProfile.length === 0 ? (
        <div className={tailwindBtn.classes.emptyState}>
          <p>Sie haben noch keine persönlichen Profile gespeichert.</p>
          <p>Wählen Sie Tests in der Test-Ansicht aus und speichern Sie sie als persönliches Profil.</p>
        </div>
      ) : (
        // Listenansicht der persönlichen Profile
        <div className="profile-liste">
          {persoenlicheProfile.map(profil => (
            <div key={profil.id} className={tailwindBtn.classes.card}>
              <h3 className={tailwindBtn.classes.cardTitle}>{profil.name}</h3>
              <p className={tailwindBtn.classes.cardDescription}>{profil.beschreibung}</p>
              
              {/* Test-Badges */}
              <div className={tailwindBtn.classes.badge.container}>
                {profil.tests.map(test => (
                  <span key={test.id} className={tailwindBtn.classes.badge.item}>
                    {test.name}
                  </span>
                ))}
              </div>
              
              {/* Aktions-Buttons */}
              <div className={tailwindBtn.classes.actions}>
                <button 
                  className={tailwindBtn.classes.actionButton}
                  onClick={() => handleProfilDrucken(profil)}>
                  <MaterialDesign.MdPrint /> Drucken
                </button>
                <button 
                  className={tailwindBtn.classes.actionButton}
                  onClick={() => handleProfilBearbeiten(profil)}>
                  <MaterialDesign.MdEdit /> Bearbeiten
                </button>
                <button 
                  className={tailwindBtn.classes.actionButtonDanger}
                  onClick={() => profilLoeschen(profil.id)}>
                  <MaterialDesign.MdDelete /> Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3. Speichern persönlicher Profile aus der TestListe

```jsx
// Erweiterung in TestListe.jsx
// Zum bestehenden Code hinzufügen:

const speicherePersoenlichesProfil = () => {
  if (selectedTests.length === 0) {
    alert('Bitte wählen Sie mindestens einen Test aus.');
    return;
  }
  
  // Dialog zum Speichern anzeigen
  setShowSpeichernDialog(true);
};

const handleSpeichern = (name, beschreibung) => {
  // Neues Profil erstellen
  const neuesProfil = {
    id: Date.now().toString(), // Einfache ID-Generierung
    name,
    beschreibung,
    erstelltAm: new Date().toISOString(),
    tests: selectedTests.map(testId => {
      const test = tests.find(t => t.id === testId);
      return {
        id: test.id,
        name: test.name
      };
    })
  };
  
  // Zum LocalStorage hinzufügen
  const gespeicherteProfile = JSON.parse(localStorage.getItem('persoenlicheProfile') || '[]');
  gespeicherteProfile.push(neuesProfil);
  localStorage.setItem('persoenlicheProfile', JSON.stringify(gespeicherteProfile));
  
  // Dialog schließen und Feedback anzeigen
  setShowSpeichernDialog(false);
  setSpeicherErfolgreich(true);
  setTimeout(() => setSpeicherErfolgreich(false), 3000);
};

// Füge einen zusätzlichen Button zum bestehenden Aktionsmenü hinzu:
<button
  className={tailwindBtn.classes.actionButton}
  onClick={speicherePersoenlichesProfil}
  disabled={selectedTests.length === 0}>
  <MaterialDesign.MdSave /> Als persönliches Profil speichern
</button>

// Speicher-Dialog als bedingter Render:
{showSpeichernDialog && (
  <ProfilErstellungDialog
    selectedTests={selectedTests}
    onClose={() => setShowSpeichernDialog(false)}
    onSpeichern={handleSpeichern}
    mode="save"
  />
)}

// Erfolgs-Feedback:
{speicherErfolgreich && (
  <div className={tailwindBtn.classes.successToast}>
    Profil erfolgreich gespeichert!
  </div>
)}
```

### 4. ProfilErstellungDialog Komponente

```jsx
// In ProfilErstellungDialog.jsx - wird für beide Funktionen verwendet (Erstellen und Speichern)
import { useState, useRef, useEffect } from 'react';
import * as MaterialDesign from "react-icons/md";
import { useAuth0 } from '@auth0/auth0-react';
import { sendProfilToDiscord } from '../services/ServiceClient';
import tailwindBtn from './tailwindBtn';

/**
 * Gemeinsamer Dialog für das Erstellen und Speichern von Profilen
 * 
 * @param {Object} props - Komponenten-Properties
 * @param {Array|number} props.selectedTests - Die ausgewählten Tests oder deren Anzahl
 * @param {Function} props.onClose - Callback beim Schließen des Dialogs
 * @param {Function} [props.onPrint] - Callback für Druckfunktion (nur im Erstellungsmodus)
 * @param {Function} [props.onSpeichern] - Callback zum Speichern als persönliches Profil (nur im Speichernmodus)
 * @param {('create'|'save')} [props.mode="create"] - Modus des Dialogs: "create" oder "save"
 */
function ProfilErstellungDialog({ 
  selectedTests, 
  onClose, 
  onPrint, 
  onSpeichern,
  mode = "create" // Standard-Modus ist Profil erstellen 
}) {
  const { isAuthenticated, loginWithRedirect, user } = useAuth0();
  
  // Zustandsvariablen
  const [profilName, setProfilName] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [kategorie, setKategorie] = useState('Klinische Chemie');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!profilName) return;
    
    if (mode === "save") {
      // Im Speichern-Modus: Persönliches Profil speichern
      onSpeichern(profilName, beschreibung);
    } else {
      // Im Erstellen-Modus: Standard-Profil erstellen
      // ... Code zum Erstellen eines Standard-Profils
    }
  };
  
  // Verschiedene Renders je nach Modus (erstellen oder speichern)
  return (
    <div className={tailwindBtn.classes.modalBackdrop}>
      <div className={tailwindBtn.classes.modal}>
        <h3 className={tailwindBtn.classes.modalTitle}>
          {mode === "create" ? "Neues Profil erstellen" : "Persönliches Profil speichern"}
        </h3>
        
        <form onSubmit={handleSubmit}>
          {/* Gemeinsame Formularelemente */}
          <div className={tailwindBtn.classes.formGroup}>
            <md-filled-text-field
              label="Profilname"
              required
              value={profilName}
              onInput={(e) => setProfilName(e.target.value)}
            ></md-filled-text-field>
          </div>
          
          <div className={tailwindBtn.classes.formGroup}>
            <md-filled-text-field
              label="Beschreibung (optional)"
              type="textarea"
              rows="4"
              value={beschreibung}
              onInput={(e) => setBeschreibung(e.target.value)}
            ></md-filled-text-field>
          </div>
          
          {/* Weitere Formularelemente basierend auf dem Modus */}
          
          <div className={tailwindBtn.classes.modalActions}>
            <md-text-button onClick={onClose}>
              Abbrechen
            </md-text-button>
            
            <md-text-button type="submit" disabled={!profilName}>
              {mode === "create" ? "Erstellen" : "Speichern"}
            </md-text-button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilErstellungDialog;
```

### 5. Aktualisieren von tailwindBtn.js mit neuen Klassen

```javascript
// In tailwindBtn.js die folgenden Klassen hinzufügen:

const classes = {
  // ...bestehende Klassen
  
  // Tab-Navigation
  tabContainer: "flex border-b border-gray-200 dark:border-gray-700 mb-4",
  tab: "px-4 py-2 font-medium text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
  activeTab: "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400",
  
  // Leerer Zustand
  emptyState: "text-center py-12 text-gray-500 dark:text-gray-400",
  
  // Modal für Dialoge
  modalBackdrop: "fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50",
  modal: "bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4",
  modalTitle: "text-xl font-semibold mb-4 text-gray-900 dark:text-white",
  modalActions: "flex justify-end gap-2 mt-6",
  
  // Formular-Elemente
  formGroup: "mb-4",
  
  // Feedback
  successToast: "fixed bottom-4 right-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-4 py-2 rounded shadow-lg z-50"
};
```

## Datenmodell

### Persönliches Profil
```javascript
{
  id: String,           // Eindeutige ID
  name: String,         // Name des Profils
  beschreibung: String, // Optionale Beschreibung
  erstelltAm: String,   // ISO-Datum
  tests: [              // Array ausgewählter Tests
    {
      id: String,       // Test-ID
      name: String      // Test-Name (für Anzeige)
    }
  ]
}
```

## Lokale Datenspeicherung

Die persönlichen Profile werden im LocalStorage des Browsers gespeichert:

```javascript
// Speichern
localStorage.setItem('persoenlicheProfile', JSON.stringify(profilListe));

// Laden
const profilListe = JSON.parse(localStorage.getItem('persoenlicheProfile') || '[]');
```

## Funktionen

1. **Persönliche Profile anzeigen**: Zeigt alle vom Benutzer gespeicherten Profile an
2. **Profil erstellen**: Speichert ausgewählte Tests als benanntes Profil
3. **Profil bearbeiten**: Ermöglicht das Ändern von Namen, Beschreibung oder Tests
4. **Profil löschen**: Entfernt ein gespeichertes Profil
5. **Profil drucken**: Erzeugt eine Druckansicht des Profils

## Benutzerführung

1. Benutzer navigieren zum "Tests"-Tab und wählen Tests aus
2. Sie klicken auf "Als persönliches Profil speichern"
3. Sie geben Namen und optional eine Beschreibung ein
4. Unter "Profile > Persönliche Profile" können sie ihre gespeicherten Profile anzeigen und verwalten

## Best Practices

1. **Responsive Design**: Alle UI-Elemente sollten auf verschiedenen Bildschirmgrößen gut aussehen
2. **Zugänglichkeit**: Achte auf ausreichenden Kontrast und Tastaturbedienung
3. **Fehlerbehandlung**: Zeige hilfreiche Fehlermeldungen an, falls etwas schief geht
4. **Performance**: Verwende Memoization für teure Berechnungen
5. **Konsistenz**: Folge dem bestehenden Design-System mit tailwindBtn