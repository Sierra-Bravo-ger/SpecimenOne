import React, { memo } from 'react';
import tailwindBtn from './tailwindBtn';

// Extreme Optimierung mit React.memo und stopPropagation
const TestCheckbox = memo(({ test, isSelected, onToggle }) => {
  // Event-Handler mit stopPropagation, um Bubble-Up zu verhindern
  const handleChange = (e) => {
    e.stopPropagation();
    onToggle(test);
  };

  // Klick auf Label auch blockieren 
  const handleLabelClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div 
      className={`${tailwindBtn.classes.checkbox.container} test-checkbox`}
      onClick={e => e.stopPropagation()} // Verhindert Klick-Event-Bubbling
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={handleChange}
        id={`test-cb-${test.id}`}
        className={`${tailwindBtn.classes.checkbox.input} test-cb-input`}
      />
      <label
        htmlFor={`test-cb-${test.id}`}
        className={`${tailwindBtn.classes.checkbox.label} test-cb-label
          ${isSelected 
            ? tailwindBtn.classes.checkbox.checked 
            : tailwindBtn.classes.checkbox.unchecked
          }`}
        onClick={handleLabelClick}
      >
        {isSelected ? "✓" : ""}
      </label>
    </div>
  );
}, (prevProps, nextProps) => {
  // Eigene Vergleichsfunktion für React.memo
  // Nur neu rendern, wenn sich der isSelected-Status ändert
  return prevProps.isSelected === nextProps.isSelected;
});

export default TestCheckbox;