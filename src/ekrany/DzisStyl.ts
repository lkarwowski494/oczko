// Style ekranu „Dziś” (wydzielone z `Dzis.tsx`, limit 20 KB `granice.mjs`; bez zmiany wartości). Wartości wyłącznie z modułu motywu i `docs/design/tokeny.json` (zasada 15).
import { StyleSheet } from 'react-native';
import { cel, krojTytulowy, odstep, promien, typografiaDzianiny as ty, type Kolory } from './motyw';
import tokeny from '../../docs/design/tokeny.json';

/** Kolumna dzianiny na karcie (M3-MAK-03, P-554): 112 × min. 216, AX5 min. 120, promień 12 — token `dzianina.kolumnaKarty` (zastępuje 1,5 × „+1” karty z p2). */
export const KOLUMNA_KARTY = tokeny.dzianina.kolumnaKarty;

export function style(k: Kolory, jezyk?: string) {
  const bree = jezyk === undefined ? {} : { fontFamily: krojTytulowy(jezyk) }; // języki z krojem systemowym (M3-S3-04)
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.tlo },
    tresc: { paddingHorizontal: odstep.l, paddingBottom: odstep.sekcja, gap: odstep.xl },
    naglowek: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: odstep.m },
    tytul: { ...ty.duzyTytul, ...bree, color: k.tekst },
    podpis: { ...ty.tresc2, color: k.tekst2 },
    opis: { flex: 1, gap: odstep.xs },
    karta: { backgroundColor: k.karta, borderRadius: promien.karta, padding: odstep.l, gap: odstep.l },
    kartaWiersz: { flexDirection: 'row' },
    kartaKolumna: { flexDirection: 'column' },
    dzianina: { width: KOLUMNA_KARTY.szerokosc, alignSelf: 'stretch', minHeight: KOLUMNA_KARTY.minWysokosc, borderRadius: KOLUMNA_KARTY.promien, overflow: 'hidden' },
    dzianinaAx: { alignSelf: 'stretch', minHeight: KOLUMNA_KARTY.ax5MinWysokosc, borderRadius: KOLUMNA_KARTY.promien, overflow: 'hidden' },
    kartaTytul: { ...ty.tytul, ...bree, color: k.kartaTekst },
    kartaPodpis: { ...ty.tresc2, color: k.kartaTekst2 },
    kartaTresc: { ...ty.tresc, color: k.kartaTekst },
    liczbaIPlus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: odstep.m },
    liczba: { ...ty.liczbaKarty, ...bree, color: k.kartaTekst },
    plus: { width: cel.plus, height: cel.plus, borderRadius: cel.plus / 2, backgroundColor: k.akcent, alignItems: 'center', justifyContent: 'center' },
    plusAx3: { width: cel.plusAx5, height: cel.plusAx5, borderRadius: cel.plusAx5 / 2, backgroundColor: k.akcent, alignItems: 'center', justifyContent: 'center' },
    liczbaIPlusAx3: { alignItems: 'flex-start' },
    dzianinaAx3: { alignSelf: 'stretch', height: tokeny.kartaDzis.ax3ax5.dzianinaWysokosc, borderRadius: KOLUMNA_KARTY.promien, overflow: 'hidden' },
    plusTekst: { ...ty.przyciskPlus, color: k.naAkcencie },
    limit: { gap: odstep.s },
    link: { minHeight: cel.minimum, justifyContent: 'center' },
    podkreslony: { textDecorationLine: 'underline', fontWeight: '700' },
    przyciskKarty: { flexDirection: 'row', minHeight: cel.minimum, alignItems: 'center', justifyContent: 'center', gap: odstep.s, borderRadius: promien.przycisk, backgroundColor: k.przyciskNaKarcie, paddingHorizontal: odstep.l, paddingVertical: odstep.m },
    przyciskKartyTekst: { ...ty.tresc, fontWeight: '700', color: k.przyciskNaKarcieTekst },
    wiersz: { backgroundColor: k.powierzchnia, borderRadius: promien.przycisk, padding: odstep.l, gap: odstep.s },
    wierszPoziomy: { flexDirection: 'row', alignItems: 'center', minHeight: cel.minimum, gap: odstep.m },
    znacznik: { width: odstep.l, height: odstep.xl, borderRadius: odstep.s, backgroundColor: k.akcent },
    trescEkranu: { ...ty.tresc, color: k.tekst },
    pogrubiony: { fontWeight: '700' },
    drugiPrzycisk: { minHeight: cel.minimum, justifyContent: 'center', alignSelf: 'flex-start' },
    sekcja: { gap: odstep.m },
    naglowekSekcji: { ...ty.tresc, fontWeight: '700', color: k.tekst },
    tydzien: { flexDirection: 'row', gap: odstep.s },
    tydzienAx: { flexDirection: 'row', flexWrap: 'wrap', gap: odstep.s },
    dzien: { flex: 1, alignItems: 'center', gap: odstep.xs },
    dzienAx: { width: '22%', alignItems: 'center', gap: odstep.xs }, // AX5: tydzień 4 + 3 (design-spec „Typografia”)
    kwadrat: { alignSelf: 'stretch', aspectRatio: 1, minHeight: cel.minimum, borderRadius: promien.dzien, backgroundColor: k.dzienPusty },
    dziergany: { backgroundColor: k.akcent, borderWidth: 2, borderColor: k.akcentTekst }, // P-590 / P-614 (6): kolor + obwódka + data, bez faktury (makieta `.tydz i.z`)
    dzis: { borderWidth: 2, borderColor: k.tekst },
    skrot: { ...ty.mala, color: k.tekst2 },
    kafle: { flexDirection: 'row', flexWrap: 'wrap', gap: odstep.l },
    kafleAx: { gap: odstep.l },
    kafel: { width: '47%', flexGrow: 1, minHeight: cel.plus * 2, backgroundColor: k.powierzchnia, borderRadius: promien.kafel, padding: odstep.l, gap: odstep.m, justifyContent: 'space-between' },
    kafelAx: { backgroundColor: k.powierzchnia, borderRadius: promien.kafel, padding: odstep.l, gap: odstep.m },
    ikona: { width: cel.minimum, height: cel.minimum, borderRadius: tokeny.promienie.ikonaKafla, backgroundColor: k.ikonaTlo, alignItems: 'center', justifyContent: 'center' },
  });
}
