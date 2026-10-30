// Plugin konfiguracji Expo (P-300 R1, ryzyko wytycznej 2.5.4): tryb tła `remote-notification` i uprawnienie `aps-environment` służą tylko
// CKSyncEngine (cichym powiadomieniom CloudKit), więc trafiają do builda wyłącznie przy ICLOUD_W_1_0 = true (P-290). Flaga ma jedno źródło:
// src/konfiguracja.ts; plugin czyta ją stamtąd, nie trzyma kopii. Reszta konfiguracji (App Group, usługi i kontener iCloud) bez zmian.
const fs = require('fs');
const path = require('path');

function flagaZKodu(korzen) {
  const tekst = fs.readFileSync(path.join(korzen, 'src/konfiguracja.ts'), 'utf8');
  const m = /export const ICLOUD_W_1_0 = (true|false)\b/.exec(tekst);
  if (!m) throw new Error('plugins/icloud-tlo: nie znaleziono ICLOUD_W_1_0 w src/konfiguracja.ts');
  return m[1] === 'true';
}

function przytnij(config, icloud) {
  if (icloud) return config;
  const ios = { ...(config.ios ?? {}) };
  if (ios.entitlements) {
    const { 'aps-environment': _aps, ...reszta } = ios.entitlements;
    ios.entitlements = reszta;
  }
  if (ios.infoPlist) {
    const { UIBackgroundModes: tryby, ...reszta } = ios.infoPlist;
    const zostaja = Array.isArray(tryby) ? tryby.filter((t) => t !== 'remote-notification') : [];
    ios.infoPlist = zostaja.length > 0 ? { ...reszta, UIBackgroundModes: zostaja } : reszta;
  }
  return { ...config, ios };
}

module.exports = (config) => przytnij(config, flagaZKodu(path.join(__dirname, '..')));
module.exports.przytnij = przytnij;
module.exports.flagaZKodu = flagaZKodu;
