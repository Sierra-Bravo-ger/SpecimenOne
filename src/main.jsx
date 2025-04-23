import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { EinheitenServiceProvider } from './services/EinheitenService'
import { Auth0Provider } from '@auth0/auth0-react'
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
  <React.StrictMode>    <Auth0Provider
      domain="dev-5shoy21cytn3t52n.eu.auth0.com"
      clientId="3uge3nJFBjoNZrB3mLJZ6zxDXsqTEEI9"
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
      // Optimale Einstellungen für E-Mail-basierte Auth0
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      <ThemeProvider>
        <EinheitenServiceProvider>
          <App />
        </EinheitenServiceProvider>
      </ThemeProvider>
    </Auth0Provider>
  </React.StrictMode>,
)