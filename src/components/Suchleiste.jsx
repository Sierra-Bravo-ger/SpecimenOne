import React, { useState, useRef, useEffect } from 'react'

import '@material/web/textfield/outlined-text-field.js'
import * as MaterialDesign from "react-icons/md"
// Suchleiste.css nicht mehr benötigt - CSS-Klassen wurden zu tailwindBtn.js migriert
import tailwindBtn from './tailwindBtn.js' // Importiere die Tailwind-Button-Bibliothek

function Suchleiste({ suchbegriff, onSuchbegriffChange, selectedKategorie, onKategorieChange }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  // Liste aller verfügbaren Kategorien  
  const kategorien = [
  "Alle",
  "Allergie",
//    "Blutbank",
//    "Chemie",
//    "Crea-Clearence",
  "Elektrophorese",
//  "Endokrinologie",
//  "Extern",
  "Gerinnung",
//    "Gerinnung Faktoren",
//    "Gerinnung Sondertest",
//    "Gerinnung Thrombophilie",
  "Hämatologie",
//   "Hämatologie Immunzytometrie",
//      "Hämatologie Sonder",
  "Immunologie",
  "Infektserologie",
  "Klinische Chemie",
//  "Liquor",
//  "Medikamente",
//  "Molekulargenetik",
//  "Proteine",
//  "Quantitative Urinanalytik",
//  "Ria",
//  "Ria Online",
//  "Steinanalyse",
//  "Stuhlanalyse",
  "Toxikologie",
//  "TDM",
//  "Transfusionsmedizin",
//  "Tumormarker",
  "Urinstatus",
  "Versand"
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
    };  }, []);  return (
    <div className={tailwindBtn.classes.search.container}>      <div className={tailwindBtn.classes.search.inputWrapper}>        <md-outlined-text-field
          label="Testname, Synonym, Materialname, Fachbereich, LOINC oder Test-ID suchen..."
          value={suchbegriff}
          onInput={(e) => onSuchbegriffChange(e.target.value)}
          className="w-full bg-transparent"
          id="search-input-field"
          inputmode=""
          type="text"
          autocomplete=""
        >
          <MaterialDesign.MdSearch slot="leading-icon" style={{fontSize: "24px"}} />
        </md-outlined-text-field>{suchbegriff && (
          <button 
            className={tailwindBtn.classes.search.clearButton}
            onClick={() => onSuchbegriffChange('')}
            aria-label="Suchbegriff löschen"
          >
            <MaterialDesign.MdClear />
          </button>
        )}
      </div>        <div className={tailwindBtn.classes.search.filterContainer} ref={dropdownRef}>
          <button 
            className={tailwindBtn.classes.search.filterButton}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="Nach Kategorie filtern"
            aria-expanded={dropdownOpen}
          >
            <MaterialDesign.MdFilterList className={tailwindBtn.classes.search.filterIcon} />
            <span className={tailwindBtn.classes.search.filterLabel}>
              {selectedKategorie === "Alle" ? "Filter" : selectedKategorie}
            </span>
          </button>{dropdownOpen && (
          <div className={tailwindBtn.classes.search.dropdownMenu}>
            {kategorien.map((kategorie) => (
              <div 
                key={kategorie}
                className={`${tailwindBtn.classes.search.dropdownMenuItem} 
                  ${selectedKategorie === kategorie 
                    ? tailwindBtn.classes.search.dropdownMenuItemActive
                    : tailwindBtn.classes.search.dropdownMenuItemInactive}`}
                onClick={() => {
                  onKategorieChange(kategorie);
                  setDropdownOpen(false);
                }}
              >
                {kategorie === selectedKategorie && (
                  <MaterialDesign.MdCheck className={tailwindBtn.classes.search.dropdownCheckIcon} />
                )}
                <span className={`${kategorie !== "Alle" ? `kategorie-text-${kategorie.toLowerCase().replace(/\s+/g, '-')}` : ""}`}>
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
