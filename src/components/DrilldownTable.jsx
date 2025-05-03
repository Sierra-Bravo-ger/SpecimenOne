import React, { useState, useEffect } from 'react';
import * as MaterialDesign from "react-icons/md";

/**
 * DrilldownTable - Eine interaktive Tabelle mit aufklappbaren Zeilen
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.data - Die Daten für die Tabelle als Array von Objekten
 * @param {Array} props.columns - Die Spalten-Konfiguration: [{id: 'name', label: 'Name', width: '30%'}, ...]
 * @param {string} props.groupBy - Das Feld, nach dem gruppiert werden soll
 * @param {function} props.onRowClick - Callback für Zeilenklick (optional)
 * @param {function} props.renderDetail - Funktion zum Rendern des erweiterten Inhalts (optional)
 */
function DrilldownTable({ 
  data = [], 
  columns = [], 
  groupBy,
  onRowClick,
  renderDetail 
}) {  // Farbdefinitionen für verschiedene Kategorien
  const categoryColors = {
    // Hämatologie Gruppe
    'hämatologie': { bg: '#f44336', bgOpacity: 'rgba(244, 67, 54, 0.05)', text: 'white' },
    'hämatologie-immunzytometrie': { bg: '#d45252', bgOpacity: 'rgba(212, 82, 82, 0.05)', text: 'white' },
    'hämatologie-sonder': { bg: '#e15959', bgOpacity: 'rgba(225, 89, 89, 0.05)', text: 'white' },
    
    // Chemie Gruppe
    'chemie': { bg: '#795548', bgOpacity: 'rgba(121, 85, 72, 0.05)', text: 'white' },
    'klinische-chemie': { bg: '#795548', bgOpacity: 'rgba(121, 85, 72, 0.05)', text: 'white' },
    'quantitative-urinanalytik': { bg: '#b27a45', bgOpacity: 'rgba(178, 122, 69, 0.05)', text: 'white' },
    'urinstatus': { bg: '#c8894e', bgOpacity: 'rgba(200, 137, 78, 0.05)', text: 'white' },
    'crea-clearence': { bg: '#a57548', bgOpacity: 'rgba(165, 117, 72, 0.05)', text: 'white' },
    'stuhlanalyse': { bg: '#8f6136', bgOpacity: 'rgba(143, 97, 54, 0.05)', text: 'white' },
    'steinanalyse': { bg: '#7a5330', bgOpacity: 'rgba(122, 83, 48, 0.05)', text: 'white' },
    
    // Gerinnung Gruppe
    'gerinnung': { bg: '#4CAF50', bgOpacity: 'rgba(76, 175, 80, 0.05)', text: 'white' },
    'gerinnung-faktoren': { bg: '#56b26a', bgOpacity: 'rgba(86, 178, 106, 0.05)', text: 'white' },
    'gerinnung-thrombophilie': { bg: '#62cc78', bgOpacity: 'rgba(98, 204, 120, 0.05)', text: 'white' },
    'gerinnung-sondertest': { bg: '#41844f', bgOpacity: 'rgba(65, 132, 79, 0.05)', text: 'white' },
    
    // Immunologie Gruppe
    'immunologie': { bg: '#2196F3', bgOpacity: 'rgba(33, 150, 243, 0.05)', text: 'white' },
    'autoantikörper': { bg: '#5681e0', bgOpacity: 'rgba(86, 129, 224, 0.05)', text: 'white' },
    'infektserologie': { bg: '#6291f8', bgOpacity: 'rgba(98, 145, 248, 0.05)', text: 'white' },
    'tumormarker': { bg: '#3d64b3', bgOpacity: 'rgba(61, 100, 179, 0.05)', text: 'white' },
    'allergie': { bg: '#345aa0', bgOpacity: 'rgba(52, 90, 160, 0.05)', text: 'white' },
    
    // Elektrophorese & Proteine
    'elektrophorese': { bg: '#9C27B0', bgOpacity: 'rgba(156, 39, 176, 0.05)', text: 'white' },
    'proteine': { bg: '#9956d4', bgOpacity: 'rgba(153, 86, 212, 0.05)', text: 'white' },
    
    // Ria Gruppe
    'ria': { bg: '#FFC107', bgOpacity: 'rgba(255, 193, 7, 0.05)', text: 'black' },
    'ria-online': { bg: '#d8ab51', bgOpacity: 'rgba(216, 171, 81, 0.05)', text: 'black' },
    
    // Spezialgebiete
    'medikamente': { bg: '#00BCD4', bgOpacity: 'rgba(0, 188, 212, 0.05)', text: 'white' },
    'toxikologie': { bg: '#FF9800', bgOpacity: 'rgba(255, 152, 0, 0.05)', text: 'black' },
    'liquor': { bg: '#45b2e0', bgOpacity: 'rgba(69, 178, 224, 0.05)', text: 'white' },
    'molekulargenetik': { bg: '#9055a2', bgOpacity: 'rgba(144, 85, 162, 0.05)', text: 'white' },
    'blutbank': { bg: '#e74c3c', bgOpacity: 'rgba(231, 76, 60, 0.05)', text: 'white' },
    'transfusionsmedizin': { bg: '#c0392b', bgOpacity: 'rgba(192, 57, 43, 0.05)', text: 'white' },
    'versand': { bg: 'rainbow', bgOpacity: 'rgba(127, 140, 141, 0.05)', text: 'white' },
    'extern': { bg: '#95a5a6', bgOpacity: 'rgba(149, 165, 166, 0.05)', text: 'white' },
    
    // Fallback für unbekannte Kategorien
    'unknown': { bg: '#9E9E9E', bgOpacity: 'rgba(158, 158, 158, 0.05)', text: 'white' }
  };

  const [groupedData, setGroupedData] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedRows, setExpandedRows] = useState({});

  // Daten nach groupBy gruppieren
  useEffect(() => {
    if (!data.length || !groupBy) return;
    
    const groups = data.reduce((acc, item) => {
      const groupValue = item[groupBy] || 'Sonstige';
      if (!acc[groupValue]) {
        acc[groupValue] = [];
      }
      acc[groupValue].push(item);
      return acc;
    }, {});

    // Nach sortierNummer oder ID sortieren, falls vorhanden
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        if (a.sortierNummer !== undefined && b.sortierNummer !== undefined) {
          return a.sortierNummer - b.sortierNummer;
        }
        return a.id.localeCompare(b.id);
      });
    });
    
    setGroupedData(groups);
  }, [data, groupBy]);

  // Gruppe ein-/ausklappen
  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Zeile ein-/ausklappen
  const toggleRow = (rowId) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  // Zeile anklicken
  const handleRowClick = (item) => {
    if (onRowClick) {
      onRowClick(item);
    } else {
      toggleRow(item.id);
    }
  };  // Farbkodierung und Stile für Kategorie bestimmen
  const getCategoryInfo = (category) => {
    if (!category) return { key: 'unknown', colors: categoryColors['unknown'] };
    
    const key = category.toLowerCase().replace(/\s+/g, '-');
    const colors = categoryColors[key] || categoryColors['unknown'];
    
    // Prüfen, ob der Regenbogen-Stil verwendet werden soll
    if (colors.bg === 'rainbow') {
      return { 
        key, 
        colors,
        isRainbow: true 
      };
    }
    
    return { key, colors };
  };
  return (
    <div className="w-full overflow-x-auto mb-8 shadow-md rounded-lg bg-white dark:bg-[var(--md-sys-color-surface,#1C1B1F)]">
      <table className="w-full border-collapse text-[0.95rem]">
        <thead>
          <tr className="bg-[var(--md-sys-color-primary-container,#E8F5E9)] dark:bg-[var(--md-sys-color-surface-variant,#3E3E42)] text-[var(--md-sys-color-on-primary-container,#1B1B1F)] dark:text-[var(--md-sys-color-on-surface-variant,#E6E1E5)]">
            {columns.map(column => (
              <th 
                key={column.id} 
                style={{ width: column.width || 'auto' }}
                className="p-3 text-left border-b border-[var(--md-sys-color-outline-variant,#C4C7C5)] dark:border-[var(--md-sys-color-outline-variant,#49454F)]"
              >
                {column.label}
              </th>
            ))}
            <th style={{ width: '30px' }} className="p-3 border-b border-[var(--md-sys-color-outline-variant,#C4C7C5)] dark:border-[var(--md-sys-color-outline-variant,#49454F)]"></th>{/* Spalte für Expand-Icon */}
          </tr>
        </thead>        <tbody>
          {Object.keys(groupedData).map(groupName => {
            const isGroupExpanded = expandedGroups[groupName];
            const groupItems = groupedData[groupName];
            const categoryInfo = getCategoryInfo(groupName);
            
            return (
              <React.Fragment key={groupName}>
                {/* Gruppenkopf */}                <tr 
                  className={`cursor-pointer bg-[var(--md-sys-color-secondary-container,#E8F5E9)] dark:bg-[var(--md-sys-color-surface-variant,#3E3E42)] transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[var(--md-sys-color-surface-variant,#E7E0EC)] ${categoryInfo.isRainbow ? 'border-l-rainbow' : ''}`}
                  style={{ borderLeft: categoryInfo.isRainbow ? undefined : `4px solid ${categoryInfo.colors.bg}` }}
                  onClick={() => toggleGroup(groupName)}
                >
                  <td colSpan={columns.length + 1} className="p-3">                    <div className="flex items-center justify-between font-medium">
                      <div className="flex-1">{groupName}</div>                      <div 
                        className={`rounded-full py-0.5 px-2 text-xs mr-4 shadow-sm transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-0.5 hover:scale-105 ${categoryInfo.isRainbow ? 'kategorie-versand' : ''}`}
                        style={{ 
                          backgroundColor: categoryInfo.isRainbow ? undefined : categoryInfo.colors.bg,
                          color: categoryInfo.colors.text
                        }}
                      >
                        {groupItems.length}
                      </div><div className="flex items-center justify-center w-8 h-8">
                        {isGroupExpanded ? 
                          <MaterialDesign.MdExpandLess className="text-xl" /> : 
                          <MaterialDesign.MdExpandMore className="text-xl" />
                        }
                      </div>
                    </div>
                  </td>
                </tr>
                  {/* Gruppeninhalte, nur anzeigen wenn expandiert */}
                {isGroupExpanded && groupItems.map((item) => {
                  const isRowExpanded = expandedRows[item.id];
                  const categoryInfo = item.kategorie ? 
                    getCategoryInfo(item.kategorie) : 
                    { colors: { bgOpacity: 'transparent' }};
                  
                  return (
                    <React.Fragment key={item.id}>                      <tr 
                        className={`cursor-pointer transition-colors duration-200 hover:bg-[var(--md-sys-color-surface-variant,#E7E0EC)] ${categoryInfo.isRainbow ? 'rainbow-bg-opacity' : ''}`}
                        style={{ backgroundColor: categoryInfo.isRainbow ? undefined : categoryInfo.colors.bgOpacity }}
                        onClick={() => handleRowClick(item)}
                      >
                        {columns.map(column => (
                          <td 
                            key={`${item.id}-${column.id}`}
                            className="p-3 text-left border-b border-[var(--md-sys-color-outline-variant,#C4C7C5)] dark:border-[var(--md-sys-color-outline-variant,#49454F)] last:border-b-0"
                          >
                            {column.render ? column.render(item) : item[column.id]}
                          </td>
                        ))}
                        <td className="w-10 text-center align-middle border-b border-[var(--md-sys-color-outline-variant,#C4C7C5)] dark:border-[var(--md-sys-color-outline-variant,#49454F)] last:border-b-0">
                          {renderDetail && (
                            <button 
                              className="bg-transparent border-none cursor-pointer flex items-center justify-center text-[var(--md-sys-color-on-surface-variant,#49454F)] text-xl p-1 hover:bg-black/5 hover:rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(item.id);
                              }}
                            >
                              {isRowExpanded ? 
                                <MaterialDesign.MdKeyboardArrowUp /> : 
                                <MaterialDesign.MdKeyboardArrowDown />
                              }
                            </button>
                          )}
                        </td>
                      </tr>
                      {/* Detail-Ansicht */}
                      {isRowExpanded && renderDetail && (
                        <tr className="bg-[var(--md-sys-color-surface-variant,#F5F5F5)] dark:bg-[var(--md-sys-color-surface-variant,#2D2D30)]">
                          <td colSpan={columns.length + 1} className="p-0">
                            <div className="p-4 border-t border-dashed border-[var(--md-sys-color-outline-variant,#C4C7C5)] dark:border-[var(--md-sys-color-outline-variant,#49454F)]">
                              {renderDetail(item)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      
      {Object.keys(groupedData).length === 0 && (
        <div className="p-8 text-center text-[var(--md-sys-color-on-surface-variant,#49454F)]">
          Keine Daten verfügbar
        </div>
      )}
    </div>
  );
}

export default DrilldownTable;
