/**
 * Tailwind Button Komponenten für SpecimenOne
 * ==========================================
 * 
 * Diese Datei definiert eine umfassende Sammlung von Tailwind-Button-Klassen für verschiedene UI-Situationen.
 * Statt CSS-Klassen zu verwenden, können diese Tailwind-Klassen direkt in den JSX-Komponenten angewendet werden.
 * 
 * @version 1.1.0
 * @created 2025-04-25
 * @updated 2025-04-26
 */

/**
 * Gemeinsame Farbdefinitionen (DRY-Prinzip)
 * ---------------------------------------
 * Zentrale Definition aller in der Anwendung verwendeten Farben
 */
const colors = {
  light: {
    background: '#f5f5f5',    
    surface: '#ffffff',    
    hover: '#f5f5f5',  
  },
  dark: {
    background: '#1C1B1F',    
    surface: '#242328',    
    hover: '#1C1B1F',  
  },
  // Rahmenfarben
  border: {
    light: 'border-gray-200',    // Rahmenfarbe im Light Mode
    dark: 'dark:border-gray-700' // Rahmenfarbe im Dark Mode
  },
  // Textfarben
  text: {
    light: 'text-gray-700',      // Standard-Textfarbe im Light Mode
    dark: 'dark:text-gray-300'   // Standard-Textfarbe im Dark Mode
  }
};

/**
 * Utility-Funktionen für häufig verwendete Tailwind-Kombinationen
 * --------------------------------------------------------------
 * Diese Funktionen helfen, DRY-Prinzip über die gesamte Anwendung einzuhalten
 */

// Hintergrundklassen für Container und Karten
const containerBg = 'bg-[#f5f5f5] dark:bg-[#1C1B1F]';
const cardBg = 'bg-[#ffffff] dark:bg-[#242328]';
const containerBgElevated = 'bg-gray-50 dark:bg-gray-850 dark-theme:bg-gray-850'; // Höher liegende Container mit beiden Dark-Mode-Selektoren
const borderClasses = `${colors.border.light} ${colors.border.dark}`;
const textClasses = `${colors.text.light} ${colors.text.dark}`;

