import React, { memo } from 'react';
import MaterialBadge from './MaterialBadge';
import tailwindBtn from './tailwindBtn';

const stabilerMaterialKey = (materialId, index) => `material-${materialId}-${index}`;

/**
 * Inhalt einer Testkarte. Der Testname ist ein echter Knopf (Tastatur, Screenreader);
 * sein ::after-Element spannt sich über die ganze Karte, sodass ein Klick auf die Karte
 * die Details öffnet, ohne dass die Karte selbst ein „Knopf mit Knöpfen darin“ sein muss.
 */
const TestCardContent = memo(({ test, onOpen }) => (
  <>
    <md-ripple></md-ripple>
    <div className="mb-2">
      <h3 className={`font-medium text-lg mb-1 ${tailwindBtn.classes.text} ${
        test.kategorie
          ? `kategorie-text-${test.kategorie.toLowerCase().replace(/\s+/g, '-')}`
          : ''
      }`}>
        <button
          type="button"
          className="test-open m-0 p-0 border-none bg-transparent text-inherit font-inherit text-left cursor-pointer after:absolute after:inset-0 after:content-['']"
          onClick={() => onOpen(test)}
        >
          {test.name || 'Kein Name'}
        </button>
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
              key={stabilerMaterialKey(materialId, index)}
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
), (prev, next) => prev.test.id === next.test.id && prev.onOpen === next.onOpen);

export default TestCardContent;
