import React, { useState, useEffect, memo } from 'react';

/**
 * MaterialBadge - Komponente zur Anzeige von Material-Bezeichnungen
 * Kombiniert CSS-Klassen und dynamische Stile für maximale Flexibilität
 * Optimiert mit Animation während des Ladens und memoization für bessere Performance
 * 
 * @param {Object} props - Component properties
 * @param {string} props.materialId - Die Material-ID (z.B. "SE-00")
 * @param {boolean} props.showKurzbezeichnung - Wenn true, wird die Kurzbezeichnung angezeigt
 * @param {boolean} props.mini - Wenn true, wird ein kleineres Badge angezeigt
 */
const MaterialBadge = memo(({ 
  materialId, 
  showKurzbezeichnung = false,
  mini = false 
}) => {
  // Status für die Materialbezeichnung und Ladezustand
  const [materialBezeichnung, setMaterialBezeichnung] = useState(materialId);
  const [materialKurz, setMaterialKurz] = useState("");
  const [farbenId, setFarbenId] = useState("0"); // Default farbenId
  const [isLoading, setIsLoading] = useState(true);
  
  // Lade die Material-Bezeichnung beim ersten Rendern
  useEffect(() => {
    // Cache für Material-Bezeichnungen
    if (!window.materialCache) {
      window.materialCache = {};
    }
    
    // Cache für Farben
    if (!window.farbenCache) {
      window.farbenCache = {};
    }
    
    const loadMaterialBezeichnung = async () => {
      try {
        // Wenn bereits im Cache, verwende den Cache
        if (window.materialCache[materialId]) {
          const cachedMaterial = window.materialCache[materialId];
          setMaterialBezeichnung(cachedMaterial.bezeichnung);
          setMaterialKurz(cachedMaterial.kurz || "");
          setFarbenId(cachedMaterial.farbenId || "0");
          setIsLoading(false); // Material wurde aus dem Cache geladen
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
            kurz: materialItem.material_kurz,
            farbe: materialItem.material_farbe || "Grau",
            farbenId: materialItem.farben_id || "0"
          };          
          setMaterialBezeichnung(materialItem.material_bezeichnung);
          setMaterialKurz(materialItem.material_kurz || "");
          setFarbenId(materialItem.farben_id || "0");
          setIsLoading(false); // Material wurde erfolgreich geladen
        }
      } catch (error) {
        console.error('Fehler beim Laden der Material-Bezeichnung:', error);
        setIsLoading(false); // Auch bei Fehler den Ladestatus beenden
      }
    };
    
    // Laden der Farben, falls noch nicht geschehen
    const loadFarben = async () => {
      if (Object.keys(window.farbenCache).length === 0) {
        try {
          const response = await fetch('/farben.json');
          if (!response.ok) {
            throw new Error('Fehler beim Laden der Farben-Daten');
          }
          
          const data = await response.json();
          if (data && data.farben) {
            data.farben.forEach(farbe => {
              window.farbenCache[farbe.id] = {
                bezeichnung: farbe.bezeichnung,
                hex: farbe.hex,
                textColor: farbe.textColor
              };
            });
          }
        } catch (error) {
          console.error('Fehler beim Laden der Farben:', error);
        }
      }
    };
    
    Promise.all([loadMaterialBezeichnung(), loadFarben()]);
  }, [materialId]);
  
  // Basisklasse und Größenvariante
  const sizeClass = mini ? 'material-badge-mini' : 'material-badge-standard';
  
  // Material-spezifische CSS-Klasse (für Kompatibilität mit dem alten Ansatz)
  const materialClass = `material-${materialId.toLowerCase().replace('_', '-')}`;
  
  // Farben-ID-basierte CSS-Klasse (für den neuen Ansatz)
  const colorClass = farbenId ? `material-color-${farbenId}` : 'material-default';
  
  // Anzeigename basierend auf showKurzbezeichnung
  const displayName = showKurzbezeichnung ? materialKurz || materialBezeichnung : materialBezeichnung;
  
  // Rendere das Badge mit CSS-Klassen-Ansatz und dynamischem Stil als Fallback
  return (
    <span 
      className={`material-badge ${sizeClass} ${materialClass} ${colorClass}`}
      title={showKurzbezeichnung ? materialBezeichnung : null}
    >
      {isLoading ? '...' : displayName}
    </span>
  );
});

export default MaterialBadge;
