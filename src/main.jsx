import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './material-theme.css'
import './styles/kategorie-badges.css'
import './styles/material-badges.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { EinheitenServiceProvider } from './services/EinheitenService'
// Auth0Provider vorübergehend deaktiviert
// import { Auth0Provider } from '@auth0/auth0-react'
import { registerSW } from 'virtual:pwa-register'

// Service Worker-Registrierung mit automatischer Aktualisierung
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Eine neue Version ist verfügbar. Jetzt aktualisieren?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ist bereit für den Offline-Einsatz');
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <ThemeProvider>
        <EinheitenServiceProvider>
          <App />
        </EinheitenServiceProvider>
      </ThemeProvider>
  </React.StrictMode>,
)