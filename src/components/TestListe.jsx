import React, { useState, useMemo, memo, useEffect, useCallback } from 'react';
import TestCheckbox from './TestCheckbox';
import '@material/web/ripple/ripple.js';
import '@material/web/elevation/elevation.js';
import TestCardContent from './TestCardContent';
import Seitennavigation from './Seitennavigation';
import tailwindBtn from './tailwindBtn';
import { sortTests } from '../utils/testFilter';
import {
  gesamtSeiten,
  istPaginiert,
  seitenAusschnitt,
  seitenBereich,
} from '../utils/seitenaufteilung';

/**
 * Einzelne Testkarte (außerhalb von TestListe definiert, damit React sie bei Änderungen
 * in der Liste nicht neu aufbaut – sonst ginge der Tastaturfokus beim Anhaken verloren).
 */
const TestCard = memo(({ test, isSelected, onToggle, onOpen }) => (
  <div
    className={`test-card relative rounded-lg shadow-sm p-4 ${tailwindBtn.classes.cardBg} border ${
      isSelected ? tailwindBtn.classes.selected : tailwindBtn.borderClasses
    } ${tailwindBtn.classes.hoverEffect} theme-transition`}
    style={{ WebkitTapHighlightColor: 'transparent' }}
  >
    <div className="absolute bottom-3 right-3 z-10" onClick={e => e.stopPropagation()}>
      <TestCheckbox test={test} isSelected={isSelected} onToggle={onToggle} />
    </div>
    <TestCardContent test={test} onOpen={onOpen} />
  </div>
), (prev, next) =>
  prev.test.id === next.test.id &&
  prev.isSelected === next.isSelected &&
  prev.onToggle === next.onToggle &&
  prev.onOpen === next.onOpen);

function TestListe({
  tests,
  onTestClick,
  selectedTests,
  onTestSelect = () => {},
  sortOption = 'id',
  sortDirection = 'asc',
  onCheckboxToggle = null,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const safeSelectedTests = selectedTests || [];
  const ausgewaehlteIds = useMemo(() => new Set(safeSelectedTests.map(t => t.id)), [safeSelectedTests]);

  const toggleTestSelection = useCallback((test) => {
    const wasSelected = safeSelectedTests.some(t => t.id === test.id);
    onTestSelect(wasSelected
      ? safeSelectedTests.filter(t => t.id !== test.id)
      : [...safeSelectedTests, test]);
    if (onCheckboxToggle) onCheckboxToggle(test, wasSelected, !wasSelected);
  }, [safeSelectedTests, onTestSelect, onCheckboxToggle]);

  const sortedTests = useMemo(
    () => sortTests(tests, sortOption, sortDirection),
    [tests, sortOption, sortDirection]
  );

  const totalPages = gesamtSeiten(sortedTests.length);
  const paginiert = istPaginiert(sortedTests.length);
  const aktuelleSeite = Math.min(currentPage, totalPages);
  const currentTests = useMemo(
    () => seitenAusschnitt(sortedTests, aktuelleSeite),
    [sortedTests, aktuelleSeite]
  );
  const bereich = seitenBereich(sortedTests.length, aktuelleSeite);

  // Zurück auf Seite 1, wenn sich Sortierung oder Trefferliste (Suche/Filter) inhaltlich ändern.
  // Verglichen wird die Folge der Test-IDs, nicht die Array-Referenz: Ein neu erzeugtes Array mit
  // denselben Tests (Re-Render, Hintergrund-Aktualisierung der Daten) behält die aktuelle Seite.
  const trefferSignatur = useMemo(() => tests.map(t => t.id).join('|'), [tests]);
  useEffect(() => {
    setCurrentPage(1);
  }, [sortOption, sortDirection, trefferSignatur]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    const oben = document.querySelector('.test-liste-container');
    if (oben) {
      // sticky Suchleiste (ca. 80 px) nicht über der Liste liegen lassen
      const y = oben.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full test-liste-container">
      <h2 className="sr-only">Testliste</h2>
      {tests.length === 0 ? (
        <p className={`text-center py-8 ${tailwindBtn.classes.textMuted} text-lg`} role="status">Keine Tests gefunden.</p>
      ) : (
        <>
          {paginiert && (
            <div className="mb-3 md:mb-4 px-2 md:px-3 pt-2 md:pt-3">
              <div className={`mb-2 text-sm ${tailwindBtn.classes.textMuted} hidden md:flex justify-between items-center`}>
                <span>Zeige {bereich.von} - {bereich.bis} von {sortedTests.length} Tests</span>
                <span>Seite {aktuelleSeite} von {totalPages}</span>
              </div>
              <div className="flex items-center justify-between md:block gap-2">
                <span className={`md:hidden text-sm ${tailwindBtn.classes.textMuted}`} data-testid="bereich-kompakt">
                  {bereich.von}–{bereich.bis} von {sortedTests.length}
                </span>
                <Seitennavigation
                  aktuelleSeite={aktuelleSeite}
                  seitenGesamt={totalPages}
                  onSeite={handlePageChange}
                />
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 px-2 pb-2 md:p-0 ${tailwindBtn.classes.containerBg}`}>
            {currentTests.map(test => (
              <TestCard
                key={test.id}
                test={test}
                isSelected={ausgewaehlteIds.has(test.id)}
                onToggle={toggleTestSelection}
                onOpen={onTestClick}
              />
            ))}
          </div>

          {paginiert && (
            <div className="mt-6 mb-2">
              <Seitennavigation
                aktuelleSeite={aktuelleSeite}
                seitenGesamt={totalPages}
                onSeite={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TestListe;
