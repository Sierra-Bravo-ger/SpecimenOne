import React, { memo } from 'react';
import tailwindBtn from './tailwindBtn';
import TestCheckbox from './TestCheckbox';
import MaterialBadge from './MaterialBadge';
import '@material/web/ripple/ripple.js';

// Optimierte TestCard-Komponente als separates memoiziertes Element
const TestCard = memo(({ 
  test, 
  isSelected, 
  isActive, 
  onTestClick, 
  onPointerDown, 
  onPointerUp, 
  onPointerCancel, 
  toggleTestSelection,
  longPressDuration 
}) => {
  return (
    <div 
      className={`relative rounded-lg shadow-md p-4 bg-white dark:bg-[#242328] border ${
        isSelected 
          ? 'border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)] ring-opacity-30' 
          : 'border-gray-200 dark:border-gray-700'
      } ${
        isActive 
          ? 'bg-[var(--md-sys-color-surface-variant)]' 
          : 'hover:bg-[#f5f5f5] dark:hover:bg-[#1C1B1F] hover:bg-opacity-50'
      } transition-all duration-200`}
      onClick={(e) => onTestClick(test, e)}
      onPointerDown={(e) => onPointerDown(test, e)}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{"--long-press-duration": `${longPressDuration/1000}s`}}
    >
      <div className="absolute bottom-3 right-3 z-10">
        <TestCheckbox 
          test={test} 
          isSelected={isSelected} 
          onToggle={toggleTestSelection}
        />
      </div>
      <md-ripple></md-ripple>
      <div className="mb-2">
        <h3 className={`font-medium text-lg mb-1 text-gray-700 dark:text-gray-300 ${
          test.kategorie 
            ? `kategorie-text-${test.kategorie.toLowerCase().replace(/\s+/g, '-')}` 
            : ''
        }`}>
          {test.name || 'Kein Name'}
        </h3>
      </div>
      <p className={`inline-block mb-3 px-2 py-1 rounded-full text-sm ${
        test.kategorie 
          ? `kategorie-${test.kategorie.toLowerCase().replace(/\s+/g, '-')}` 
          : 'bg-gray-200 text-gray-700'
      }`}>
        {test.kategorie || 'Keine Kategorie'}
      </p>
      <div className="mb-2">
        <strong className="text-sm text-gray-700 dark:text-gray-300">Material:</strong>
        {test.material && test.material.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {test.material.map((materialId, index) => (
              <MaterialBadge key={index} materialId={materialId} mini={true} />
            ))}
          </div>
        ) : (
          <span className="text-sm italic text-gray-500 dark:text-gray-400">Keine Angabe</span>
        )}
      </div>
      {test.synonyme && test.synonyme.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 border-dashed">
          <span className="text-sm text-gray-500 dark:text-gray-400 italic">{test.synonyme.join(', ')}</span>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Nur neu rendern, wenn sich relevante Props geändert haben
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.test.id === nextProps.test.id
  );
});

export default TestCard;
