import React, { useState, useEffect, memo, useRef, useCallback } from 'react';

/**
 * MaterialBadge mit optimiertem Rendering-Verhalten
 * Verhindert Flickering-Probleme durch Pure Component-Ansatz und mehrstufiges Caching
 */
// Globales Material-Cache-Objekt außerhalb der Komponente
if (!window.materialDataCache) {
  window.materialDataCache = {};
}

// Globales Badge-Instanz-Cache
if (!window.badgeInstanceCache) {
  window.badgeInstanceCache = {};
}

// Pure Komponente ohne internen Zustand
const PureMaterialBadge = memo(({ 
  materialData,
  badgeId,
  materialId, 
  showKurzbezeichnung,
  mini
}) => {  
  // Basisklasse und Größenvariante
  const sizeClass = mini ? 'material-badge-mini' : 'material-badge-standard';
  // Material-spezifische CSS-Klasse (für Kompatibilität mit dem alten Ansatz)
  const materialClass = `material-${materialId.toLowerCase().replace('_', '-')}`;
  
  // Farben-ID-basierte CSS-Klasse (für den neuen Ansatz)
  const colorClass = materialData.farbenId ? `material-color-${materialData.farbenId}` : 'material-default';
    // Anzeigename basierend auf showKurzbezeichnung
  let displayName;
  if (showKurzbezeichnung) {
    // Zeige die vollständige Material-ID an
    displayName = materialId;
  } else {
    // Zeige die Bezeichnung an
    displayName = materialData.materialBezeichnung;
  }
  
  // Rendere das Badge mit CSS-Klassen-Ansatz
  return (
    <span 
      className={`material-badge ${sizeClass} ${materialClass} ${colorClass} ${materialData.isLoading ? 'pulse-animation' : ''}`}
      title={`${materialData.materialBezeichnung} (${materialId})`}
      data-badge-id={badgeId}
    >
      {materialData.isLoading ? '...' : displayName}
    </span>
  );
}, (prevProps, nextProps) => {
  // Verhindert Rerenders, wenn sich die Props nicht ändern
  return prevProps.materialId === nextProps.materialId && 
         prevProps.mini === nextProps.mini &&
         prevProps.showKurzbezeichnung === nextProps.showKurzbezeichnung &&
         prevProps.materialData === nextProps.materialData;
});

// Wrapper-Komponente, die den Zustand hält
const MaterialBadgeContainer = ({ 
  materialId, 
  showKurzbezeichnung = false,
  mini = false 
}) => {
  // Eindeutige Badge-ID für Debugging
  const badgeId = useRef(`badge-${materialId}-${Math.random().toString(36).substring(2, 7)}`).current;
  
  // Komponenten-übergreifender Cache für Material-Daten
  const [materialData, setMaterialData] = useState(() => {
    // Prüfe, ob Material bereits im Cache ist
    if (window.materialDataCache[materialId]) {
      return window.materialDataCache[materialId];
    }
    
    // Initialer State für neues Material
    return {
      materialBezeichnung: materialId,
      materialKurz: "",
      farbenId: "0",
      isLoading: true
    };
  });
  
  // Material-Daten laden - nur wenn noch nicht im Cache
  useEffect(() => {
    // Wenn bereits im Cache und nicht mehr im Ladezustand
    if (window.materialDataCache[materialId] && !window.materialDataCache[materialId].isLoading) {
      setMaterialData(window.materialDataCache[materialId]);
      return;
    }
    
    const loadMaterialData = async () => {
      try {
        // Initialisiere Cache-Objekte falls nötig
        if (!window.materialCache) {
          window.materialCache = {};
        }
        
        if (!window.farbenCache) {
          window.farbenCache = {};
        }
        
        // Wenn bereits im Cache, verwende den Cache
        if (window.materialCache[materialId]) {
          const cachedMaterial = window.materialCache[materialId];
          const newData = {
            materialBezeichnung: cachedMaterial.bezeichnung,
            materialKurz: cachedMaterial.kurz || "",
            farbenId: cachedMaterial.farbenId || "0",
            isLoading: false
          };
          
          // Aktualisiere lokalen Zustand und globalen Cache
          setMaterialData(newData);
          window.materialDataCache[materialId] = newData;
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
          
          const newData = {
            materialBezeichnung: materialItem.material_bezeichnung,
            materialKurz: materialItem.material_kurz || "",
            farbenId: materialItem.farben_id || "0", 
            isLoading: false
          };
          
          // Aktualisiere lokalen Zustand und globalen Cache
          setMaterialData(newData);
          window.materialDataCache[materialId] = newData;
        }
      } catch (error) {
        console.error('Fehler beim Laden der Material-Bezeichnung:', error);
        
        // Auch bei Fehler den Ladestatus beenden
        const errorData = { ...materialData, isLoading: false };
        setMaterialData(errorData);
        window.materialDataCache[materialId] = errorData;
      }
    };
    
    loadMaterialData();
  }, [materialId]);
  
  // Komponenten-Instanz-Cache
  useEffect(() => {
    const instanceKey = `${materialId}-${showKurzbezeichnung}-${mini}`;
    
    // Wenn noch nicht im Cache, füge es hinzu
    if (!window.badgeInstanceCache[instanceKey]) {
      window.badgeInstanceCache[instanceKey] = badgeId;
    }
  }, [materialId, showKurzbezeichnung, mini, badgeId]);
    // Badge-Render-Zähler (deaktiviert)
  const renderCount = useRef(0);
  
  // Rendere die eigentliche Badge-Komponente (memoized)
  return (
    <PureMaterialBadge 
      materialData={materialData}
      badgeId={badgeId}
      materialId={materialId}
      showKurzbezeichnung={showKurzbezeichnung}
      mini={mini}
    />
  );
};

// Exportiere die Container-Komponente als default
export default memo(MaterialBadgeContainer);
