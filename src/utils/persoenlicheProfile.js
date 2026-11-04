// Persönliche Profile liegen in localStorage unter „persoenlicheProfile“ (Liste von
// { id, name, beschreibung, kategorie, erstelltAm, tests: [{ id, name }] }).

export function ladePersoenlicheProfile() {
  try {
    const liste = JSON.parse(localStorage.getItem('persoenlicheProfile') || '[]')
    return Array.isArray(liste) ? liste : []
  } catch {
    return []
  }
}

export function speicherePersoenlichesProfil({ name, beschreibung = '', kategorie = 'Keine Kategorie', tests }) {
  const profil = {
    id: Date.now().toString(),
    name,
    beschreibung,
    kategorie,
    erstelltAm: new Date().toISOString(),
    tests: tests.map((t) => ({ id: t.id, name: t.name })),
  }
  const liste = ladePersoenlicheProfile()
  liste.push(profil)
  localStorage.setItem('persoenlicheProfile', JSON.stringify(liste))
  return profil
}
