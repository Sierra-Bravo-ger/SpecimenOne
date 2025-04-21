import { useState, useEffect } from 'react';
import './TestCheckbox.css';

function TestCheckbox({ test, isSelected, onToggle, onLongPress }) {
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [touchTimeout, setTouchTimeout] = useState(null);
  const longPressDuration = 600; // ms

  // Touch-Event Handler für Mobile Long-Press
  const handleTouchStart = () => {
	setTouchStartTime(Date.now());
	const timeout = setTimeout(() => {
	  // Long press erkannt
	  if (onLongPress) onLongPress(test);
	}, longPressDuration);
	setTouchTimeout(timeout);
  };

  const handleTouchEnd = () => {
	// Touch-Dauer berechnen
	const touchDuration = Date.now() - touchStartTime;

	// Long-Press Timeout löschen
	if (touchTimeout) clearTimeout(touchTimeout);

	// Wenn es kein Long-Press war (< 600ms), als normalen Klick behandeln
	if (touchDuration < longPressDuration) {
	  onToggle(test);
	}
  };

  // Cleanup bei Komponentenabbau
  useEffect(() => {
	return () => {
	  if (touchTimeout) clearTimeout(touchTimeout);
	};
  }, [touchTimeout]);

  return (
	<div
	  className="test-checkbox"
	  onTouchStart={handleTouchStart}
	  onTouchEnd={handleTouchEnd}
	>
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