// Style ekranu licznika — wydzielone z Licznik.tsx (P-268, plan-prac 1.6); wartości tylko z modułu motywu (tokeny 04).
import { StyleSheet } from 'react-native';
import { cel as rozmiary, odstep, promien, typografia, type Kolory } from './motyw';

export type Style = ReturnType<typeof style>;
export function style(k: Kolory) {
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.papier },
    pasek: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: odstep.l, minHeight: rozmiary.minimum },
    paskaPrawa: { flexDirection: 'row', gap: odstep.s, flexShrink: 0 }, // ikony zostają w pasku przy AX5 (makieta fix-8 `.nav .ikony`, P-287)
    navLink: { flexShrink: 1, alignItems: 'flex-start' }, // „‹ Projects” zawija się zamiast wypychać ikony
    ikona: { minWidth: rozmiary.minimum, minHeight: rozmiary.minimum, alignItems: 'center', justifyContent: 'center' },
    ikonaTekst: { ...typografia.instrukcja, color: k.grafit },
    blokada: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: odstep.l, backgroundColor: k.papierGrupa, minHeight: rozmiary.minimum },
    blokadaPrzycisk: { minHeight: rozmiary.minimum, justifyContent: 'center', paddingHorizontal: odstep.s },
    srodek: { paddingHorizontal: odstep.xl, gap: odstep.m, paddingBottom: odstep.sekcja },
    tytul: { ...typografia.tytul, color: k.grafit },
    instrukcja: { ...typografia.instrukcja, color: k.grafit },
    tresc: { ...typografia.tresc, color: k.grafit },
    wpisProjektu: { minHeight: rozmiary.minimum, justifyContent: 'center' },
    podpis: { ...typografia.podpis, color: k.olowek },
    pogrubiony: { fontWeight: '700' },
    link: { textDecorationLine: 'underline' },
    liczbaWiersz: { flexDirection: 'row', alignItems: 'baseline', gap: odstep.s },
    liczba: { ...typografia.liczba, color: k.grafit },
    linijka: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: odstep.s },
    baner: { gap: odstep.s, padding: odstep.m, borderRadius: promien.grupa, backgroundColor: k.papierGrupa },
    zakreslacz: { backgroundColor: k.zakreslacz, borderLeftWidth: 3, borderLeftColor: k.zakreslaczKrawedz, borderRadius: promien.zakreslacz, padding: odstep.m },
    przyciski: { flexDirection: 'row', alignItems: 'flex-end', gap: rozmiary.odstepMinusPlus, padding: odstep.l },
    minus: { width: rozmiary.przyciskMinus, height: rozmiary.przyciskMinus, borderRadius: promien.przyciskDrugi, borderWidth: 2, borderColor: k.drugiPrzyciskObrys, alignItems: 'center', justifyContent: 'center' },
    minusTekst: { ...typografia.przycisk, color: k.grafit },
    plus: { flex: 1, minHeight: rozmiary.przyciskPlusWysokosc, borderRadius: promien.przyciskGlowny, backgroundColor: k.przyciskTlo, borderWidth: 2, borderColor: k.przyciskObrys, alignItems: 'center', justifyContent: 'center', padding: odstep.m },
    plusTekst: { ...typografia.przycisk, color: k.przyciskTekst },
    plusPodpis: { ...typografia.podpis, color: k.przyciskTekst },
    drugiPrzycisk: { minHeight: rozmiary.minimum, borderRadius: promien.przyciskDrugi, borderWidth: 2, borderColor: k.drugiPrzyciskObrys, alignItems: 'center', justifyContent: 'center', paddingHorizontal: odstep.l },
    komunikat: { paddingHorizontal: odstep.xl }, // M1-004: komunikat nad przyciskami, w linii z treścią `srodek`
    komunikatLimitu: { padding: odstep.l, margin: odstep.l, borderRadius: promien.grupa, backgroundColor: k.papierGrupa },
    arkusz: { ...StyleSheet.absoluteFill, backgroundColor: k.arkusz, padding: odstep.xl, gap: odstep.m, justifyContent: 'center' },
  });
}
