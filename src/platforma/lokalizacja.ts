// Adapter expo-localization (ADR-0016, ADR-0017): jedyne miejsce importu pakietu. Źródło języka i preferencji urządzenia.
import { getLocales, getCalendars } from 'expo-localization';

export const tagiSystemowe = (): string[] => getLocales().map((l) => l.languageTag);

export const miaraSystemowa = (): 'metric' | 'us' | 'uk' | null => getLocales()[0]?.measurementSystem ?? null;

export const zegar24h = (): boolean => getCalendars()[0]?.uses24hourClock ?? false;

/** 1 = poniedziałek … 7 = niedziela (jak `firstWeekday` w expo-localization); domyślnie poniedziałek. */
export const pierwszyDzienTygodnia = (): number => getCalendars()[0]?.firstWeekday ?? 1;
