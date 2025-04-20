import React, { useState, useRef, useEffect } from 'react'
import '@material/web/textfield/outlined-text-field.js'
import * as MaterialDesign from "react-icons/md"
import './Suchleiste.css'

function Suchleiste({ suchbegriff, onSuchbegriffChange, selectedKategorie, onKategorieChange }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Liste aller verfügbaren Kategorien
  const kategorien = [
    "Alle",
    "Hämatologie",
    "Klinische Chemie",
    "Gerinnung",
    "Immunologie",
    "Mikrobiologie",
    "Endokrinologie",
    "Virologie",
    "Infektionsdiagnostik"
  ];

  // Schließen des Dropdown-Menüs bei Klick außerhalb
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);  return (
    <div className="suche-container">
      <div className="suche-input-wrapper">        <md-outlined-text-field
          label="Testname, Synonym, Fachbereich, LOINC oder Test-ID suchen..."
          value={suchbegriff}
          onInput={(e) => onSuchbegriffChange(e.target.value)}
          className="suche-input"
        >
          <MaterialDesign.MdSearch slot="leading-icon" style={{fontSize: "24px"}} />
        </md-outlined-text-field>
        {suchbegriff && (
          <button 
            className="suche-clear-button"
            onClick={() => onSuchbegriffChange('')}
            aria-label="Suchbegriff löschen"
          >
            <MaterialDesign.MdClear />
          </button>
        )}
      </div>
      
      <div className="filter-container" ref={dropdownRef}>
        <button 
          className="filter-button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-label="Nach Kategorie filtern"
          aria-expanded={dropdownOpen}
        >
          <MaterialDesign.MdFilterList style={{fontSize: "24px"}} />
          <span className="filter-label">
            {selectedKategorie === "Alle" ? "Filter" : selectedKategorie}
          </span>
        </button>
        
        {dropdownOpen && (
          <div className="filter-dropdown">
            {kategorien.map((kategorie) => (
              <div 
                key={kategorie}
                className={`filter-option ${selectedKategorie === kategorie ? 'selected' : ''}`}
                onClick={() => {
                  onKategorieChange(kategorie);
                  setDropdownOpen(false);
                }}
              >
                {kategorie === selectedKategorie && (
                  <MaterialDesign.MdCheck className="filter-check-icon" />
                )}
                <span className={`filter-text ${kategorie !== "Alle" ? `kategorie-text-${kategorie.toLowerCase().replace(/\s+/g, '-')}` : ""}`}>
                  {kategorie}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Suchleiste
