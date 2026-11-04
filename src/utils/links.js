// Adressen der App: Parsen und Bauen von /test/<id> und /profil?tests=…&name=…
// Bewusst ohne Router-Bibliothek: es gibt nur zwei Zieladressen, den Rest erledigt die History API.

export const MAX_PROFIL_TESTS = 100
export const MAX_PROFIL_NAME = 100
// Test-IDs sehen aus wie „T0003“; erlaubt sind nur harmlose Zeichen (kein Pfad, kein HTML).
const TEST_ID_MUSTER = /^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/

export function istGueltigeTestId(id) {
  return typeof id === 'string' && TEST_ID_MUSTER.test(id)
}

export function baueTestPfad(id) {
  return `/test/${encodeURIComponent(id)}`
}

/**
 * Profil-Adresse: /profil?tests=T0003,T0008&name=…
 * Mehr als MAX_PROFIL_TESTS IDs werden abgeschnitten; `abgeschnitten` sagt, wie viele fehlen.
 */
export function baueProfilPfad({ ids, name }) {
  const eindeutig = [...new Set((ids || []).filter(istGueltigeTestId))]
  const verwendet = eindeutig.slice(0, MAX_PROFIL_TESTS)
  let pfad = `/profil?tests=${verwendet.join(',')}`
  const sauber = (name || '').trim().slice(0, MAX_PROFIL_NAME)
  if (sauber) pfad += `&name=${encodeURIComponent(sauber)}`
  return { pfad, abgeschnitten: eindeutig.length - verwendet.length }
}

export function baueVollstaendigeUrl(pfad, origin = window.location.origin) {
  return `${origin}${pfad}`
}

function dekodiere(teil) {
  try { return decodeURIComponent(teil) } catch { return teil }
}

/**
 * Liest eine Adresse und liefert die Route:
 *   { typ: 'start' }
 *   { typ: 'test', id }
 *   { typ: 'profil', name, ids, ungueltig: [..], zuViele: n }
 * `/?test=T0003` (alter Link) gilt weiter und ergibt dieselbe Route wie /test/T0003.
 * Alles Unbekannte ist 'start' (die App zeigt dann die Liste).
 */
export function parseRoute(pathname, search = '') {
  const pfad = (pathname || '/').replace(/\/+$/, '') || '/'
  const params = new URLSearchParams(search)

  const testMatch = pfad.match(/^\/test\/([^/]+)$/)
  if (testMatch) return { typ: 'test', id: dekodiere(testMatch[1]) }

  if (pfad === '/profil') {
    const roh = (params.get('tests') || '').split(',').map((s) => s.trim()).filter(Boolean)
    const eindeutig = [...new Set(roh)]
    const gueltig = eindeutig.filter(istGueltigeTestId)
    const ungueltig = eindeutig.filter((id) => !istGueltigeTestId(id)).slice(0, 20)
    const ids = gueltig.slice(0, MAX_PROFIL_TESTS)
    return {
      typ: 'profil',
      name: (params.get('name') || '').trim().slice(0, MAX_PROFIL_NAME),
      ids,
      ungueltig,
      zuViele: gueltig.length - ids.length,
    }
  }

  if (pfad === '/' && params.get('test')) return { typ: 'test', id: params.get('test'), alt: true }
  return { typ: 'start' }
}

/**
 * Link teilen: navigator.share (Handy), sonst Zwischenablage.
 * Ergebnis: 'geteilt' | 'kopiert' | 'abgebrochen' | 'fehler'
 */
export async function teileLink({ url, titel, text }) {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: titel, text, url })
      return 'geteilt'
    } catch (err) {
      if (err && err.name === 'AbortError') return 'abgebrochen'
      // sonst weiter mit der Zwischenablage
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'kopiert'
  } catch {
    try {
      const feld = document.createElement('textarea')
      feld.value = url
      feld.setAttribute('readonly', '')
      feld.style.position = 'fixed'
      feld.style.opacity = '0'
      document.body.appendChild(feld)
      feld.select()
      const ok = document.execCommand('copy')
      feld.remove()
      return ok ? 'kopiert' : 'fehler'
    } catch {
      return 'fehler'
    }
  }
}

export const TEILEN_MELDUNG = {
  geteilt: 'Link geteilt',
  kopiert: 'Link kopiert',
  abgebrochen: '',
  fehler: 'Link konnte nicht kopiert werden',
}
