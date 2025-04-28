# Persönliche Profile - Entwurf für Komponenten

Diese Datei enthält Code-Vorlagen für die Implementierung der "Persönliche Profile" Funktionalität.

## ProfilListe.jsx (Erweiterte Version)

```jsx
import React, { useState, useEffect } from 'react';
import MaterialDesign from "react-icons/md";
import tailwindBtn from './tailwindBtn';
import StandardProfileListe from './StandardProfileListe';
import PersoenlicheProfileListe from './PersoenlicheProfileListe';

function ProfilListe() {
  const [activeSubTab, setActiveSubTab] = useState('standard');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name');
  
  return (
    <div className="profil-liste-container">
      {/* Suchleiste */}
      <div className={tailwindBtn.classes.search.container}>
        <input
          type="text"
          className={tailwindBtn.classes.search.input}
          placeholder="Profile durchsuchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <MaterialDesign.MdSearch className={tailwindBtn.classes.search.icon} />
      </div>
      
      {/* Sortierung */}
      <div className={tailwindBtn.classes.sortMenu.container}>
        <span className={tailwindBtn.classes.sortMenu.label}>Sortieren nach:</span>
        <select
          className={tailwindBtn.classes.sortMenu.select}
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="name">Name</option>
          <option value="kategorie">Kategorie</option>
          <option value="anzahlTests">Anzahl Tests</option>
        </select>
      </div>
      
      {/* Sub-Tab Navigation */}
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
      
      {/* Profilinhalte basierend auf aktivem Tab */}
      {activeSubTab === 'standard' ? (
        <StandardProfileListe 
          searchTerm={searchTerm}
          sortOption={sortOption}
        />
      ) : (
        <PersoenlicheProfileListe 
          searchTerm={searchTerm}
          sortOption={sortOption}
        />
      )}
    </div>
  );
}

export default ProfilListe;
```

## StandardProfileListe.jsx (Extrahierte bestehende Funktionalität)

```jsx
import React from 'react';
import tailwindBtn from './tailwindBtn';
// Weitere Imports...

function StandardProfileListe({ searchTerm, sortOption }) {
  // Der bestehende Code aus der aktuellen ProfilListe-Komponente
  // mit den Anpassungen für die Suchterm- und Sortieroptions-Props
  
  return (
    <div className="standard-profile-liste">
      {/* Bestehender Code für die Anzeige der Standard-Profile */}
    </div>
  );
}

export default StandardProfileListe;
```

## PersoenlicheProfileListe.jsx

```jsx
import React, { useState, useEffect } from 'react';
import MaterialDesign from "react-icons/md";
import tailwindBtn from './tailwindBtn';
import ProfilCard from './ProfilCard';  // Wiederverwendbare Karte für Profile

function PersoenlicheProfileListe({ searchTerm, sortOption }) {
  const [persoenlicheProfile, setPersoenlicheProfile] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Laden der persönlichen Profile aus dem LocalStorage
  useEffect(() => {
    const geladeneProfile = JSON.parse(localStorage.getItem('persoenlicheProfile') || '[]');
    setPersoenlicheProfile(geladeneProfile);
    setLoading(false);
  }, []);
  
  // Profil löschen
  const handleDelete = (profilId) => {
    if (window.confirm('Möchten Sie dieses Profil wirklich löschen?')) {
      const aktualisierteListe = persoenlicheProfile.filter(profil => profil.id !== profilId);
      setPersoenlicheProfile(aktualisierteListe);
      localStorage.setItem('persoenlicheProfile', JSON.stringify(aktualisierteListe));
    }
  };
  
  // Filtern und Sortieren der Profile
  const filteredAndSortedProfiles = persoenlicheProfile
    .filter(profil => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        profil.name.toLowerCase().includes(term) ||
        profil.beschreibung.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      if (sortOption === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortOption === 'erstelltAm') {
        return new Date(b.erstelltAm) - new Date(a.erstelltAm);
      } else if (sortOption === 'anzahlTests') {
        return b.tests.length - a.tests.length;
      }
      return 0;
    });
  
  // Exportieren und Importieren
  const exportProfile = () => {
    const dataStr = "data:text/json;charset=utf-8," + 
      encodeURIComponent(JSON.stringify(persoenlicheProfile));
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
          setPersoenlicheProfile(importedProfiles);
          localStorage.setItem('persoenlicheProfile', JSON.stringify(importedProfiles));
        } else {
          throw new Error('Ungültiges Format: Keine Array-Struktur');
        }
      } catch (error) {
        alert('Fehler beim Importieren: ' + error.message);
      }
    };
    reader.readAsText(file);
  };
  
  if (loading) {
    return <div className={tailwindBtn.classes.loading}>Lädt persönliche Profile...</div>;
  }
  
  return (
    <div className="persoenliche-profile-container">
      {/* Import/Export-Buttons */}
      <div className={tailwindBtn.classes.actionBar}>
        <button 
          className={tailwindBtn.classes.secondaryButton}
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
          className={tailwindBtn.classes.secondaryButton}
          onClick={exportProfile}
          disabled={persoenlicheProfile.length === 0}
        >
          <MaterialDesign.MdFileDownload /> Profile exportieren
        </button>
      </div>
      
      {filteredAndSortedProfiles.length === 0 ? (
        <div className={tailwindBtn.classes.emptyState}>
          <MaterialDesign.MdBookmarkBorder style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <p className={tailwindBtn.classes.emptyStateHeading}>Keine persönlichen Profile</p>
          <p className={tailwindBtn.classes.emptyStateText}>
            Sie haben noch keine persönlichen Profile gespeichert. 
            Wählen Sie Tests in der Test-Ansicht aus und speichern Sie sie als persönliches Profil.
          </p>
        </div>
      ) : (
        <div className="profile-grid">
          {filteredAndSortedProfiles.map(profil => (
            <ProfilCard 
              key={profil.id}
              profil={profil}
              onDelete={() => handleDelete(profil.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PersoenlicheProfileListe;
```

