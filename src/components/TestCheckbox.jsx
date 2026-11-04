import React, { memo } from 'react';
import tailwindBtn from './tailwindBtn';

/** Checkbox „für Profil auswählen“ einer Testkarte; der Name nennt den Test für Screenreader. */
const TestCheckbox = memo(({ test, isSelected, onToggle }) => {
  const handleChange = (e) => {
    e.stopPropagation();
    onToggle(test);
  };

  return (
    <div
      className={`${tailwindBtn.classes.checkbox.container} test-checkbox`}
      onClick={e => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={handleChange}
        id={`test-cb-${test.id}`}
        aria-label={`${test.name || test.id} für Profil auswählen`}
        className={`${tailwindBtn.classes.checkbox.input} test-cb-input`}
      />
      <label
        htmlFor={`test-cb-${test.id}`}
        aria-hidden="true"
        className={`${tailwindBtn.classes.checkbox.label} test-cb-label relative after:absolute after:-inset-3 after:content-['']
          ${isSelected
            ? tailwindBtn.classes.checkbox.checked
            : tailwindBtn.classes.checkbox.unchecked
          }`}
        onClick={e => e.stopPropagation()}
      >
        {isSelected ? '✓' : ''}
      </label>
    </div>
  );
}, (prev, next) => prev.isSelected === next.isSelected && prev.test.id === next.test.id && prev.onToggle === next.onToggle);

export default TestCheckbox;
