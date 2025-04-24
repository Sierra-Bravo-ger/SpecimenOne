import { useState, useEffect } from 'react';
import './App.css';
import './material-theme.css';
import TestListe from './components/TestListe';
import ProfilListe from './components/ProfilListe';
import DrilldownTable from './components/DrilldownTable';
import TestDetails from './components/TestDetails';
import MaterialBadge from './components/MaterialBadge';
import Suchleiste from './components/Suchleiste';
import SortierMenu from './components/SortierMenu';
import ProfilErstellungDialog from './components/ProfilErstellungDialog';
import ProfilDruckAnsicht from './components/ProfilDruckAnsicht';
import ThemeSwitcher from './components/ThemeSwitcher';
import LoginButton from './components/LoginButton';
import './components/ThemeSwitcher.css';
import { useAuth0 } from '@auth0/auth0-react';
import { useTheme } from './contexts/ThemeContext';
import { useMaterialService } from './services/MaterialService';
import { EinheitenServiceProvider, useEinheitenService } from './services/EinheitenService';
import '@material/web/button/filled-button.js';
import '@material/web/button/text-button.js';
import '@material/web/icon/icon.js';
import '@material/web/progress/circular-progress.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/tabs/tabs.js';
import * as MaterialDesign from "react-icons/md";

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

  // Rest der Komponente...
}

export default App;