## ProfilCard.jsx (Wiederverwendbare Komponente)

```jsx
import React from 'react';
import MaterialDesign from "react-icons/md";
import tailwindBtn from './tailwindBtn';
import { useNavigate } from 'react-router-dom'; // Falls react-router verwendet wird

function ProfilCard({ profil, onDelete }) {
  const navigate = useNavigate();
  
  const navigateToDetail = () => {
    // Zum Detail navigieren oder Dialog öffnen
    navigate(`/profile/${profil.id}`);
  };
  
  // Formatiere das Datum
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };
  
  return (
    <div className={tailwindBtn.classes.card}>
      <div className={tailwindBtn.classes.cardHeader}>
        <h3 className={tailwindBtn.classes.cardTitle}>{profil.name}</h3>
        <span className={tailwindBtn.classes.cardBadge}>
          {profil.tests.length} Tests
        </span>
      </div>
      
      <p className={tailwindBtn.classes.cardDescription}>
        {profil.beschreibung || 'Keine Beschreibung verfügbar'}
      </p>
      
      <div className={tailwindBtn.classes.cardDate}>
        Erstellt am {formatDate(profil.erstelltAm)}
      </div>
      
      {/* Test-Liste (Gekürzt) */}
      <div className={tailwindBtn.classes.cardTags}>
        {profil.tests.slice(0, 3).map(test => (
          <span key={test.id} className={tailwindBtn.classes.cardTag}>
            {test.name}
          </span>
        ))}
        {profil.tests.length > 3 && (
          <span className={tailwindBtn.classes.cardTagMore}>
            +{profil.tests.length - 3} weitere
          </span>
        )}
      </div>
      
      {/* Aktionsbuttons */}
      <div className={tailwindBtn.classes.cardActions}>
        <button 
          className={tailwindBtn.classes.iconButton}
          onClick={navigateToDetail}
          aria-label="Details anzeigen"
        >
          <MaterialDesign.MdVisibility />
        </button>
        
        <button 
          className={tailwindBtn.classes.iconButton}
          onClick={() => window.print()} // Hier könnte eine spezifische Druckfunktion aufgerufen werden
          aria-label="Profil drucken"
        >
          <MaterialDesign.MdPrint />
        </button>
        
        <button 
          className={`${tailwindBtn.classes.iconButton} ${tailwindBtn.classes.iconButtonDanger}`}
          onClick={onDelete}
          aria-label="Profil löschen"
        >
          <MaterialDesign.MdDelete />
        </button>
      </div>
    </div>
  );
}

export default ProfilCard;
```

## ProfilSpeichernDialog.jsx

```jsx
import React, { useState } from 'react';
import MaterialDesign from "react-icons/md";
import tailwindBtn from './tailwindBtn';
import '@material/web/dialog/dialog.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/button/text-button.js';

function ProfilSpeichernDialog({ selectedTests, onClose, onSave }) {
  const [name, setName] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  
  const handleSave = () => {
    if (!name.trim()) return;
    
    const neuesProfil = {
      id: `profil_${Date.now()}`,
      name: name.trim(),
      beschreibung: beschreibung.trim(),
      erstelltAm: new Date().toISOString(),
      tests: selectedTests
    };
    
    onSave(neuesProfil);
  };
  
  return (
    <div className={tailwindBtn.classes.modalBackdrop}>
      <div className={tailwindBtn.classes.modal}>
        <div className={tailwindBtn.classes.modalHeader}>
          <h2 className={tailwindBtn.classes.modalTitle}>
            <MaterialDesign.MdBookmarkAdd className={tailwindBtn.classes.modalIcon} />
            Persönliches Profil speichern
          </h2>
          <button 
            className={tailwindBtn.classes.modalCloseButton}
            onClick={onClose}
            aria-label="Schließen"
          >
            <MaterialDesign.MdClose />
          </button>
        </div>
        
        <div className={tailwindBtn.classes.modalBody}>
          <p className={tailwindBtn.classes.modalInfo}>
            Sie speichern {selectedTests.length} ausgewählte Tests als persönliches Profil.
          </p>
          
          <div className={tailwindBtn.classes.formGroup}>
            <md-filled-text-field
              label="Name des Profils"
              required
              value={name}
              onInput={(e) => setName(e.target.value)}
            ></md-filled-text-field>
          </div>
          
          <div className={tailwindBtn.classes.formGroup}>
            <md-filled-text-field
              label="Beschreibung (optional)"
              type="textarea"
              rows="3"
              value={beschreibung}
              onInput={(e) => setBeschreibung(e.target.value)}
            ></md-filled-text-field>
          </div>
        </div>
        
        <div className={tailwindBtn.classes.modalFooter}>
          <button 
            className={tailwindBtn.classes.secondaryButton}
            onClick={onClose}
          >
            Abbrechen
          </button>
          
          <button 
            className={tailwindBtn.classes.primaryButton}
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Profil speichern
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilSpeichernDialog;
```

