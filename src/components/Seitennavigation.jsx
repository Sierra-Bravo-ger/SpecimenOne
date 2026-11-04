import React from 'react';
import * as MaterialDesign from 'react-icons/md';
import tailwindBtn from './tailwindBtn';
import { sichtbareSeiten } from '../utils/seitenaufteilung';

const knopfBasis = `flex items-center justify-center min-w-[40px] min-h-[40px] px-3 py-1 border ${tailwindBtn.borderClasses} ${tailwindBtn.classes.text}`;
const knopfHover = 'hover:bg-gray-100 dark:hover:bg-gray-700 theme-transition';

/**
 * Seitennavigation der Testliste.
 * Mobil kompakt („‹ 1/8 ›“), ab md mit Seitenzahlen.
 */
function Seitennavigation({ aktuelleSeite, seitenGesamt, onSeite, className = '' }) {
  if (seitenGesamt <= 1) return null;
  const seiten = sichtbareSeiten(aktuelleSeite, seitenGesamt);
  const start = seiten[0];
  const ende = seiten[seiten.length - 1];
  const erste = aktuelleSeite === 1;
  const letzte = aktuelleSeite === seitenGesamt;

  const zurueck = (rundung) => (
    <button
      type="button"
      onClick={() => onSeite(aktuelleSeite - 1)}
      disabled={erste}
      className={`${knopfBasis} ${rundung} ${erste ? 'opacity-50 cursor-not-allowed' : knopfHover}`}
      aria-label="Vorherige Seite"
    >
      <MaterialDesign.MdChevronLeft className="text-xl" aria-hidden="true" />
    </button>
  );
  const weiter = (rundung) => (
    <button
      type="button"
      onClick={() => onSeite(aktuelleSeite + 1)}
      disabled={letzte}
      className={`${knopfBasis} ${rundung} ${letzte ? 'opacity-50 cursor-not-allowed' : knopfHover}`}
      aria-label="Nächste Seite"
    >
      <MaterialDesign.MdChevronRight className="text-xl" aria-hidden="true" />
    </button>
  );

  return (
    <nav aria-label="Seitennavigation" className={`select-none ${className}`}>
      {/* Mobil: ‹ 1/8 › */}
      <div className="flex md:hidden items-center justify-center" data-testid="seiten-kompakt">
        {zurueck('rounded-l-lg')}
        <span className={`${knopfBasis} border-x-0 min-w-[72px] font-medium`} aria-current="page">
          {aktuelleSeite}/{seitenGesamt}
        </span>
        {weiter('rounded-r-lg')}
      </div>

      {/* Ab md: Seitenzahlen */}
      <div className="hidden md:flex justify-center items-center">
        <div className="inline-flex justify-center items-center w-auto min-w-[350px]">
          {zurueck('rounded-l-lg')}
          {start > 1 && (
            <>
              <button type="button" onClick={() => onSeite(1)} className={`${knopfBasis} border-y ${knopfHover}`}>1</button>
              {start > 2 && <span className={`${knopfBasis} border-y ${tailwindBtn.classes.textMuted}`} aria-hidden="true">…</span>}
            </>
          )}
          {seiten.map((seite) => (
            <button
              type="button"
              key={seite}
              onClick={() => onSeite(seite)}
              aria-current={aktuelleSeite === seite ? 'page' : undefined}
              className={`${knopfBasis} border-y ${aktuelleSeite === seite ? `${tailwindBtn.classes.selected} font-medium` : knopfHover}`}
            >
              {seite}
            </button>
          ))}
          {ende < seitenGesamt && (
            <>
              {ende < seitenGesamt - 1 && <span className={`${knopfBasis} border-y ${tailwindBtn.classes.textMuted}`} aria-hidden="true">…</span>}
              <button type="button" onClick={() => onSeite(seitenGesamt)} className={`${knopfBasis} border-y ${knopfHover}`}>{seitenGesamt}</button>
            </>
          )}
          {weiter('rounded-r-lg')}
        </div>
      </div>
    </nav>
  );
}

export default Seitennavigation;