// Fertige Klassen für typische UI-Elemente
const classes = {
  // Containerhintergrund (für größere Bereiche)
  containerBg: 'bg-[#f5f5f5] dark:bg-[#1C1B1F]',
    // Erhöhter Containerhintergrund (für UI-Elemente, die sich vom Hintergrund abheben sollen)
  containerBgElevated: 'bg-gray-50 dark:bg-gray-850 dark-theme:bg-[#1a1a1e]',
  
  // Kartenhintergrund (für UI-Elemente im Vordergrund)
  cardBg: 'bg-[#ffffff] dark:bg-[#242328]',
  
  // Standardborder
  border: `border ${colors.border.light} ${colors.border.dark}`,
  
  // Standardtext
  text: textClasses,
  
  // Hover-Effekt
  hover: 'hover:bg-[#f5f5f5] dark:hover:bg-[#1C1B1F]',
  
  // Kombinierte Klassen für typische Anwendungsfälle
  card: 'bg-[#ffffff] dark:bg-[#242328] border border-gray-200 dark:border-gray-700 rounded-md shadow-sm',
  
  // Textfarben für verschiedene Zustände
  text: 'text-gray-700 dark:text-gray-300',
  textMuted: 'text-gray-500 dark:text-gray-400',
  headingSecondary: 'font-medium text-lg text-gray-700 dark:text-gray-300 mb-2',
  
  // Zustände für UI-Elemente
  active: 'bg-[var(--md-sys-color-surface-variant)]',
  hoverEffect: 'hover:bg-[var(--md-sys-color-surface-variant)] hover:bg-opacity-50',
  
  // Material Design Button Stile
  mdButton: 'primary',
  
  // Card-spezifische Klassen
  cardBg: 'bg-white dark:bg-[#242328]',
  
  // Badge-spezifische Klassen für TestDetails
  badge: {
    materialRow: 'flex items-start mb-3',
    materialRowText: 'm-0 mr-3',
    badgesContainer: 'flex flex-wrap gap-1.5 mt-0.5',
    noMaterialInfo: 'italic text-gray-500 dark:text-gray-400 opacity-70'
  },    // Suchleiste-spezifische Klassen
  search: {
    // Container für die gesamte Suchleiste
    container: 'flex items-center w-full gap-2 mb-4',
    
    // Wrapper für das Textfeld
    inputWrapper: 'relative flex-1 mr-2 w-full',
    
    // Clear-Button im Textfeld
    clearButton: 'absolute right-3 top-1/2 transform -translate-y-1/2 bg-transparent border-none cursor-pointer ' + 
                'text-[var(--md-sys-color-on-surface-variant)] dark:text-[var(--md-sys-color-on-surface-variant,#CAC4D0)] ' +
                'p-2 rounded-full ' +
                'hover:bg-[var(--md-sys-color-surface-variant)] dark:hover:bg-[rgba(255,255,255,0.1)]',
    
    // Container für den Filter-Button und Dropdown
    filterContainer: 'relative',
    
    // Filter-Button mit Dark Mode Unterstützung
    filterButton: 'flex items-center gap-2 py-2.5 px-4 h-12 ' +
                 'bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] ' +
                 'dark:bg-[rgba(255,255,255,0.08)] dark:text-[var(--md-sys-color-on-surface-variant,#CAC4D0)] ' +
                 'border border-[var(--md-sys-color-outline)] dark:border-[var(--md-sys-color-outline,#938F99)] ' +
                 'rounded-3xl cursor-pointer transition-all duration-200 ' +
                 'shadow-sm dark:shadow-md ' +
                 'hover:transform hover:-translate-y-0.5 hover:shadow-md ' +
                 'dark:hover:bg-[rgba(255,255,255,0.12)] dark:hover:shadow-lg',
    
    // Icon im Filter-Button
    filterIcon: 'text-2xl',
    
    // Text im Filter-Button
    filterLabel: 'text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis relative z-1',
    
    // Dropdown-Menü-Container
    dropdownMenu: 'absolute top-full left-0 z-50 mt-1 w-56 py-2 ' +
                 'bg-[var(--md-sys-color-surface)] dark:bg-[var(--md-sys-color-surface,#1C1B1F)] ' +
                 'rounded-lg shadow-lg dark:shadow-xl ' +
                 'border border-[var(--md-sys-color-outline-variant)] dark:border-[var(--md-sys-color-outline-variant,#49454F)] ' +
                 'overflow-hidden animate-dropdown-fade-in',
    
    // Basisstil für Dropdown-Menüpunkte
    dropdownMenuItem: 'flex items-center w-full px-4 py-2.5 cursor-pointer transition-colors duration-150',
    
    // Aktiver Menüpunkt im Dropdown
    dropdownMenuItemActive: 'bg-[var(--md-sys-color-primary-container)] dark:bg-[var(--md-sys-color-primary-container,#1e4d2b)] ' +
                           'text-[var(--md-sys-color-on-primary-container)] dark:text-[var(--md-sys-color-on-primary-container,#8fd69b)] ' +
                           'font-medium',
    
    // Inaktiver Menüpunkt im Dropdown
    dropdownMenuItemInactive: 'hover:bg-[var(--md-sys-color-surface-variant)] dark:hover:bg-[rgba(255,255,255,0.05)] ' +
                             'text-[var(--md-sys-color-on-surface)] dark:text-[var(--md-sys-color-on-surface,#E6E1E5)]',
    
    // Check-Icon in ausgewählten Dropdown-Menüpunkten
    dropdownCheckIcon: 'mr-2 text-[var(--md-sys-color-primary)] dark:text-[var(--md-sys-color-primary,#83d991)]'
  },
  
  // SortierMenu-spezifische Klassen
  sortMenu: {
    container: 'flex items-center bg-[var(--md-sys-color-surface-container)] rounded-lg p-2 shadow-md mb-3 flex-wrap gap-3',
    options: 'flex flex-wrap gap-3 flex-1',
    option: 'flex items-center cursor-pointer text-sm py-1.5 px-2.5 rounded-2xl transition-colors duration-200',
    optionHover: 'hover:bg-[var(--md-sys-color-surface-variant)]',
    optionActive: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-medium',
    directionContainer: 'flex gap-1 relative',
    directionButton: 'bg-transparent border-none rounded-2xl min-w-8 h-8 py-0 px-2.5 flex items-center justify-center gap-1 cursor-pointer transition-colors duration-200 text-[var(--md-sys-color-on-surface-variant)]',
    directionButtonHover: 'hover:bg-[var(--md-sys-color-surface-variant)]',
    directionButtonActive: 'text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]',
    directionLabel: 'text-xs font-medium'
  },
  
  // Timeline-spezifische Klassen für TimelineView
  timeline: {
    container: 'w-full p-4 bg-[var(--md-sys-color-surface-container)] rounded-xl mb-6',
    title: 'text-[var(--md-sys-color-on-surface)] text-xl font-medium mb-4',
    header: 'flex flex-col mb-4',
    filters: 'flex flex-wrap items-center gap-4 mb-2',
    tabNavigation: 'flex mb-6 border-b border-[var(--md-sys-color-outline)]',
    tabButton: 'flex items-center gap-2 py-3 px-6 bg-transparent text-[var(--md-sys-color-on-surface-variant)] border-0 border-b-3 border-b-transparent rounded-none text-base transition-all duration-200 cursor-pointer',
    tabButtonActive: 'text-[var(--md-sys-color-primary)] border-b-3 border-b-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)]',
    tabButtonHover: 'hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]',
    filterGroup: 'flex items-center gap-2',
    filterBtnsContainer: 'flex justify-center w-full',
    filterBtns: 'flex gap-2',
    dropdownContainer: 'relative inline-block',
    kategSelect: 'p-2 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]',
    dropdownMenu: 'absolute top-full left-0 z-50 mt-1 w-56 py-2 bg-[var(--md-sys-color-surface)] rounded-lg shadow-lg border border-[var(--md-sys-color-outline-variant)] overflow-hidden animate-dropdown-fade-in',
    dropdownMenuItem: 'flex items-center w-full py-2.5 px-4 text-left border-0 bg-transparent text-[var(--md-sys-color-on-surface)] cursor-pointer text-sm relative transition-colors duration-150 overflow-hidden',
    dropdownMenuItemHover: 'hover:bg-[var(--md-sys-color-surface-container-highest)] hover:text-[var(--md-sys-color-primary)]',
    dropdownMenuItemActive: 'active:bg-[var(--md-sys-color-surface-container-high)]',
    dropdownMenuItemSelected: 'text-[var(--md-sys-color-primary)] font-medium bg-[rgba(var(--md-sys-color-primary-rgb),0.08)]',
    treemapContainer: 'p-4 bg-[var(--md-sys-color-surface-container)] rounded-lg mb-6',
    treemapTitle: 'text-[var(--md-sys-color-on-surface)] text-lg font-medium mb-4',
    treemapVisualization: 'rounded-lg overflow-hidden',
    chartContainer: 'h-[500px] w-full relative mt-4 bg-[var(--md-sys-color-surface)] rounded-lg overflow-hidden',
    profileSection: 'mb-8 pb-6 border-b border-[var(--md-sys-color-outline-variant)]',
    profileSectionLast: 'border-b-0 pb-0',
    profileName: 'text-[var(--md-sys-color-on-surface)] text-lg font-medium mb-2',
    profileDuration: 'text-[var(--md-sys-color-on-surface-variant)] text-sm mb-4',
    tooltip: 'rounded-lg p-3.5 bg-white/85 dark:bg-[#333333]/85 backdrop-blur-md shadow-lg border border-black/5 dark:border-white/10 font-medium text-gray-800 dark:text-white',
    treemapTooltip: 'p-2',
    treemapTooltipTests: 'mt-2',
    treemapTooltipList: 'm-1 ml-4 pl-0',
    treemapTooltipItem: 'text-sm',
    loading: 'flex flex-col items-center justify-center min-h-[200px] p-8 text-center',
    error: 'flex flex-col items-center justify-center min-h-[200px] p-8 text-center',
    empty: 'flex flex-col items-center justify-center min-h-[200px] p-8 text-center',
    errorIcon: 'text-5xl text-[var(--md-sys-color-error)] mb-4',
    emptyIcon: 'text-5xl text-[var(--md-sys-color-on-surface-variant)] mb-4',
    paginationWrapper: 'flex flex-col items-center mt-4 mb-6',
    paginationControls: 'flex justify-center gap-4 mb-2',
    paginationButton: 'flex items-center gap-1 py-2 px-3 border-0 rounded bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] cursor-pointer transition-opacity duration-200',
    paginationButtonHover: 'hover:opacity-90',
    paginationButtonDisabled: 'opacity-50 cursor-not-allowed',
    paginationInfo: 'text-sm text-[var(--md-sys-color-on-surface-variant)]'
  },
  
  checkbox: {
    container: 'relative inline-block z-10 cursor-pointer',
    input: 'sr-only',
    label: `flex items-center justify-center w-5 h-5 rounded-md cursor-pointer transition-all duration-150`,
    unchecked: 'bg-white dark:bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] dark:border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-variant)]',
    checked: 'bg-[var(--md-sys-color-primary)] dark:bg-[var(--md-sys-color-primary)] text-white shadow-sm'
  },
    profileList: {
    container: 'mt-4',
    card: 'bg-white dark:bg-[#242328] rounded-xl mb-4 overflow-hidden relative',
    header: 'p-5 cursor-pointer flex justify-between items-center relative overflow-hidden hover:bg-[#f5f5f5] dark:hover:bg-[#1C1B1F]',
    info: 'flex-1',
    titleRow: 'flex justify-between items-start',
    title: 'm-0 text-[var(--md-sys-color-on-surface,#1C1B1F)] dark:text-[var(--md-sys-color-on-surface,#E6E1E5)] text-lg mb-1 flex-1',
    description: 'm-0 text-[var(--md-sys-color-on-surface-variant,#49454F)] text-sm',
    category: 'inline-block bg-[var(--md-sys-color-primary-container,#d0f9e3)] text-[var(--md-sys-color-on-primary-container,#003921)] text-xs py-0.5 px-2.5 rounded-full mt-2',
    expandIcon: 'text-[var(--md-sys-color-on-surface-variant,#49454F)] flex items-center p-2',
    tests: 'px-5 pb-5 border-t border-[var(--md-sys-color-surface-variant,#E7E0EC)]',
    testsHeader: 'font-medium mt-4 mb-3 text-[var(--md-sys-color-on-surface,#1C1B1F)]',
    testsGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
    testItem: 'bg-[var(--md-sys-color-surface-variant,#E7E0EC)] p-4 rounded-lg cursor-pointer relative overflow-hidden transition-transform duration-200 hover:-translate-y-0.5',
    testName: 'font-medium mb-1 text-[var(--md-sys-color-on-surface-variant,#49454F)]',
    testDetail: 'text-sm text-[var(--md-sys-color-on-surface-variant,#49454F)]',
    materialBadgesContainer: 'flex flex-wrap mt-1 gap-1',
    noMaterialInfo: 'italic opacity-70',
    testSynonyms: 'mt-2 text-[var(--md-sys-color-outline,#79747E)] text-xs',
    noProfilesMessage: 'text-center py-8 text-[var(--md-sys-color-on-surface-variant,#49454F)]',
    noTestsMessage: 'text-center py-5 text-[var(--md-sys-color-on-surface-variant,#49454F)]'
  },
  
  // Tab-Navigation für die Profilanzeige
  tabContainer: "flex border-b border-gray-200 dark:border-gray-700 mb-4",
  tab: "px-4 py-2 font-medium text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors",
  activeTab: "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400",
  
  // Tab-Navigation für Sub-Tabs
  tabContainer: "flex border-b border-gray-200 dark:border-gray-700 mb-4",
  tab: "px-4 py-2 font-medium text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors",
  activeTab: "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400",
  
  // Karten-Layout für Profile
  cardHeader: "flex justify-between items-center mb-2",
  cardTitle: "text-lg font-medium text-gray-900 dark:text-white",
  cardBadge: "bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs font-medium px-2 py-1 rounded-full",
  cardDescription: "text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2",
  cardDate: "text-xs text-gray-400 dark:text-gray-500 mb-3",
  cardTags: "flex flex-wrap gap-1 mb-3",
  cardTag: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs px-2 py-1 rounded",
  cardTagMore: "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded italic",
  cardActions: "flex justify-end gap-2",
  
  // Leerer Zustand
  emptyState: "flex flex-col items-center justify-center py-12",
  emptyStateHeading: "text-lg font-medium text-gray-900 dark:text-white mb-2",
  emptyStateText: "text-gray-500 dark:text-gray-400 text-center max-w-md",
  
  // Modals
  modalBackdrop: "fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50",
  modal: "bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-auto",
  modalHeader: "flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700",
  modalTitle: "text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2",
  modalIcon: "text-primary-600 dark:text-primary-400",
  modalCloseButton: "text-gray-400 hover:text-gray-500 dark:hover:text-gray-300",
  modalBody: "p-4",
  modalInfo: "text-sm text-gray-500 dark:text-gray-400 mb-4",
  modalFooter: "flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700",
  
  // Buttons für Aktionen
  primaryButton: "px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md flex items-center justify-center gap-2 transition-colors",
  secondaryButton: "px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md flex items-center justify-center gap-2 transition-colors",
  iconButton: "p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
  iconButtonDanger: "text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30",
    // Toast-Nachrichten
  toast: "fixed top-4 left-1/2 transform -translate-x-1/2 p-3 rounded-lg shadow-lg z-[60] transition-all duration-300 animate-fade-in-down",
  successToast: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-6 py-3 rounded-lg shadow-lg z-[60] border-l-4 border-green-500 dark:border-green-700 flex items-center gap-2",
  errorToast: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 px-6 py-3 rounded-lg shadow-lg z-[60] border-l-4 border-red-500 dark:border-red-700 flex items-center gap-2",
  
  // Action Bar
  actionBar: "flex justify-end gap-2 mb-4",
  
  // Formular-Elemente
  formGroup: "mb-4",
  
  loading: "flex justify-center items-center py-12 text-gray-500 dark:text-gray-400",
}

