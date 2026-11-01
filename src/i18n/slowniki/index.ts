// Zasoby w pakiecie (statyczne importy dla Metro): 35 języków (en źródło; 34 przekłady maszynowe z drugim przeglądem AI — docs/lokalizacja/stan-przeklad.md).
import en from './en.json';
import dbg from './bg.json';
import dcs from './cs.json';
import dda from './da.json';
import dde from './de.json';
import del from './el.json';
import des from './es.json';
import des_419 from './es-419.json';
import det from './et.json';
import dfi from './fi.json';
import dfr from './fr.json';
import dhr from './hr.json';
import dhu from './hu.json';
import did from './id.json';
import dit from './it.json';
import dja from './ja.json';
import dko from './ko.json';
import dlt from './lt.json';
import dlv from './lv.json';
import dms from './ms.json';
import dnb from './nb.json';
import dnl from './nl.json';
import dpl from './pl.json';
import dpt from './pt.json';
import dpt_BR from './pt-BR.json';
import dro from './ro.json';
import dru from './ru.json';
import dsk from './sk.json';
import dsl from './sl.json';
import dsr from './sr.json';
import dsv from './sv.json';
import dtr from './tr.json';
import duk from './uk.json';
import dvi from './vi.json';
import dzh_Hant from './zh-Hant.json';
import type { Zasoby } from '../i18n';

export const ZASOBY: Zasoby = {
  en: { translation: en },
  bg: { translation: dbg },
  cs: { translation: dcs },
  da: { translation: dda },
  de: { translation: dde },
  el: { translation: del },
  es: { translation: des },
  "es-419": { translation: des_419 },
  et: { translation: det },
  fi: { translation: dfi },
  fr: { translation: dfr },
  hr: { translation: dhr },
  hu: { translation: dhu },
  id: { translation: did },
  it: { translation: dit },
  ja: { translation: dja },
  ko: { translation: dko },
  lt: { translation: dlt },
  lv: { translation: dlv },
  ms: { translation: dms },
  nb: { translation: dnb },
  nl: { translation: dnl },
  pl: { translation: dpl },
  pt: { translation: dpt },
  "pt-BR": { translation: dpt_BR },
  ro: { translation: dro },
  ru: { translation: dru },
  sk: { translation: dsk },
  sl: { translation: dsl },
  sr: { translation: dsr },
  sv: { translation: dsv },
  tr: { translation: dtr },
  uk: { translation: duk },
  vi: { translation: dvi },
  "zh-Hant": { translation: dzh_Hant },
};
