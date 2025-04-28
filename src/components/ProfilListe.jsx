import React, { useState } from 'react';
import TestDetails from './TestDetails';
import * as MaterialDesign from "react-icons/md";
import '@material/web/ripple/ripple.js';
import '@material/web/elevation/elevation.js';
import { useMaterialService } from '../services/MaterialService';
import StandardProfileListe from './StandardProfileListe';
import PersoenlicheProfileListe from './PersoenlicheProfileListe';
import tailwindBtn from './tailwindBtn';

// Hauptkomponente für die Profil-Ansicht mit Sub-Tab Navigation
function ProfilListe({ tests, profile }) {
  const [expandedProfiles, setExpandedProfiles] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('standard');
  const { isLoading: materialsLoading } = useMaterialService();

  const handleTestClick = (test) => {
    setSelectedTest(test);
  };

  const handleCloseDetails = () => {
    setSelectedTest(null);
  };
  
  return (
    <div className={tailwindBtn.classes.profileList?.container || "w-full"}>
      {/* Sub-Tab Navigation für Profile */}
      <div className={tailwindBtn.classes.tabContainer || "flex border-b border-gray-200 dark:border-gray-700 mb-4"}>
        <button 
          className={`${tailwindBtn.classes.tab || "px-4 py-2 font-medium text-sm text-gray-500"} ${activeSubTab === 'standard' ? (tailwindBtn.classes.activeTab || "text-primary-600 border-b-2 border-primary-600") : ''}`}
          onClick={() => setActiveSubTab('standard')}>
          Standard-Profile
        </button>
        <button 
          className={`${tailwindBtn.classes.tab || "px-4 py-2 font-medium text-sm text-gray-500"} ${activeSubTab === 'persoenlich' ? (tailwindBtn.classes.activeTab || "text-primary-600 border-b-2 border-primary-600") : ''}`}
          onClick={() => setActiveSubTab('persoenlich')}>
          Persönliche Profile
        </button>
      </div>
      
      {/* Bedingt zu rendernder Inhalt basierend auf aktivem Tab */}
      {activeSubTab === 'standard' ? (
        <StandardProfileListe 
          tests={tests} 
          profile={profile}
          expandedProfiles={expandedProfiles}
          setExpandedProfiles={setExpandedProfiles}
          onTestClick={handleTestClick}
        />
      ) : (
        <PersoenlicheProfileListe />
      )}

      {/* Test-Details Dialog */}
      {selectedTest && (
        <TestDetails 
          test={selectedTest} 
          onClose={handleCloseDetails} 
        />
      )}
    </div>
  );
}

// Default export für die Komponente
export default ProfilListe;