## Erweiterung von TestListe.jsx

```jsx
// In TestListe.jsx hinzufügen:

// Import für den Speicher-Dialog
import ProfilSpeichernDialog from './ProfilSpeichernDialog';

// State für den Dialog
const [showSpeichernDialog, setShowSpeichernDialog] = useState(false);
const [speicherFeedback, setSpeicherFeedback] = useState({ 
  show: false, 
  success: false, 
  message: '' 
});

// Funktion zum Speichern eines persönlichen Profils
const saveToPersoenlicheProfile = (profil) => {
  // Bestehende Profile laden
  const existingProfiles = JSON.parse(localStorage.getItem('persoenlicheProfile') || '[]');
  
  // Neues Profil hinzufügen
  existingProfiles.push(profil);
  
  // Im localStorage speichern
  localStorage.setItem('persoenlicheProfile', JSON.stringify(existingProfiles));
  
  // Dialog schließen und Feedback anzeigen
  setShowSpeichernDialog(false);
  setSpeicherFeedback({
    show: true,
    success: true,
    message: 'Profil erfolgreich gespeichert!'
  });
  
  // Feedback nach 3 Sekunden ausblenden
  setTimeout(() => {
    setSpeicherFeedback({ show: false, success: false, message: '' });
  }, 3000);
};

// Button zum Speichermenü hinzufügen
<button
  className={tailwindBtn.classes.secondaryButton}
  onClick={() => setShowSpeichernDialog(true)}
  disabled={selectedTests.length === 0}
>
  <MaterialDesign.MdBookmarkAdd /> Als persönliches Profil speichern
</button>

// Dialog und Feedback in den Render-Bereich einfügen
{showSpeichernDialog && (
  <ProfilSpeichernDialog
    selectedTests={selectedTests.map(testId => {
      // Finde die Test-Details für die ausgewählte ID
      const testDetails = tests.find(test => test.id === testId);
      return {
        id: testDetails.id,
        name: testDetails.name
      };
    })}
    onClose={() => setShowSpeichernDialog(false)}
    onSave={saveToPersoenlicheProfile}
  />
)}

{speicherFeedback.show && (
  <div className={`
    ${tailwindBtn.classes.toast}
    ${speicherFeedback.success ? tailwindBtn.classes.successToast : tailwindBtn.classes.errorToast}
  `}>
    {speicherFeedback.message}
  </div>
)}
```

## Erweiterte tailwindBtn.js Klassen

```javascript
// Zu tailwindBtn.js hinzufügen:

// Tab-Navigation
tabContainer: "flex border-b border-gray-200 dark:border-gray-700 mb-4",
tab: "px-4 py-2 font-medium text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors",
activeTab: "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400",

// Karten-Layout für Profile
card: "bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md",
cardHeader: "flex justify-between items-center mb-2",
cardTitle: "text-lg font-medium text-gray-900 dark:text-white",
cardBadge: "bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs font-medium px-2 py-1 rounded-full",
cardDescription: "text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2",
cardDate: "text-xs text-gray-400 dark:text-gray-500 mb-3",
cardTags: "flex flex-wrap gap-1 mb-3",
cardTag: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs px-2 py-1 rounded",
cardTagMore: "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded italic",
cardActions: "flex justify-end gap-2",

// Leerer Zustand
emptyState: "flex flex-col items-center justify-center py-12",
emptyStateHeading: "text-lg font-medium text-gray-900 dark:text-white mb-2",
emptyStateText: "text-gray-500 dark:text-gray-400 text-center max-w-md",

// Modals
modalBackdrop: "fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50",
modal: "bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto",
modalHeader: "flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700",
modalTitle: "text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2",
modalIcon: "text-primary-600 dark:text-primary-400",
modalCloseButton: "text-gray-400 hover:text-gray-500 dark:hover:text-gray-300",
modalBody: "p-4",
modalInfo: "text-sm text-gray-500 dark:text-gray-400 mb-4",
modalFooter: "flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700",

// Toast-Nachrichten
toast: "fixed bottom-4 right-4 p-3 rounded shadow-lg z-50 transition-opacity duration-300",
successToast: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100",
errorToast: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100",

// Action Bar
actionBar: "flex justify-end gap-2 mb-4",
```
