import React from 'react';
import { useTheme, THEMES } from '../contexts/ThemeContext';
import * as MaterialDesign from "react-icons/md";

/**
 * ThemeSwitcher als moderner Toggle-Slider zum Umschalten zwischen Hell/Dunkel
 * mit Symbolen innerhalb des Sliders und kontrastreichem Design
 */
const ThemeSwitcher = () => {
  const { currentTheme, setTheme, isDark } = useTheme();
  
  // Toggle zwischen hell und dunkel
  const toggleTheme = () => {
    // Wenn aktuell dunkel, zu hell wechseln und umgekehrt
    const newTheme = isDark ? THEMES.LIGHT : THEMES.DARK;
    setTheme(newTheme);
  };

  return (
    <div 
      className="theme-switcher"
      title={isDark ? "Zu hellem Theme wechseln" : "Zu dunklem Theme wechseln"}
      onClick={toggleTheme}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {if (e.key === 'Enter' || e.key === ' ') toggleTheme();}}
      aria-checked={isDark}
    >
      <div className="theme-toggle-slider">
        <div className="theme-toggle-icons">
          <MaterialDesign.MdLightMode className="theme-icon light-icon" />
          <MaterialDesign.MdDarkMode className="theme-icon dark-icon" />
        </div>
        <div className="theme-toggle-thumb"></div>
      </div>
    </div>
  );
};

export default ThemeSwitcher;