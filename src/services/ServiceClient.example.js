// ServiceClient.js - Zentraler Service-Manager für SpecimenOne
// Dieser Client stellt sicher, dass die richtigen Service-Implementierungen verwendet werden

// Service-Stubs für den Fall, dass die eigentlichen Services nicht geladen werden können
const defaultDiscordService = {
  sendProfilToDiscord: async (profil) => {
    console.error('Discord Service konnte nicht geladen werden. Verwende Fallback.');
    return { status: 'error', message: 'Discord Service nicht verfügbar' };
  }
};

const defaultFormSubmitService = {
  sendProfilByFormSubmit: async (profil) => {
    console.error('FormSubmit Service konnte nicht geladen werden. Verwende Fallback.');
    return { status: 'error', message: 'FormSubmit Service nicht verfügbar' };
  }
};

// Dynamischer Import der Services mit Fallback
let discordService = defaultDiscordService;
let formSubmitService = defaultFormSubmitService;

// Versuche, die Service-Implementierungen zu laden
try {
  import('./DiscordService.js')
    .then(module => {
      discordService = module;
      console.log('✅ Discord Service erfolgreich geladen');
    })
    .catch(error => {
      console.error('❌ Fehler beim Laden des Discord Service:', error);
    });
} catch (error) {
  console.error('❌ Kritischer Fehler beim Import des Discord Service:', error);
}

try {
  import('./FormSubmitService.js')
    .then(module => {
      formSubmitService = module;
      console.log('✅ FormSubmit Service erfolgreich geladen');
    })
    .catch(error => {
      console.error('❌ Fehler beim Laden des FormSubmit Service:', error);
    });
} catch (error) {
  console.error('❌ Kritischer Fehler beim Import des FormSubmit Service:', error);
}

// Hilfsfunktion zur Ermittlung der Discord Webhook URL
function getDiscordWebhookUrl() {
  // Priorität 1: Runtime-Konfiguration (für Docker-Container)
  if (window.SPECIMENONE_CONFIG && window.SPECIMENONE_CONFIG.DISCORD_WEBHOOK_URL) {
    return window.SPECIMENONE_CONFIG.DISCORD_WEBHOOK_URL;
  }
  
  // Priorität 2: Build-Time Umgebungsvariable (für lokale Entwicklung)
  if (import.meta.env.VITE_DISCORD_WEBHOOK_URL) {
    return import.meta.env.VITE_DISCORD_WEBHOOK_URL;
  }
  
  // Fallback: Kein Webhook konfiguriert
  return null;
}

