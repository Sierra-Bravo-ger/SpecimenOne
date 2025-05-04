import React, { useState, useMemo, memo, useEffect, useCallback } from 'react';
import TestCheckbox from './TestCheckbox';
import '@material/web/ripple/ripple.js';
import '@material/web/elevation/elevation.js';
import * as MaterialDesign from "react-icons/md";
import { useMaterialService } from '../services/MaterialService';
import MaterialBadge from './MaterialBadge';
import TestCardContent from './TestCardContent';
import tailwindBtn from './tailwindBtn';
import ProfilErstellungDialog from './ProfilErstellungDialog';

function TestListe({ 
  tests, 
  onTestClick, 
  selectedTests, 
  onTestSelect = () => {},
  sortOption = 'id',
  sortDirection = 'asc',
  onCheckboxToggle = null
}) {  // Pagination-Einstellungen - Angepasst für größere Datenmengen (2000+ Tests)
  const ITEMS_PER_PAGE = 200; // Erhöht, um mehr Tests auf einmal anzuzeigen
  const PAGINATION_THRESHOLD = 120; // Ab dieser Anzahl Tests wird paginiert
  const [currentPage, setCurrentPage] = useState(1);
  const isPaginationEnabled = tests.length > PAGINATION_THRESHOLD;

  // Sicherstellen, dass selectedTests immer ein Array ist
  const safeSelectedTests = selectedTests || [];
  const [selectedTest, setSelectedTest] = useState(null);
  const [activeTest, setActiveTest] = useState(null);
  // Long-Press states beibehalten, aber nicht mehr aktiv benutzt
  const [isLongPress, setIsLongPress] = useState(false); 
  const [showSpeichernDialog, setShowSpeichernDialog] = useState(false);
  const [showProfilAntragDialog, setShowProfilAntragDialog] = useState(false);
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
  
  // Funktion zum Erstellen eines Profil-Antrags
  const erstelleProfilAntrag = () => {
    if (safeSelectedTests.length === 0) {
      alert('Bitte wählen Sie mindestens einen Test aus.');
      return;
    }
    
    // Dialog zum Erstellen eines Profil-Antrags anzeigen
    setSelectedTest(null);
    setShowProfilAntragDialog(true);
  };

  // Long-Press-Funktionalität deaktiviert
  // In einem Kommentar gespeicherte Lösungsansätze für spätere Referenz
  /*
   * Lösungansätze für bessere Long-Press-Funktionalität:
   * 
   * 1. Bewegungstoleranz einbauen: Bei einer kleinen Bewegung des Fingers sollte der Long-Press abgebrochen werden:
   *    - Im pointerDown-Handler eine Startposition speichern: const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
   *    - Im handlePointerDown:
   *      if (e.pointerType === 'touch') {
   *        setTouchStartPos({ x: e.clientX, y: e.clientY });
   *        // Rest des Codes...
   *      }
   *    - Im handlePointerMove:
   *      const handlePointerMove = useCallback((e) => {
   *        if (e.pointerType === 'touch' && longPressTimer) {
   *          const moveX = Math.abs(e.clientX - touchStartPos.x);
   *          const moveY = Math.abs(e.clientY - touchStartPos.y);
   *          // Wenn Bewegung größer als Schwellenwert, Long-Press abbrechen
   *          if (moveY > 5 || moveX > 5) {
   *            clearTimeout(longPressTimer);
   *            setLongPressTimer(null);
   *          }
   *        }
   *      }, [longPressTimer, touchStartPos]);
   * 
   * 2. Einen dedizierte Long-Press-Komponente verwenden: Es gibt fertige React-Komponenten für Long-Press wie use-long-press, 
   *    die bereits solche Edge Cases berücksichtigen.
   * 
   * 3. Scrollen und Long-Press trennen: Eine andere Strategie wäre, einen bestimmten Bereich jeder Karte für Long-Press zu reservieren
   *    (z.B. ein Icon), während der Rest der Karte normales Scrollverhalten beibehält.
   */

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
    // Überprüfen, ob ein Test ausgewählt ist
  const isTestSelected = useCallback((test) => {
    return safeSelectedTests.some(selectedTest => selectedTest.id === test.id);
  }, [safeSelectedTests]);  // Test-Auswahl umschalten - mit useCallback stabilisiert
  const toggleTestSelection = useCallback((test) => {
    const wasSelected = safeSelectedTests.some(selectedTest => selectedTest.id === test.id);
    
    if (wasSelected) {
      // Test entfernen, wenn bereits ausgewählt
      const newSelectedTests = safeSelectedTests.filter(t => t.id !== test.id);
      onTestSelect(newSelectedTests);
      
      // Optional: Debug-Callback aufrufen, wenn vorhanden
      if (onCheckboxToggle) {
        onCheckboxToggle(test, true, false);
      }
    } else {
      // Test hinzufügen, wenn nicht ausgewählt
      const newSelectedTests = [...safeSelectedTests, test];
      onTestSelect(newSelectedTests);
      
      // Optional: Debug-Callback aufrufen, wenn vorhanden
      if (onCheckboxToggle) {
        onCheckboxToggle(test, false, true);
      }
    }
  }, [safeSelectedTests, onTestSelect, onCheckboxToggle]);
  
  // Standard Click-Handler für Desktop-Nutzung und zur Anzeige der Details
  const handleTestClick = useCallback((test, e) => {
    // Wenn auf die Checkbox oder deren Label geklickt wurde, nichts tun
    if (e && (e.target.closest('.test-checkbox') || e.target.classList.contains('test-cb-label') || 
              e.target.classList.contains('test-cb-input'))) {
      return;
    }

    // Test Details immer direkt öffnen
    onTestClick(test);
  }, [onTestClick]);

  // Vereinfachter Pointer-Down Handler - nur für visuelles Feedback
  const handlePointerDown = useCallback((test, e) => {
    // Ignorieren bei Checkbox-Interaktionen
    if (e && e.target && (e.target.closest('.test-checkbox') || e.target.classList.contains('test-cb-label') || 
        e.target.classList.contains('test-cb-input'))) {
      return;
    }
    
    // Für alle Geräte nur das visuelle Feedback setzen
    setActiveTest(test);
  }, []);

  // Vereinfachter Pointer-Up Handler
  const handlePointerUp = useCallback(() => {
    // Einfach nur den aktiven Test zurücksetzen
    setActiveTest(null);
    
    // Long-Press zurücksetzen
    setIsLongPress(false);
  }, []);

  // Vereinfachter Pointer-Cancel Handler
  const handlePointerCancel = useCallback(() => {
    // Einfach nur den aktiven Test zurücksetzen
    setActiveTest(null);
  }, []);
  
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
  }, [sortOption, sortDirection]);  // Stabile Key-Funktion für MaterialBadges
  const getStableMaterialKey = useCallback((materialId, index) => {
    // Erzeuge einen stabilen Key basierend auf materialId und Index
    return `material-${materialId}-${index}`;
  }, []);  // Separate Komponente für den Inhalt einer Testkarte
  // Externe Komponente für bessere Memoization
  /* TestCardContent wurde in eigene Datei ausgelagert */

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
      // Event-Handler - einfach und direkt
    const clickHandler = useCallback((e) => handleTestClick(test, e), [test]);
    const pointerDownHandler = useCallback((e) => handlePointerDown(test, e), [test]);
      // Touch-Handler mit Scroll-Erkennung
    const [touchStartPos, setTouchStartPos] = useState(null);
    
    const handleTouchStart = useCallback((e) => {
      if (e?.touches?.[0]) {
        setTouchStartPos({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now()
        });
      }
    }, []);
    
    const handleTouchEnd = useCallback((e) => {
      // Ignorieren bei Checkbox-Interaktionen
      if (e && e.target && (e.target.closest('.test-checkbox') || e.target.classList.contains('test-cb-label') || 
          e.target.classList.contains('test-cb-input'))) {
        return;
      }
      
      // Scroll-Erkennung: Wenn kein Start-Punkt vorhanden ist oder zu viel Zeit vergangen ist, nichts tun
      if (!touchStartPos || Date.now() - touchStartPos.time > 300) {
        setTouchStartPos(null);
        return;
      }
      
      // Wenn eine Bewegung stattgefunden hat (Scrollen), kein Klick auslösen
      if (e?.changedTouches?.[0]) {
        const moveX = Math.abs(e.changedTouches[0].clientX - touchStartPos.x);
        const moveY = Math.abs(e.changedTouches[0].clientY - touchStartPos.y);
        
        // Wenn mehr als 10px Bewegung, war es ein Scroll
        if (moveX > 10 || moveY > 10) {
          setTouchStartPos(null);
          return;
        }
      }
      
      // Wenn kein Scroll erkannt wurde, Test öffnen
      setTouchStartPos(null);
      onTestClick(test);
    }, [test, onTestClick, touchStartPos]);

    return (      <div
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
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          "--long-press-duration": `${longPressDuration/1000}s`,
          WebkitTapHighlightColor: "transparent" // Entfernt das Highlight beim Tippen auf iOS
        }}
      >
        {/* Separater Checkbox-Bereich */}
        <TestCardCheckbox test={test} />
          {/* Inhalt der Karte */}
        <TestCardContent test={test} getStableMaterialKey={getStableMaterialKey} />
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
    const maxVisiblePages = 7; // Erhöht von 5 auf 7 für bessere Navigation bei großen Datenmengen
    
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
    
    // Einheitliche Stile für alle Buttons definieren
    const btnBaseClass = `flex items-center justify-center min-w-[40px] px-3 py-1 border ${tailwindBtn.borderClasses}`;
    const btnHoverClass = `${tailwindBtn.classes.hoverEffect} hover:bg-gray-100 dark:hover:bg-gray-700 theme-transition`;
    
    return (
      <div className="flex justify-center items-center my-4 select-none">
        {/* Container mit fester Breite für die Pagination */}
        <div className="inline-flex justify-center items-center w-auto min-w-[350px]">
          {/* Zurück-Button */}
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`${btnBaseClass} rounded-l-lg ${
              currentPage === 1 
                ? 'opacity-50 cursor-not-allowed'
                : btnHoverClass
            }`}
            aria-label="Vorherige Seite"
          >
            <MaterialDesign.MdChevronLeft className="text-xl" />
          </button>
          
          {/* Erste Seite, wenn nicht im sichtbaren Bereich */}
          {startPage > 1 && (
            <>
              <button 
                onClick={() => handlePageChange(1)}
                className={`${btnBaseClass} border-y ${btnHoverClass}`}
              >
                1
              </button>
              {startPage > 2 && (
                <span className={`${btnBaseClass} border-y ${tailwindBtn.classes.textMuted}`}>...</span>
              )}
            </>
          )}
          
          {/* Seitenzahlen */}
          {pages.map(page => (
            <button 
              key={page}
              onClick={() => handlePageChange(page)}
              className={`${btnBaseClass} border-y ${
                currentPage === page 
                  ? `${tailwindBtn.classes.selected} font-medium`
                  : btnHoverClass
              }`}
            >
              {page}
            </button>
          ))}
          
          {/* Letzte Seite, wenn nicht im sichtbaren Bereich */}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className={`${btnBaseClass} border-y ${tailwindBtn.classes.textMuted}`}>...</span>
              )}
              <button 
                onClick={() => handlePageChange(totalPages)}
                className={`${btnBaseClass} border-y ${btnHoverClass}`}
              >
                {totalPages}
              </button>
            </>
          )}
          
          {/* Weiter-Button */}
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`${btnBaseClass} rounded-r-lg ${
              currentPage === totalPages 
                ? 'opacity-50 cursor-not-allowed'
                : btnHoverClass
            }`}
            aria-label="Nächste Seite"
          >
            <MaterialDesign.MdChevronRight className="text-xl" />
          </button>
        </div>
      </div>
    );
  };
  
  // Optimiertes Grid-Rendering mit useMemo
  const TestCardGrid = useMemo(() => (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 ${tailwindBtn.classes.containerBg}`}>
      {currentTests.map(test => <TestCard key={test.id} test={test} />)}
    </div>
  ), [currentTests]);
  
  // Handler für Druckfunktion
  const handlePrint = (profilData) => {
    // Hier kann die Druckfunktionalität implementiert werden
    console.log('Drucke Profil-Antrag:', profilData);
    // Hier könnte z.B. die Weiterleitung zur Druckansicht erfolgen
    // oder ein Druckdialog geöffnet werden
  };

  return (
    <div className="w-full test-liste-container">
      {tests.length === 0 ? (
        <p className={`text-center py-8 ${tailwindBtn.classes.textMuted} text-lg`}>Keine Tests gefunden.</p>
      ) : (
        <>
          {/* Anzeige der aktuellen Seite und Gesamtanzahl mit Pagination oben */}
          {isPaginationEnabled && (
            <div className="mb-4">
              <div className={`mb-2 text-sm ${tailwindBtn.classes.textMuted} flex justify-between items-center`}>
                <span>
                  Zeige {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, sortedTests.length)} von {sortedTests.length} Tests
                </span>
                <span>
                  Seite {currentPage} von {totalPages}
                </span>
              </div>
              {/* Pagination Controls (oben) */}
              <PaginationControls />
            </div>
          )}
          
          {/* Test-Karten-Grid mit optimierter Render-Strategie */}
          {TestCardGrid}
          
          {/* Pagination Controls (unten) mit Abstand nach oben */}
          {isPaginationEnabled && (
            <div className="mt-6">
              <PaginationControls />
            </div>
          )}
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
      
      {/* Dialog zum Erstellen eines Profil-Antrags */}
      {showProfilAntragDialog && (
        <ProfilErstellungDialog 
          selectedTests={safeSelectedTests}
          onClose={() => setShowProfilAntragDialog(false)} 
          onPrint={handlePrint}
          mode="create"
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