import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import EnvChecker from './components/EnvChecker.jsx'
import DiscordDebugger from './components/DiscordDebugger.jsx'
import './index.css'

// Prüfen, ob ein spezieller URL-Parameter für die Umgebungsvariablen-Prüfung vorhanden ist
const urlParams = new URLSearchParams(window.location.search);
const showEnvCheck = urlParams.get('checkEnv') === 'true';
const showDiscordDebug = urlParams.get('testDiscord') === 'true';

// Komponente basierend auf URL-Parametern auswählen
let ComponentToRender = App;
if (showEnvCheck) {
  ComponentToRender = EnvChecker;
} else if (showDiscordDebug) {
  ComponentToRender = DiscordDebugger;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ComponentToRender />
  </React.StrictMode>,
)