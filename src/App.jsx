import { useState, useEffect } from 'react'
import './App.css'
import './material-theme.css'
import TestListe from './components/TestListe'
import ProfilListe from './components/ProfilListe'
import DrilldownTable from './components/DrilldownTable'
import TestDetails from './components/TestDetails'
import Suchleiste from './components/Suchleiste'
import ProfilErstellungDialog from './components/ProfilErstellungDialog'
import ProfilDruckAnsicht from './components/ProfilDruckAnsicht'
import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/icon/icon.js'
import '@material/web/progress/circular-progress.js'
import '@material/web/tabs/primary-tab.js'
import '@material/web/tabs/tabs.js'
import * as MaterialDesign from "react-icons/md"

function App() {
  const [tests, setTests] = useState([])
  const [profile, setProfile] = useState([])
  const [ansicht, setAnsicht] = useState('tests') // 'tests', 'profile' oder 'tabelle'
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [suchbegriff, setSuchbegriff] = useState('')
  const [selectedKategorie, setSelectedKategorie] = useState('Alle')
  const [darkMode, setDarkMode] = useState(false)
  const [selectedTest, setSelectedTest] = useState(null)
  const [showTestDetails, setShowTestDetails] = useState(false)
  // Neue State-Variablen für die Profil-Selektor Funktionalität
  const [selectedTests, setSelectedTests] = useState([])
  const [showProfilErstellung, setShowProfilErstellung] = useState(false)
  const [showProfilDruck, setShowProfilDruck] = useState(false)
  const [customProfil, setCustomProfil] = useState(null)
  // Effect to handle dark mode changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);
  
  // Überprüfen der URL-Parameter beim Laden
  useEffect(() => {
    // Nur ausführen, wenn Tests geladen sind
    if (tests.length === 0) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('test');
    
    if (testId) {
      const foundTest = tests.find(test => test.id === testId);
      if (foundTest) {
        setSelectedTest(foundTest);
        setShowTestDetails(true);
      }
    }
  }, [tests]);
  
  // Überprüfen der URL-Parameter beim Laden
  useEffect(() => {
    // Nur ausführen, wenn Tests geladen sind
    if (tests.length === 0) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('test');
    
    if (testId) {
      const foundTest = tests.find(test => test.id === testId);
      if (foundTest) {
        setSelectedTest(foundTest);
        setShowTestDetails(true);
      }
    }
  }, [tests]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Tests laden
        const testsResponse = await fetch('/tests.json')
        if (!testsResponse.ok) {
          throw new Error('Fehler beim Laden der Testdaten')
        }
        const testsData = await testsResponse.json()
        setTests(testsData)

        // Profile laden
        const profileResponse = await fetch('/profile.json')
        if (!profileResponse.ok) {
          throw new Error('Fehler beim Laden der Profildaten')
        }
        const profileData = await profileResponse.json()
        setProfile(profileData)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])  

  // Filterung für Suche und Kategorie implementieren  
  const filteredTests = tests.filter(test => {
    // Erst nach Kategorie filtern
    if (selectedKategorie !== 'Alle' && test.kategorie !== selectedKategorie) {
      return false;
    }
    
    // Wenn kein Suchbegriff, dann nur nach Kategorie filtern
    if (!suchbegriff) {
      return true;
    }
    
    const searchTerm = suchbegriff.toLowerCase();
    
    // Suche im Namen
    if (test.name && test.name.toLowerCase().includes(searchTerm)) {
      return true;
    }
    // Suche in Synonymen
    if (test.synonyme && test.synonyme.some(synonym => 
      synonym.toLowerCase().includes(searchTerm))
    ) {
      return true;
    }
    // Suche in Kategorie
    if (test.kategorie && test.kategorie.toLowerCase().includes(searchTerm)) {
      return true;
    }
    // Suche in LOINC-Code
    if (test.loinc && test.loinc.toLowerCase().includes(searchTerm)) {
      return true;
    }    // Suche in Test-ID
    if (test.id && test.id.toLowerCase().includes(searchTerm)) {
      return true;
    }
    // Suche im Material
    if (test.material && Array.isArray(test.material) && test.material.some(mat => 
      mat.toLowerCase().includes(searchTerm))
    ) {
      return true;
    }
    return false;
  });
  // Filterung für Profile mit Berücksichtigung der Kategorie
  const filteredProfile = profile.filter(profil => {
    // Erst nach Kategorie filtern
    if (selectedKategorie !== 'Alle' && profil.kategorie !== selectedKategorie) {
      return false;
    }
    
    // Wenn kein Suchbegriff, dann nur nach Kategorie filtern
    if (!suchbegriff) {
      return true;
    }
    const searchTerm = suchbegriff.toLowerCase();
    return profil.name.toLowerCase().includes(searchTerm) || 
           profil.beschreibung.toLowerCase().includes(searchTerm) || 
           profil.kategorie.toLowerCase().includes(searchTerm);
  });
  const handleSuchbegriffChange = (newValue) => {
    setSuchbegriff(newValue);
  };
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  // Funktion zum Öffnen der Testdetails
  const openTestDetails = (test) => {
    setSelectedTest(test);
    setShowTestDetails(true);
  };
  
  // Funktion zum Schließen der Testdetails
  const closeTestDetails = () => {
    setShowTestDetails(false);
    
    // URL-Parameter entfernen, wenn vorhanden
    if (window.location.search) {
      const url = new URL(window.location);
      url.search = '';
      window.history.replaceState({}, '', url);
    }
  };

  // Profil-Selektor Funktionen
  const handleTestSelect = (tests) => {
    setSelectedTests(tests);
  };

  const openProfilErstellung = () => {
    if (selectedTests.length > 0) {
      setShowProfilErstellung(true);
    } else {
      alert("Bitte wählen Sie mindestens einen Test aus, um ein Profil zu erstellen.");
    }
  };

  const closeProfilErstellung = () => {
    setShowProfilErstellung(false);
  };

  const handleProfilPrint = (profil) => {
    setCustomProfil(profil);
    setShowProfilErstellung(false);
    setShowProfilDruck(true);
  };

  const closeProfilDruck = () => {
    setShowProfilDruck(false);
    setSelectedTests([]);
  };
  
  return (
    <div className={`app-container ${darkMode ? 'dark-theme' : ''}`}>      <header className="app-header">
        <div className="app-title">
          <img src="/images/icon-512x512.png" alt="SpecimenOne Logo" className="app-logo large-logo" />
          <h1>SpecimenOne</h1>
        </div>
        <button className="theme-toggle" onClick={toggleDarkMode} aria-label="Farbmodus wechseln">
          {darkMode ? <MaterialDesign.MdLightMode /> : <MaterialDesign.MdDarkMode />}
        </button>
      </header>
      <main>
        {isLoading && <md-circular-progress indeterminate></md-circular-progress>}
        {error && <p className="error-message">Fehler: {error}</p>}
        
        {!isLoading && !error && (
          <>
            <div className="search-and-tabs">              <Suchleiste 
                suchbegriff={suchbegriff} 
                onSuchbegriffChange={handleSuchbegriffChange}
                selectedKategorie={selectedKategorie}
                onKategorieChange={setSelectedKategorie}
              />              <div className="ansicht-tabs">
                <div className="tabs-container">
                  <button 
                    className={`tab-button ${ansicht === 'tests' ? 'active' : ''}`}
                    onClick={() => setAnsicht('tests')}
                  >
                    <MaterialDesign.MdListAlt style={{marginRight: '0.5rem'}} /> Einzelne Tests
                  </button>
                  <button 
                    className={`tab-button ${ansicht === 'profile' ? 'active' : ''}`}
                    onClick={() => setAnsicht('profile')}
                  >
                    <MaterialDesign.MdFolderOpen style={{marginRight: '0.5rem'}} /> Test-Profile
                  </button>
                  <button 
                    className={`tab-button ${ansicht === 'tabelle' ? 'active' : ''}`}
                    onClick={() => setAnsicht('tabelle')}
                  >
                    <MaterialDesign.MdTableView style={{marginRight: '0.5rem'}} /> Tabellen-Ansicht
                  </button>
                </div>
              </div>
            </div>

            <div className="content-container">
              {ansicht === 'tests' && (
                <>
                  {selectedTests.length > 0 && (
                    <div className="selection-controls">
                      <div className="selected-count">
                        {selectedTests.length} Test{selectedTests.length !== 1 ? 'e' : ''} ausgewählt
                      </div>
                      <button 
                        className="create-profile-button"
                        onClick={openProfilErstellung}
                      >
                        <MaterialDesign.MdCreateNewFolder style={{marginRight: '8px'}} />
                        Profil erstellen
                      </button>
                    </div>
                  )}
                  <TestListe 
                    tests={filteredTests} 
                    onTestClick={openTestDetails}
                    selectedTests={selectedTests}
                    onTestSelect={handleTestSelect}
                  />
                </>
              )}
              
              {ansicht === 'profile' && (
                <ProfilListe tests={tests} profile={filteredProfile} />
              )}
              
              {ansicht === 'tabelle' && (
                <DrilldownTable 
                  data={filteredTests}
                  columns={[
                    { id: 'id', label: 'Test ID', width: '10%' },
                    { id: 'name', label: 'Test', width: '30%' },
                    { 
                      id: 'material', 
                      label: 'Material', 
                      width: '30%',
                      render: (item) => Array.isArray(item.material) ? item.material.join(', ') : item.material
                    },
                    { id: 'befundzeit', label: 'TAT', width: '15%' }
                  ]}
                  groupBy="kategorie"
                  renderDetail={(test) => (
                    <div className="test-quick-details">
                      {test.synonyme?.length > 0 && (
                        <p><strong>Synonyme:</strong> {test.synonyme.join(', ')}</p>
                      )}
                      <p><strong>LOINC:</strong> {test.loinc || 'N/A'}</p>
                      <p><strong>Lagerung:</strong> {test.lagerung}</p>
                      <p><strong>Durchführung:</strong> {test.durchführung}</p>
                      {(test.ebm || test.goae) && (
                        <p>
                          <strong>Abrechnung:</strong> {' '}
                          {test.ebm && <span>EBM: {test.ebm}</span>} {' '}
                          {test.goae && <span>GOÄ: {test.goae}</span>}
                        </p>
                      )}                      <div style={{marginTop: '10px'}}>
                        <md-filled-button onClick={() => openTestDetails(test)}>
                          Details anzeigen
                        </md-filled-button>
                      </div>
                    </div>
                  )}
                />
              )}
            </div>
          </>
        )}      
        </main>      <footer className="app-footer">
        <p>© {new Date().getFullYear()} SpecimenOne</p>
      </footer>
      
      {/* Test-Details Dialog */}
      {showTestDetails && selectedTest && (
        <TestDetails 
          test={selectedTest}
          onClose={closeTestDetails}
        />
      )}
      
      {/* Profil-Erstellungsdialog */}
      {showProfilErstellung && (
        <ProfilErstellungDialog
          selectedTests={selectedTests}
          onClose={closeProfilErstellung}
          onPrint={handleProfilPrint}
        />
      )}
      
      {/* Profildruck-Ansicht */}
      {showProfilDruck && customProfil && (
        <ProfilDruckAnsicht
          profil={customProfil}
          onClose={closeProfilDruck}
        />
      )}
    </div>
  )
}

export default App