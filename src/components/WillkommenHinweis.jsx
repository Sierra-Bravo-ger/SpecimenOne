import { useEffect, useState } from 'react';
import * as MaterialDesign from 'react-icons/md';
import tailwindBtn from './tailwindBtn';

// Beispielsuchen für Erstbesucher: Begriff -> was damit gezeigt wird
export const BEISPIEL_SUCHEN = [
  { begriff: 'Lanoxin', hinweis: 'Handelsname, findet Digoxin über ein Synonym' },
  { begriff: 'Creatinin', hinweis: 'Klinische Chemie' },
  { begriff: 'Mycoplasma pneumoniae', hinweis: 'Infektserologie' },
  { begriff: 'F37', hinweis: 'Suche nach Kürzel/Code' },
];

const STACK = [
  'React/Vite-PWA',
  'Node/Express-API',
  'PostgreSQL',
  'Docker',
  'Cloudflare Tunnel',
  'CI mit GitHub Actions',
];

const LINKS = [
  { label: 'GitHub', href: 'https://github.com/Sierra-Bravo-ger/SpecimenOne' },
  { label: 'API-Doku', href: '/api/docs/' },
  { label: 'Portfolio', href: 'https://sebastian-bride.pages.dev' },
];

const chip = 'inline-flex items-center rounded-full border border-primary/40 dark:border-primary-dark/60 bg-white dark:bg-gray-800 px-2.5 py-0.5 text-[13px] text-gray-800 dark:text-gray-100 cursor-pointer hover:bg-primary/10 dark:hover:bg-primary-dark/20 transition-colors';
const linkCls = 'text-green-800 dark:text-green-300 underline underline-offset-2 hover:no-underline';

/**
 * Kompakter Einstieg für Erstbesucher über der Suche:
 * Kurzbeschreibung, Beispielsuchen als Chips, „Über das Projekt“ (Dialog), Schließen-Knopf.
 */
function WillkommenHinweis({ onBeispielSuche, onSchliessen }) {
  const [infoOffen, setInfoOffen] = useState(false);

  // Escape schließt den Dialog
  useEffect(() => {
    if (!infoOffen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setInfoOffen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [infoOffen]);

  return (
    <section
      aria-label="Willkommen bei SpecimenOne"
      data-testid="willkommen-hinweis"
      className={`relative p-2.5 pr-11 rounded-lg border ${tailwindBtn.colors.border.light} ${tailwindBtn.colors.border.dark} bg-primary/5 dark:bg-primary-dark/10 text-[13px] text-gray-700 dark:text-gray-300`}
    >
      <button
        type="button"
        onClick={onSchliessen}
        aria-label="Hinweis schließen"
        className="absolute top-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-none bg-transparent text-xl text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
      >
        <MaterialDesign.MdClose aria-hidden="true" />
      </button>
      <p className="m-0 leading-snug">
        Labor-Leistungsverzeichnis mit Referenzwerten<span className="hidden sm:inline">, Material und Versand</span> – offline nutzbar.{' '}
        <button
          type="button"
          className={`${linkCls} border-none bg-transparent p-0 cursor-pointer text-[13px]`}
          onClick={() => setInfoOffen(true)}
        >
          Über das Projekt
        </button>
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {BEISPIEL_SUCHEN.map(({ begriff, hinweis }) => (
          <button
            key={begriff}
            type="button"
            className={chip}
            title={hinweis}
            onClick={() => onBeispielSuche(begriff)}
          >
            {begriff}
          </button>
        ))}
      </div>

      {infoOffen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setInfoOffen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="projekt-titel"
            className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-5 text-gray-800 dark:text-gray-100 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="projekt-titel" className="mt-0 mb-2 text-lg font-medium">Über das Projekt</h2>
            <p className="mt-0 text-sm">
              SpecimenOne ist ein Portfolio-Projekt: ein durchsuchbares Labor-Leistungsverzeichnis
              als installierbare Web-App.
            </p>
            <ul className="mb-3 pl-5 text-sm list-disc">
              {STACK.map((s) => <li key={s}>{s}</li>)}
            </ul>
            <p className="my-2 text-sm flex flex-wrap gap-x-4 gap-y-1">
              {LINKS.map(({ label, href }) => (
                <a key={label} href={href} className={linkCls} target="_blank" rel="noopener noreferrer">{label}</a>
              ))}
            </p>
            <div className="text-right">
              <button
                type="button"
                autoFocus
                onClick={() => setInfoOffen(false)}
                className="rounded-full border-none bg-primary dark:bg-primary-dark px-5 py-2 text-sm text-white cursor-pointer"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default WillkommenHinweis;
