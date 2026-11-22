// Zestaw języków (D-026, P-009), dopasowanie języka systemu i łańcuch zastępczy (ADR-0017).
export const ZRODLO = 'en';

export const JEZYKI = [
  'bg', 'cs', 'da', 'de', 'el', 'en', 'es-419', 'es', 'et', 'fi', 'fr', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'lt', 'lv',
  'ms', 'nb', 'nl', 'pl', 'pt-BR', 'pt', 'ro', 'ru', 'sk', 'sl', 'sr', 'sv', 'tr', 'uk', 'vi', 'zh-Hant',
] as const;
export type Jezyk = (typeof JEZYKI)[number];
export type PreferencjaJezyka = 'auto' | Jezyk;

export const jestJezykiem = (x: string): x is Jezyk => (JEZYKI as readonly string[]).includes(x);

// Regiony, w których hiszpański dziedziczy po es-419 (CLDR supplementalData.xml, parentLocales; ta sama lista co w Treningu, lib/i18n.ts).
const AMERYKA_LACINSKA = new Set([
  '419', 'AR', 'BO', 'BR', 'BZ', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT', 'HN', 'JP', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'US', 'UY', 'VE',
]);
const CHINY_TRADYCYJNE = new Set(['TW', 'HK', 'MO']);
const STARE_KODY: Record<string, string> = { in: 'id', no: 'nb', nn: 'nb' };

function dopasujTag(tag: string): Jezyk | null {
  const cz = tag.split('-');
  const jezyk = (STARE_KODY[cz[0].toLowerCase()] ?? cz[0].toLowerCase());
  if (!/^[a-z]{2,3}$/.test(jezyk) || cz.slice(1).some((x) => !/^[A-Za-z0-9]{2,8}$/.test(x))) return null;
  const skrypt = cz.slice(1).find((x) => /^[A-Za-z]{4}$/.test(x));
  const region = cz.slice(1).find((x) => /^([A-Za-z]{2}|\d{3})$/.test(x))?.toUpperCase();
  if (jezyk === 'zh') return skrypt?.toLowerCase() === 'hant' || (!skrypt && region && CHINY_TRADYCYJNE.has(region)) ? 'zh-Hant' : null;
  if (jezyk === 'es') return region && AMERYKA_LACINSKA.has(region) ? 'es-419' : 'es';
  // Jak w Treningu (CLDR likelySubtags: pt → pt_BR): brak regionu lub BR → pt-BR; każdy inny region (PT, AO, MZ…) → pt (Portugalia).
  if (jezyk === 'pt') return !region || region === 'BR' ? 'pt-BR' : 'pt';
  return jestJezykiem(jezyk) ? jezyk : null;
}

/** Pierwszy tag z listy użytkownika, który ma słownik; inaczej źródło. */
export function dopasujJezyk(tagi: string[]): Jezyk {
  for (const tag of tagi) {
    const j = dopasujTag(tag);
    if (j) return j;
  }
  return ZRODLO;
}

/** Wybór z przełącznika w aplikacji (P-075, 3b) albo z systemu; nieznany zapis = auto. */
export function wybierzJezyk(preferencja: string | null, tagiSystemowe: string[]): Jezyk {
  return preferencja && preferencja !== 'auto' && jestJezykiem(preferencja) ? preferencja : dopasujJezyk(tagiSystemowe);
}

// Wariant regionalny = nakładka na język bazowy (jak w Treningu: słownik wariantu ma tylko teksty różne od bazy).
const ZASTEPCZY: Partial<Record<Jezyk, Jezyk>> = { 'es-419': 'es', 'pt-BR': 'pt' };

/** Wariant → język bazowy → źródło; nigdy klucz. */
export function lancuchZastepczy(j: Jezyk): Jezyk[] {
  const bliski = ZASTEPCZY[j];
  return [...new Set<Jezyk>([j, ...(bliski ? [bliski] : []), ZRODLO])];
}

/**
 * Nazwy własne na liście języków (design-spec „Ustawienia › Język”; nie klucze t()): CLDR 47 (Intl.DisplayNames w Node 22, ICU 77.1,
 * odczyt 2026-10-26), pierwsza litera wielka. Stała, bo Hermes nie gwarantuje Intl.DisplayNames. Aneks 08 do przeglądu 09.
 */
export const NAZWY_JEZYKOW: Readonly<Record<Jezyk, string>> = {
  bg: 'Български', cs: 'Čeština', da: 'Dansk', de: 'Deutsch', el: 'Ελληνικά', en: 'English', 'es-419': 'Español latinoamericano',
  es: 'Español', et: 'Eesti', fi: 'Suomi', fr: 'Français', hr: 'Hrvatski', hu: 'Magyar', id: 'Indonesia', it: 'Italiano', ja: '日本語',
  ko: '한국어', lt: 'Lietuvių', lv: 'Latviešu', ms: 'Melayu', nb: 'Norsk bokmål', nl: 'Nederlands', pl: 'Polski', 'pt-BR': 'Português (Brasil)',
  pt: 'Português', ro: 'Română', ru: 'Русский', sk: 'Slovenčina', sl: 'Slovenščina', sr: 'Српски', sv: 'Svenska', tr: 'Türkçe',
  uk: 'Українська', vi: 'Tiếng Việt', 'zh-Hant': '繁體中文',
};
