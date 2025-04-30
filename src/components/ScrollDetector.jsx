import React, { useEffect } from 'react';

/**
 * Komponente zur Erkennung von Scroll-Events
 * Hilft bei der Unterscheidung zwischen Scroll- und Touch-Events
 */
const ScrollDetector = () => {
  useEffect(() => {
    // Scroll-Handler registrieren
    const scrollHandler = () => {
      window.scrollTimestamp = Date.now();
    };

    // Passiven Event-Listener verwenden für bessere Performance
    window.addEventListener('scroll', scrollHandler, { passive: true });
    
    // Primären Touch-Handler registrieren
    const touchStartHandler = () => {
      document.hasStoredUserInteraction = true;
    };
    
    window.addEventListener('touchstart', touchStartHandler, { once: true, passive: true });

    // Event-Listener bereinigen
    return () => {
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('touchstart', touchStartHandler);
    };
  }, []);

  return null; // Diese Komponente rendert nichts
};

export default ScrollDetector;
