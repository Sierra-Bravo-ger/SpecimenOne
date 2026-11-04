// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import TestDetails from './TestDetails';
import MaterialBadge from './MaterialBadge';

// Material-Web-Komponenten (Lit) laufen nicht in jsdom
vi.mock('@material/web/button/filled-button.js', () => ({}));
vi.mock('@material/web/button/text-button.js', () => ({}));
vi.mock('@material/web/divider/divider.js', () => ({}));
vi.mock('@material/web/elevation/elevation.js', () => ({}));
vi.mock('../services/MaterialService', () => ({
  useMaterialService: () => ({ convertMaterialIdsToNames: (ids) => ids, isLoading: false }),
}));
vi.mock('../services/EinheitenService', () => ({
  useEinheitenService: () => ({ formatEinheit: () => 'ng/ml', isLoading: false }),
}));

const digoxin = {
  id: 'T0003',
  name: 'Digoxin',
  kategorie: 'Klinische Chemie',
  material: ['SE-00'],
  synonyme: ['Lanoxin'],
  einheit_id: 1,
  mindestmenge_ml: 0.5,
};

beforeEach(() => {
  window.materialCache = { 'SE-00': { bezeichnung: 'Serum', kurz: 'SE', farbe: 'Rot', farbenId: '3' } };
  window.materialDataCache = {};
  window.badgeInstanceCache = {};
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ referenzwerte: [], versandinfos: [] }) })));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Material in der Detailansicht', () => {
  it('zeigt „Serum“ statt des Codes SE-00, den Code nur als Zusatz', async () => {
    render(<TestDetails test={digoxin} onClose={() => {}} />);
    const badge = await screen.findByText('Serum', { exact: false });
    expect(badge.textContent).toContain('Serum');
    expect(screen.getByTestId('material-code').textContent).toBe('(SE-00)');
    // der Code steht nicht mehr allein als Badge-Text
    expect(screen.queryByText('SE-00', { exact: true })).toBeNull();
  });

  it('MaterialBadge ohne zeigeCode (Liste) zeigt nur den Namen', async () => {
    render(<MaterialBadge materialId="SE-00" mini />);
    expect(await screen.findByText('Serum')).toBeTruthy();
    expect(screen.queryByTestId('material-code')).toBeNull();
  });

  it('zeigt den Code, wenn kein Name bekannt ist (offline ohne Cache)', async () => {
    window.materialCache = {};
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<MaterialBadge materialId="XX-99" zeigeCode />);
    await waitFor(() => expect(screen.getByText('XX-99')).toBeTruthy());
    expect(screen.queryByTestId('material-code')).toBeNull(); // kein doppelter Code
  });
});

describe('Detailansicht als Dialog', () => {
  it('ist ein beschrifteter modaler Dialog und fokussiert sich beim Öffnen', () => {
    render(<TestDetails test={digoxin} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('test-details-titel');
    expect(document.getElementById('test-details-titel').textContent).toBe('Digoxin');
    expect(document.activeElement).toBe(dialog);
  });

  it('Escape schließt die Detailansicht', () => {
    const onClose = vi.fn();
    render(<TestDetails test={digoxin} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('der Schließen-Knopf hat einen Namen', () => {
    const onClose = vi.fn();
    render(<TestDetails test={digoxin} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Details schließen' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('gibt den Fokus beim Schließen an das auslösende Element zurück', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = render(<TestDetails test={digoxin} onClose={() => {}} />);
    expect(document.activeElement).not.toBe(opener);
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('hält Tab im Dialog (Fokusfalle)', () => {
    render(<TestDetails test={digoxin} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog');
    const fokussierbar = dialog.querySelectorAll('button:not([disabled])');
    const letztes = fokussierbar[fokussierbar.length - 1];
    letztes.focus();
    fireEvent.keyDown(letztes, { key: 'Tab' });
    expect(document.activeElement).toBe(fokussierbar[0]);
  });
});
