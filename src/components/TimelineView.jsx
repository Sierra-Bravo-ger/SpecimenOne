import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveTreeMap } from '@nivo/treemap';
// TimelineView.css not needed anymore - CSS classes have been migrated to tailwindBtn.js
import tailwindBtn from './tailwindBtn'; // Importiere die Tailwind-Button-Bibliothek
import * as MaterialDesign from "react-icons/md";
import { useTheme } from '../contexts/ThemeContext';

// Globaler Cache für bereits erkannte Zeitformate
// Verhindert wiederholte Konsolenausgaben und beschleunigt die Verarbeitung
const TIME_FORMAT_CACHE = {
  // Bekannte Durchführungszeitformate mit Standardwerten vorinitialisiert
  "Mo-Fr 7-17Uhr": 240,
  "Mo-Fr 8-16 Uhr": 240,
  "Mo–Fr 8–16 Uhr": 240, 
  "Mo-Fr 8-14 Uhr": 240,
  "Mo–Fr": 240,
  "Mi–Fr": 240,
  "Di, Do 8–12 Uhr": 240,
  "Mo, Mi, Fr 8–14 Uhr": 240,
  "Mo-Fr 8-17 Uhr": 240,
  "24/7": 240,
  "Einmal wöchentlich (Dienstag)": 240,
  "Mo, Mi, Fr": 240
};

// Begrenzt die Anzahl der Warnungen in der Konsole
let warningCount = 0;
const MAX_WARNINGS = 3;

import { useProfileService } from '../services/ProfileService.api';
import { useTestsService } from '../services/TestsService';

