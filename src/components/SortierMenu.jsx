import React from 'react';
import './SortierMenu.css';
import * as MaterialDesign from "react-icons/md";

function SortierMenu({ sortOption, setSortOption, sortDirection, setSortDirection }) {
  return (
    <div className="sortier-menu">
      <div className="sortier-optionen">
        <label className={`sortier-option ${sortOption === 'id' ? 'active' : ''}`}>
          <input 
            type="radio" 
            name="sortOption" 
            value="id" 
            checked={sortOption === 'id'} 
            onChange={() => setSortOption('id')}
          />
          <span className="sortier-label">Test-ID</span>
        </label>
        <label className={`sortier-option ${sortOption === 'name' ? 'active' : ''}`}>
          <input 
            type="radio" 
            name="sortOption" 
            value="name" 
            checked={sortOption === 'name'} 
            onChange={() => setSortOption('name')}
          />
          <span className="sortier-label">Name</span>
        </label>
        <label className={`sortier-option ${sortOption === 'kategorie' ? 'active' : ''}`}>
          <input 
            type="radio" 
            name="sortOption" 
            value="kategorie" 
            checked={sortOption === 'kategorie'} 
            onChange={() => setSortOption('kategorie')}
          />
          <span className="sortier-label">Kategorie</span>
        </label>
        <label className={`sortier-option ${sortOption === 'material' ? 'active' : ''}`}>
          <input 
            type="radio" 
            name="sortOption" 
            value="material" 
            checked={sortOption === 'material'} 
            onChange={() => setSortOption('material')}
          />
          <span className="sortier-label">Material</span>
        </label>
      </div>      <div className="sortier-richtung">
        <button 
          className="sortier-btn active"
          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          aria-label={sortDirection === 'asc' ? "Aufsteigend sortiert (klicken für absteigend)" : "Absteigend sortiert (klicken für aufsteigend)"}
          title={sortDirection === 'asc' ? "Aufsteigend sortiert (klicken für absteigend)" : "Absteigend sortiert (klicken für aufsteigend)"}
        >
          {sortDirection === 'asc' ? (
            <>
              <MaterialDesign.MdArrowUpward />
              <span className="sortier-direction-label">A-Z</span>
            </>
          ) : (
            <>
              <MaterialDesign.MdArrowDownward />
              <span className="sortier-direction-label">Z-A</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default SortierMenu;
