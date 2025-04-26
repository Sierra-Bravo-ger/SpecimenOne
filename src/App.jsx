import { useState, useEffect } from 'react'
import './material-theme.css'
import TestListe from './components/TestListe'
import ProfilListe from './components/ProfilListe'
import DrilldownTable from './components/DrilldownTable'
import TimelineView from './components/TimelineView';
import TestDetails from './components/TestDetails'
import MaterialBadge from './components/MaterialBadge'
import Suchleiste from './components/Suchleiste'
import SortierMenu from './components/SortierMenu'
import ProfilErstellungDialog from './components/ProfilErstellungDialog'
import ProfilDruckAnsicht from './components/ProfilDruckAnsicht'
import ThemeSwitcher from './components/ThemeSwitcher'
import LoginButton from './components/LoginButton'
import tailwindBtn from './components/tailwindBtn'
import { useAuth0 } from '@auth0/auth0-react'
import { useTheme } from './contexts/ThemeContext'
import { useMaterialService } from './services/MaterialService'
import { EinheitenServiceProvider, useEinheitenService } from './services/EinheitenService'
import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/icon/icon.js'
import '@material/web/progress/circular-progress.js'
import '@material/web/tabs/primary-tab.js'
import '@material/web/tabs/tabs.js'
import * as MaterialDesign from "react-icons/md"

// Debug-Logger Funktion
const debugLog = (message, value) => {
  console.log(`DEBUG: ${message}`, value);
  try {
    // Versuch, den Wert in einer Zeichenkette umzuwandeln
    console.log(`Type: ${typeof value}, isArray: ${Array.isArray(value)}, Value: ${JSON.stringify(value)}`);
  } catch (e) {
    console.log('Konnte Wert nicht als String darstellen:', e);
  }
};

