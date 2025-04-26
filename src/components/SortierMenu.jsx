import React from 'react';
// SortierMenu.css nicht mehr benötigt - CSS-Klassen wurden zu tailwindBtn.js migriert
import * as MaterialDesign from "react-icons/md";
import tailwindBtn from './tailwindBtn';

function SortierMenu({ sortOption, setSortOption, sortDirection, setSortDirection }) {
  // Direkte Verwendung der zentralen Utility-Klassen aus tailwindBtn
  return (
    <div className={`${tailwindBtn.classes.card} p-3`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-sm font-medium ${tailwindBtn.classes.text} flex items-center`}>
          <MaterialDesign.MdSort className="mr-1" /> Sortierung
        </h3>        <div className={tailwindBtn.classes.sortMenu.directionContainer}>          <button 
            className="flex items-center gap-1 py-1 px-2.5 text-sm rounded-md border-none bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-all duration-200 hover:shadow-md"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            aria-label={sortDirection === 'asc' ? "Aufsteigend sortiert (klicken für absteigend)" : "Absteigend sortiert (klicken für aufsteigend)"}
            title={sortDirection === 'asc' ? "Aufsteigend sortiert (klicken für absteigend)" : "Absteigend sortiert (klicken für aufsteigend)"}
          >
            {sortDirection === 'asc' ? (
              <>
                <MaterialDesign.MdArrowUpward />
                <span className={tailwindBtn.classes.sortMenu.directionLabel}>A-Z</span>
              </>
            ) : (
              <>
                <MaterialDesign.MdArrowDownward />
                <span className={tailwindBtn.classes.sortMenu.directionLabel}>Z-A</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* 2x2 Grid für die Sortieroptionen - optimiert für mobile Benutzer */}
      <div className="grid grid-cols-2 gap-2">        <label className={`flex items-center p-2 rounded cursor-pointer ${
          sortOption === 'id' 
            ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]' 
            : `${tailwindBtn.classes.hover} ${tailwindBtn.classes.text}`
        }`}>
          <input 
            type="radio" 
            name="sortOption" 
            value="id" 
            checked={sortOption === 'id'} 
            onChange={() => setSortOption('id')}
            className="sr-only" // versteckt das Standard-Radio, aber erhält Zugänglichkeit
          />
          <span className="flex items-center">
            {sortOption === 'id' && <MaterialDesign.MdRadioButtonChecked className="mr-1" />}
            {sortOption !== 'id' && <MaterialDesign.MdRadioButtonUnchecked className="mr-1" />}
            Test-ID
          </span>
        </label>        <label className={`flex items-center p-2 rounded cursor-pointer ${
          sortOption === 'name' 
            ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]' 
            : `${tailwindBtn.classes.hover} ${tailwindBtn.classes.text}`
        }`}>
          <input 
            type="radio" 
            name="sortOption" 
            value="name" 
            checked={sortOption === 'name'} 
            onChange={() => setSortOption('name')}
            className="sr-only"
          />
          <span className="flex items-center">
            {sortOption === 'name' && <MaterialDesign.MdRadioButtonChecked className="mr-1" />}
            {sortOption !== 'name' && <MaterialDesign.MdRadioButtonUnchecked className="mr-1" />}
            Name
          </span>
        </label>        <label className={`flex items-center p-2 rounded cursor-pointer ${
          sortOption === 'kategorie' 
            ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]' 
            : `${tailwindBtn.classes.hover} ${tailwindBtn.classes.text}`
        }`}>
          <input 
            type="radio" 
            name="sortOption" 
            value="kategorie" 
            checked={sortOption === 'kategorie'} 
            onChange={() => setSortOption('kategorie')}
            className="sr-only"
          />
          <span className="flex items-center">
            {sortOption === 'kategorie' && <MaterialDesign.MdRadioButtonChecked className="mr-1" />}
            {sortOption !== 'kategorie' && <MaterialDesign.MdRadioButtonUnchecked className="mr-1" />}
            Kategorie
          </span>
        </label>
          <label className={`flex items-center p-2 rounded cursor-pointer ${
          sortOption === 'material' 
            ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]' 
            : `${tailwindBtn.classes.hover} ${tailwindBtn.classes.text}`
        }`}>
          <input 
            type="radio" 
            name="sortOption" 
            value="material" 
            checked={sortOption === 'material'} 
            onChange={() => setSortOption('material')}
            className="sr-only"
          />
          <span className="flex items-center">
            {sortOption === 'material' && <MaterialDesign.MdRadioButtonChecked className="mr-1" />}
            {sortOption !== 'material' && <MaterialDesign.MdRadioButtonUnchecked className="mr-1" />}
            Material
          </span>
        </label>
      </div>
    </div>
  );
}

export default SortierMenu;
