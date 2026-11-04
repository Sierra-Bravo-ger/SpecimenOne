// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act, cleanup } from '@testing-library/react';
import WillkommenHinweis, { BEISPIEL_SUCHEN } from './WillkommenHinweis';
import { useWillkommen, WILLKOMMEN_KEY } from '../hooks/useWillkommen';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('WillkommenHinweis', () => {
  it('ruft bei Klick auf eine Beispielsuche den Callback mit dem Begriff auf', () => {
    const onBeispielSuche = vi.fn();
    render(<WillkommenHinweis onBeispielSuche={onBeispielSuche} onSchliessen={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Lanoxin' }));
    expect(onBeispielSuche).toHaveBeenCalledWith('Lanoxin');
    expect(BEISPIEL_SUCHEN.map((b) => b.begriff)).toEqual(['Lanoxin', 'Creatinin', 'Mycoplasma pneumoniae', 'F37']);
  });

  it('Schließen-Knopf hat ein aria-label und ruft onSchliessen auf', () => {
    const onSchliessen = vi.fn();
    render(<WillkommenHinweis onBeispielSuche={() => {}} onSchliessen={onSchliessen} />);
    fireEvent.click(screen.getByLabelText('Hinweis schließen'));
    expect(onSchliessen).toHaveBeenCalledTimes(1);
  });

  it('öffnet und schließt den Dialog „Über das Projekt“', () => {
    render(<WillkommenHinweis onBeispielSuche={() => {}} onSchliessen={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByText('Über das Projekt'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'API-Doku' }).getAttribute('href')).toBe('/api/docs/');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('useWillkommen', () => {
  it('ist beim ersten Besuch sichtbar', () => {
    const { result } = renderHook(() => useWillkommen());
    expect(result.current.sichtbar).toBe(true);
  });

  it('merkt sich das Ausblenden in localStorage, auch nach Neuaufbau', () => {
    const { result, unmount } = renderHook(() => useWillkommen());
    act(() => result.current.ausblenden());
    expect(result.current.sichtbar).toBe(false);
    expect(localStorage.getItem(WILLKOMMEN_KEY)).toBe('1');
    unmount();
    const zweiter = renderHook(() => useWillkommen());
    expect(zweiter.result.current.sichtbar).toBe(false);
  });

  it('einblenden hebt die Merkung auf', () => {
    localStorage.setItem(WILLKOMMEN_KEY, '1');
    const { result } = renderHook(() => useWillkommen());
    expect(result.current.sichtbar).toBe(false);
    act(() => result.current.einblenden());
    expect(result.current.sichtbar).toBe(true);
    expect(localStorage.getItem(WILLKOMMEN_KEY)).toBeNull();
  });
});
