import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import './material-theme.css'
import './styles/a11y.css'
import TestListe from './components/TestListe'
import ProfilListe from './components/ProfilListe'
import TestDetails from './components/TestDetails'
import MaterialBadge from './components/MaterialBadge'
import Suchleiste from './components/Suchleiste'
import SortierMenu from './components/SortierMenu'
import ProfilErstellungDialog from './components/ProfilErstellungDialog'
import ProfilDruckAnsicht from './components/ProfilDruckAnsicht'
import ThemeSwitcher from './components/ThemeSwitcher'
import tailwindBtn from './components/tailwindBtn'
// Auth0 vorübergehend deaktiviert
// import { useAuth0 } from '@auth0/auth0-react'
import { useTheme } from './contexts/ThemeContext'
import { useMaterialService } from './services/MaterialService'
import { EinheitenServiceProvider, useEinheitenService } from './services/EinheitenService'
import { useProfileService } from './services/ProfileService.api'
import { API_BASE_URL, ALL_TESTS_PATH } from './services/apiConfig'
import { useTestsService } from './services/TestsService'
import OfflineBanner from './components/OfflineBanner'
import WillkommenHinweis from './components/WillkommenHinweis'
import { useWillkommen } from './hooks/useWillkommen'
import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/icon/icon.js'
import '@material/web/progress/circular-progress.js'
import '@material/web/tabs/primary-tab.js'
import '@material/web/tabs/tabs.js'
import * as MaterialDesign from "react-icons/md"
import { debugLog } from './utils/debug';
import { filterTests } from './utils/testFilter';
import { parseRoute, baueTestPfad } from './utils/links';
import GeteiltesProfil from './components/GeteiltesProfil';

// Selten genutzte Ansichten erst beim Öffnen laden (TimelineView bringt @nivo mit)
const TimelineView = lazy(() => import('./components/TimelineView'))
const DrilldownTable = lazy(() => import('./components/DrilldownTable'))

const ANSICHTEN = [
  { id: 'tests', label: 'Einzelne Tests', Icon: MaterialDesign.MdListAlt },
  { id: 'profile', label: 'Test-Profile', Icon: MaterialDesign.MdFolderOpen },
  { id: 'tabelle', label: 'Tabellen-Ansicht', Icon: MaterialDesign.MdTableView },
  { id: 'timeline', label: 'Grafiken', Icon: MaterialDesign.MdTimeline },
]

const SORT_LABELS = { id: 'Test-ID', name: 'Name', kategorie: 'Kategorie', material: 'Material' }

/**
 * Platzhalter-Karten, solange die Liste lädt. Die Höhe (mindestens eine Bildschirmhöhe)
 * hält die Fußzeile unterhalb des sichtbaren Bereichs, sodass sie beim Nachladen nicht springt.
 */
