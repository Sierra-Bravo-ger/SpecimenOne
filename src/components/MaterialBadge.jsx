import React, { useState, useEffect } from 'react';

/**
 * MaterialBadge - Einfache CSS-basierte Komponente zur Anzeige von Material-Bezeichnungen
 * Analog zu Kategorie-Badges - verwendet vordefinierte CSS-Klassen statt dynamischer Logik
 * 
 * @param {Object} props - Component properties
 * @param {string} props.materialId - Die Material-ID (z.B. "SER-00")
 * @param {boolean} props.showKurzbezeichnung - Wenn true, wird die Kurzbezeichnung angezeigt
 * @param {boolean} props.mini - Wenn true, wird ein kleineres Badge angezeigt
 */
const MaterialBadge = ({ 
  materialId, 
  showKurzbezeichnung = false,
  mini = false 
}) => {
  // Status für die Materialbezeichnung
  const [materialBezeichnung, setMaterialBezeichnung] = useState(materialId);
  const [materialKurz, setMaterialKurz] = useState("");
  
  // Lade die Material-Bezeichnung beim ersten Rendern
  useEffect(() => {
    // Cache für Material-Bezeichnungen
    if (!window.materialCache) {
      window.materialCache = {};
    }
    
    const loadMaterialBezeichnung = async () => {
      try {
        // Wenn bereits im Cache, verwende den Cache
        if (window.materialCache[materialId]) {
          const cachedMaterial = window.materialCache[materialId];
          setMaterialBezeichnung(cachedMaterial.bezeichnung);
          setMaterialKurz(cachedMaterial.kurz || "");
          return;
        }
        
        // Sonst lade aus material.json
        const response = await fetch('/material.json');
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Materialdaten');
        }
        
        const data = await response.json();
        const materialItem = data.materialien.find(m => m.material_id === materialId);
        
        if (materialItem) {
          // Zum Cache hinzufügen
          window.materialCache[materialId] = {
            bezeichnung: materialItem.material_bezeichnung,
            kurz: materialItem.material_kurz
          };
          
          setMaterialBezeichnung(materialItem.material_bezeichnung);
          setMaterialKurz(materialItem.material_kurz || "");
        }
      } catch (error) {
        console.error('Fehler beim Laden der Material-Bezeichnung:', error);
      }
    };
    
    loadMaterialBezeichnung();
  }, [materialId]);
  
  // Basisklasse und Größenvariante
  const sizeClass = mini ? 'material-badge-mini' : 'material-badge-standard';
  
  // Spezifische Klasse für das Material (basierend auf ID, in Kleinbuchstaben)
  const materialClass = `material-${materialId.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
  
  // Fallback-Klasse für unbekannte Materialien
  const fallbackClass = 'material-default';
  
  // Text zum Anzeigen, mit oder ohne Kurzbezeichnung
  const displayText = showKurzbezeichnung && materialKurz 
    ? `${materialBezeichnung} (${materialKurz})` 
    : materialBezeichnung;
  
  return (
    <span className={`material-badge ${sizeClass} ${materialClass || fallbackClass}`}>
      {displayText}
    </span>
  );
};

// Named export
export { MaterialBadge };

// Default export
export default MaterialBadge;
