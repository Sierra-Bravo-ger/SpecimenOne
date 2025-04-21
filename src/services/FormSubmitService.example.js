// FormSubmit-Service für SpecimenOne
// Verwendet den kostenlosen FormSubmit.co-Service für CORS-freundliche E-Mail-Integration im Frontend

/**
 * Sendet eine E-Mail über FormSubmit.co mit den Profildaten
 * @param {Object} profil - Das erstellte Profil mit allen Tests
 * @returns {Promise} - Promise mit dem Ergebnis des E-Mail-Versands
 */
export async function sendProfilByFormSubmit(profil) {
  try {
    // E-Mail-Konfiguration
    const config = {
      emailTo: 'YOUR_EMAIL_HERE' // Setzen Sie hier Ihre E-Mail-Adresse ein
    };
    
    console.log('⚙️ Versuche E-Mail über FormSubmit.co zu senden...');
      // Formular-Daten vorbereiten
    const formData = new FormData();
    formData.append('_subject', `SpecimenOne - Neues Testprofil: ${profil.profilName}`);
    formData.append('_replyto', profil.email || 'no-reply@specimenone.de');
    formData.append('name', profil.userName || 'SpecimenOne Benutzer');
    formData.append('message', `Neues Testprofil erstellt: ${profil.profilName} (${profil.tests.length} Tests)`);
    
    // FormSubmit-spezifische Konfiguration für professionelleres Aussehen
    formData.append('_captcha', 'false');              // Captcha deaktivieren
    formData.append('_template', 'box');               // Attraktiveres Box-Template verwenden
    formData.append('_autoresponse', 'Ihr Testprofil wurde erfolgreich übermittelt'); // Automatische Antwort
    
    // Profilinformationen hinzufügen
    formData.append('profilName', profil.profilName);
    formData.append('erstelltVon', profil.userName || 'Nicht angegeben');
    formData.append('erstellerEmail', profil.email || 'Nicht angegeben');
    formData.append('datum', profil.erstelltAm);
    formData.append('anzahlTests', profil.tests.length.toString());
    
    // HTML-Tabellen-Template aktivieren
    formData.append('_template', 'table');
    
    // Testinformationen in einem lesbaren Format hinzufügen
    const testsOverview = profil.tests.map(test => 
      `${test.id}: ${test.name} (${test.kategorie || 'Keine Kategorie'})`
    ).join('\n');
    formData.append('tests', testsOverview);
      try {
      // FormSubmit API mit API-Key aufrufen
      const response = await fetch('https://formsubmit.co/ajax/dfc1410f5fdc5bf2a297418b957b8d6d', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success === "true" || result.success === true) {
        console.log('✅ E-Mail erfolgreich über FormSubmit.co gesendet');
        return { status: 'success' };
      } else {
        throw new Error('FormSubmit Antwort nicht erfolgreich');
      }
    } catch (error) {
      console.error('FormSubmit fehlgeschlagen, verwende Mailto-Fallback', error);
      
      // Fallback auf mailto-Link
      const emailBody = createSimpleEmailContent(profil);
      const mailtoLink = `mailto:${config.emailTo}?subject=${encodeURIComponent(`SpecimenOne - Neues Testprofil: ${profil.profilName}`)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoLink, '_blank');
      
      return { status: 'success' };
    }
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error);
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