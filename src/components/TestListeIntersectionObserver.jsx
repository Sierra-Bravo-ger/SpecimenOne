import React, { useState, useMemo, memo } from 'react'
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
  
  // Standard Click-Handler für Desktop-Nutzung und zur Anzeige der Details
  const handleTestClick = (test, e) => {
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
  };
  
  // Moderner Pointer-Down Handler (statt touchStart)
  const handlePointerDown = (test, e) => {
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
  };

  // Pointer-Up Handler (statt touchEnd)
  const handlePointerUp = (e) => {
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
  };

  // Pointer-Cancel Handler (z.B. bei Scroll)
  const handlePointerCancel = () => {
    // Timer löschen
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    setActiveTest(null);
  };
  
  // Prüfen, ob ein Test ausgewählt ist
  const isTestSelected = (test) => {
    return safeSelectedTests.some(selectedTest => selectedTest.id === test.id);
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

  // TestCard mit IntersectionObserver-Hook
  const TestCard = memo(({ test }) => {
    // InView-Hook für Lazy-Loading
    const [ref, inView] = useInView({
      triggerOnce: true,
      rootMargin: '200px 0px',
    });

    return (
      <div 
        ref={ref}
        className={`relative rounded-lg shadow-sm p-4 ${tailwindBtn.classes.cardBg} border ${
          isTestSelected(test) 
            ? tailwindBtn.classes.selected
            : tailwindBtn.borderClasses
        } ${
          activeTest?.id === test.id 
            ? tailwindBtn.classes.active
            : tailwindBtn.classes.hoverEffect
        } theme-transition ${inView ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onClick={(e) => handleTestClick(test, e)}
        onPointerDown={(e) => handlePointerDown(test, e)}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{"--long-press-duration": `${longPressDuration/1000}s`}}
      >
        {inView && (
          <>
            <div className="absolute bottom-3 right-3 z-10">
              <TestCheckbox 
                test={test} 
                isSelected={isTestSelected(test)} 
                onToggle={toggleTestSelection}
              />
            </div>
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
        )}
        
        {!inView && (
          // Placeholder für nicht sichtbare Karten
          <>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3 animate-pulse"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
          </>
        )}
      </div>
    );
  });

  return (
    <div className="w-full">
      {tests.length === 0 ? (
        <p className={`text-center py-8 ${tailwindBtn.classes.textMuted} text-lg`}>Keine Tests gefunden.</p>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${tailwindBtn.classes.containerBg}`}>
          {sortedTests.map(test => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>
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
