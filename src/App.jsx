import { useState, useEffect } from 'react'
import './App.css'
import './material-theme.css'
import TestListe from './components/TestListe'
import ProfilListe from './components/ProfilListe'
import Suchleiste from './components/Suchleiste'
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
  const [ansicht, setAnsicht] = useState('tests') // 'tests' oder 'profile'
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [suchbegriff, setSuchbegriff] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  // Effect to handle dark mode changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

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
  // Filterung für Suche implementieren
  const filteredTests = !suchbegriff ? tests : tests.filter(test => {
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
    return false;
  });

  // Filterung für Profile
  const filteredProfile = !suchbegriff ? profile : profile.filter(profil => {
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
  return (
    <div className={`app-container ${darkMode ? 'dark-theme' : ''}`}>
      <header className="app-header">        <div className="app-title">
          <img src="/images/icon-512x512.png" alt="SpecimenOne Logo" className="app-logo large-logo" />
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
                placeholder="Suche nach Tests, Synonymen oder Fachbereichen"
              />

              <div className="ansicht-tabs">
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
                </div>
              </div>
            </div>

            <div className="content-container">
              {ansicht === 'tests' && (
                <TestListe tests={filteredTests} />
              )}
              
              {ansicht === 'profile' && (
                <ProfilListe tests={tests} profile={filteredProfile} />
              )}
            </div>
          </>
        )}
      </main>
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Labor Test-Menü</p>
      </footer>
    </div>
  )
}

export default App