const base = `
  flex items-center justify-center gap-2
  py-2 px-3 
  border-none rounded-md
  text-[0.9rem] font-medium
  relative overflow-hidden
  transition-all duration-200
  cursor-pointer
  whitespace-nowrap
  select-none
  hover:translate-y-[-1px] hover:shadow-md
  active:translate-y-0 active:shadow-sm
  disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none
`;

const tab = `
  flex items-center gap-2 
  py-3 px-6
  bg-transparent
  text-[var(--md-sys-color-on-surface-variant)]
  border-0 border-b-3 border-b-transparent 
  rounded-none
  text-base
  transition-all duration-200
  hover:bg-[var(--md-sys-color-surface-variant)]
  hover:translate-y-0 hover:shadow-none
`;

const tabActive = `
  text-[var(--md-sys-color-primary)]
  border-b-3 border-b-[var(--md-sys-color-primary)]
  bg-[var(--md-sys-color-surface-container-high)]
`;

const filter = `
  flex !flex items-center !items-center gap-1 !gap-1
  py-2 !py-2 px-3 !px-3
  rounded-md !rounded-md border-none !border-none 
  text-[0.9rem] !text-[0.9rem] font-medium !font-medium
  bg-[var(--md-sys-color-surface-container-high)] !bg-[var(--md-sys-color-surface-container-high)]
  text-[var(--md-sys-color-on-surface)] !text-[var(--md-sys-color-on-surface)]
  relative !relative overflow-hidden !overflow-hidden
  transition-all !transition-all duration-200 !duration-200
  hover:translate-y-[-1px] hover:!translate-y-[-1px] hover:shadow-md hover:!shadow-md
  active:translate-y-0 active:!translate-y-0 active:shadow-sm active:!shadow-sm
`;

