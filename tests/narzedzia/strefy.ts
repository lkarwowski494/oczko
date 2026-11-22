// Jedna lista stref testowych (docs/jakosc/strategia.md §3, DS-09): zbiór Treningu + Asia/Tokyo (rynek nr 2, SD-36).
// Przejścia czasu dla roku bieżącego i następnego liczy `przejsciaCzasu` (tests/narzedzia/czas.ts).
export const STREFY_TESTOWE = [
  'Europe/Warsaw',
  'UTC',
  'America/Los_Angeles',
  'Pacific/Kiritimati', // +14
  'Pacific/Pago_Pago', // −11
  'Asia/Kolkata', // +5:30
  'Australia/Lord_Howe', // czas letni o 30 min
  'Asia/Tokyo', // bez czasu letniego, rynek nr 2
] as const;
export type StrefaTestowa = (typeof STREFY_TESTOWE)[number];
