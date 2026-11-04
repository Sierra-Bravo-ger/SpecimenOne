import React, { useEffect, useRef, useState } from 'react'
import * as MaterialDesign from 'react-icons/md'
import TestDetails from './TestDetails'
import tailwindBtn from './tailwindBtn'
import { speicherePersoenlichesProfil } from '../utils/persoenlicheProfile'
import { MAX_PROFIL_TESTS, baueProfilPfad, baueVollstaendigeUrl, teileLink, TEILEN_MELDUNG } from '../utils/links'
import './TestDetails.css'

/**
 * Profil aus einem Link: /profil?tests=T0003,T0008&name=…
 * `route` kommt aus parseRoute; `tests` ist die geladene Testliste (unbekannte IDs werden übersprungen).
 */
function GeteiltesProfil({ route, tests, onClose }) {
  const dialogRef = useRef(null)
  const [selectedTest, setSelectedTest] = useState(null)
  const [meldung, setMeldung] = useState('')
  const [gespeichert, setGespeichert] = useState(false)

  const name = route.name || 'Geteiltes Profil'
  const gefunden = []
  const unbekannt = []
  for (const id of route.ids) {
    const test = tests.find((t) => t.id === id)
    if (test) gefunden.push(test)
    else unbekannt.push(id)
  }
  const uebersprungen = [...unbekannt, ...route.ungueltig]

  useEffect(() => {
    const opener = document.activeElement
    dialogRef.current?.focus()
    const vorher = document.title
    document.title = `${name} – SpecimenOne`
    return () => {
      document.title = vorher
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus()
    }
  }, [name])

  useEffect(() => {
    if (selectedTest) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, selectedTest])

  const speichern = () => {
    speicherePersoenlichesProfil({
      name,
      beschreibung: 'Über Link geteilt',
      tests: gefunden,
    })
    setGespeichert(true)
  }

  const teilen = async () => {
    const { pfad } = baueProfilPfad({ ids: gefunden.map((t) => t.id), name: route.name })
    const ergebnis = await teileLink({ url: baueVollstaendigeUrl(pfad), titel: `${name} – SpecimenOne`, text: name })
    setMeldung(TEILEN_MELDUNG[ergebnis])
    if (ergebnis !== 'fehler') setTimeout(() => setMeldung(''), 3000)
  }

  const knopf = 'inline-flex items-center justify-center text-center gap-2 min-h-[44px] px-4 rounded-full border border-[#1e6b35] dark:border-[#83d991] bg-transparent text-[#1e6b35] dark:text-[#83d991] font-medium cursor-pointer'

  return (
    <div className="test-details-overlay" onClick={(e) => { if (e.target.className === 'test-details-overlay') onClose() }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="geteiltes-profil-titel"
        tabIndex={-1}
        className={`test-details-container md-elevation-5 ${tailwindBtn.classes.cardBg}`}
      >
        <button type="button" className={`close-button ${tailwindBtn.classes.textMuted}`} onClick={onClose} aria-label="Profil schließen">
          <MaterialDesign.MdClose style={{ fontSize: '24px' }} aria-hidden="true" />
        </button>
        <h2 id="geteiltes-profil-titel" className={tailwindBtn.classes.text}>{name}</h2>
        <p className={tailwindBtn.classes.text}>
          Profil aus einem Link · {gefunden.length} Test{gefunden.length !== 1 ? 's' : ''}
        </p>

        {uebersprungen.length > 0 && (
          <p role="alert" className="my-3 p-3 rounded border-l-4 border-amber-600 bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
            {uebersprungen.length === 1 ? 'Diese Test-ID ist unbekannt und wurde übersprungen' : 'Diese Test-IDs sind unbekannt und wurden übersprungen'}:{' '}
            <strong>{uebersprungen.join(', ')}</strong>
          </p>
        )}
        {route.zuViele > 0 && (
          <p role="alert" className="my-3 p-3 rounded border-l-4 border-amber-600 bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
            Ein Profil-Link enthält höchstens {MAX_PROFIL_TESTS} Tests; {route.zuViele} weitere wurden ignoriert.
          </p>
        )}

        {gefunden.length === 0 ? (
          <p className={tailwindBtn.classes.text}>Dieser Link enthält keinen bekannten Test.</p>
        ) : (
          <ul className="list-none p-0 m-0 grid gap-2" aria-label="Tests im Profil">
            {gefunden.map((test) => (
              <li key={test.id}>
                <button
                  type="button"
                  onClick={() => setSelectedTest(test)}
                  className={`w-full text-left p-3 rounded-md border ${tailwindBtn.colors.border.light} ${tailwindBtn.colors.border.dark} ${tailwindBtn.classes.cardBg} ${tailwindBtn.classes.text} cursor-pointer`}
                >
                  <span className="font-medium">{test.name}</span>
                  <span className="ml-2 text-sm opacity-80">{test.id}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="actions">
          <button type="button" className={knopf} onClick={speichern} disabled={gefunden.length === 0 || gespeichert}>
            <MaterialDesign.MdBookmarkAdd aria-hidden="true" />
            {gespeichert ? 'Gespeichert' : 'Als persönliches Profil speichern'}
          </button>
          <button type="button" className={knopf} onClick={teilen} disabled={gefunden.length === 0} aria-label={`Link zum Profil ${name} teilen`}>
            <MaterialDesign.MdShare aria-hidden="true" /> Link teilen
          </button>
          <button type="button" className={knopf} onClick={onClose}>Schließen</button>
        </div>
        <p role="status" aria-live="polite" className="teilen-meldung">
          {gespeichert ? 'Gespeichert unter Test-Profile › Persönliche Profile' : meldung}
        </p>
      </div>
      {selectedTest && <TestDetails test={selectedTest} onClose={() => setSelectedTest(null)} />}
    </div>
  )
}

export default GeteiltesProfil
