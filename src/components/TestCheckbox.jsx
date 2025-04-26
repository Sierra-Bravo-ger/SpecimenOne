import { useState, useEffect } from 'react';
import tailwindBtn from './tailwindBtn';

function TestCheckbox({ test, isSelected, onToggle }) {
  // Vereinfachte Implementierung ohne Long-Press Funktionalität
  // Long-Press wird nun auf Ebene des gesamten Elements behandelt
  return (
    <div className={`${tailwindBtn.classes.checkbox.container} test-checkbox`}> {/* Behält die CSS-Klasse für Kompatibilität */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(test)}
        id={`test-cb-${test.id}`}
        className={`${tailwindBtn.classes.checkbox.input} test-cb-input`} // Behält die CSS-Klasse für Kompatibilität
      />
      <label
        htmlFor={`test-cb-${test.id}`}
        className={`${tailwindBtn.classes.checkbox.label} test-cb-label
          ${isSelected 
            ? tailwindBtn.classes.checkbox.checked 
            : tailwindBtn.classes.checkbox.unchecked
          }`}
      >
        {isSelected ? "✓" : ""}
      </label>
    </div>
  );
}

export default TestCheckbox;