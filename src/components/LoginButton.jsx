import React, { useState } from 'react';
import * as MaterialDesign from "react-icons/md";
import tailwindBtn from './tailwindBtn';

/**
 * LoginButton Komponente
 * Vorübergehend deaktiviert - zeigt nur eine Hinweismeldung an
 */
function LoginButton() {
  const [showMessage, setShowMessage] = useState(false);
  
  const handleLoginClick = () => {
    setShowMessage(true);
    // Nach 3 Sekunden die Nachricht ausblenden
    setTimeout(() => setShowMessage(false), 3000);
  };

  return (
    <div className="flex items-center relative">
      <button 
        onClick={handleLoginClick} 
        className={tailwindBtn.primary}
      >
        <MaterialDesign.MdLogin className="text-xl" />
        <span className="hidden sm:inline">Anmelden</span>
        <span className="inline sm:hidden">Login</span>
      </button>
      
      {showMessage && (
        <div className="absolute top-full mt-2 right-0 bg-[var(--md-sys-color-surface)] p-3 rounded-md shadow-md z-10 text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline)] min-w-[220px]">
          <div className="flex items-center gap-2">
            <MaterialDesign.MdInfo className="text-[var(--md-sys-color-primary)] text-xl" />
            <span className="font-medium text-sm">Hinweis</span>
          </div>
          <p className="text-xs mt-1">Diese Funktion wird in Kürze verfügbar sein.</p>
        </div>
      )}    </div>
  );
}

export default LoginButton;
