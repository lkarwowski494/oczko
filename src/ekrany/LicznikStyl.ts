// Style ekranu licznika — wydzielone z Licznik.tsx (P-268, plan-prac 1.6); wartości tylko z modułu motywu (tokeny 04).
import { StyleSheet } from 'react-native';
import tokeny from '../../docs/design/tokeny.json';
import { cel as rozmiary, odstep, promien, typografia, typografiaDzianiny, type Kolory } from './motyw';

export type Style = ReturnType<typeof style>;
export function style(k: Kolory) {
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.papier },
    pasek: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: odstep.l, minHeight: rozmiary.minimum },
    paskaPrawa: { flexDirection: 'row', gap: odstep.s, flexShrink: 0 }, // ikony zostają w pasku przy AX5 (makieta fix-8 `.nav .ikony`, P-287)
    blokada: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: odstep.l, backgroundColor: k.papierGrupa, minHeight: rozmiary.minimum },
    blokadaPrzycisk: { minHeight: rozmiary.minimum, justifyContent: 'center', paddingHorizontal: odstep.s },
    przewijana: { flex: 1 },
    srodek: { paddingHorizontal: odstep.xl, gap: odstep.m, paddingBottom: odstep.sekcja }, // paddingBottom do pierwszego pomiaru strefy (016)
    // 016 + LIC-04 (tokeny `licznik.strefa`): strefa „akcje + −1/+1” nałożona u dołu na przewijaną treść, tło `tlo`.
    strefa: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: k.papier },
    tytul: { ...typografia.tytul, color: k.grafit },
    instrukcja: { ...typografia.instrukcja, color: k.grafit },
    tresc: { ...typografia.tresc, color: k.grafit },
    wpisProjektu: { minHeight: rozmiary.minimum, justifyContent: 'center' },
    podpis: { ...typografia.podpis, color: k.olowek },
    pogrubiony: { fontWeight: '700' },
    link: { textDecorationLine: 'underline' },
    // Układ M3 p3a (makieta `licznik`, `.licz-g`): dzianina i liczba obok siebie; AX: pas dzianiny nad liczbą.
    glowna: { flexDirection: 'row', gap: odstep.l },
    glownaAx: { flexDirection: 'column', gap: odstep.l },
    dzianina: { borderRadius: tokeny.dzianina.kolumnaLicznika.promien, overflow: 'hidden', alignSelf: 'flex-start' }, // token `dzianina.kolumnaLicznika` (M3-MAK-03)
    dzianinaAx: { borderRadius: tokeny.dzianina.kolumnaLicznika.promien, overflow: 'hidden', alignSelf: 'stretch' },
    kolumnaLiczby: { flex: 1, gap: odstep.s },
    liczba: { ...typografia.liczba, color: k.tekst },
    liczbaKarty: { ...typografiaDzianiny.liczbaKarty, color: k.tekst },
    liczbaMala: { ...typografiaDzianiny.liczbaPaskaWzoru, color: k.tekst },
    wejscieProjektu: { minHeight: rozmiary.minimum, justifyContent: 'center', alignSelf: 'flex-start' },
    wejscieTekst: { ...typografiaDzianiny.tresc2, fontWeight: '700', color: k.akcentTekst },
    notatka: { flexDirection: 'row', gap: odstep.m, padding: odstep.l, borderRadius: promien.przycisk, backgroundColor: k.powierzchnia },
    notatkaTekst: { flex: 1 },
    linijka: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: odstep.s },
    baner: { gap: odstep.s, padding: odstep.m, borderRadius: promien.grupa, backgroundColor: k.papierGrupa },
    zakreslacz: { backgroundColor: k.zakreslacz, borderLeftWidth: 3, borderLeftColor: k.zakreslaczKrawedz, borderRadius: promien.zakreslacz, padding: odstep.m },
    // M3-LIC-03: rząd akcji stoi nad stałą strefą „−1 / +1” (makieta: akcje tuż nad `.dol`, margines 16 pt), nie w przewijanej treści; zIndex — menu stopera nad strefą.
    akcjeStrefa: { paddingHorizontal: odstep.l, paddingTop: odstep.s, zIndex: 10 },
    przyciski: { flexDirection: 'row', alignItems: 'flex-end', gap: rozmiary.odstepMinusPlus, padding: odstep.l },
    przyciskiAx: { flexDirection: 'column', gap: rozmiary.odstepMinusPlus, padding: odstep.l },
    minus: { width: rozmiary.przyciskMinus, height: rozmiary.przyciskMinus, borderRadius: promien.przyciskDrugi, borderWidth: 2, borderColor: k.drugiPrzyciskObrys, alignItems: 'center', justifyContent: 'center' },
    minusTekst: { ...typografia.przycisk, color: k.grafit },
    plus: { flex: 1, minHeight: rozmiary.przyciskPlusWysokosc, borderRadius: promien.przyciskGlowny, backgroundColor: k.akcent, alignItems: 'center', justifyContent: 'center', padding: odstep.m },
    plusAx: { alignSelf: 'stretch', minHeight: rozmiary.plus, borderRadius: promien.przyciskGlowny, backgroundColor: k.akcent, alignItems: 'center', justifyContent: 'center', padding: odstep.m },
    plusTekst: { ...typografia.przycisk, color: k.naAkcencie },
    plusPodpis: { ...typografia.podpis, color: k.naAkcencie },
    minusAx: { alignSelf: 'stretch', minHeight: rozmiary.przyciskMinus, borderRadius: promien.przyciskDrugi, borderWidth: 2, borderColor: k.drugiPrzyciskObrys, alignItems: 'center', justifyContent: 'center' },
    drugiPrzycisk: { minHeight: rozmiary.minimum, borderRadius: promien.przyciskDrugi, borderWidth: 2, borderColor: k.drugiPrzyciskObrys, alignItems: 'center', justifyContent: 'center', paddingHorizontal: odstep.l },
    komunikat: { paddingHorizontal: odstep.xl }, // M1-004: komunikat nad przyciskami, w linii z treścią `srodek`
    komunikatLimitu: { padding: odstep.l, margin: odstep.l, borderRadius: promien.grupa, backgroundColor: k.papierGrupa },
    arkusz: { ...StyleSheet.absoluteFill, backgroundColor: k.arkusz, padding: odstep.xl, gap: odstep.m, justifyContent: 'center' },
  });
}