const filterActive = `
  !bg-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]
  !text-[var(--md-sys-color-on-primary)] text-[var(--md-sys-color-on-primary)]
  !font-medium font-medium
  hover:!bg-[var(--md-sys-color-primary-container)] hover:bg-[var(--md-sys-color-primary-container)]
  hover:!text-white hover:text-white
  hover:!shadow-md hover:shadow-md
`;

const filterSearch = `
  flex items-center gap-2
  py-2.5 px-4
  h-12
  bg-white
  text-gray-700
  rounded-full
  text-[0.9rem] font-medium
  relative overflow-hidden
  transition-all duration-200
  hover:translate-y-[-1px] hover:shadow-md
  active:translate-y-0 active:shadow-sm
`;

const primary = `
  flex items-center justify-center gap-2
  py-2.5 px-4
  bg-[var(--md-sys-color-primary)]
  text-[var(--md-sys-color-on-primary)]
  font-medium
  border-none rounded-md
  text-[0.9rem]
  relative overflow-hidden
  transition-all duration-200
  hover:bg-[var(--md-sys-color-primary-hover,#5aaf6b)]
  hover:shadow-md
  active:translate-y-[1px]
  disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none
`;

const secondary = `
  flex items-center justify-center gap-2
  py-2.5 px-4
  bg-[var(--md-sys-color-secondary)]
  text-[var(--md-sys-color-on-secondary)]
  font-medium
  border-none rounded-md
  text-[0.9rem]
  relative overflow-hidden
  transition-all duration-200
  hover:bg-[var(--md-sys-color-secondary-container)]
  hover:shadow-md
  active:translate-y-[1px]
  disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none
`;