// Öffentliche API
export async function sendProfilToDiscord(profil) {
  console.log('🔍 ServiceClient: sendProfilToDiscord aufgerufen mit Profil:', 
    profil.profilName, '(', profil.tests?.length || 0, 'Tests)');
  
  // DIREKTE IMPLEMENTIERUNG OHNE UMWEG ÜBER DEN SERVICE
  // Webhook kommt zur Laufzeit aus config.js (Container-Env VITE_DISCORD_WEBHOOK_URL)
  const DISCORD_WEBHOOK_URL = getDiscordWebhookUrl();
  if (!DISCORD_WEBHOOK_URL || !DISCORD_WEBHOOK_URL.startsWith('https://')) {
    console.warn('ServiceClient: Kein Discord-Webhook konfiguriert');
    return { status: 'not_configured' };
  }
  
  console.log('💡 ServiceClient: Verwende DIREKTEN Discord-Webhook ohne Service:', 
    DISCORD_WEBHOOK_URL.substring(0, 60) + '...');
    try {
    // Wir umgehen den regulären Service und implementieren die Funktionalität direkt hier
    console.log('⚙️ ServiceClient: Sende direkte Anfrage an Discord...');
    
    // Erstelle einen einfachen Payload
    const payload = {
      username: "SpecimenOne Bot (ServiceClient)",
      content: `🧪 **Neues Testprofil erstellt: ${profil.profilName}**\n` +
               `📋 **Erstellt von:** ${profil.userName || 'Nicht angegeben'}\n` +
               `📅 **Datum:** ${new Date().toLocaleString('de-DE')}\n` +
               `🧪 **Tests:** ${profil.tests?.length || 0}`
    };
    
    // Direkter Webhook-Aufruf
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log('📡 Discord-Antwort von ServiceClient:', response.status, response.statusText);
    
    if (response.ok) {
      console.log('✅ Profil erfolgreich von ServiceClient an Discord gesendet');
      return { status: 'success', source: 'service_client_direct' };
    } else {
      const errorText = await response.text();
      console.error('❌ Discord-Fehler im ServiceClient:', response.status, errorText);
      
      // E-Mail-Fallback bei Fehlern
      console.log('📧 Öffne E-Mail-Fallback von ServiceClient...');
      const emailSubject = `SpecimenOne - Neues Testprofil: ${profil.profilName}`;
      const emailBody = `Neues Testprofil: ${profil.profilName}\nErstellt von: ${profil.userName || 'Anonym'}\nTests: ${profil.tests ? profil.tests.length : 0}`;
      
      window.open(`mailto:sebastian.bride@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`, '_blank');
      return { status: 'email_fallback', source: 'service_client_direct' };
    }
  } catch (error) {
    console.error('❌ Fehler im ServiceClient bei Discord-Aufruf:', error);
    
    // Bei Fehlern im Service, versuchen wir es mit dem direkten Fallback
    try {
      console.warn('⚠️ Versuche direkten Fallback nach Fehler...');
      return directDiscordFallback(webhookUrl, profil);
    } catch (fallbackError) {
      console.error('❌ Auch direkter Fallback fehlgeschlagen:', fallbackError);
      throw fallbackError;
    }
  }
}

// Einfache Fallback-Implementierung für Discord, falls der reguläre Service fehlschlägt
async function directDiscordFallback(webhookUrl, profil) {
  console.log('⚙️ Direkter Discord-Fallback wird ausgeführt...');
  
  if (!webhookUrl || webhookUrl === 'placeholder-during-build' || webhookUrl === 'placeholder-during-runtime') {
    console.error('❌ Keine gültige Webhook-URL für Fallback verfügbar');
    throw new Error('Keine gültige Discord Webhook URL verfügbar');
  }
  
  try {
    // Einfache Payload erstellen
    const payload = {
      username: "SpecimenOne Bot (Fallback)",
      content: `🧪 **Neues Testprofil erstellt: ${profil.profilName || 'Unbenannt'}**\n` +
               `Erstellt von: ${profil.userName || 'Anonym'}\n` +
               `Tests: ${profil.tests ? profil.tests.length : 0}\n` +
               `Zeitpunkt: ${new Date().toLocaleString('de-DE')}`
    };
    
    console.log('🔍 Sende Fallback-Anfrage an Discord:', webhookUrl.substring(0, 40) + '...');
    
    // Direkter Aufruf ohne komplexe Logik
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📡 Discord Fallback-Antwort:', response.status, response.statusText);
    
    if (response.ok) {
      console.log('✅ Discord Fallback erfolgreich');
      return { status: 'success', mode: 'fallback' };
    } else {
      const errorText = await response.text();
      console.error('❌ Discord Fallback fehlgeschlagen:', response.status, errorText);
      throw new Error(`Discord Fallback fehlgeschlagen: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Fehler im Discord-Fallback:', error);
    throw error;
  }
}

export async function sendProfilByFormSubmit(profil) {
  return formSubmitService.sendProfilByFormSubmit(profil);
}

// Exportieren der aktuellen Service-Status für die Diagnostik
export function getServiceStatus() {
  return {
    discordServiceLoaded: discordService !== defaultDiscordService,
    formSubmitServiceLoaded: formSubmitService !== defaultFormSubmitService,
    environmentVariables: {
      VITE_DISCORD_WEBHOOK_URL: import.meta.env.VITE_DISCORD_WEBHOOK_URL ? 'Gesetzt (verborgen)' : 'Nicht gesetzt'
    }
  };
}