function ListenSkeleton() {
  return (
    <div className="min-h-[100vh] p-2 md:p-0" role="status" aria-label="Tests werden geladen">
      <div className="h-[52px] md:h-[88px]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="h-[196px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    </div>
  )
}

function AnsichtLaedt() {
  return (
    <div className="p-8 text-center text-gray-600 dark:text-gray-400" role="status">
      Ansicht wird geladen …
    </div>
  )
}

function App() {
  // Auth0 vorübergehend deaktiviert
  // const { isAuthenticated, isLoading: authLoading, loginWithRedirect } = useAuth0();
  const isAuthenticated = true; // Simuliert einen authentifizierten Zustand
  const authLoading = false;
  
  // State für die Auth-Weiterleitung, um Endlosschleifen zu vermeiden
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const [tests, setTests] = useState([]);  // Initialisiere profile als leeres Array, falls es undefined ist
  const [profile, setProfile] = useState([]);
  const { sichtbar: willkommenSichtbar, ausblenden: willkommenAusblenden, einblenden: willkommenEinblenden } = useWillkommen();
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
  // Neue States für persönliche Profile
  const [showSpeichernDialog, setShowSpeichernDialog] = useState(false);
  const [speicherErfolgreich, setSpeicherErfolgreich] = useState(false);
  // Neue States für die Sortierung
  const [sortOption, setSortOption] = useState('id'); // 'id', 'name', 'kategorie', 'material'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc', 'desc'
  const [sortOffen, setSortOffen] = useState(false); // mobil: Sortier-Panel aufgeklappt
  // Theme-Management über den ThemeContext-Hook
  const { currentTheme, isDark } = useTheme();
  // MaterialService für die Materialbezeichnungen
  const { convertMaterialIdsToNames, isLoading: materialsLoading } = useMaterialService();
  // Neu: API-Services für Tests und Profile
  const testsService = useTestsService();
  const profileService = useProfileService();
  
  // Adresse → Ansicht: /test/<id> öffnet die Details, /profil?tests=… ein geteiltes Profil.
  // Die Verlaufseinträge für Tests legt TestDetails an (pushState), hier wird nur gelesen.
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname, window.location.search));
  const [nichtGefunden, setNichtGefunden] = useState(null);

  useEffect(() => {
    const onPopState = () => setRoute(parseRoute(window.location.pathname, window.location.search));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    // Erst auswerten, wenn die Tests geladen sind (auch offline aus dem Cache)
    if (isLoading || error) return;
    if (route.typ !== 'test') {
      setNichtGefunden(null);
      return;
    }
    if (route.alt) {
      // alter Link /?test=T0003 → saubere Adresse
      window.history.replaceState(null, '', baueTestPfad(route.id));
    }
    const foundTest = tests.find(test => test.id === route.id);
    if (foundTest) {
      setSelectedTest(foundTest);
      setShowTestDetails(true);
      setNichtGefunden(null);
    } else {
      setNichtGefunden(route.id);
    }
  }, [route, tests, isLoading, error]);

  const zurListe = () => {
    window.history.replaceState(null, '', '/');
    setRoute({ typ: 'start' });
  };

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
  }, [sortOption, sortDirection]);  useEffect(() => {
    const fetchJson = async (path) => {
      const response = await fetch(`${API_BASE_URL}${path}`);
      if (!response.ok) throw new Error(`HTTP ${response.status} bei ${path}`);
      return response.json();
    };

    const fetchData = async () => {
      try {
        debugLog('App.jsx: Tests und Profile werden parallel geladen');
        // Parallel statt nacheinander: offline kommen beide sofort aus dem Service-Worker-Cache
        const [testsData, profileData] = await Promise.all([
          fetchJson(ALL_TESTS_PATH),
          fetchJson('/profile'),
        ]);

        if (testsData && testsData.tests) {
          debugLog('API-Tests empfangen:', testsData.tests.length);
          setTests(testsData.tests);
        }
        if (profileData && profileData.profile) {
          debugLog('API-Profile direkt empfangen:', profileData.profile.length);
          setProfile(profileData.profile);
        }
      } catch (err) {
        setError(err.message);
        console.error('Fehler beim direkten Laden der Daten:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Beim ersten Laden ausführen
    fetchData();
  }, []);
  // Theme wird jetzt über den ThemeContext verwaltet

  // Filterung für Suche und Kategorie implementieren  
  // useMemo: sonst entsteht bei jedem Render (z.B. beim Öffnen der Testdetails) ein neues Array,
  // und TestListe springt auf Seite 1 zurück
  const filteredTests = useMemo(
    () => filterTests(tests, { suchbegriff: suchbegriff, kategorie: selectedKategorie }),
    [tests, suchbegriff, selectedKategorie]
  );

  // Filterung für Profile mit Berücksichtigung der Kategorie
  debugLog("App.jsx: Profile vor Filterung:", {
    profileLength: profile.length,
    isArray: Array.isArray(profile),
    firstItem: profile.length > 0 ? profile[0] : null,
    selectedKategorie
  });
  
  const filteredProfile = Array.isArray(profile) ? profile.filter(profil => {
    if (!profil) return false;
    
    // Debug für jedes Profil
    if (profile.length > 0 && profile.indexOf(profil) < 5) {
      debugLog(`Profil ${profil.id} Kategorie: ${profil.kategorie}, Selected: ${selectedKategorie}`);
    }
    
    // Wenn "Alle" ausgewählt ist oder die Kategorie übereinstimmt
    if (selectedKategorie === 'Alle' || profil.kategorie === selectedKategorie) {
      // Wenn kein Suchbegriff, dann nur nach Kategorie filtern
      if (!suchbegriff) {
        return true;
      }
      
      // Mit Suchbegriff filtern
      const searchTerm = suchbegriff.toLowerCase();
      return (profil.name && profil.name.toLowerCase().includes(searchTerm)) || 
             (profil.beschreibung && profil.beschreibung.toLowerCase().includes(searchTerm)) || 
             (profil.kategorie && profil.kategorie.toLowerCase().includes(searchTerm));
    }
    
    return false;
  }) : [];
  
  // Debug-Ausgabe für filteredProfile
  debugLog("App.jsx: Gefilterte Profile:", {
    count: filteredProfile.length,
    firstItem: filteredProfile.length > 0 ? filteredProfile[0] : null
  });
  
  const handleSuchbegriffChange = (newValue) => {
    setSuchbegriff(newValue);
  };

  // Beispielsuche aus dem Willkommenshinweis: Einzeltests ohne Kategoriefilter zeigen
  const handleBeispielSuche = (begriff) => {
    setAnsicht('tests');
    setSelectedKategorie('Alle');
    handleSuchbegriffChange(begriff);
  };
  
  // Funktion zum Öffnen der Testdetails
  const openTestDetails = (test) => {
    setSelectedTest(test);
    setShowTestDetails(true);
  };
  
  // Funktion zum Schließen der Testdetails (die Adresse stellt TestDetails per history.back() zurück)
  const closeTestDetails = () => {
    setShowTestDetails(false);
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
      alert("Bitte wählen Sie mindestens einen Test aus, um einen Profil-Antrag zu erstellen.");
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
  // Funktion zum Speichern persönlicher Profile
  const handleSpeichern = (name, beschreibung, kategorie = "Keine Kategorie") => {
    // Neues Profil erstellen
    const neuesProfil = {
      id: Date.now().toString(), // Einfache ID-Generierung
      name,
      beschreibung,
      kategorie, // Kategorie hinzufügen
      erstelltAm: new Date().toISOString(),
      // Speichere immer noch vollständige Test-Objekte für die interne Verarbeitung
      tests: selectedTests.map(test => {
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
        <img src="/images/icons/icon_512x512.png" width="128" height="128" alt="SpecimenOne Logo" className="h-32 w-32 mb-6 filter drop-shadow-lg" />
        <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-6">SpecimenOne wird geladen</h2>
        <md-circular-progress indeterminate></md-circular-progress>
      </div>
    );
  }
  return (
    <div className={`flex flex-col min-h-screen font-roboto m-0 p-0 overflow-x-clip w-full ${isDark ? 'dark-theme dark bg-surface-dark text-on-surface-dark' : 'bg-white text-on-surface'}`}>
      <header className="bg-header dark:bg-header-dark text-white shadow-md flex justify-between items-center w-full p-2 md:p-3 box-border border-none">
        <div className="flex items-center justify-start flex-1">
          <img src="/images/icons/icon_512x512.png" width="80" height="80" alt="SpecimenOne Logo" className="h-11 w-11 md:h-20 md:w-20 mr-3 md:mr-4 filter drop-shadow" />
          {/* Desktop-Version des Titels (einzeilig) */}
          <h1 className="m-0 text-2xl font-medium text-white hidden md:block" style={{textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'}}>SpecimenOne</h1>
          {/* Mobile-Version des Titels (zweizeilig) */}
          <div className="flex flex-col leading-tight md:hidden text-white" aria-hidden="true">
            <span className="text-xs font-bold tracking-wide">Specimen</span>
            <span className="text-lg font-semibold tracking-wider">One</span>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-5">
          {!willkommenSichtbar && (
            <button
              type="button"
              onClick={willkommenEinblenden}
              aria-label="Einführung und Info zum Projekt anzeigen"
              title="Info zum Projekt"
              className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-white/15 text-white text-xl cursor-pointer hover:bg-white/25"
            >
              <MaterialDesign.MdHelpOutline aria-hidden="true" />
            </button>
          )}
          <ThemeSwitcher />
        </div>
      </header>
      <main className="flex-1 w-full px-3 pt-2 pb-4 md:p-4">
        <OfflineBanner />
        {willkommenSichtbar && (
          <div className="max-w-screen-2xl mx-auto w-full mb-3">
            <WillkommenHinweis onBeispielSuche={handleBeispielSuche} onSchliessen={willkommenAusblenden} />
          </div>
        )}

        {/* Suche bleibt beim Scrollen oben (direktes Kind von main, damit sticky über die ganze Liste gilt) */}
        <div className="sticky top-0 z-30 -mx-3 px-3 md:-mx-4 md:px-4 pb-2 bg-white dark:bg-surface-dark">
          <div className={`max-w-screen-2xl mx-auto p-2 md:p-3 ${tailwindBtn.containerBgElevated} rounded-lg shadow-sm border ${tailwindBtn.colors.border.light} ${tailwindBtn.colors.border.dark} w-full`}>
            <Suchleiste
              suchbegriff={suchbegriff}
              onSuchbegriffChange={handleSuchbegriffChange}
              selectedKategorie={selectedKategorie}
              onKategorieChange={setSelectedKategorie}
            />
          </div>
        </div>

        <div className="max-w-screen-2xl mx-auto w-full">
          {/* Sortierung: mobil hinter einem Knopf, ab md immer sichtbar */}
          <div className="mt-2 md:mt-3">
            <button
              type="button"
              onClick={() => setSortOffen(o => !o)}
              aria-expanded={sortOffen}
              aria-controls="sortier-panel"
              className={`md:hidden flex w-full items-center gap-2 min-h-[40px] px-3 rounded-lg border ${tailwindBtn.colors.border.light} ${tailwindBtn.colors.border.dark} ${tailwindBtn.classes.cardBg} ${tailwindBtn.classes.text} text-sm font-medium cursor-pointer`}
            >
              <MaterialDesign.MdSort className="text-xl" aria-hidden="true" />
              <span className="flex-1 text-left">Sortierung: {SORT_LABELS[sortOption] || sortOption} {sortDirection === 'asc' ? 'A–Z' : 'Z–A'}</span>
              {sortOffen
                ? <MaterialDesign.MdExpandLess className="text-xl" aria-hidden="true" />
                : <MaterialDesign.MdExpandMore className="text-xl" aria-hidden="true" />}
            </button>
            <div id="sortier-panel" className={`${sortOffen ? 'block mt-2' : 'hidden'} md:block md:mt-0`}>
              <SortierMenu
                sortOption={sortOption}
                setSortOption={setSortOption}
                sortDirection={sortDirection}
                setSortDirection={setSortDirection}
              />
            </div>
          </div>

          {/* Ansichten: mobil waagerecht scrollbar */}
          <nav aria-label="Ansicht" className="mt-2 md:mt-3">
            <div className={`flex overflow-x-auto no-scrollbar md:overflow-visible border-b-2 ${tailwindBtn.borderClasses} w-full ${tailwindBtn.classes.cardBg} rounded-t-lg shadow-sm`}>
              {ANSICHTEN.map(({ id, label, Icon }) => (
                <button
                  type="button"
                  key={id}
                  aria-current={ansicht === id ? 'page' : undefined}
                  className={`tab-knopf flex items-center justify-center shrink-0 md:shrink md:flex-1 whitespace-nowrap px-3 md:px-2 py-2.5 md:py-3 min-h-[44px] text-sm font-medium relative border-none cursor-pointer ${tailwindBtn.classes.cardBg} transition-all ${
                    ansicht === id
                      ? 'text-[#1e6b35] dark:text-[var(--md-sys-color-primary)] border-b-2 border-[#1e6b35] dark:border-[var(--md-sys-color-primary)] bg-primary/5 dark:bg-primary-dark/10'
                      : `${tailwindBtn.classes.text} ${tailwindBtn.classes.hover} border-b-2 border-transparent`
                  }`}
                  onClick={() => setAnsicht(id)}
                >
                  <Icon className="mr-1.5 text-lg" aria-hidden="true" /> {label}
                </button>
              ))}
            </div>
          </nav>
        </div>

        <div className={`mt-1 md:mt-6 ${ansicht === 'tests' ? 'w-full' : 'max-w-screen-2xl mx-auto'} ${tailwindBtn.classes.containerBg} rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700`}>
          {error && <p className="m-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded border-l-4 border-red-600 dark:border-red-500" role="alert">Fehler: {error}</p>}
          {!error && isLoading && <ListenSkeleton />}
          {!isLoading && !error && (
            <>
              {ansicht === 'tests' && (
                <TestListe
                  tests={filteredTests}
                  onTestClick={openTestDetails}
                  selectedTests={selectedTests}
                  onTestSelect={handleTestSelect}
                  sortOption={sortOption}
                  sortDirection={sortDirection}
                />
              )}
              {ansicht === 'timeline' && (
                <Suspense fallback={<AnsichtLaedt />}>
                  <TimelineView key="timeline-view" />
                </Suspense>
              )}
              {ansicht === 'profile' && (
                <ProfilListe tests={filteredTests} profile={filteredProfile} />
              )}

              {ansicht === 'tabelle' && (
                <Suspense fallback={<AnsichtLaedt />}>
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
                </Suspense>
              )}
            </>
          )}
        </div>
      </main>
      <footer className="bg-gray-100 dark:bg-gray-800 py-4 px-8 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="flex flex-col gap-4 max-w-7xl mx-auto w-full">
          {/* Rechtshinweise und Links */}
          <div className="flex flex-col md:flex-row justify-between items-center w-full">
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 md:mb-0">© {new Date().getFullYear()} SpecimenOne</p>
            <div className="flex items-center gap-4">
              <a href="/datenschutz.html" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm transition-colors underline">Datenschutz</a>
              <a href="https://sebastian-bride.pages.dev/impressum" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm transition-colors underline">Impressum</a>
            </div>
          </div>

          {/* Technologie-Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center text-center p-2">
              <div className="font-medium text-xs text-gray-600 dark:text-gray-400">Entwickelt mit</div>
              <div className="font-medium text-sm text-gray-700 dark:text-gray-300">React</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">UI-Bibliothek</div>
            </div>
            <div className="flex flex-col items-center text-center p-2">
              <div className="font-medium text-xs text-gray-600 dark:text-gray-400">Styling mit</div>
              <div className="font-medium text-sm text-gray-700 dark:text-gray-300">Tailwind CSS</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">CSS-Framework</div>
            </div>
            <div className="flex flex-col items-center text-center p-2">
              <div className="font-medium text-xs text-gray-600 dark:text-gray-400">Build-Tool</div>
              <div className="font-medium text-sm text-gray-700 dark:text-gray-300">Vite</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Frontend-Tooling</div>
            </div>
            <div className="flex flex-col items-center text-center p-2">
              <div className="font-medium text-xs text-gray-600 dark:text-gray-400">Datenanalyse</div>
              <div className="font-medium text-sm text-gray-700 dark:text-gray-300">DuckDB</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">SQL-Engine</div>
            </div>
          </div>
        </div>
      </footer>
        {/* Schwebende Selection Controls */}      {ansicht === 'tests' && Array.isArray(selectedTests) && selectedTests.length > 0 && (        <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 flex flex-wrap gap-2 justify-between items-center p-3 bg-white dark:bg-[#242328] border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-w-7xl w-[calc(100%-1.5rem)] z-40">
          <div className="font-medium text-gray-800 dark:text-white drop-shadow-sm">
            {selectedTests.length} Test{selectedTests.length !== 1 ? 'e' : ''} ausgewählt
          </div>          <div className="flex flex-wrap items-center gap-2 md:gap-4">            <button 
              className={tailwindBtn.cancel}
              onClick={clearAllTestSelections}
            >
              <MaterialDesign.MdCancel className="mr-2" />
              Abbrechen
            </button>            <button 
              className={tailwindBtn.primary}
              onClick={openProfilErstellung}
            >
              <MaterialDesign.MdCreateNewFolder className="mr-2" />
              Profil-Antrag erstellen
            </button>
            {/* Speicherbutton für persönliche Profile, styled like other buttons */}
            <button 
              className={`
  flex items-center justify-center gap-2
  py-2.5 px-4
  bg-[var(--md-sys-color-primary)]
  text-[var(--md-sys-color-on-primary)]
  font-medium
  border-none rounded-md
  text-[0.9rem]
  relative overflow-hidden
  transition-all duration-200
  hover:bg-[var(--md-sys-color-primary-hover,#5aaf6b)]
  hover:shadow-md
  active:translate-y-[1px]
  disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none
`}
              onClick={() => {
                // Rufe die Funktion speicherePersoenlichesProfil über ein Ref-Objekt auf
                if (ansicht === 'tests' && tests && tests.length > 0) {
                  setShowSpeichernDialog(true);
                }
              }}
            >
              <MaterialDesign.MdBookmarkAdd className="mr-2" /> Als persönliches Profil speichern
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
      
      {/* Hinweis bei unbekannter Test-ID in der Adresse */}
      {nichtGefunden && !showTestDetails && (
        <div className="test-details-overlay">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="nicht-gefunden-titel"
            className={`test-details-container md-elevation-5 ${tailwindBtn.classes.cardBg}`}
          >
            <h2 id="nicht-gefunden-titel" className={tailwindBtn.classes.text}>Test {nichtGefunden} nicht gefunden</h2>
            <p className={tailwindBtn.classes.text}>
              Diesen Test gibt es nicht (mehr). Der Link ist vielleicht veraltet oder falsch geschrieben.
            </p>
            <div className="actions">
              <md-filled-button autofocus onClick={zurListe} class={tailwindBtn.classes.mdButton}>Zur Testliste</md-filled-button>
            </div>
          </div>
        </div>
      )}

      {/* Geteiltes Profil (/profil?tests=…) */}
      {route.typ === 'profil' && !isLoading && !error && (
        <div className="z-40">
          <GeteiltesProfil route={route} tests={tests} onClose={zurListe} />
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
      
      {/* Dialog zum Speichern persönlicher Profile - Wiederverwendung der ProfilErstellungDialog-Komponente */}
      {showSpeichernDialog && (
        <div className="z-50">
          <ProfilErstellungDialog 
            selectedTests={selectedTests}
            onClose={() => setShowSpeichernDialog(false)} 
            onSpeichern={handleSpeichern}
            mode="save"
          />
        </div>
      )}
        {/* Erfolgsmeldung beim Speichern eines persönlichen Profils */}
      {speicherErfolgreich && (
        <div className={tailwindBtn.classes.successToast}>
          <MaterialDesign.MdCheckCircle className="text-xl" /> 
          Profil erfolgreich gespeichert!
        </div>
      )}
    </div>
  );
}

export default App;
