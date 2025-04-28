/**
 * MaterialService.jsx
 * Vereinfachter Service für grundlegende Material-Funktionen
 * 
 * Dieser Service nutzt den gleichen Caching-Mechanismus wie die MaterialBadge-Komponente,
 * ist aber stark vereinfacht und bietet nur die grundlegenden Funktionen, die von anderen
 * Komponenten benötigt werden.
 */

import { useState, useEffect } from 'react';

/**
 * Hook für grundlegende Material-Funktionalitäten
 * @returns {Object} - Materialien und zugehörige Funktionen
 */
export const useMaterialService = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Material-Cache im Window-Objekt initialisieren (wird mit MaterialBadge geteilt)
  useEffect(() => {
    const initializeCache = async () => {
      try {
        // Cache nur initialisieren, wenn er noch nicht existiert
        if (!window.materialCache) {
          window.materialCache = {};
          
          const response = await fetch('/material.json');
          if (!response.ok) {
            throw new Error(`HTTP Fehler! Status: ${response.status}`);
          }
          
          const data = await response.json();
            if (data && data.materialien) {
            // Cache mit Materialdaten füllen
            data.materialien.forEach(material => {
              window.materialCache[material.material_id] = {
                bezeichnung: material.material_bezeichnung,
                kurz: material.material_kurz || "",
                farbe: material.material_farbe || "Grau",
                farbenId: material.farben_id || "0"  // Farben-ID für CSS-Klassen
              };
            });
          }
        }
      } catch (err) {
        console.error('Fehler beim Laden der Materialien:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCache();
  }, []);

  /**
   * Konvertiert ein Material-Array mit IDs in Bezeichnungen
   * @param {Array} materialIds - Array mit Material-IDs
   * @returns {Array} - Array mit Materialbezeichnungen
   */
  const convertMaterialIdsToNames = (materialIds) => {
    if (!materialIds) return [];
    return materialIds.map(id => {
      const material = window.materialCache?.[id];
      return material ? material.bezeichnung : id;
    });
  };

  /**
   * Formatiert eine Material-ID in ein lesbares Format für die Anzeige
   * @param {string} materialId - Die Material-ID (z.B. "SER-00")
   * @returns {string} - Formatierte Darstellung (z.B. "Serum (SE)")
   */
  const formatMaterialForDisplay = (materialId) => {
    const material = window.materialCache?.[materialId];
    if (!material) return materialId;
    
    return `${material.bezeichnung} (${material.kurz})`;
  };

  return {
    isLoading,
    error,
    convertMaterialIdsToNames,
    formatMaterialForDisplay
  };
};

export default useMaterialService;
