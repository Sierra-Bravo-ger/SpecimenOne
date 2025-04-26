/**
 * Index-Datei für Test-Komponenten
 * Diese Datei dient als zentraler Export-Punkt für alle test-bezogenen Komponenten
 */

// TestListe Komponente direkt importieren (ohne über TestCard zu gehen)
import TestListeComponent from './TestListe';

// Re-Export für einfachen Import in anderen Dateien
export const TestListe = TestListeComponent;
export default TestListeComponent;
