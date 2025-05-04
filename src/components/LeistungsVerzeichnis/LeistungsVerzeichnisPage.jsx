import { useState, useEffect } from 'react';
import useLeistungsverzeichnis from '../../hooks/useLeistungsverzeichnis';

/**
 * Hauptkomponente für das Leistungsverzeichnis
 */
export default function LeistungsVerzeichnisPage() {
  const {
    tests,
    testsLoading,
    testsError,
    pagination,
    goToPage,
    updateSearch,
    searchQuery,
    formatMaterial,
    formatEinheit,
    loadTestDetails
  } = useLeistungsverzeichnis();
  
  const [selectedTest, setSelectedTest] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Testdetails laden, wenn ein Test ausgewählt wird
  const handleSelectTest = async (testId) => {
    setLoadingDetails(true);
    try {
      const test = await loadTestDetails(testId);
      setSelectedTest(test);
    } catch (error) {
      console.error('Fehler beim Laden der Testdetails:', error);
    } finally {
      setLoadingDetails(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Leistungsverzeichnis</h1>
      
      {/* Suchfeld */}
      <div className="mb-8">
        <div className="flex">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => updateSearch(e.target.value)}
            placeholder="Suche nach Tests..."
            className="flex-grow p-3 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            className="bg-blue-500 text-white px-6 py-3 rounded-r hover:bg-blue-600 transition"
            onClick={() => updateSearch(searchQuery)}
          >
            Suchen
          </button>
        </div>
      </div>
      
      {/* Fehlermeldung */}
      {testsError && (
        <div className="bg-red-100 text-red-700 p-4 mb-6 rounded">
          Fehler: {testsError}
        </div>
      )}
      
      {/* Loading-Zustand */}
      {testsLoading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Testergebnisse */}
      {!testsLoading && tests.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Keine Tests gefunden.
        </div>
      )}
      
      {/* Testliste */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map(test => (
          <div 
            key={test.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
            onClick={() => handleSelectTest(test.id)}
          >
            <h3 className="font-bold text-lg">{test.name}</h3>
            <div className="text-gray-600 text-sm mb-2">{test.id}</div>
            
            <div className="mt-2 flex flex-wrap gap-1">
              {test.material && test.material.map(matId => (
                <span 
                  key={matId}
                  className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                >
                  {formatMaterial(matId)}
                </span>
              ))}
            </div>
            
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-gray-600">{test.kategorie}</span>
              <span>{formatEinheit(test.einheit_id)}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Paginierung */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border rounded mr-2 disabled:opacity-50"
            >
              Zurück
            </button>
            
            <span className="text-gray-600">
              Seite {pagination.page} von {pagination.totalPages}
            </span>
            
            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border rounded ml-2 disabled:opacity-50"
            >
              Weiter
            </button>
          </nav>
        </div>
      )}
      
      {/* Test-Details Modal */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between">
                <h2 className="text-2xl font-bold">{selectedTest.name}</h2>
                <button onClick={() => setSelectedTest(null)} className="text-gray-500 hover:text-gray-700">
                  &times;
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h3 className="font-semibold text-gray-700">ID</h3>
                  <p>{selectedTest.id}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Kategorie</h3>
                  <p>{selectedTest.kategorie}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Material</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedTest.material && selectedTest.material.map(matId => (
                      <span key={matId} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {formatMaterial(matId)}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Synonyme</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedTest.synonyme && selectedTest.synonyme.map(syn => (
                      <span key={syn} className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Einheit</h3>
                  <p>{formatEinheit(selectedTest.einheit_id)}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Befundzeit</h3>
                  <p>{selectedTest.befundzeit}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Durchführung</h3>
                  <p>{selectedTest.durchfuehrung}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Lagerung</h3>
                  <p>{selectedTest.lagerung}</p>
                </div>
              </div>
              
              {/* Referenzwerte */}
              {selectedTest.referenzwerte && selectedTest.referenzwerte.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-3">Referenzwerte</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 border">Geschlecht</th>
                          <th className="p-2 border">Alter</th>
                          <th className="p-2 border">Untere Grenze</th>
                          <th className="p-2 border">Obere Grenze</th>
                          <th className="p-2 border">Anzeige</th>
                          <th className="p-2 border">Besonderheit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTest.referenzwerte.map((ref, idx) => {
                          // Geschlecht formatieren
                          let geschlecht = "Alle";
                          if (ref.geschlecht === "1000") geschlecht = "Männlich";
                          if (ref.geschlecht === "2000") geschlecht = "Weiblich";
                          
                          // Altersbereich formatieren
                          const alterBereich = ref.alter_von !== null && ref.alter_bis !== null
                            ? `${ref.alter_von} - ${ref.alter_bis === 999 ? "∞" : ref.alter_bis}`
                            : "-";
                            
                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="p-2 border">{geschlecht}</td>
                              <td className="p-2 border">{alterBereich}</td>
                              <td className="p-2 border">{ref.wert_untere_grenze || "-"}</td>
                              <td className="p-2 border">{ref.wert_obere_grenze || "-"}</td>
                              <td className="p-2 border">{ref.anzeige_label || "-"}</td>
                              <td className="p-2 border">{ref.besondere_bedingung || "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
