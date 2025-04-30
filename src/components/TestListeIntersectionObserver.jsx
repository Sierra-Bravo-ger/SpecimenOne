import React, { useState, useMemo, memo, useRef } from 'react'
import TestCheckbox from './TestCheckbox'
import '@material/web/ripple/ripple.js'
import '@material/web/elevation/elevation.js'
import * as MaterialDesign from "react-icons/md"
import { useMaterialService } from '../services/MaterialService'
import MaterialBadge from './MaterialBadge'
import tailwindBtn from './tailwindBtn'
import ProfilErstellungDialog from './ProfilErstellungDialog'
import { useInView } from 'react-intersection-observer'

function TestListe({ 
  tests, 
  onTestClick, 
  selectedTests, 
  onTestSelect = () => {},
  sortOption = 'id',
  sortDirection = 'asc'
}) {
  // Sicherstellen, dass selectedTests immer ein Array ist
  const safeSelectedTests = selectedTests || [];
  const [selectedTest, setSelectedTest] = useState(null);
  const [activeTest, setActiveTest] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [showSpeichernDialog, setShowSpeichernDialog] = useState(false);
  const [speicherErfolgreich, setSpeicherErfolgreich] = useState(false);
  const { convertMaterialIdsToNames, isLoading: materialsLoading } = useMaterialService();
  
  // Verbesserte Touch-Tracking-Logik
  const touchState = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    isScrolling: false,
    testId: null,
    moved: false,
    touchActive: false
  });
  
  // Konstanten für die Touch-Erkennung
  const SCROLL_THRESHOLD = 8; // Pixel ab denen eine Bewegung als Scrolling gilt
  const LONG_PRESS_DELAY = 600; // ms für Long Press
  
  // Funktion zum Speichern eines persönlichen Profils
  const speicherePersoenlichesProfil = () => {
    if (safeSelectedTests.length === 0) {
      alert('Bitte wählen Sie mindestens einen Test aus.');
      return;
    }
    
    // Dialog zum Speichern anzeigen
    setShowSpeichernDialog(true);
  };

  const handleSpeichern = (name, beschreibung, kategorie) => {
    // Neues Profil erstellen
    const neuesProfil = {
      id: Date.now().toString(), // Einfache ID-Generierung
      name,
      beschreibung,
      kategorie,
      erstelltAm: new Date().toISOString(),
      tests: safeSelectedTests.map(test => {
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

  // Standard Click-Handler für Desktop-Nutzung 
  const handleTestClick = (test, e) => {
    // Wenn auf die Checkbox oder deren Label geklickt wurde, nichts tun
    if (e && (e.target.closest('.test-checkbox') || e.target.classList.contains('test-cb-label') || 
              e.target.classList.contains('test-cb-input'))) {
      return;
    }
    
    // Bei Touch-Geräten nicht reagieren - hier übernehmen die Touch-Events
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return;
    }

    // Bei Desktop-Geräten: Test öffnen
    onTestClick(test);
  };

  // Test-Auswahl umschalten
  const toggleTestSelection = (test) => {
    if (isTestSelected(test)) {
      // Test entfernen, wenn bereits ausgewählt
      onTestSelect(safeSelectedTests.filter(t => t.id !== test.id));
    } else {
      // Test hinzufügen, wenn nicht ausgewählt
      onTestSelect([...safeSelectedTests, test]);
    }
  };
  
  // Prüfen, ob ein Test ausgewählt ist
  const isTestSelected = (test) => {
    return safeSelectedTests.some(selectedTest => selectedTest.id === test.id);
  };
  
  // Touch-Start-Handler
  const handleTouchStart = (e, test) => {
    // Ignoriere Touch-Events auf Checkbox
    if (e.target.closest('.test-checkbox') || e.target.classList.contains('test-cb-label') || 
        e.target.classList.contains('test-cb-input')) {
      return;
    }
    
    const touch = e.touches[0];
    
    // Touch-Status zurücksetzen und neue Touch-Werte speichern
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isScrolling: false,
      testId: test.id,
      moved: false,
      touchActive: true
    };
    
    // Aktiven Test für UI-Feedback setzen
    setActiveTest(test);
    
    // Long-Press Timer starten
    const timer = setTimeout(() => {
      // Long-Press nur erkennen, wenn:
      // 1. Touch noch aktiv ist
      // 2. Keine Scrollbewegung erkannt wurde
      // 3. Der Timer nicht während eines Scrollvorgangs ausgelöst wurde
      if (touchState.current.touchActive && !touchState.current.isScrolling && !touchState.current.moved) {
        setIsLongPress(true);
        toggleTestSelection(test);
        
        // Haptisches Feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, LONG_PRESS_DELAY);
    
    setLongPressTimer(timer);
  };
  
  // Touch-Move-Handler
  const handleTouchMove = (e) => {
    // Wenn kein Touch aktiv ist, nichts tun
    if (!touchState.current.touchActive) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchState.current.startX);
    const deltaY = Math.abs(touch.clientY - touchState.current.startY);
    
    // Als Scrollvorgang erkennen, wenn Bewegung über Schwellenwert geht
    if (deltaX > SCROLL_THRESHOLD || deltaY > SCROLL_THRESHOLD) {
      touchState.current.moved = true;
      
      // Wenn bisher kein Scrolling erkannt, jetzt als Scrolling markieren
      if (!touchState.current.isScrolling) {
        touchState.current.isScrolling = true;
        
        // Long-Press Timer abbrechen, da wir scrollen
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          setLongPressTimer(null);
        }
        
        // Aktiven Test zurücksetzen
        setActiveTest(null);
      }
    }
  };
  
  // Touch-End-Handler
  const handleTouchEnd = (e, test) => {
    // Long-Press Timer abbrechen
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Wenn wir einen Long-Press hatten, keine weitere Aktion
    if (isLongPress) {
      setTimeout(() => setIsLongPress(false), 300);
      touchState.current.touchActive = false;
      return;
    }
    
    // Wenn es ein einfacher Tap ohne Scrolling war, Test öffnen
    if (!touchState.current.isScrolling && !touchState.current.moved && 
        touchState.current.testId === test.id) {
      // Nur als Tap erkennen, wenn Touch weniger als 300ms dauert
      if (Date.now() - touchState.current.startTime < 300) {
        onTestClick(test);
      }
    }
    
    // Touch-Status zurücksetzen
    touchState.current.touchActive = false;
    setActiveTest(null);
  };
  
  // Touch-Cancel-Handler
  const handleTouchCancel = () => {
    // Timer abbrechen und Status zurücksetzen
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    touchState.current.touchActive = false;
    setActiveTest(null);
  };
  
  // Flexibel sortieren basierend auf den übergebenen Sortieroptionen
  const sortedTests = useMemo(() => {
    return [...tests].sort((a, b) => {
      let comparison = 0;
      
      switch (sortOption) {
        case 'name':
          // Nach Namen sortieren
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'kategorie':
          // Nach Kategorie sortieren, dann nach Namen
          comparison = (a.kategorie || '').localeCompare(b.kategorie || '');
          if (comparison === 0) {
            comparison = (a.name || '').localeCompare(b.name || '');
          }
          break;
        case 'material':
          // Nach dem ersten Material sortieren (falls vorhanden), dann nach Namen
          const aMaterial = a.material && a.material.length > 0 ? a.material[0] : '';
          const bMaterial = b.material && b.material.length > 0 ? b.material[0] : '';
          comparison = aMaterial.localeCompare(bMaterial);
          if (comparison === 0) {
            comparison = (a.name || '').localeCompare(b.name || '');
          }
          break;
        case 'id':
        default:
          // Nach ID sortieren (Standard)
          comparison = a.id.localeCompare(b.id);
          break;
      }
      
      // Sortierrichtung anwenden (aufsteigend oder absteigend)
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [tests, sortOption, sortDirection]);
  
  // Intersection Observer für virtualisiertes Rendering
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  // Rendere die Liste als virtualisierte List-Items
  return (
    <div className="w-full">
      <div className="sticky top-0 z-10 flex justify-between bg-white dark:bg-gray-800 p-2 border-b border-gray-300 dark:border-gray-600 shadow-sm">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mr-2">
            {safeSelectedTests.length} ausgewählt
          </span>
        </div>
        
        <button 
          onClick={speicherePersoenlichesProfil}
          disabled={safeSelectedTests.length === 0}
          className={`
            ${safeSelectedTests.length > 0
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
            px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200
          `}
        >
          <MaterialDesign.MdBookmarkAdd className="inline mr-1" />
          Als Profil speichern
        </button>
      </div>

      {/* Erfolgsmeldung beim Speichern */}
      {speicherErfolgreich && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-2 mb-4">
          <p className="font-medium">Profil erfolgreich gespeichert!</p>
        </div>
      )}
      
      {/* Liste der Tests mit Touch-Event-Handlern */}
      <ul className="divide-y divide-gray-300 dark:divide-gray-700">
        {sortedTests.map(test => (
          <li
            key={test.id}
            ref={ref}
            className={`
              relative px-4 py-3 flex items-center 
              ${test.aktiv === false ? 'opacity-50' : ''}
              ${activeTest?.id === test.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
              transition-colors duration-200
            `}
            onClick={(e) => handleTestClick(test, e)}
            onTouchStart={(e) => handleTouchStart(e, test)}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, test)}
            onTouchCancel={handleTouchCancel}
          >
            {/* Checkbox für Auswahl */}
            <TestCheckbox 
              test={test} 
              isSelected={isTestSelected(test)} 
              onToggle={toggleTestSelection}
            />
            
            <div className="flex-1 ml-3">
              {/* Test-ID mit Aktiv-Status */}
              <div className="flex items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{test.id}</span>
                {test.aktiv === false && (
                  <span className="ml-2 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs">
                    Inaktiv
                  </span>
                )}
              </div>
              
              {/* Test-Name */}
              <div className="font-medium text-gray-900 dark:text-gray-100 mb-0.5 line-clamp-2">
                {test.name || <span className="italic text-gray-500">Kein Name</span>}
              </div>
              
              {/* Kategorie und Material */}
              <div className="flex flex-wrap gap-1 mt-1">
                {test.kategorie && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    {test.kategorie}
                  </span>
                )}
                
                {test.material && test.material.map((materialId, index) => (
                  <MaterialBadge 
                    key={index} 
                    materialId={materialId} 
                    mini={true}
                    showKurzbezeichnung={true} 
                  />
                ))}
              </div>
            </div>
            
            <MaterialDesign.MdChevronRight className="text-gray-400 dark:text-gray-500 text-xl" />
          </li>
        ))}
      </ul>
      
      {/* Dialog zum Speichern des Profils */}
      <ProfilErstellungDialog
        isOpen={showSpeichernDialog}
        selectedTests={safeSelectedTests}
        onClose={() => setShowSpeichernDialog(false)} 
        onSpeichern={handleSpeichern}
        mode="save"
      />
    </div>
  );
}

export default memo(TestListe);
