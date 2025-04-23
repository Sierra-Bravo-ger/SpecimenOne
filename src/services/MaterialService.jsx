/**
 * MaterialService.jsx
 * Service zum Laden und Verarbeiten der Materialdefinitionen
 */

import { useState, useEffect } from 'react';

/**
 * Hook, das die Materialien aus der material.json lädt und aufbereitet
 * @returns {Object} - Materialien und zugehörige Funktionen
 */
export const useMaterialService = () => {
  const [materials, setMaterials] = useState([]);
  const [materialsMap, setMaterialsMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Materialien beim ersten Laden abrufen
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/material.json');
        if (!response.ok) {
          throw new Error(`HTTP Fehler! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.materialien) {
          setMaterials(data.materialien);
          
          // Lookup-Map für schnellen Zugriff erstellen
          const map = {};
          data.materialien.forEach(material => {
            map[material.material_id] = material;
          });
          
          setMaterialsMap(map);
        } else {
          throw new Error('Ungültiges Datenformat für material.json');
        }
      } catch (err) {
        console.error('Fehler beim Laden der Materialien:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  /**
   * Gibt Material-Informationen basierend auf der Material-ID zurück
   * @param {string} materialId - Die Material-ID (z.B. "SER-00")
   * @returns {Object|null} - Das Material-Objekt oder null, wenn nicht gefunden
   */
  const getMaterialById = (materialId) => {
    return materialsMap[materialId] || null;
  };

  /**
   * Gibt die vollständige Bezeichnung eines Materials zurück
   * @param {string} materialId - Die Material-ID
   * @returns {string} - Die Bezeichnung des Materials oder die ID als Fallback
   */
  const getMaterialBezeichnung = (materialId) => {
    const material = getMaterialById(materialId);
    return material ? material.material_bezeichnung : materialId;
  };

  /**
   * Gibt die Kurzbezeichnung eines Materials zurück
   * @param {string} materialId - Die Material-ID
   * @returns {string} - Die Kurzbezeichnung des Materials oder die ID als Fallback
   */
  const getMaterialKurzbezeichnung = (materialId) => {
    const material = getMaterialById(materialId);
    return material ? material.material_kurz : materialId;
  };

  /**
   * Gibt die Farbe eines Materials zurück
   * @param {string} materialId - Die Material-ID
   * @returns {string} - Die Farbe des Materials oder einen Standardwert
   */
  const getMaterialFarbe = (materialId) => {
    const material = getMaterialById(materialId);
    return material ? material.material_farbe : 'Grau';
  };

  /**
   * Gibt die Lagerungsinformationen eines Materials zurück
   * @param {string} materialId - Die Material-ID
   * @returns {string} - Die Lagerungsinformationen oder einen leeren String
   */
  const getMaterialLagerung = (materialId) => {
    const material = getMaterialById(materialId);
    return material ? material.lagerung : '';
  };

  /**
   * Gibt das Probenröhrchen eines Materials zurück
   * @param {string} materialId - Die Material-ID
   * @returns {string} - Das Probenröhrchen oder einen leeren String
   */
  const getMaterialProbenroehre = (materialId) => {
    const material = getMaterialById(materialId);
    return material ? material.probenroehre : '';
  };

  /**
   * Konvertiert ein Material-Array mit IDs in Bezeichnungen
   * @param {Array} materialIds - Array mit Material-IDs
   * @returns {Array} - Array mit Materialbezeichnungen
   */
  const convertMaterialIdsToNames = (materialIds) => {
    if (!materialIds) return [];
    return materialIds.map(id => getMaterialBezeichnung(id));
  };

  /**
   * Formatiert eine Material-ID in ein lesbares Format für die Anzeige
   * @param {string} materialId - Die Material-ID (z.B. "SER-00")
   * @returns {string} - Formatierte Darstellung (z.B. "Serum (SE)")
   */
  const formatMaterialForDisplay = (materialId) => {
    const material = getMaterialById(materialId);
    if (!material) return materialId;
    
    return `${material.material_bezeichnung} (${material.material_kurz})`;
  };

  /**
   * Gibt alle verfügbaren Material-IDs zurück
   * @returns {Array} - Liste aller Material-IDs
   */
  const getAllMaterialIds = () => {
    return Object.keys(materialsMap);
  };

  /**
   * Gibt alle verfügbaren Materialien zurück
   * @returns {Array} - Liste aller Materialobjekte
   */
  const getAllMaterials = () => {
    return materials;
  };

  return {
    materials,
    isLoading,
    error,
    getMaterialById,
    getMaterialBezeichnung,
    getMaterialKurzbezeichnung,
    getMaterialFarbe,
    getMaterialLagerung,
    getMaterialProbenroehre,
    convertMaterialIdsToNames,
    formatMaterialForDisplay,
    getAllMaterialIds,
    getAllMaterials
  };
};

export default useMaterialService;
