import React, { memo } from 'react';
import MaterialBadge from './MaterialBadge';
import tailwindBtn from './tailwindBtn';

/**
 * Optimierte Komponente für den Inhalt einer Testkarte
 * Verhindert unnötige Rerenderings bei Checkbox-Interaktionen
 */
const TestCardContent = memo(({ test, getStableMaterialKey }) => (
  <>
    <md-ripple></md-ripple>
    <div className="mb-2">
      <h3 className={`font-medium text-lg mb-1 ${tailwindBtn.classes.text} ${
        test.kategorie 
          ? `kategorie-text-${test.kategorie.toLowerCase().replace(/\s+/g, '-')}` 
          : ''
      }`}>
        {test.name || 'Kein Name'}
      </h3>
    </div>
    <p className={`inline-block mb-3 px-2 py-1 rounded-full text-sm kategorie-badge ${
      test.kategorie 
        ? `kategorie-${test.kategorie.toLowerCase().replace(/\s+/g, '-')}` 
        : 'bg-gray-200 text-gray-700'
    }`}>
      {test.kategorie || 'Keine Kategorie'}
    </p>
    <div className="mb-2">
      <strong className={`text-sm ${tailwindBtn.classes.text}`}>Material:</strong>
      {test.material && test.material.length > 0 ? (
        <div className="flex flex-wrap gap-1 mt-1">
          {test.material.map((materialId, index) => (
            <MaterialBadge 
              key={getStableMaterialKey(materialId, index)} 
              materialId={materialId} 
              mini={true} 
            />
          ))}
        </div>
      ) : (
        <span className={`text-sm italic ${tailwindBtn.classes.textMuted}`}>Keine Angabe</span>
      )}
    </div>
    {test.synonyme && test.synonyme.length > 0 && (
      <div className={`mt-2 pt-2 border-t ${tailwindBtn.borderClasses} border-dashed`}>
        <span className={`text-sm ${tailwindBtn.classes.textMuted} italic`}>{test.synonyme.join(', ')}</span>
      </div>
    )}
  </>
), (prevProps, nextProps) => {
  // Nur neu rendern wenn sich die Test ID ändert
  return prevProps.test.id === nextProps.test.id;
});

export default TestCardContent;
