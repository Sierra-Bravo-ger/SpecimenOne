import { useRef, useEffect } from 'react';

/**
 * Custom Hook zum Verfolgen vorheriger Werte
 * @param {*} value - Der aktuelle Wert
 * @returns Der vorherige Wert
 */
function usePrevious(value) {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * Custom Hook zum Verfolgen von State-Updates
 * @param {*} value - Der zu verfolgende Wert
 * @param {string} debugName - Name für Debug-Logs
 */
function useStateTracking(value, debugName = 'State') {
  const previousValue = usePrevious(value);
  
  useEffect(() => {
    if (previousValue !== undefined && value !== previousValue) {
      console.log(`[StateTracking] ${debugName} hat sich geändert:`, {
        von: previousValue,
        zu: value,
      });
    }
  }, [value, previousValue, debugName]);
}

export { usePrevious, useStateTracking };