function App() {
  // Auth0 Authentifizierungsstatus
  const { isAuthenticated, isLoading: authLoading, loginWithRedirect } = useAuth0();
  
  // State für die Auth-Weiterleitung, um Endlosschleifen zu vermeiden
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const [tests, setTests] = useState([]);
  const [profile, setProfile] = useState([]);
  const [ansicht, setAnsicht] = useState('tests'); // 'tests', 'profile' oder 'tabelle'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suchbegriff, setSuchbegriff] = useState('');
  const [selectedKategorie, setSelectedKategorie] = useState('Alle');
  const [selectedTest, setSelectedTest] = useState(null);
  const [showTestDetails, setShowTestDetails] = useState(false);
  // Neue State-Variablen für die Profil-Selektor Funktionalität
  const [selectedTests, setSelectedTests] = useState([]);
  const [showProfilErstellung, setShowProfilErstellung] = useState(false);
  const [showProfilDruck, setShowProfilDruck] = useState(false);
  const [customProfil, setCustomProfil] = useState(null);
  // Neue States für die Sortierung
  const [sortOption, setSortOption] = useState('id'); // 'id', 'name', 'kategorie', 'material'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc', 'desc'
  // Theme-Management über den ThemeContext-Hook
  const { currentTheme, isDark } = useTheme();
  // MaterialService für die Materialbezeichnungen
  const { convertMaterialIdsToNames, isLoading: materialsLoading } = useMaterialService();
  
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

  // Sortieroptionen aus localStorage laden
  useEffect(() => {
    const savedSortOption = localStorage.getItem('specimenOne.sortOption');
    const savedSortDirection = localStorage.getItem('specimenOne.sortDirection');
    
    if (savedSortOption) setSortOption(savedSortOption);
    if (savedSortDirection) setSortDirection(savedSortDirection);
  }, []);
  
  // Sortieroptionen im localStorage speichern, wenn sie sich ändern
  useEffect(() => {
    localStorage.setItem('specimenOne.sortOption', sortOption);
    localStorage.setItem('specimenOne.sortDirection', sortDirection);
  }, [sortOption, sortDirection]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Tests laden
        const testsResponse = await fetch('/tests.json');
        if (!testsResponse.ok) {
          throw new Error('Fehler beim Laden der Testdaten');
        }
        const testsData = await testsResponse.json();
        // Prüfen, ob die Daten in der neuen Struktur mit value-Attribut vorliegen
        const testsArray = testsData.value ? testsData.value : testsData;
        setTests(testsArray);

        // Profile laden
        const profileResponse = await fetch('/profile.json');
        if (!profileResponse.ok) {
          throw new Error('Fehler beim Laden der Profildaten');
        }
        const profileData = await profileResponse.json();
        setProfile(profileData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);  
  // Theme wird jetzt über den ThemeContext verwaltet

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
    }
    // Suche in Test-ID
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
    debugLog('handleTestSelect wurde aufgerufen mit', tests);
    setSelectedTests(tests);
    debugLog('selectedTests nach setSelectedTests', selectedTests); // Wird den alten Wert zeigen wegen Closure
  };

  const openProfilErstellung = () => {
    debugLog('openProfilErstellung wurde aufgerufen, selectedTests ist', selectedTests);
    if (Array.isArray(selectedTests) && selectedTests.length > 0) {
      setShowProfilErstellung(true);
    } else {
      alert("Bitte wählen Sie mindestens einen Test aus, um ein Profil zu erstellen.");
    }
  };

  const closeProfilErstellung = () => {
    setShowProfilErstellung(false);
  };

  // Funktion zum Löschen aller Testmarkierungen
  const clearAllTestSelections = () => {
    setSelectedTests([]);
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
  
  // Handler für manuelle Anmeldung
  const handleLoginClick = () => {
    if (!isRedirecting) {
      setIsRedirecting(true);
      // Spezielle Optionen für Benutzernamen-Unterstützung hinzufügen
      loginWithRedirect({
        authorizationParams: {
          login_hint: 'username',
          prompt: 'login'
        }
      });
    }
  };
    // UseEffect um den Authentifizierungsstatus zu überwachen
  useEffect(() => {
    // Reset isRedirecting wenn der User authentifiziert ist
    if (isAuthenticated) {
      setIsRedirecting(false);
    }
  }, [isAuthenticated]);

  // Auth0 Authentifizierungsprüfung
  // Wenn Auth0 noch prüft, zeigen wir eine Ladeanzeige
  if (authLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${tailwindBtn.classes.containerBg} ${tailwindBtn.appLayout.fadeIn}`}>
        <img src="/images/icons/icon-512x512-new.png" alt="SpecimenOne Logo" className="h-32 w-auto mb-6 filter drop-shadow-lg" />
        <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-6">SpecimenOne wird geladen</h2>
        <md-circular-progress indeterminate></md-circular-progress>
      </div>
    );
  }
  // Benutzer kann die App nutzen, unabhängig vom Auth-Status
  // Der Login erfolgt über den LoginButton in der Navigationsleiste
  
  // Wenn der Benutzer authentifiziert ist, zeigen wir die App
  return (
    <div className={`flex flex-col min-h-screen font-roboto m-0 p-0 overflow-x-hidden w-full transition-colors duration-500 ease-in-out ${isDark ? 'dark-theme dark bg-[#1C1B1F] text-[#E6E1E5]' : 'bg-white text-[#1C1B1F]'}`}><header className="bg-primary dark:bg-primary-dark text-white shadow-md flex justify-between items-center w-full p-3 box-border border-none">
        <div className="flex items-center justify-start flex-1">          <img src="/images/icons/icon-512x512-new.png" alt="SpecimenOne Logo" className="h-20 w-auto mr-4 filter drop-shadow" />
          {/* Desktop-Version des Titels (einzeilig) */}
          <h1 className="m-0 text-2xl font-medium text-white hidden md:block" style={{textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'}}>SpecimenOne</h1>
          {/* Mobile-Version des Titels (zweizeilig) */}
          <div className="flex flex-col leading-tight md:hidden text-white">
            <span className="text-xs font-bold tracking-wide">Specimen</span>
            <span className="text-lg font-semibold tracking-wider">One</span>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <ThemeSwitcher />
          <LoginButton />
        </div>
      </header>      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {isLoading && <div className="flex justify-center my-8"><md-circular-progress indeterminate></md-circular-progress></div>}
        {error && <p className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded border-l-4 border-red-600 dark:border-red-500">Fehler: {error}</p>}
        {!isLoading && !error && (  <>            <div className="mb-8">            <div className="mb-4 space-y-3">
                <div className={`p-3 ${tailwindBtn.containerBgElevated} rounded-lg shadow-sm border ${tailwindBtn.colors.border.light} ${tailwindBtn.colors.border.dark} w-full`}>
                  <Suchleiste 
                    suchbegriff={suchbegriff} 
                    onSuchbegriffChange={handleSuchbegriffChange}
                    selectedKategorie={selectedKategorie}
                    onKategorieChange={setSelectedKategorie}
                  />
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <SortierMenu 
                    sortOption={sortOption}
                    setSortOption={setSortOption}
                    sortDirection={sortDirection}
                    setSortDirection={setSortDirection}
                  />
                </div>
              </div><div className="w-full">
                <div className={`flex mb-6 border-b-2 ${tailwindBtn.borderClasses} w-full ${tailwindBtn.classes.cardBg} rounded-t-lg shadow-sm overflow-hidden`}><button                    className={`flex items-center justify-center px-2 py-3 flex-1 text-sm font-medium relative border-none cursor-pointer ${tailwindBtn.classes.cardBg} transition-all ${
                      ansicht === 'tests' 
                        ? 'text-[var(--md-sys-color-primary)] dark:text-[var(--md-sys-color-primary)] border-b-2 border-[var(--md-sys-color-primary)] dark:border-[var(--md-sys-color-primary)] bg-primary/5 dark:bg-primary-dark/10' 
                        : `${tailwindBtn.classes.text} ${tailwindBtn.classes.hover} border-b-2 border-transparent`
                    }`}
                    onClick={() => setAnsicht('tests')}
                  >
                    <div className="flex items-center justify-center">
                      <MaterialDesign.MdListAlt className="mr-1" /> Einzelne Tests
                    </div>
                  </button>                  <button                    className={`flex items-center justify-center px-2 py-3 flex-1 text-sm font-medium relative border-none cursor-pointer ${tailwindBtn.classes.cardBg} transition-all ${
                      ansicht === 'profile' 
                        ? 'text-[var(--md-sys-color-primary)] dark:text-[var(--md-sys-color-primary)] border-b-2 border-[var(--md-sys-color-primary)] dark:border-[var(--md-sys-color-primary)] bg-primary/5 dark:bg-primary-dark/10' 
                        : `${tailwindBtn.classes.text} ${tailwindBtn.classes.hover} border-b-2 border-transparent`
                    }`}
                    onClick={() => setAnsicht('profile')}
                  >
                    <div className="flex items-center justify-center">
                      <MaterialDesign.MdFolderOpen className="mr-1" /> Test-Profile
                    </div>                  </button><button                    className={`flex items-center justify-center px-2 py-3 flex-1 text-sm font-medium relative border-none cursor-pointer ${tailwindBtn.classes.cardBg} transition-all ${
                      ansicht === 'tabelle' 
                        ? 'text-[var(--md-sys-color-primary)] dark:text-[var(--md-sys-color-primary)] border-b-2 border-[var(--md-sys-color-primary)] dark:border-[var(--md-sys-color-primary)] bg-primary/5 dark:bg-primary-dark/10' 
                        : `${tailwindBtn.classes.text} ${tailwindBtn.classes.hover} border-b-2 border-transparent`
                    }`}
                    onClick={() => setAnsicht('tabelle')}
                  >
                    <div className="flex items-center justify-center">
                      <MaterialDesign.MdTableView className="mr-1" /> Tabellen-Ansicht
                    </div>                  </button>                  <button                    className={`flex items-center justify-center px-2 py-3 flex-1 text-sm font-medium relative border-none cursor-pointer ${tailwindBtn.classes.cardBg} transition-all ${
                      ansicht === 'timeline' 
                        ? 'text-[var(--md-sys-color-primary)] dark:text-[var(--md-sys-color-primary)] border-b-2 border-[var(--md-sys-color-primary)] dark:border-[var(--md-sys-color-primary)] bg-primary/5 dark:bg-primary-dark/10' 
                        : `${tailwindBtn.classes.text} ${tailwindBtn.classes.hover} border-b-2 border-transparent`
                    }`}
                    onClick={() => setAnsicht('timeline')}
                  >
                    <div className="flex items-center justify-center">
                      <MaterialDesign.MdTimeline className="mr-1" /> Grafiken
                    </div>
                  </button>
                </div>
              </div>            </div>            <div className={`mt-6 w-full ${tailwindBtn.classes.containerBg} rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700`}>
              {ansicht === 'tests' && (
                <>
                  <TestListe 
                    tests={filteredTests} 
                    onTestClick={openTestDetails}
                    selectedTests={selectedTests}
                    onTestSelect={handleTestSelect}
                    sortOption={sortOption}
                    sortDirection={sortDirection}
                  />
                </>              )}{ansicht === 'timeline' && (
                <TimelineView key="timeline-view" />
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
                      render: (item) => {
                        if (!Array.isArray(item.material) || item.material.length === 0) 
                          return <span className="keine-material-info">Keine Angabe</span>;
                        
                        return materialsLoading 
                          ? <span className="material-badge loading">Wird geladen...</span>
                          : (
                            <div className="material-badges-container table-badges">
                              {item.material.map((materialId, index) => (
                                <MaterialBadge 
                                  key={index} 
                                  materialId={materialId} 
                                  mini={true} 
                                />
                              ))}
                            </div>
                          );
                      }
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
                      )}
                      <div style={{marginTop: '10px'}}>
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
        </main>      <footer className="bg-gray-100 dark:bg-gray-800 py-4 px-8 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto w-full">
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 md:mb-0">© {new Date().getFullYear()} SpecimenOne</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm transition-colors">Datenschutz</a>
            <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm transition-colors">Impressum</a>
          </div>
        </div>
      </footer>
        {/* Schwebende Selection Controls */}      {ansicht === 'tests' && Array.isArray(selectedTests) && selectedTests.length > 0 && (        <div className="fixed bottom-[70px] left-1/2 transform -translate-x-1/2 flex justify-between items-center p-3 bg-primary/20 dark:bg-primary-dark/20 backdrop-blur-xl rounded-lg shadow-lg max-w-7xl w-full z-10">
          <div className="font-medium text-gray-800 dark:text-white drop-shadow-sm">
            {selectedTests.length} Test{selectedTests.length !== 1 ? 'e' : ''} ausgewählt
          </div>          <div className="flex items-center gap-4">            <button 
              className={tailwindBtn.cancel}
              onClick={clearAllTestSelections}
            >
              <MaterialDesign.MdCancel className="mr-2" />
              Abbrechen
            </button>
            <button 
              className={tailwindBtn.primary}
              onClick={openProfilErstellung}
            >
              <MaterialDesign.MdCreateNewFolder className="mr-2" />
              Profil erstellen
            </button>
          </div>
        </div>
      )}
        {/* Test-Details Dialog */}
      {showTestDetails && selectedTest && (
        <div className="z-40">
          <TestDetails 
            test={selectedTest}
            onClose={closeTestDetails}
          />
        </div>
      )}
      
      {/* Profil-Erstellungsdialog */}
      {showProfilErstellung && (
        <div className="z-50">
          <ProfilErstellungDialog
            selectedTests={selectedTests}
            onClose={closeProfilErstellung}
            onPrint={handleProfilPrint}
          />
        </div>
      )}
      
      {/* Profildruck-Ansicht */}
      {showProfilDruck && customProfil && (
        <div className="z-50">
          <ProfilDruckAnsicht
            profil={customProfil}
            onClose={closeProfilDruck}
          />
        </div>
      )}
    </div>
  );
}

export default App;