function TimelineView({ selectedProfiles = [] }) {  // Verwende useRef für den Zustand, der keine Re-Renders auslösen soll
  const initialRender = React.useRef(true);
  
  // State für Media Queries (Mobile vs. Desktop)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileFilter, setProfileFilter] = useState('alle'); // 'alle', 'top10', 'kategorie'
  const [selectedKategorie, setSelectedKategorie] = useState('Alle');  const [availableKategorien, setAvailableKategorien] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);
  const { isDark } = useTheme();
  
  // Effect zum Schließen des Dropdowns bei Klick außerhalb
  useEffect(() => {
    if (!dropdownOpen) return;
    
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);
  
  // Effect für die Erkennung von Bildschirmgrößenänderungen
  useEffect(() => {
    // Handler für Fenstergröße-Änderungen 
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Event Listener beim Mounten hinzufügen
    window.addEventListener('resize', handleResize);
    
    // Beim ersten Laden prüfen
    handleResize();
    
    // Event Listener beim Unmounten entfernen
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Leeres Dependency Array = nur beim ersten Rendern ausführen
  
  // State für Reiter und Paginierung - müssen vor bedingten Return-Anweisungen deklariert werden
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' oder 'treemap'
  const [currentPage, setCurrentPage] = useState(0);
  const profilesPerPage = 5; // Anzahl Profile pro Seite
    // API-Services für Tests und Profile
  const profileService = useProfileService();
  const testsService = useTestsService();
  
  // Wir verwenden useState für die Profil- und Testdaten
  const [profiles, setProfiles] = useState([]);
  const [tests, setTests] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
    // Farben für die verschiedenen Kategorien - mit useMemo memoiziert
  const categoryColors = useMemo(() => ({
    // Hämatologie Gruppe
    'Hämatologie': '#f44336',
    'Hämatologie Immunzytometrie': '#d45252',
    'Hämatologie Sonder': '#e15959',
    
    // Chemie Gruppe
    'Klinische Chemie': '#795548',
    'Chemie': '#795548',
    'Quantitative Urinanalytik': '#b27a45',
    'Urinstatus': '#c8894e',
    'Crea-Clearence': '#a57548',
    'Stuhlanalyse': '#8f6136',
    'Steinanalyse': '#7a5330',
    
    // Gerinnung Gruppe
    'Gerinnung': '#4CAF50',
    'Gerinnung Faktoren': '#56b26a',
    'Gerinnung Thrombophilie': '#62cc78',
    'Gerinnung Sondertest': '#41844f',
    
    // Immunologie Gruppe
    'Immunologie': '#2196F3',
    'Autoantikörper': '#5681e0',
    'Infektserologie': '#6291f8',
    'Tumormarker': '#3d64b3',
    'Allergie': '#345aa0',
    
    // Elektrophorese & Proteine
    'Elektrophorese': '#9C27B0',
    'Proteine': '#9956d4',
    
    // Ria Gruppe
    'Ria': '#FFC107',
    'Ria Online': '#d8ab51',
      // Spezialgebiete
    'Medikamente': '#00BCD4',
    'Toxikologie': '#FF9800',
    'Liquor': '#45b2e0',
    'Molekulargenetik': '#9055a2',
    'Blutbank': '#e74c3c',
    'Transfusionsmedizin': '#c0392b',
    'Versand': 'rainbow',
    'Extern': '#95a5a6',
    'Sonstige': '#607d8b', // Hinzugefügt für API-Profile
  }), []);
  
  // Farbe für eine Kategorie abrufen
  const getCategoryColor = useCallback((category) => {
    const color = categoryColors[category];
    if (color === 'rainbow') {
      // Falls in Timeline ein Regenbogen nicht funktioniert, 
      // einen repräsentativen Farbton zurückgeben
      return '#ff8c00'; // Ein kräftiges Orange als Alternative
    }
    return color || '#888888';
  }, [categoryColors]);
  // Hilfsfunktion zum Konvertieren der Zeitangaben
  const convertTimeToMinutes = useCallback((timeString) => {
    if (!timeString) {
      console.log('[TimelineView] Leere Zeitangabe - verwende Standardwert (60 min)');
      return 60; // Standardwert für leere Angaben
    }
    
    // Normalisiere die Eingabe (entferne mehrfache Leerzeichen, trimme)
    const normalizedTimeString = timeString.trim().replace(/\s+/g, ' ');
    
    // Wenn das Format bereits im Cache ist, gespeicherten Wert verwenden
    if (normalizedTimeString in TIME_FORMAT_CACHE) {
      return TIME_FORMAT_CACHE[normalizedTimeString];
    }
    
    console.log(`[TimelineView] Konvertiere Zeitangabe: "${timeString}" (normalisiert: "${normalizedTimeString}")`);
    
    let minutes = 60; // Standardwert
    let matched = false;
    
    // Tagesangaben (z.B. "3 Tage", "1-2 Tage")
    const daysMatch = timeString.match(/(\d+)(?:-(\d+))?\s*Tage?/i);
    if (daysMatch) {
      // Bei Bereichsangaben den höheren Wert verwenden
      const days = daysMatch[2] ? parseInt(daysMatch[2]) : parseInt(daysMatch[1]);
      minutes = days * 24 * 60;
      console.log(`[TimelineView] Tagesangabe erkannt: ${days} Tage => ${minutes} Minuten`);
      matched = true;
    }
    // "Max. X Tage" Angaben
    else {
      const maxDaysMatch = timeString.match(/Max\.\s*(\d+)\s*Tage?/i);
      if (maxDaysMatch) {
        minutes = parseInt(maxDaysMatch[1]) * 24 * 60;
        console.log(`[TimelineView] Max. Tage erkannt: ${maxDaysMatch[1]} Tage => ${minutes} Minuten`);
        matched = true;
      }
      // "am selben Tag" Angaben
      else if (timeString.toLowerCase().includes('am selben tag')) {
        minutes = 8 * 60; // 8 Stunden für "am selben Tag"
        console.log('[TimelineView] "Am selben Tag" erkannt => 480 Minuten');
        matched = true;
      }
      // Stundenangaben
      else {
        const hoursMatch = timeString.match(/(\d+)\s*Stunden?/i);
        if (hoursMatch) {
          minutes = parseInt(hoursMatch[1]) * 60;
          console.log(`[TimelineView] Stundenangabe erkannt: ${hoursMatch[1]} Stunden => ${minutes} Minuten`);
          matched = true;
        }
        // Minutenangaben
        else {
          const minutesMatch = timeString.match(/(\d+)\s*Minuten?/i);
          if (minutesMatch) {
            minutes = parseInt(minutesMatch[1]);
            matched = true;
          }
          // Bereichsangaben in Stunden (z.B. "1-2 Stunden")
          else {
            const hourRangeMatch = timeString.match(/(\d+)-(\d+)\s*Stunden?/i);
            if (hourRangeMatch) {
              minutes = parseInt(hourRangeMatch[2]) * 60; // Höheren Wert verwenden
              matched = true;
            }
            // Einfache numerische Werte (als Stunden interpretieren)
            else if (/^\d+$/.test(timeString.trim())) {
              minutes = parseInt(timeString.trim()) * 60;
              matched = true;
            }
            // Durchführungszeitangaben (keine eigentliche Befundzeit)
            else if (/Mo-Fr|Mo–Fr|Mo,\s*Mi,\s*Fr|Mo,\s*Di,\s*Mi|[0-9]\s*-\s*[0-9]\s*Uhr|24\/7|wöchentlich/i.test(timeString)) {
              minutes = 240; // 4 Stunden für Durchführungszeiten
              
              // Begrenzte Anzahl an Warnungen ausgeben
              if (warningCount < MAX_WARNINGS) {
                console.warn(`[SpecimenOne] Durchführungszeitangabe erkannt: "${timeString}" - verwende Standardwert (240 min)`);
                warningCount++;
                
                if (warningCount === MAX_WARNINGS) {
                  console.warn('[SpecimenOne] Weitere Warnungen werden unterdrückt um die Konsole übersichtlich zu halten.');
                }
              }
              matched = true;
            }
          }
        }
      }
    }
    
    // Unbekanntes Format
    if (!matched && warningCount < MAX_WARNINGS) {
      console.warn(`[SpecimenOne] Unbekanntes Zeitformat: "${timeString}" - verwende Standardwert (60 min)`);
      warningCount++;
      
      if (warningCount === MAX_WARNINGS) {
        console.warn('[SpecimenOne] Weitere Warnungen werden unterdrückt um die Konsole übersichtlich zu halten.');
      }
    }
      // Ergebnis im Cache speichern für zukünftige Aufrufe (mit normalisiertem String)
    TIME_FORMAT_CACHE[normalizedTimeString] = minutes;
    return minutes;
  }, []);  // Diese useEffect lädt die Daten aus den API-Services und nutzt die neue Methode zum Laden ALLER Tests
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        console.log('[TimelineView] Daten werden geladen...');
        
        // Warten bis Profile geladen sind
        if (!profileService.isLoading && profileService.profiles) {
          console.log('[TimelineView] Profile aus API-Services geladen:', {
            profiles: profileService.profiles.length
          });
          
          setProfiles(profileService.profiles);
          
          // Alle verfügbaren Kategorien extrahieren
          const kategorien = [...new Set(profileService.profiles.map(p => p.kategorie))].filter(Boolean);
          setAvailableKategorien(['Alle', ...kategorien]);
          
          // Für die Timeline und Treemap brauchen wir ALLE Tests ohne Paginierung
          console.log('[TimelineView] Lade jetzt ALLE Tests für Treemap und Timeline...');
          
          try {
            // Verwende die neue Methode, die direkt ein Array zurückgibt
            const allTests = await testsService.loadAllTestsAtOnce();
            
            // Setze die Tests direkt
            console.log(`[TimelineView] ${allTests.length} Tests wurden für die Visualisierung geladen`);
            setTests(allTests);
            
            // Jetzt sind alle Daten geladen
            setDataLoaded(true);
          } catch (testErr) {
            console.error('[TimelineView] Fehler beim Laden aller Tests:', testErr);
            setError(testErr.message);
          } finally {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('[TimelineView] Fehler beim Laden der Daten:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [profileService.profiles, profileService.isLoading]);
  
  // Verwende useMemo zur Berechnung der anzuzeigenden Profile
  const profilesToRender = useMemo(() => {
    if (!dataLoaded) return [];
    
    if (selectedProfiles && selectedProfiles.length > 0) {
      // Wenn explizit Profile angegeben wurden, diese verwenden
      return selectedProfiles;
    } else {
      // Ansonsten abhängig vom Filter
      switch (profileFilter) {
        case 'top10':
          // Die 10 Profile mit niedrigster sortierNummer (höchste Priorität)
          return [...profiles]
            .sort((a, b) => (a.sortierNummer || 999) - (b.sortierNummer || 999))
            .slice(0, 10)
            .map(p => p.id);
        case 'kategorie':
          // Profile nach ausgewählter Kategorie filtern
          if (selectedKategorie !== 'Alle') {
            const filteredProfiles = profiles.filter(p => p.kategorie === selectedKategorie).map(p => p.id);
            console.log(`[TimelineView] Filter '${selectedKategorie}': ${filteredProfiles.length} Profile gefunden`);
            return filteredProfiles;
          } else {
            // Wenn 'Alle' gewählt ist, ein paar Profile aus jeder Kategorie nehmen
            const profilesByCategory = {};
            profiles.forEach(p => {
              if (!profilesByCategory[p.kategorie]) {
                profilesByCategory[p.kategorie] = [];
              }
              profilesByCategory[p.kategorie].push(p);
            });
            
            // Aus jeder Kategorie die ersten 2 Profile nehmen
            const result = [];
            Object.values(profilesByCategory).forEach(categoryProfiles => {
              const sorted = [...categoryProfiles].sort((a, b) => 
                (a.sortierNummer || 999) - (b.sortierNummer || 999)
              );
              result.push(...sorted.slice(0, 2).map(p => p.id));
            });
            return result;
          }
        default: // 'alle'
          // Alle Profile verwenden (ohne Performance-Limit)
          const allProfiles = profiles.map(p => p.id);
          console.log(`[TimelineView] Filter 'Alle': ${allProfiles.length} Profile gefunden`);
          console.log(`[TimelineView] Kategorien in den Daten:`, [...new Set(profiles.map(p => p.kategorie))]);
          
          // Logge die Anzahl der Profile pro Kategorie
          const categoryCount = {};
          profiles.forEach(p => {
            if (!p.kategorie) {
              if (!categoryCount['Keine Kategorie']) categoryCount['Keine Kategorie'] = 0;
              categoryCount['Keine Kategorie']++;
            } else {
              if (!categoryCount[p.kategorie]) categoryCount[p.kategorie] = 0;
              categoryCount[p.kategorie]++;
            }
          });
          console.log('[TimelineView] Profile pro Kategorie:', categoryCount);
          
          return allProfiles;
      }
    }
  }, [dataLoaded, selectedProfiles, profileFilter, selectedKategorie, profiles]);
    // Daten für die Timeline mit useMemo memoizieren, anstatt in einem useEffect zu verarbeiten
  // Dies verhindert die unendliche Update-Schleife
  const memoizedTimelineData = useMemo(() => {
    // Nur ausführen, wenn Daten geladen sind
    if (!dataLoaded || profilesToRender.length === 0) return [];
    
    try {
      // Daten für die Nivo-Visualisierung vorbereiten
      const formattedData = [];
      
      for (const profileId of profilesToRender) {
        const profile = profiles.find(p => p.id === profileId);
        if (!profile) continue;
        
        let maxDuration = 0;
        const testEntries = [];
        // Sammle alle einzigartigen Kategorien in diesem Profil
        const uniqueCategories = new Set();
          // Konvertiere tests-String in Array, falls nötig
        const testsArray = Array.isArray(profile.tests) 
          ? profile.tests 
          : (typeof profile.tests === 'string' 
             ? profile.tests.split('|') 
             : []);
          // Debugging-Informationen für dieses Profil
        console.log(`[TimelineView] Verarbeite Profil ${profile.id} (${profile.name}) mit ${testsArray.length} Tests:`, testsArray);
          for (const testId of testsArray) {
          // Überprüfen, ob die Test-ID noch Pipe-Zeichen enthält und ggf. weiter aufteilen
          if (testId.includes('|')) {
            console.warn(`[TimelineView] Test-ID '${testId}' enthält immer noch Pipe-Zeichen, wird weiter aufgeteilt.`);
            // Rekursiv die Suche für jeden Teil ausführen
            const subIds = testId.split('|');
            for (const subId of subIds) {
              const trimmedSubId = subId.trim();
              const subTest = tests.find(t => t.id === trimmedSubId);
              if (!subTest) {
                console.warn(`[TimelineView] Unter-Test mit ID '${trimmedSubId}' nicht gefunden für Profil ${profile.id}`);
                continue;
              }
              // Den gefundenen Unter-Test verarbeiten
              const duration = convertTimeToMinutes(subTest.befundzeit || '');
              maxDuration = Math.max(maxDuration, duration);
              const category = subTest.kategorie || 'Unbekannt';
              uniqueCategories.add(category);
              testEntries.push({
                id: subTest.id,
                name: subTest.name,
                duration,
                category
              });
            }
            // Weiter zur nächsten ID in der Hauptschleife
            continue;
          }
          
          // Normale Verarbeitung einer einzelnen Test-ID
          const testIdTrimmed = testId.trim(); // Whitespace entfernen, falls vorhanden
          const test = tests.find(t => t.id === testIdTrimmed);
          
          if (!test) {
            console.warn(`[TimelineView] Test mit ID '${testIdTrimmed}' nicht gefunden für Profil ${profile.id}`);
            continue;
          }
          
          // Debugging: Überprüfe die gefundenen Test-Daten
          console.log(`[TimelineView] Test gefunden:`, {
            id: test.id,
            name: test.name,
            befundzeit: test.befundzeit,
            kategorie: test.kategorie
          });
          
          const duration = convertTimeToMinutes(test.befundzeit || '');
          console.log(`[TimelineView] Konvertierte Zeit für ${test.id}: ${test.befundzeit} => ${duration} Minuten`);
          
          maxDuration = Math.max(maxDuration, duration);
          const category = test.kategorie || 'Unbekannt';
          
          // Füge die Kategorie zur Menge hinzu
          uniqueCategories.add(category);
          
          testEntries.push({
            id: test.id,
            name: test.name,
            duration,
            category
          });
        }
        
        // Konvertiere die Set in ein Array von Kategorie-Objekten mit Farben
        const categories = Array.from(uniqueCategories).map(category => ({
          id: category,
          name: category,
          color: getCategoryColor(category)
        }));
        
        // Für jedes Profil einen Eintrag erstellen
        formattedData.push({
          profile: profile.name,
          profileId: profile.id,
          tests: testEntries,
          maxDuration,
          categories // Speichere die Kategorien für die Legende
        });
      }
      
      return formattedData;
    } catch (err) {
      console.error('Fehler bei der Verarbeitung der Timeline-Daten:', err);
      setError(err.message);
      return [];
    }
  }, [dataLoaded, profilesToRender, profiles, tests, convertTimeToMinutes, getCategoryColor]);
  // In einem separaten useEffect den memoizierten Wert zuweisen
  // Aber nur, wenn es wirklich eine Änderung gibt oder beim ersten Rendern
  useEffect(() => {
    // Verwende initialRender.current, um nur beim ersten Rendern oder bei Wertänderungen upzudaten
    if (initialRender.current) {
      initialRender.current = false;
      setTimelineData(memoizedTimelineData);
    } else if (JSON.stringify(timelineData) !== JSON.stringify(memoizedTimelineData)) {
      setTimelineData(memoizedTimelineData);
    }
  }, [memoizedTimelineData, timelineData]);
  
  // Angepasste Legendenitems für ein Profil generieren
  const createProfileLegendItems = useCallback((profileData) => {
    if (!profileData || !profileData.categories || profileData.categories.length === 0) {
      return [{
        id: 'duration',
        label: 'Dauer',
        color: '#888888'
      }];
    }
    
    // Erstelle für jede Kategorie einen Legendeneintrag
    return profileData.categories.map(category => ({
      id: category.id,
      label: category.name,
      color: category.color
    }));
  }, []);
  
  // Formatierung der Daten für die Nivo Bar-Komponente
  const prepareChartData = useCallback((profileData) => {
    if (!profileData || !profileData.tests || profileData.tests.length === 0) {
      return [];
    }
    
    return profileData.tests.map(test => ({
      test: test.name,
      testId: test.id,
      duration: test.duration,
      category: test.category,
      color: getCategoryColor(test.category)
    }));
  }, [getCategoryColor]);
  // Vorbereitung der Daten für die Treemap-Visualisierung
  const prepareTreemapData = useMemo(() => {
    if (!tests || tests.length === 0) {
      console.warn('[TimelineView] Keine Tests für Treemap verfügbar');
      return { name: 'tests', children: [] };
    }
    
    console.log('[TimelineView] Bereite Treemap-Daten vor mit', tests.length, 'Tests');
    
    // Tests nach Kategorie gruppieren
    const categoryCounts = {};
    
    // Zähle Tests pro Kategorie
    tests.forEach(test => {
      const category = test.kategorie || 'Unbekannt';
      if (!categoryCounts[category]) {
        categoryCounts[category] = {
          name: category,
          count: 0,
          tests: []
        };
      }
      categoryCounts[category].count++;
      categoryCounts[category].tests.push(test.name);
    });
    
    // In das für Treemap benötigte Format konvertieren
    const children = Object.values(categoryCounts).map(cat => ({
      name: cat.name,
      value: cat.count,
      tests: cat.tests,
      color: getCategoryColor(cat.name)
    }));
    
    return {
      name: 'Testkategorien',
      children: children
    };
  }, [tests, getCategoryColor]);
  
  // Zeiteinheit formatieren
  const formatDuration = useCallback((minutes) => {
    if (minutes < 60) {
      return `${minutes} Min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }, []);
  
  // Handler für Filteränderungen
  const handleProfileFilterChange = useCallback((filter) => {
    setProfileFilter(filter);
  }, []);
  
  // Handler für Kategorieänderungen
  const handleKategorieChange = useCallback((e) => {
    setSelectedKategorie(e.target.value);
  }, []);
  
  // Handler für Tab-Wechsel
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);
  
  // Berechnet die aktuelle Seite der Profile
  const currentPageData = useMemo(() => {
    if (!timelineData || timelineData.length === 0) return [];
    const start = currentPage * profilesPerPage;
    const end = start + profilesPerPage;
    return timelineData.slice(start, end);
  }, [timelineData, currentPage, profilesPerPage]);
  
  // Gesamtanzahl der Seiten
  const pageCount = useMemo(() => {
    return Math.ceil((timelineData || []).length / profilesPerPage);
  }, [timelineData, profilesPerPage]);
  
  // Paginierungsfunktionen
  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, pageCount - 1));
  }, [pageCount]);
  
  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  }, []);
    // Lade-Anzeige
  if (loading) {
    return (
      <div className={tailwindBtn.classes.timeline.loading}>
        <md-circular-progress indeterminate></md-circular-progress>
        <p>Lade Timeline-Daten...</p>
      </div>
    );
  }
  
  // Fehler-Anzeige
  if (error) {
    return (
      <div className={tailwindBtn.classes.timeline.error}>
        <MaterialDesign.MdError className={tailwindBtn.classes.timeline.errorIcon} />
        <p>Fehler beim Laden der Daten: {error}</p>
      </div>
    );
  }
  
  // Leere Anzeige
  if (timelineData.length === 0) {
    return (
      <div className={tailwindBtn.classes.timeline.empty}>
        <MaterialDesign.MdPieChart className={tailwindBtn.classes.timeline.emptyIcon} />
        <p>Bitte wählen Sie Profile zum Vergleich aus</p>
      </div>
    );
  }
    return (
    <div className={tailwindBtn.classes.timeline.container}>
      <div className={tailwindBtn.classes.timeline.header}>
        {/* Tab Navigation */}        <div className={tailwindBtn.classes.timeline.tabNavigation}>
          <button 
            className={`${tailwindBtn.classes.timeline.tabButton} ${tailwindBtn.classes.timeline.tabButtonHover} ${activeTab === 'timeline' ? tailwindBtn.classes.timeline.tabButtonActive : ''}`}
            onClick={() => handleTabChange('timeline')}
          >
            <MaterialDesign.MdTimeline /> Zeitachse
          </button>
          <button 
            className={`${tailwindBtn.classes.timeline.tabButton} ${tailwindBtn.classes.timeline.tabButtonHover} ${activeTab === 'treemap' ? tailwindBtn.classes.timeline.tabButtonActive : ''}`}
            onClick={() => handleTabChange('treemap')}
          >
            <MaterialDesign.MdDashboard /> Kategorien-Treemap
          </button>
        </div>
          {/* Nur Timeline-bezogene Filter anzeigen, wenn Timeline aktiv ist */}        {activeTab === 'timeline' && (
          <div className={tailwindBtn.classes.timeline.filters}>
            <div className={tailwindBtn.classes.timeline.filterBtnsContainer}>
              <div className={tailwindBtn.classes.timeline.filterBtns}>                <button 
                  className={`${tailwindBtn.filter} ${profileFilter === 'alle' ? tailwindBtn.filterActive : ''}`}
                  onClick={() => handleProfileFilterChange('alle')}
                >
                  <MaterialDesign.MdViewList /> Alle Profile
                </button>
                {/* Top 10 Button vorübergehend ausgeblendet
                <button 
                  className={`filter-button ${profileFilter === 'top10' ? 'active' : ''}`}
                  onClick={() => handleProfileFilterChange('top10')}
                >
                  <MaterialDesign.MdStarRate /> Top 10 Profile
                </button>
                */}                <div className={tailwindBtn.classes.timeline.dropdownContainer} ref={dropdownRef}>                  <button 
                    className={`${tailwindBtn.filter} ${profileFilter === 'kategorie' ? tailwindBtn.filterActive : ''}`}
                    onClick={() => {
                      if (profileFilter !== 'kategorie') {
                        handleProfileFilterChange('kategorie');
                        setDropdownOpen(true);  // Öffne das Dropdown sofort, wenn Button aktiviert wird
                      } else {
                        setDropdownOpen(!dropdownOpen);  // Nur Toggle wenn bereits aktiv
                      }
                    }}
                  >
                    <MaterialDesign.MdFilterList /> Nach Kategorie
                  </button>                  {profileFilter === 'kategorie' && dropdownOpen && (
                    <div className="absolute top-full left-0 z-50 mt-1 w-56 py-2 bg-[var(--md-sys-color-surface)] rounded-lg shadow-lg border border-[var(--md-sys-color-outline-variant)] overflow-hidden animate-dropdown-fade-in">
                      {availableKategorien.map(kat => (                        <button
                          key={kat} 
                          className={`${tailwindBtn.classes.timeline.dropdownMenuItem} ${tailwindBtn.classes.timeline.dropdownMenuItemHover}`}
                          onClick={() => {
                            setSelectedKategorie(kat);
                            setDropdownOpen(false);
                          }}
                        >
                          {kat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Treemap-Visualisierung (nur anzeigen, wenn der Treemap-Tab aktiv ist) */}      {activeTab === 'treemap' && (
        <div className={tailwindBtn.classes.timeline.treemapContainer}>
          <h3 className={tailwindBtn.classes.timeline.treemapTitle}>Verteilung der Tests nach Kategorien</h3>
          <div className={tailwindBtn.classes.timeline.treemapVisualization} style={{ height: '500px' }}><ResponsiveTreeMap
              data={prepareTreemapData}
              identity="name"
              value="value"
              valueFormat=".0f"
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              labelSkipSize={12}
              enableLabel={true}
              labelTextColor={isDark ? 
                { from: 'color', modifiers: [['brighter', 4]] } : 
                { from: 'color', modifiers: [['darker', 2]] }
              }
              parentLabelTextColor={isDark ? 
                { from: 'color', modifiers: [['brighter', 4]] } : 
                { from: 'color', modifiers: [['darker', 3]] }
              }
              labelFontSize={14}
              parentLabelFontSize={16}
              borderWidth={2}
              borderColor={isDark ? 
                { from: 'color', modifiers: [['brighter', 0.3]] } : 
                { from: 'color', modifiers: [['darker', 0.5]] }
              }
              colors={node => node.data.color || '#888888'}
              colorBy="color"
              nodeOpacity={0.9}
              animate={true}
              motionConfig="gentle"              defs={[
                // Punkte-Muster für Treemap-Rechtecke - subtiler und moderner
                {
                  id: 'treemap-pattern',
                  type: 'patternDots',
                  background: 'inherit',
                  color: 'rgba(255, 255, 255, 0.2)',
                  size: 4,
                  padding: 6,
                  stagger: true
                },
                // Schatten-Effekt für die Ränder
                {
                  id: 'treemap-gradient',
                  type: 'linearGradient',
                  colors: [
                    { offset: 0, color: 'inherit' },
                    { offset: 100, color: { from: 'color', modifiers: [['darker', 0.3]] } }
                  ]
                }
              ]}
              fill={[{ match: '*', id: 'treemap-pattern' }]}
              theme={{
                textColor: isDark ? '#f0f0f0' : '#333333',
                labels: {
                  text: {
                    fontSize: 14,
                    fontWeight: 600,
                    textShadow: isDark ? 
                      '0px 0px 6px rgba(0,0,0,0.5)' : 
                      '0px 0px 6px rgba(255,255,255,0.8)'
                  }
                },
                tooltip: {
                  container: {
                    background: isDark ? '#333333' : '#ffffff',
                    color: isDark ? '#ffffff' : '#333333',
                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '14px'
                  }
                }
              }}
              tooltip={({ node }) => (                <div className={tailwindBtn.classes.timeline.tooltip}>
                  <strong>{node.id}</strong>
                  <br />
                  {node.value} Tests ({((node.value / tests.length) * 100).toFixed(1)}%)
                  {node.data.tests && node.data.tests.length > 0 && (
                    <div className={tailwindBtn.classes.timeline.treemapTooltipTests}>
                      <strong>Beispiele:</strong>
                      <ul className={tailwindBtn.classes.timeline.treemapTooltipList}>
                        {node.data.tests.slice(0, 5).map(test => (
                          <li key={test} className={tailwindBtn.classes.timeline.treemapTooltipItem}>{test}</li>
                        ))}
                        {node.data.tests.length > 5 && <li className={tailwindBtn.classes.timeline.treemapTooltipItem}>... und {node.data.tests.length - 5} weitere</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            />
          </div>
        </div>
      )}
      
      {/* Timeline-Visualisierung (nur anzeigen, wenn der Timeline-Tab aktiv ist) */}
      {activeTab === 'timeline' && (
        <>          {/* Paginierungs-Navigation */}          {timelineData.length > profilesPerPage && (
            <div className={tailwindBtn.classes.timeline.paginationWrapper}>
              <div className={tailwindBtn.classes.timeline.paginationControls}>
                <button 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 0}
                  className={`${tailwindBtn.classes.timeline.paginationButton} ${tailwindBtn.classes.timeline.paginationButtonHover} ${currentPage === 0 ? tailwindBtn.classes.timeline.paginationButtonDisabled : ''}`}
                >
                  <MaterialDesign.MdChevronLeft /> Vorherige
                </button>
                <button 
                  onClick={handleNextPage} 
                  disabled={currentPage >= pageCount - 1}
                  className={`${tailwindBtn.classes.timeline.paginationButton} ${tailwindBtn.classes.timeline.paginationButtonHover} ${currentPage >= pageCount - 1 ? tailwindBtn.classes.timeline.paginationButtonDisabled : ''}`}
                >
                  Nächste <MaterialDesign.MdChevronRight />
                </button>
              </div>
              <div className={tailwindBtn.classes.timeline.paginationInfo}>
                <span>Seite {currentPage + 1} von {pageCount}</span>
              </div>
            </div>
          )}
          
          {/* Profil-Timelines */}
          {currentPageData.map((profileData) => (            <div key={profileData.profileId} className={`${tailwindBtn.classes.timeline.profileSection} ${currentPageData.indexOf(profileData) === currentPageData.length - 1 ? tailwindBtn.classes.timeline.profileSectionLast : ''}`}>              <h3 className={tailwindBtn.classes.timeline.profileName}>{profileData.profile}</h3>
              <p className={tailwindBtn.classes.timeline.profileDuration}>
                Gesamtdauer (längster Test): {formatDuration(profileData.maxDuration)}
                {profileData.categories && profileData.categories.length > 1 && (
                  <span className="ml-2 text-sm">
                    ({profileData.categories.length} Testkategorien)
                  </span>
                )}
              </p><div className={tailwindBtn.classes.timeline.chartContainer} style={{ 
                height: isMobile ? `${Math.max(400, profileData.tests.length * 30)}px` : `${profileData.tests.length * 50 + 100}px` 
              }}>
                <ResponsiveBar
                  data={prepareChartData(profileData)}
                  keys={['duration']}
                  indexBy="test"                  margin={isMobile
                    ? { top: 50, right: 30, bottom: 120, left: 60 } 
                    : { top: 20, right: 130, bottom: 50, left: 200 }
                  }                  padding={0.3}
                  layout={isMobile ? "vertical" : "horizontal"}
                  valueScale={{ type: 'linear' }}
                  indexScale={{ type: 'band', round: true }}                  colors={({ data }) => data.color}
                  theme={{
                    textColor: isDark ? '#f0f0f0' : '#333333',
                    axis: {
                      domain: {
                        line: {
                          stroke: isDark ? '#888888' : '#cccccc',
                          strokeWidth: 1
                        }
                      },
                      ticks: {
                        line: {
                          stroke: isDark ? '#888888' : '#cccccc',
                          strokeWidth: 1
                        },
                        text: {
                          fill: isDark ? '#f0f0f0' : '#333333',
                          fontSize: 12,
                          fontWeight: 500 // Etwas fetter für bessere Lesbarkeit
                        }
                      },
                      legend: {
                        text: {
                          fill: isDark ? '#ffffff' : '#333333',
                          fontSize: 13,
                          fontWeight: 600 // Fetter für die Legende
                        }
                      }
                    },
                    tooltip: {
                      container: {
                        background: isDark ? '#333333' : '#ffffff',
                        color: isDark ? '#ffffff' : '#333333',
                        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
                        borderRadius: '6px',
                        padding: '12px',
                        fontSize: '14px'
                      }
                    },
                    // Verbesserte Darstellung der Balken
                    bars: {
                      borderRadius: 4,
                      borderWidth: 0,
                      // Leichter Farbverlauf für einen 3D-Effekt
                      gradient: {
                        type: 'linear',
                        colors: [
                          { offset: 0, color: { from: 'color', modifiers: [['darker', 0.2]] } },
                          { offset: 100, color: { from: 'color', modifiers: [['brighter', 0.1]] } }
                        ]
                      }
                    }
                  }}
                  defs={[
                    // Schatten-Effekt für die Balken
                    {
                      id: 'shadow-pattern',
                      type: 'patternLines',
                      background: 'inherit',
                      color: 'rgba(0, 0, 0, 0.05)',
                      rotation: -45,
                      lineWidth: 4,
                      spacing: 8
                    }
                  ]}
                  fill={[{ match: '*', id: 'shadow-pattern' }]}
                  borderRadius={4}
                  borderWidth={1}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
                  // Hover-Effekte
                  hoverTarget="row"
                  hoverEffect={(bar, index, state) => ({
                    style: {
                      fill: state === 'enter' ? { from: 'color', modifiers: [['brighter', 0.2]] } : bar.color,
                      strokeWidth: state === 'enter' ? 2 : 1,
                      boxShadow: state === 'enter' ? '0 0 8px rgba(0, 0, 0, 0.3)' : 'none'
                    }
                  })}axisTop={null}
                  axisRight={null}
                  axisBottom={isMobile ? {
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: 'Test',
                    legendPosition: 'middle',
                    legendOffset: 80,
                    truncateTickAt: 0
                  } : {
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Dauer (Minuten)',
                    legendPosition: 'middle',
                    legendOffset: 40,
                    format: value => formatDuration(value)
                  }}
                  axisLeft={isMobile ? {
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Dauer (Minuten)',
                    legendPosition: 'middle',
                    legendOffset: -30,
                    format: value => formatDuration(value)
                  } : {
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Test',
                    legendPosition: 'middle',
                    legendOffset: -180
                  }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  labelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                  animate={true}
                  animationDuration={300}
                  enableLabel={false}                  tooltip={({ data }) => (
                    <div className={tailwindBtn.classes.timeline.tooltip}>                    <strong>{data.testId}: {data.test}</strong>
                      <br />
                      Dauer: {formatDuration(data.duration)}
                      <br />
                      <div className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: getCategoryColor(data.category) }}></span>
                        Kategorie: {data.category}
                      </div>
                    </div>
                  )}                  legends={[
                    {
                      data: createProfileLegendItems(profileData),
                      anchor: 'bottom-right',
                      direction: 'column',
                      justify: false,
                      translateX: 120,
                      translateY: 0,
                      itemsSpacing: 2,
                      itemWidth: 100,
                      itemHeight: 20,
                      itemDirection: 'left-to-right',
                      itemOpacity: 0.85,
                      symbolSize: 20,
                      symbolShape: 'square',
                      effects: [
                        {
                          on: 'hover',
                          style: {
                            itemOpacity: 1
                          }
                        }
                      ]
                    }
                  ]}
                />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default TimelineView;
