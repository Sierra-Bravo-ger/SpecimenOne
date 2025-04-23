import React, { createContext, useState, useContext, useEffect } from 'react';

// Theme-Typen
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Context erstellen
const ThemeContext = createContext();

// Storage-Key für localStorage
const STORAGE_KEY = 'specimenone_theme';

// Provider-Komponente für den Theme-Context
export function ThemeProvider({ children }) {
  // State für die Theme-Präferenz
  const [themePreference, setThemePreference] = useState(() => {
    // Beim Initialisieren aus dem localStorage lesen oder System-Default verwenden
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY);
      return savedTheme || THEMES.SYSTEM;
    } catch (e) {
      return THEMES.SYSTEM;
    }
  });

  // State für das tatsächlich angezeigte Theme (light/dark)
  const [currentTheme, setCurrentTheme] = useState(() => {
    const preference = themePreference || THEMES.SYSTEM;
    
    if (preference === THEMES.SYSTEM) {
      // System-Theme erkennen
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? THEMES.DARK
        : THEMES.LIGHT;
    }
    
    return preference;
  });

  // Speichern der Präferenz im localStorage wenn sie sich ändert
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, themePreference);
    } catch (e) {
      console.error('Fehler beim Speichern des Themes:', e);
    }
  }, [themePreference]);

  // Aktualisieren des effektiven Themes basierend auf der Präferenz und dem System-Theme
  useEffect(() => {
    if (themePreference === THEMES.SYSTEM) {
      // Bei System-Einstellung das System-Theme erkennen
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setCurrentTheme(isDarkMode ? THEMES.DARK : THEMES.LIGHT);

      // Event-Listener für Änderungen der System-Präferenz
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        setCurrentTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
      };

      // Event-Listener hinzufügen (mit Fallback für ältere Browser)
      if (darkModeMediaQuery.addEventListener) {
        darkModeMediaQuery.addEventListener('change', handleChange);
      } else if (darkModeMediaQuery.addListener) {
        darkModeMediaQuery.addListener(handleChange);
      }

      // Cleanup
      return () => {
        if (darkModeMediaQuery.removeEventListener) {
          darkModeMediaQuery.removeEventListener('change', handleChange);
        } else if (darkModeMediaQuery.removeListener) {
          darkModeMediaQuery.removeListener(handleChange);
        }
      };
    } else {
      // Bei expliziter Nutzerwahl direkt diese setzen
      setCurrentTheme(themePreference);
    }
  }, [themePreference]);

  // Theme-Klasse auf HTML-Dokument anwenden
  useEffect(() => {
    document.documentElement.classList.remove(THEMES.LIGHT, THEMES.DARK);
    document.documentElement.classList.add(currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  // Funktion zum Ändern der Theme-Präferenz
  const setTheme = (newTheme) => {
    setThemePreference(newTheme);
  };

  // Context-Wert
  const contextValue = {
    themePreference,
    currentTheme,
    setTheme,
    isDark: currentTheme === THEMES.DARK
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom Hook für einfachen Zugriff auf den Theme-Context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme muss innerhalb eines ThemeProviders verwendet werden');
  }
  return context;
}

export default ThemeContext;