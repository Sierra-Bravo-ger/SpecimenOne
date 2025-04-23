import React from 'react';
import { useMaterialService } from '../services/MaterialService';
import './MaterialBadge.css';

/**
 * MaterialBadge - Komponente zur Anzeige von Material-Bezeichnungen mit farblichen Badges
 * 
 * @param {Object} props - Component properties
 * @param {string} props.materialId - Die Material-ID (z.B. "SER-00")
 * @param {boolean} props.showKurzbezeichnung - Optional: Wenn true, wird die Kurzbezeichnung angezeigt
 * @param {boolean} props.mini - Optional: Wenn true, wird ein kleineres Badge angezeigt
 */
const MaterialBadge = ({ materialId, showKurzbezeichnung = false, mini = false }) => {
  const { 
    getMaterialById, 
    getMaterialBezeichnung, 
    getMaterialKurzbezeichnung,
    getMaterialFarbe,
    isLoading 
  } = useMaterialService();

  if (isLoading) {
    return <span className="material-badge loading">Wird geladen...</span>;
  }

  const material = getMaterialById(materialId);
  
  // Wenn Material nicht gefunden wurde, zeige die ID als Fallback
  if (!material) {
    return <span className="material-badge not-found">{materialId}</span>;
  }

  // Bestimme die Textfarbe basierend auf der Hintergrundfarbe
  // Konvertiere Farbwerte in Kleinbuchstaben für den Vergleich
  const bgColor = material.material_farbe.toLowerCase();
  const isLightBackground = ['gelb', 'weiß', 'weiss', 'farblos', 'orange'].includes(bgColor);
  const textColorClass = isLightBackground ? 'dark-text' : 'light-text';

  // Bestimme den anzuzeigenden Text
  let displayText = getMaterialBezeichnung(materialId);
  if (showKurzbezeichnung) {
    const kurzbezeichnung = getMaterialKurzbezeichnung(materialId);
    displayText = `${displayText} (${kurzbezeichnung})`;
  }

  return (
    <span 
      className={`material-badge ${textColorClass} ${mini ? 'mini' : ''}`}
      style={{ 
        backgroundColor: getColorCode(bgColor),
        borderColor: getDarkerShade(getColorCode(bgColor))
      }}
    >
      {displayText}
    </span>
  );
};

/**
 * Konvertiert Farbnamen in HEX-Farbcodes
 * @param {string} colorName - Name der Farbe
 * @returns {string} HEX-Farbcode
 */
function getColorCode(colorName) {
  const colorMap = {
    'rot': '#ef5350',      // Kräftiges Rot
    'braun': '#8d6e63',    // Kräftiges Braun
    'gelb': '#ffee58',     // Kräftiges Gelb
    'grün': '#66bb6a',     // Kräftiges Grün
    'gruen': '#66bb6a',    // Kräftiges Grün (alternative Schreibweise)
    'blau': '#42a5f5',     // Kräftiges Blau
    'lila': '#ab47bc',     // Kräftiges Lila
    'orange': '#ffa726',   // Kräftiges Orange
    'weiß': '#e0e0e0',     // Hellgrau statt Weiß für bessere Sichtbarkeit
    'weiss': '#e0e0e0',    // Hellgrau statt Weiß (alternative Schreibweise)
    'farblos': '#e0e0e0',  // Hellgrau statt Farblos
    'grau': '#9e9e9e',     // Mittelgrau
    'grünlich': '#9ccc65', // Kräftiges Grünlich
    'gruenlich': '#9ccc65', // Kräftiges Grünlich (alternative Schreibweise)
    'variabel': '#78909c'  // Bläuliches Grau für 'variabel'
  };
  
  return colorMap[colorName.toLowerCase()] || '#e0e0e0'; // Fallback zu Grau
}

/**
 * Erzeugt einen dunkleren Schatten der übergebenen Farbe
 * @param {string} hexColor - HEX-Farbcode
 * @returns {string} Dunklerer HEX-Farbcode
 */
function getDarkerShade(hexColor) {
  // Konvertiere Hex zu RGB
  let r = parseInt(hexColor.slice(1, 3), 16);
  let g = parseInt(hexColor.slice(3, 5), 16);
  let b = parseInt(hexColor.slice(5, 7), 16);
  
  // Verdunkle um 20%
  r = Math.floor(r * 0.8);
  g = Math.floor(g * 0.8);
  b = Math.floor(b * 0.8);
  
  // Konvertiere zurück zu Hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Named export
export { MaterialBadge };

// Default export
export default MaterialBadge;
