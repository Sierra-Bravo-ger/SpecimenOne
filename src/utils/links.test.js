import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  parseRoute, baueTestPfad, baueProfilPfad, istGueltigeTestId, teileLink, MAX_PROFIL_TESTS,
} from './links'

afterEach(() => vi.unstubAllGlobals())

describe('parseRoute', () => {
  it('Startseite und Unbekanntes', () => {
    expect(parseRoute('/', '')).toEqual({ typ: 'start' })
    expect(parseRoute('/irgendwas', '')).toEqual({ typ: 'start' })
    expect(parseRoute('/test', '')).toEqual({ typ: 'start' })
  })
  it('/test/:id, mit und ohne Schrägstrich am Ende', () => {
    expect(parseRoute('/test/T0003', '')).toEqual({ typ: 'test', id: 'T0003' })
    expect(parseRoute('/test/T0003/', '')).toEqual({ typ: 'test', id: 'T0003' })
  })
  it('behält unbekannte und kaputt kodierte IDs, damit die App „nicht gefunden“ zeigen kann', () => {
    expect(parseRoute('/test/T9999', '').id).toBe('T9999')
    expect(parseRoute('/test/%E0%A4%A', '').typ).toBe('test')
  })
  it('alter Link /?test=T0003 wird zur Test-Route', () => {
    expect(parseRoute('/', '?test=T0003')).toEqual({ typ: 'test', id: 'T0003', alt: true })
  })
  it('/profil: IDs, Name, Duplikate', () => {
    const r = parseRoute('/profil', '?tests=T0003,T0008,T0003&name=Mein%20Profil%20%C3%A4')
    expect(r).toEqual({ typ: 'profil', name: 'Mein Profil ä', ids: ['T0003', 'T0008'], ungueltig: [], zuViele: 0 })
  })
  it('/profil: ungültige IDs werden gemeldet, nicht übernommen', () => {
    const r = parseRoute('/profil', '?tests=T0003,<script>,../x,%20,T0008')
    expect(r.ids).toEqual(['T0003', 'T0008'])
    expect(r.ungueltig).toEqual(['<script>', '../x'])
  })
  it('/profil: höchstens 100 IDs, der Rest wird gezählt', () => {
    const ids = Array.from({ length: 130 }, (_, i) => `T${String(i).padStart(4, '0')}`)
    const r = parseRoute('/profil', `?tests=${ids.join(',')}`)
    expect(r.ids).toHaveLength(MAX_PROFIL_TESTS)
    expect(r.zuViele).toBe(30)
  })
  it('/profil ohne Parameter ergibt ein leeres Profil', () => {
    expect(parseRoute('/profil', '')).toMatchObject({ typ: 'profil', ids: [], name: '' })
  })
  it('kürzt zu lange Namen', () => {
    expect(parseRoute('/profil', `?name=${'a'.repeat(300)}`).name).toHaveLength(100)
  })
})

describe('Adressen bauen', () => {
  it('Test-Pfad', () => {
    expect(baueTestPfad('T0003')).toBe('/test/T0003')
  })
  it('Profil-Pfad mit Kommas und kodiertem Namen', () => {
    expect(baueProfilPfad({ ids: ['T0003', 'T0008'], name: 'Herz & Niere' }).pfad)
      .toBe('/profil?tests=T0003,T0008&name=Herz%20%26%20Niere')
  })
  it('Profil-Pfad ohne Namen, mit Duplikaten und ungültigen IDs', () => {
    expect(baueProfilPfad({ ids: ['T0003', 'T0003', 'x y'], name: '  ' }).pfad).toBe('/profil?tests=T0003')
  })
  it('Profil-Pfad schneidet bei 100 IDs ab', () => {
    const ids = Array.from({ length: 105 }, (_, i) => `T${i}`)
    const r = baueProfilPfad({ ids })
    expect(r.pfad.split('=')[1].split(',')).toHaveLength(100)
    expect(r.abgeschnitten).toBe(5)
  })
  it('Rundlauf: gebaut und wieder gelesen', () => {
    const { pfad } = baueProfilPfad({ ids: ['T0003', 'T0008'], name: 'Ä/Ö ?&=' })
    const [p, s] = pfad.split('?')
    expect(parseRoute(p, `?${s}`)).toMatchObject({ ids: ['T0003', 'T0008'], name: 'Ä/Ö ?&=' })
  })
  it('istGueltigeTestId', () => {
    expect(istGueltigeTestId('T0003')).toBe(true)
    expect(istGueltigeTestId('')).toBe(false)
    expect(istGueltigeTestId('a/b')).toBe(false)
    expect(istGueltigeTestId(null)).toBe(false)
  })
})

describe('teileLink', () => {
  it('nutzt navigator.share, wenn vorhanden', async () => {
    const share = vi.fn().mockResolvedValue()
    vi.stubGlobal('navigator', { share })
    expect(await teileLink({ url: 'https://x/test/T1', titel: 'T' })).toBe('geteilt')
    expect(share).toHaveBeenCalledWith({ title: 'T', text: undefined, url: 'https://x/test/T1' })
  })
  it('Abbruch im Teilen-Dialog kopiert nicht', async () => {
    const writeText = vi.fn()
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' })), clipboard: { writeText } })
    expect(await teileLink({ url: 'u' })).toBe('abgebrochen')
    expect(writeText).not.toHaveBeenCalled()
  })
  it('kopiert in die Zwischenablage ohne navigator.share', async () => {
    const writeText = vi.fn().mockResolvedValue()
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    expect(await teileLink({ url: 'https://x/test/T1' })).toBe('kopiert')
    expect(writeText).toHaveBeenCalledWith('https://x/test/T1')
  })
})
