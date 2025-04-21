// Discord Webhook Service für SpecimenOne (BEISPIEL-IMPLEMENTATION)
// Verwendet Discord Webhooks für CORS-freundliche Benachrichtigungen im Frontend
// Kopieren Sie diese Datei nach DiscordService.js und fügen Sie Ihre Webhook-URL ein

/**
 * Sendet Profildaten über einen Discord Webhook
 * @param {Object} profil - Das erstellte Profil mit allen Tests
 * @returns {Promise} - Promise mit dem Ergebnis des Versands
 */
export async function sendProfilToDiscord(profil) {
  try {
    // Die Webhook URL sollte aus einer Umgebungsvariable bezogen werden
    // Lesen Sie diese entweder aus import.meta.env (Vite) oder process.env (Node.js)
    // Setzen Sie beim Start der Anwendung die Variable DISCORD_WEBHOOK_URL
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL || 
                      process.env.DISCORD_WEBHOOK_URL ||
                      'IHRE_DISCORD_WEBHOOK_URL_HIER';
    
    // Wenn keine gültige URL gefunden wurde, Fallback auf Email verwenden
    if (!webhookUrl || webhookUrl === 'IHRE_DISCORD_WEBHOOK_URL_HIER') {
      console.warn('⚠️ Keine Discord Webhook URL konfiguriert. Verwende Email-Fallback.');
      throw new Error('Keine Discord Webhook URL konfiguriert');
    }
    
    console.log('⚙️ Sende Profil an Discord Webhook...');
    
    // Erstelle eine formatierte Zusammenfassung der Tests für das Embed
    const testsSummary = profil.tests.map(test => 
      `• ${test.id}: ${test.name} (${test.kategorie || 'Keine Kategorie'})`
    ).join('\n');
    
    // Begrenzte Anzahl an Tests für die Übersicht (Discord limitiert Nachrichtenlänge)
    const limitedTestsList = testsSummary.length > 1000 ? 
      testsSummary.substring(0, 997) + '...' : 
      testsSummary;
    
    // Erstelle den Discord Webhook Payload mit einem schönen Embed
    const payload = {
      username: "SpecimenOne Bot",
      avatar_url: window.location.origin + "/images/icons/icon-512x512.png", // Verwende das App-Icon
      content: `🧪 **Neues Testprofil erstellt: ${profil.profilName}**`,
      embeds: [
        {
          title: `Testprofil: ${profil.profilName}`,
          color: 5025616, // Grüne Farbe im Dezimalformat
          description: `Dieses Profil enthält ${profil.tests.length} ausgewählte Tests.`,
          fields: [
            {
              name: "📋 Profil-Information",
              value: `**Erstellt von:** ${profil.userName || 'Nicht angegeben'}\n**Kontakt:** ${profil.email || 'Nicht angegeben'}\n**Datum:** ${profil.erstelltAm}`
            },
            {
              name: `🧪 Tests (${profil.tests.length})`,
              value: limitedTestsList || 'Keine Tests ausgewählt'
            }
          ],
          footer: {
            text: "Erstellt mit SpecimenOne"
          },
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    try {
      // Discord Webhook aufrufen
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        console.log('✅ Profil erfolgreich an Discord gesendet');
        return { status: 'success' };
      } else {
        const errorText = await response.text();
        throw new Error(`Discord Webhook Fehler: ${response.status} - ${errorText}`);
      }
    } catch (webhookError) {
      console.error('Discord Webhook fehlgeschlagen, verwende Mailto-Fallback', webhookError);
      
      // Letzter Fallback: Öffne einen mailto-Link
      try {
        console.log('Öffne E-Mail-Client als letzten Fallback...');
        const emailSubject = `SpecimenOne - Neues Testprofil: ${profil.profilName}`;
        const emailBody = createSimpleEmailContent(profil);
        
        const mailtoLink = `mailto:sebastian.bride@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        window.open(mailtoLink, '_blank');
        
        return { status: 'success', fallback: 'mailto' };
      } catch (mailtoError) {
        console.error('Auch der Mailto-Fallback ist fehlgeschlagen:', mailtoError);
        throw new Error('Alle Übertragungsmethoden sind fehlgeschlagen');
      }
    }
  } catch (error) {
    console.error('Fehler beim Senden an Discord:', error);
    throw error;
  }
}

/**
 * Erstellt einen einfachen Text-Inhalt für die E-Mail (für mailto-Fallback)
 * @param {Object} profil - Das erstellte Profil
 * @returns {string} - Text-Inhalt der E-Mail
 */
function createSimpleEmailContent(profil) {
  // Erstelle eine einfache Textliste aller Tests im Profil
  const testList = profil.tests.map(test => 
    `- ${test.id}: ${test.name} (${test.kategorie || 'Keine Kategorie'})${test.material ? ' | Material: ' + test.material.join(', ') : ''}`
  ).join('\n');

  // Erstelle den vollständigen Text-E-Mail-Inhalt
  return `Neues Testprofil erstellt in SpecimenOne

PROFIL INFORMATION
-----------------
Profilname: ${profil.profilName}
Erstellt von: ${profil.userName || 'Nicht angegeben'}
Kontakt: ${profil.email || 'Nicht angegeben'}
Erstellungsdatum: ${profil.erstelltAm}
Anzahl Tests: ${profil.tests.length}

ENTHALTENE TESTS
-----------------
${testList}

-----------------
Diese E-Mail wurde automatisch durch SpecimenOne generiert.
`;
}