import React from 'react'
import '@material/web/textfield/outlined-text-field.js'
import * as MaterialDesign from "react-icons/md"
import './Suchleiste.css'

function Suchleiste({ suchbegriff, onSuchbegriffChange }) {
  return (
    <div className="suche-container">
      <md-outlined-text-field
        label="Test, Synonym oder Fachbereich suchen..."
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
  )
}

export default Suchleiste
