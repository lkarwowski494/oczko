// Szacunek skali danych (E0 roli 05). Wszystkie wejścia to [OCENA] — założenia nazwane, nie pomiar.
const profile = {
  darmowy: { dniRok: 5 * 12, zdarzenDzien: 80, projektyRok: 4, wzoryRok: 3, zdjeciaProjekt: 4, stronyNotatekWzor: 3, wloczkiRok: 10 },
  intensywny: { dniRok: 250, zdarzenDzien: 200, projektyRok: 15, wzoryRok: 20, zdjeciaProjekt: 8, stronyNotatekWzor: 8, wloczkiRok: 60 },
};
const B = { zdarzenie: 120, sesja: 100, projekt: 1500, licznik: 300, wloczka: 600, dzien: 60 }; // bajty wiersza z indeksami [OCENA]
const PLIK = { pdfMB: 3, zdjecieMB: 0.6, rysunekStronaKB: 40 }; // [OCENA]
for (const [n, p] of Object.entries(profile)) for (const lat of [1, 3]) {
  const zd = p.dniRok * p.zdarzenDzien * lat, pr = p.projektyRok * lat, sesje = p.dniRok * 1.5 * lat;
  const liczniki = pr * 4, wloczki = p.wloczkiRok * lat, dni = p.dniRok * lat;
  const bazaMB = (zd * B.zdarzenie + sesje * B.sesja + pr * B.projekt + liczniki * B.licznik + wloczki * B.wloczka + dni * B.dzien) / 1e6;
  const wzory = p.wzoryRok * lat, zdj = pr * p.zdjeciaProjekt;
  const plikiMB = wzory * PLIK.pdfMB + zdj * PLIK.zdjecieMB + wzory * p.stronyNotatekWzor * PLIK.rysunekStronaKB / 1000;
  console.log(`${n} ${lat} r.: zdarzenia ${zd}, sesje ${sesje}, projekty ${pr}, liczniki ${liczniki}, włóczki ${wloczki}, dni ${dni} → baza ≈ ${bazaMB.toFixed(1)} MB; wzory ${wzory}, zdjęcia ${zdj} → pliki ≈ ${plikiMB.toFixed(0)} MB`);
}