const close = `
  flex items-center justify-center gap-2
  py-2 px-4
  bg-gray-600
  text-white
  border-none rounded-md
  text-[0.9rem] font-medium
  relative overflow-hidden
  transition-all duration-200
  hover:bg-gray-700 hover:shadow-md
  active:translate-y-[1px]
`;

const cancel = `
  flex items-center justify-center gap-2
  py-2.5 px-4
  bg-[var(--md-sys-color-error,#f44336)]
  text-[var(--md-sys-color-on-error,white)]
  border-none rounded-md
  text-[0.9rem] font-medium
  relative overflow-hidden
  transition-all duration-200
  hover:bg-[#c62828] hover:shadow-md
  active:translate-y-[1px]
`;

const pagination = `
  flex items-center gap-1
  py-2 px-3
  bg-[var(--md-sys-color-secondary-container)]
  text-[var(--md-sys-color-on-secondary-container)]
  border-none rounded-md
  text-[0.9rem]
  cursor-pointer
  transition-opacity duration-200
  hover:opacity-90
  disabled:opacity-50 disabled:cursor-not-allowed
`;

const clear = `
  flex !flex items-center !items-center justify-center !justify-center
  w-8 !w-8 h-8 !h-8
  absolute !absolute right-2 !right-2
  bg-transparent !bg-transparent
  text-[var(--md-sys-color-on-surface-variant)] !text-[var(--md-sys-color-on-surface-variant)]
  border-none !border-none rounded-full !rounded-full
  cursor-pointer !cursor-pointer
  transition-colors !transition-colors duration-200 !duration-200
  hover:bg-[var(--md-sys-color-surface-variant)] hover:!bg-[var(--md-sys-color-surface-variant)]
  active:bg-[rgba(0,0,0,0.1)] active:!bg-[rgba(0,0,0,0.1)]
  text-xl !text-xl
  focus:outline-none !focus:outline-none
`;

