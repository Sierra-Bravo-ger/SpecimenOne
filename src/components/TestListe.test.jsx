// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import TestListe from './TestListe';

// Material-Badges laden Daten per API; hier nur der Rahmen der Liste
vi.mock('./MaterialBadge', () => ({ default: ({ materialId }) => <span>{materialId}</span> }));

const tests = Array.from({ length: 120 }, (_, i) => ({
  id: `T${String(i + 1).padStart(4, '0')}`,
  name: `Test ${i + 1}`,
  kategorie: 'Klinische Chemie',
  material: ['SE-00'],
  synonyme: [],
}));

beforeEach(() => { window.scrollTo = vi.fn(); });
afterEach(cleanup);

function renderListe(props = {}) {
  const onTestClick = vi.fn();
  const onTestSelect = vi.fn();
  const r = render(
    <TestListe tests={tests} onTestClick={onTestClick} selectedTests={[]} onTestSelect={onTestSelect} {...props} />
  );
  return { ...r, onTestClick, onTestSelect };
}

describe('TestListe', () => {
  it('rendert nur 50 Karten pro Seite und zeigt kompakt „1/3“', () => {
    const { container } = renderListe();
    expect(container.querySelectorAll('.test-card')).toHaveLength(50);
    expect(screen.getAllByTestId('seiten-kompakt')[0].textContent).toBe('1/3');
    expect(screen.getByTestId('bereich-kompakt').textContent).toBe('1–50 von 120');
  });

  it('bleibt auf der Seite, wenn ein neues Array mit denselben Tests kommt (z.B. beim Öffnen der Details)', () => {
    const { container, rerender, onTestClick, onTestSelect } = renderListe();
    fireEvent.click(screen.getAllByLabelText('Nächste Seite')[0]);
    rerender(<TestListe tests={[...tests]} onTestClick={onTestClick} selectedTests={[]} onTestSelect={onTestSelect} />);
    expect(container.querySelector('.test-card h3').textContent).toBe('Test 51');
  });

  it('springt auf Seite 1, wenn sich die Trefferliste ändert', () => {
    const { container, rerender, onTestClick, onTestSelect } = renderListe();
    fireEvent.click(screen.getAllByLabelText('Nächste Seite')[0]);
    rerender(<TestListe tests={tests.slice(10)} onTestClick={onTestClick} selectedTests={[]} onTestSelect={onTestSelect} />);
    expect(container.querySelector('.test-card h3').textContent).toBe('Test 11');
  });

  it('blättert auf Seite 2 und zeigt die nächsten Karten', () => {
    const { container } = renderListe();
    fireEvent.click(screen.getAllByLabelText('Nächste Seite')[0]);
    expect(container.querySelector('.test-card h3').textContent).toBe('Test 51');
    expect(screen.getAllByTestId('seiten-kompakt')[0].textContent).toBe('2/3');
  });

  it('Checkboxen haben einen sprechenden Namen und wählen den Test aus', () => {
    const { onTestSelect } = renderListe();
    const box = screen.getByLabelText('Test 1 für Profil auswählen');
    fireEvent.click(box);
    expect(onTestSelect).toHaveBeenCalledWith([expect.objectContaining({ id: 'T0001' })]);
  });

  it('der Testname ist ein Knopf, der die Details öffnet', () => {
    const { onTestClick } = renderListe();
    fireEvent.click(screen.getByRole('button', { name: 'Test 2' }));
    expect(onTestClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'T0002' }));
  });

  it('markiert ausgewählte Karten und behält den Fokus beim Anhaken', () => {
    const { container, rerender, onTestClick, onTestSelect } = renderListe();
    const box = screen.getByLabelText('Test 3 für Profil auswählen');
    box.focus();
    rerender(<TestListe tests={tests} onTestClick={onTestClick} selectedTests={[tests[2]]} onTestSelect={onTestSelect} />);
    const nach = screen.getByLabelText('Test 3 für Profil auswählen');
    expect(nach).toBe(box); // gleiches DOM-Element: Karte wurde nicht neu aufgebaut
    expect(document.activeElement).toBe(box);
    expect(nach.checked).toBe(true);
    expect(within(container.querySelectorAll('.test-card')[2]).getByText('✓')).toBeTruthy();
  });

  it('zeigt bei einer kurzen Liste keine Seitennavigation', () => {
    renderListe({ tests: tests.slice(0, 20) });
    expect(screen.queryByLabelText('Seitennavigation')).toBeNull();
  });

  it('meldet leere Trefferlisten', () => {
    renderListe({ tests: [] });
    expect(screen.getByText('Keine Tests gefunden.')).toBeTruthy();
  });
});
