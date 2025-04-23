import { useState, useEffect } from 'react';
import './TestCheckbox.css';

function TestCheckbox({ test, isSelected, onToggle }) {
  // Vereinfachte Implementierung ohne Long-Press Funktionalität
  // Long-Press wird nun auf Ebene des gesamten Elements behandelt
  return (
    <div className="test-checkbox">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(test)}
        id={`test-cb-${test.id}`}
        className="test-cb-input"
      />
      <label
        htmlFor={`test-cb-${test.id}`}
        className="test-cb-label"
      >
        {isSelected ? "✓" : ""}
      </label>
    </div>
  );
}

export default TestCheckbox;