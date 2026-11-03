// ServiceClient.js – Versand von Profil-Anträgen per Discord-Webhook.
// Der Webhook kommt ausschließlich zur Laufzeit aus window.SPECIMENONE_CONFIG
// (wird von docker-entrypoint.sh in config.js geschrieben). Es wird kein Secret
// ins Bundle eingebaut. Ohne Webhook: { status: 'not_configured' }.

function getDiscordWebhookUrl() {
  const url = window.SPECIMENONE_CONFIG?.DISCORD_WEBHOOK_URL;
  if (typeof url === 'string' && url.startsWith('https://')) return url;
  return null;
}

/**
 * Sendet ein Profil an den konfigurierten Discord-Webhook.
 * @param {Object} profil - Profil mit profilName, tests, userName, email, erstelltAm
 * @returns {Promise<{status: 'success'|'not_configured'}>}
 * @throws {Error} wenn der Webhook nicht erreichbar ist oder einen Fehler liefert
 */
export async function sendProfilToDiscord(profil) {
  const webhookUrl = getDiscordWebhookUrl();
  if (!webhookUrl) return { status: 'not_configured' };

  const tests = profil.tests || [];
  const summary = tests
    .map((t) => `• ${t.id}: ${t.name} (${t.kategorie || 'Keine Kategorie'})`)
    .join('\n');
  const list = summary.length > 1000 ? `${summary.substring(0, 997)}...` : summary;

  const payload = {
    username: 'SpecimenOne Bot',
    content: `🧪 **Neues Testprofil erstellt: ${profil.profilName}**`,
    embeds: [
      {
        title: `Testprofil: ${profil.profilName}`,
        color: 5025616,
        description: `Dieses Profil enthält ${tests.length} ausgewählte Tests.`,
        fields: [
          {
            name: '📋 Profil-Information',
            value: `**Erstellt von:** ${profil.userName || 'Nicht angegeben'}\n**Kontakt:** ${profil.email || 'Nicht angegeben'}\n**Datum:** ${profil.erstelltAm || new Date().toLocaleDateString('de-DE')}`,
          },
          { name: `🧪 Tests (${tests.length})`, value: list || 'Keine Tests ausgewählt' },
        ],
        footer: { text: 'Erstellt mit SpecimenOne' },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Discord-Webhook antwortete mit Status ${response.status}`);
  }
  return { status: 'success' };
}
