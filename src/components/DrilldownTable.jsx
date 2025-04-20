import React, { useState, useEffect } from 'react';
import './DrilldownTable.css';
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
}) {
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
  };

  // Farbkodierung für Kategorie bestimmen
  const getCategoryClass = (category) => {
    if (!category) return '';
    return `category-${category.toLowerCase().replace(/\s+/g, '-')}`;
  };

  return (
    <div className="drilldown-table-container">
      <table className="drilldown-table">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.id} style={{ width: column.width || 'auto' }}>
                {column.label}
              </th>
            ))}
            <th style={{ width: '30px' }}></th> {/* Spalte für Expand-Icon */}
          </tr>
        </thead>
        <tbody>
          {Object.keys(groupedData).map(groupName => {
            const isGroupExpanded = expandedGroups[groupName];
            const groupItems = groupedData[groupName];
            
            return (
              <React.Fragment key={groupName}>
                {/* Gruppenkopf */}
                <tr 
                  className={`group-row ${getCategoryClass(groupName)}`}
                  onClick={() => toggleGroup(groupName)}
                >
                  <td colSpan={columns.length + 1}>
                    <div className="group-header">
                      <div className="group-name">{groupName}</div>
                      <div className="group-count">{groupItems.length}</div>
                      <div className="group-expand-icon">
                        {isGroupExpanded ? 
                          <MaterialDesign.MdExpandLess /> : 
                          <MaterialDesign.MdExpandMore />
                        }
                      </div>
                    </div>
                  </td>
                </tr>
                
                {/* Gruppeninhalte, nur anzeigen wenn expandiert */}
                {isGroupExpanded && groupItems.map((item) => {
                  const isRowExpanded = expandedRows[item.id];
                  
                  return (
                    <React.Fragment key={item.id}>
                      <tr 
                        className="data-row"
                        onClick={() => handleRowClick(item)}
                      >
                        {columns.map(column => (
                          <td key={`${item.id}-${column.id}`}>
                            {column.render ? column.render(item) : item[column.id]}
                          </td>
                        ))}
                        <td className="expand-cell">
                          {renderDetail && (
                            <button 
                              className="expand-button"
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
                        <tr className="detail-row">
                          <td colSpan={columns.length + 1}>
                            <div className="detail-content">
                              {renderDetail(item)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      
      {Object.keys(groupedData).length === 0 && (
        <div className="no-data-message">Keine Daten verfügbar</div>
      )}
    </div>
  );
}

export default DrilldownTable;