const darkModePrimary = `
  dark:bg-[var(--md-sys-color-primary,#83d991)]
`;

const darkModeFilterActive = `
  dark:bg-[var(--md-sys-color-primary)]
  dark:hover:bg-[var(--md-sys-color-primary-container)]
  dark:hover:text-white
  dark:hover:shadow-md
  dark:text-shadow-[0_0_2px_rgba(0,0,0,0.7)]
`;

const appLayout = {
  container: 'flex flex-col min-h-screen font-roboto m-0 p-0 overflow-x-hidden w-full',
  main: 'flex-1 p-4 w-full',
  contentWrapper: 'mt-6 w-full rounded-lg shadow-sm overflow-hidden',
  dialog: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm',
  dialogContent: 'bg-white dark:bg-[#242328] rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col',
  dialogHeader: 'flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700',
  dialogBody: 'p-6 overflow-y-auto',
  dialogFooter: 'flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700',
  successBanner: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 rounded border-l-4 border-green-500',
  errorBanner: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded border-l-4 border-red-600 dark:border-red-500',
  infoBanner: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-4 rounded border-l-4 border-blue-600 dark:border-blue-500',
  fadeIn: 'animate-fadeIn',
  slideIn: 'animate-slideIn',
  slideOut: 'animate-slideOut',
  themeTransition: 'transition-colors duration-500 ease-in-out'
};

const kategorienFarben = {
  'hämatologie': '#c74a4a',
  'klinische chemie': '#9c6b3c',
  'gerinnung': '#4a995c',
  'immunologie': '#4a72c7',
  'mikrobiologie': '#8d4ac7',
  'endokrinologie': '#c79c4a',
  'virologie': '#3d99c2',
  'infektionsdiagnostik': '#9c6b3c',
  'toxikologie': '#e67e00'
};

const getKategorieColor = (kategorie) => {
  if (!kategorie) return '#888888';
  const lowerKategorie = typeof kategorie === 'string' ? kategorie.toLowerCase() : '';
  return kategorienFarben[lowerKategorie] || '#888888';
};

const getKategorieBadgeClasses = (kategorie) => {
  if (!kategorie) return '';
  const lowerKategorie = typeof kategorie === 'string' ? kategorie.toLowerCase() : '';
  return `kategorie-badge kategorie-${lowerKategorie.replace(/\s+/g, '-')}`;
};

const tailwindBtn = {
  base,
  tab,
  tabActive,
  filter,
  filterActive,
  filterSearch,
  primary,
  secondary,
  close,
  cancel,
  pagination,
  clear,
  darkModePrimary,
  darkModeFilterActive,
  colors,
  containerBg,
  containerBgElevated,
  cardBg,
  borderClasses,
  textClasses,
  classes,
  appLayout,
  kategorienFarben,
  getKategorieColor,
  getKategorieBadgeClasses
};

export default tailwindBtn;
