/**
 * Reine Filter- und Sortierfunktionen für die Testliste (ohne React-Abhängigkeit).
 */

const includesCI = (value, term) =>
  typeof value === 'string' && value.toLowerCase().includes(term);

/**
 * Filtert Tests nach Kategorie und Suchbegriff.
 * Durchsucht Name, Synonyme, Kategorie, LOINC, Test-ID und Material (Teilstring, ohne Groß-/Kleinschreibung).
 *
 * @param {Array<Object>} tests - alle Tests
 * @param {Object} [options]
 * @param {string} [options.suchbegriff] - Suchtext
 * @param {string} [options.kategorie='Alle'] - Kategorie oder 'Alle'
 * @returns {Array<Object>} gefilterte Tests (Reihenfolge unverändert)
 */
export function filterTests(tests, { suchbegriff = '', kategorie = 'Alle' } = {}) {
  const term = (suchbegriff || '').toLowerCase();

  return (tests || []).filter((test) => {
    if (kategorie !== 'Alle' && test.kategorie !== kategorie) return false;
    if (!term) return true;

    return (
      includesCI(test.name, term) ||
      (Array.isArray(test.synonyme) && test.synonyme.some((s) => includesCI(s, term))) ||
      includesCI(test.kategorie, term) ||
      includesCI(test.loinc, term) ||
      includesCI(test.id, term) ||
      (Array.isArray(test.material) && test.material.some((m) => includesCI(m, term)))
    );
  });
}

/**
 * Sortiert Tests (liefert eine neue Liste).
 *
 * @param {Array<Object>} tests
 * @param {'id'|'name'|'kategorie'|'material'} [sortOption='id'] - Sortierfeld; Kategorie und Material sortieren sekundär nach Name
 * @param {'asc'|'desc'} [sortDirection='asc']
 * @returns {Array<Object>}
 */
export function sortTests(tests, sortOption = 'id', sortDirection = 'asc') {
  const byName = (a, b) => (a.name || '').localeCompare(b.name || '');

  return [...(tests || [])].sort((a, b) => {
    let comparison;
    switch (sortOption) {
      case 'name':
        comparison = byName(a, b);
        break;
      case 'kategorie':
        comparison = (a.kategorie || '').localeCompare(b.kategorie || '') || byName(a, b);
        break;
      case 'material': {
        const aMaterial = a.material?.length > 0 ? a.material[0] : '';
        const bMaterial = b.material?.length > 0 ? b.material[0] : '';
        comparison = aMaterial.localeCompare(bMaterial) || byName(a, b);
        break;
      }
      case 'id':
      default:
        comparison = a.id.localeCompare(b.id);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });
}
