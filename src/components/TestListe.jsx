import React, { useState, useMemo, memo, useEffect, useCallback } from 'react'
import TestCheckbox from './TestCheckbox'
import '@material/web/ripple/ripple.js'
import '@material/web/elevation/elevation.js'
import * as MaterialDesign from "react-icons/md"
import { useMaterialService } from '../services/MaterialService'
import MaterialBadge from './MaterialBadge'
import tailwindBtn from './tailwindBtn'
import ProfilErstellungDialog from './ProfilErstellungDialog'

function TestListe({ 
  tests, 
  onTestClick, 
  selectedTests, 
  onTestSelect = () => {},
  sortOption = 'id',
  sortDirection = 'asc'
}) {
  // Pagination-Einstellungen
  const ITEMS_PER_PAGE = 150; // 3x4 Grid für Desktop
  const PAGINATION_THRESHOLD = 150; // Ab dieser Anzahl Tests wird paginiert
  const [currentPage, setCurrentPage] = useState(1);
  const isPaginationEnabled = tests.length > PAGINATION_THRESHOLD;

  // Sicherstellen, dass selectedTests immer ein Array ist
  const safeSelectedTests = selectedTests || [];
  const [selectedTest, setSelectedTest] = useState(null);
  const [activeTest, setActiveTest] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [showSpeichernDialog, setShowSpeichernDialog] = useState(false);
  const [speicherErfolgreich, setSpeicherErfolgreich] = useState(false);
  const { convertMaterialIdsToNames, isLoading: materialsLoading } = useMaterialService();
  
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
  
  // Konvertiere ms in Sekunden für CSS-Variable
  const longPressDuration = 600; // ms
  
  // WICHTIG: Diese Funktionen müssen VOR ihrer Verwendung definiert werden!
  
  // Prüfen, ob ein Test ausgewählt ist - mit useCallback stabilisiert
  const isTestSelected = useCallback((test) => {
    return safeSelectedTests.some(selectedTest => selectedTest.id === test.id);
  }, [safeSelectedTests]);

  // Test-Auswahl umschalten - mit useCallback stabilisiert
  const toggleTestSelection = useCallback((test) => {
    if (safeSelectedTests.some(selectedTest => selectedTest.id === test.id)) {
      // Test entfernen, wenn bereits ausgewählt
      onTestSelect(safeSelectedTests.filter(t => t.id !== test.id));
    } else {
      // Test hinzufügen, wenn nicht ausgewählt
      onTestSelect([...safeSelectedTests, test]);
    }
  }, [safeSelectedTests, onTestSelect]);
  
  // Standard Click-Handler für Desktop-Nutzung und zur Anzeige der Details
  const handleTestClick = useCallback((test, e) => {
    // Wenn auf die Checkbox oder deren Label geklickt wurde, nichts tun
    if (e && (e.target.closest('.test-checkbox') || e.target.classList.contains('test-cb-label') || 
              e.target.classList.contains('test-cb-input'))) {
      return;
    }

    // Prüfen, ob es sich um ein Touch-Gerät handelt
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Wenn Long-Press aktiv war, keinen Test öffnen (nur für Touch-Geräte)
    if (isTouchDevice && isLongPress) {
      setIsLongPress(false);
      return;
    }

    // Test-Details öffnen (für Desktop oder einfachen Touch)
    onTestClick(test);
  }, [isLongPress, onTestClick]);

  // Moderner Pointer-Down Handler (statt touchStart)
  const handlePointerDown = useCallback((test, e) => {
    // Ignorieren bei Checkbox-Interaktionen
    if (e.target.closest('.test-checkbox') || e.target.classList.contains('test-cb-label') || 
        e.target.classList.contains('test-cb-input')) {
      return;
    }
    
    // Long-Press nur bei Touch aktivieren, nicht bei Maus
    if (e.pointerType === 'touch') {
      setActiveTest(test);

      // Timer für Long-Press starten
      const timer = setTimeout(() => {
        toggleTestSelection(test);
        setIsLongPress(true);
        
        // Haptisches Feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, longPressDuration);
      
      setLongPressTimer(timer);
    }
  }, [toggleTestSelection, longPressDuration]);

  // Pointer-Up Handler (statt touchEnd)
  const handlePointerUp = useCallback(() => {
    // Timer löschen
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Nach einer Weile den Long-Press-Status zurücksetzen
    if (isLongPress) {
      setTimeout(() => {
        setIsLongPress(false);
      }, 300);
    }
    
    setActiveTest(null);
  }, [longPressTimer, isLongPress]);

  // Pointer-Cancel Handler (z.B. bei Scroll)
  const handlePointerCancel = useCallback(() => {
    // Timer löschen
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    setActiveTest(null);
  }, [longPressTimer]);
  
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
  
  // Aktuelle Seite von Tests für Pagination
  const currentTests = useMemo(() => {
    if (!isPaginationEnabled) return sortedTests;
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedTests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedTests, currentPage, isPaginationEnabled, ITEMS_PER_PAGE]);
  
  // Berechne die Gesamtanzahl der Seiten
  const totalPages = useMemo(() => {
    if (!isPaginationEnabled) return 1;
    return Math.ceil(sortedTests.length / ITEMS_PER_PAGE);
  }, [sortedTests.length, isPaginationEnabled, ITEMS_PER_PAGE]);
  
  // Setze die aktuelle Seite zurück, wenn sich die sortierten Tests ändern
  useEffect(() => {
    setCurrentPage(1);
  }, [sortOption, sortDirection]);

  // Separate Komponente für den Inhalt einer Testkarte
  const TestCardContent = memo(({ test }) => (
    <>
      <md-ripple></md-ripple>
      <div className="mb-2">
        <h3 className={`font-medium text-lg mb-1 ${tailwindBtn.classes.text} ${
          test.kategorie 
            ? `kategorie-text-${test.kategorie.toLowerCase().replace(/\s+/g, '-')}` 
            : ''
        }`}>
          {test.name || 'Kein Name'}
        </h3>
      </div>
      <p className={`inline-block mb-3 px-2 py-1 rounded-full text-sm kategorie-badge ${
        test.kategorie 
          ? `kategorie-${test.kategorie.toLowerCase().replace(/\s+/g, '-')}` 
          : 'bg-gray-200 text-gray-700'
      }`}>
        {test.kategorie || 'Keine Kategorie'}
      </p>
      <div className="mb-2">
        <strong className={`text-sm ${tailwindBtn.classes.text}`}>Material:</strong>
        {test.material && test.material.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {test.material.map((materialId, index) => (
              <MaterialBadge key={index} materialId={materialId} mini={true} />
            ))}
          </div>
        ) : (
          <span className={`text-sm italic ${tailwindBtn.classes.textMuted}`}>Keine Angabe</span>
        )}
      </div>
      {test.synonyme && test.synonyme.length > 0 && (
        <div className={`mt-2 pt-2 border-t ${tailwindBtn.borderClasses} border-dashed`}>
          <span className={`text-sm ${tailwindBtn.classes.textMuted} italic`}>{test.synonyme.join(', ')}</span>
        </div>
      )}
    </>
  ), (prevProps, nextProps) => {
    // Nur neu rendern wenn sich die Test ID ändert
    return prevProps.test.id === nextProps.test.id;
  });

  // Separate Komponente für die Checkbox, um Re-Renders zu isolieren
  const TestCardCheckbox = memo(({ test }) => {
    const isSelected = isTestSelected(test);
    
    return (
      <div 
        className="absolute bottom-3 right-3 z-10" 
        onClick={e => e.stopPropagation()}
      >
        <TestCheckbox 
          test={test} 
          isSelected={isSelected} 
          onToggle={toggleTestSelection} 
        />
      </div>
    );
  }, (prevProps, nextProps) => {
    // Checkbox-Component soll nur neu rendern wenn sich die Test-ID ändert
    // Tatsächliches checked-state wird in der TestCheckbox-Komponente selbst gehandhabt
    return prevProps.test.id === nextProps.test.id;
  });

  // Optimierte TestCard-Komponente ohne Lazy-Loading
  const TestCard = memo(({ test }) => {
    // Berechnete Werte für Karten-Styling
    const isSelected = isTestSelected(test);
    const isActive = activeTest?.id === test.id;
    
    // Event-Handler
    const clickHandler = useCallback((e) => handleTestClick(test, e), [test]);
    const pointerDownHandler = useCallback((e) => handlePointerDown(test, e), [test]);

    return (
      <div
        className={`relative rounded-lg shadow-sm p-4 ${tailwindBtn.classes.cardBg} border ${
          isSelected
            ? tailwindBtn.classes.selected
            : tailwindBtn.borderClasses
        } ${
          isActive
            ? tailwindBtn.classes.active
            : tailwindBtn.classes.hoverEffect
        } theme-transition`}
        onClick={clickHandler}
        onPointerDown={pointerDownHandler}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{"--long-press-duration": `${longPressDuration/1000}s`}}
      >
        {/* Separater Checkbox-Bereich */}
        <TestCardCheckbox test={test} />
        
        {/* Inhalt der Karte */}
        <TestCardContent test={test} />
      </div>
    );
  }, (prevProps, nextProps) => {
    // Komplett memoized TestCard - nur neu rendern wenn sich die Test-ID ändert
    return prevProps.test.id === nextProps.test.id;
  });

  // Pagination Controls
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scrolle zum Anfang der Liste
      window.scrollTo({
        top: document.querySelector('.test-liste-container')?.offsetTop || 0,
        behavior: 'smooth'
      });
    }
  };
  
  // Pagination Component
  const PaginationControls = () => {
    // Wenn Pagination deaktiviert ist oder nur eine Seite vorhanden ist, keine Controls anzeigen
    if (!isPaginationEnabled || totalPages <= 1) return null;
    
    // Helper für die Seitenauswahl
    const pages = [];
    const maxVisiblePages = 5; // Maximale Anzahl sichtbarer Seitenzahlen
    
    // Bestimme, welche Seitenzahlen angezeigt werden sollen
    let startPage = Math.max(1, Math.min(currentPage - Math.floor(maxVisiblePages / 2), totalPages - maxVisiblePages + 1));
    const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Erzeuge Array mit anzuzeigenden Seitenzahlen
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex justify-center items-center my-6 select-none">
        {/* Zurück-Button */}
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-l-lg border ${tailwindBtn.borderClasses} ${
            currentPage === 1 
              ? 'opacity-50 cursor-not-allowed'
              : `${tailwindBtn.classes.hoverEffect} hover:bg-gray-100 dark:hover:bg-gray-700`
          } theme-transition`}
          aria-label="Vorherige Seite"
        >
          <MaterialDesign.MdChevronLeft className="text-xl" />
        </button>
        
        {/* Erste Seite, wenn nicht im sichtbaren Bereich */}
        {startPage > 1 && (
          <>
            <button 
              onClick={() => handlePageChange(1)}
              className={`px-3 py-1 border-y ${tailwindBtn.borderClasses} ${tailwindBtn.classes.hoverEffect} hover:bg-gray-100 dark:hover:bg-gray-700 theme-transition`}
            >
              1
            </button>
            {startPage > 2 && (
              <span className={`px-3 py-1 border-y ${tailwindBtn.borderClasses} ${tailwindBtn.classes.textMuted}`}>...</span>
            )}
          </>
        )}
        
        {/* Seitenzahlen */}
        {pages.map(page => (
          <button 
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 border-y ${tailwindBtn.borderClasses} ${
              currentPage === page 
                ? `${tailwindBtn.classes.selected} font-medium`
                : `${tailwindBtn.classes.hoverEffect} hover:bg-gray-100 dark:hover:bg-gray-700`
            } theme-transition`}
          >
            {page}
          </button>
        ))}
        
        {/* Letzte Seite, wenn nicht im sichtbaren Bereich */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className={`px-3 py-1 border-y ${tailwindBtn.borderClasses} ${tailwindBtn.classes.textMuted}`}>...</span>
            )}
            <button 
              onClick={() => handlePageChange(totalPages)}
              className={`px-3 py-1 border-y ${tailwindBtn.borderClasses} ${tailwindBtn.classes.hoverEffect} hover:bg-gray-100 dark:hover:bg-gray-700 theme-transition`}
            >
              {totalPages}
            </button>
          </>
        )}
        
        {/* Weiter-Button */}
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-r-lg border ${tailwindBtn.borderClasses} ${
            currentPage === totalPages 
              ? 'opacity-50 cursor-not-allowed'
              : `${tailwindBtn.classes.hoverEffect} hover:bg-gray-100 dark:hover:bg-gray-700`
          } theme-transition`}
          aria-label="Nächste Seite"
        >
          <MaterialDesign.MdChevronRight className="text-xl" />
        </button>
      </div>
    );
  };
  
  // Optimiertes Grid-Rendering mit useMemo
  const TestCardGrid = useMemo(() => (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 ${tailwindBtn.classes.containerBg}`}>
      {currentTests.map(test => <TestCard key={test.id} test={test} />)}
    </div>
  ), [currentTests]);
  
  return (
    <div className="w-full test-liste-container">
      {tests.length === 0 ? (
        <p className={`text-center py-8 ${tailwindBtn.classes.textMuted} text-lg`}>Keine Tests gefunden.</p>
      ) : (
        <>
          {/* Anzeige der aktuellen Seite und Gesamtanzahl */}
          {isPaginationEnabled && (
            <div className={`mb-3 text-sm ${tailwindBtn.classes.textMuted} flex justify-between items-center`}>
              <span>
                Zeige {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, sortedTests.length)} von {sortedTests.length} Tests
              </span>
              <span>
                Seite {currentPage} von {totalPages}
              </span>
            </div>
          )}          
          {/* Test-Karten-Grid mit optimierter Render-Strategie */}
          {TestCardGrid}
          
          {/* Pagination Controls (unten) */}
          <PaginationControls />
        </>
      )}
      
      {/* Dialog zum Speichern persönlicher Profile - Wiederverwendung der ProfilErstellungDialog-Komponente */}
      {showSpeichernDialog && (
        <ProfilErstellungDialog 
          selectedTests={safeSelectedTests}
          onClose={() => setShowSpeichernDialog(false)} 
          onSpeichern={handleSpeichern}
          mode="save"
        />
      )}
      
      {/* Erfolgsmeldung mit Animation */}
      {speicherErfolgreich && (
        <div className={tailwindBtn.classes.successToast}>
          <MaterialDesign.MdCheckCircle className="text-xl" /> 
          Profil erfolgreich gespeichert!
        </div>
      )}
    </div>
  );
}

export default TestListe;