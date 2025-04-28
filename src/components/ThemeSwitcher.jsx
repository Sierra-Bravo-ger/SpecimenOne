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
      className="flex items-center justify-center mx-4 cursor-pointer relative w-[60px] h-[30px] select-none theme-transition"
      title={isDark ? "Zu hellem Theme wechseln" : "Zu dunklem Theme wechseln"}
      onClick={toggleTheme}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {if (e.key === 'Enter' || e.key === ' ') toggleTheme();}}
      aria-checked={isDark}
    >
      {/* Der Slider */}      <div className={`relative cursor-pointer w-[60px] h-[30px] rounded-[30px] flex items-center transition-all duration-500 ease-in-out
        ${isDark ? 'bg-[#3f51b5]' : 'bg-[#ffb74d]'}
        shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_1px_2px_rgba(255,255,255,0.4)]
        border-2 border-solid ${isDark ? 'border-white/20' : 'border-white/70'}`}
      >
        {/* Icons-Container innerhalb des Sliders */}
        <div className="w-full flex justify-between px-2 box-border z-[1]">
          <MaterialDesign.MdLightMode className={`text-[1.2rem] text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.3)] z-[2] transition-opacity duration-500 ease-in-out ${isDark ? 'opacity-40' : 'opacity-100'}`} />
          <MaterialDesign.MdDarkMode className={`text-[1.2rem] text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.3)] z-[2] transition-opacity duration-500 ease-in-out ${isDark ? 'opacity-100' : 'opacity-40'}`} />
        </div>
          {/* Der Slider-Kreis (Thumb) */}
        <div className={`absolute h-[24px] w-[24px] bg-white transition-all duration-500 ease-in-out rounded-full 
          shadow-[0_2px_5px_rgba(0,0,0,0.2)] z-[2] 
          ${isDark ? 'left-auto right-[3px]' : 'left-[3px] right-auto'}
          hover:shadow-[0_0_8px_rgba(255,255,255,0.8)]`}
        ></div>
      </div>
    </div>
  );
};

export default ThemeSwitcher;