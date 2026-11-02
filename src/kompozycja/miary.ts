// Układ miar dla ekranów „Tools” (R-131, P-075 (4a), ADR-0029, BR-KAL-003/S6): preferencja „Units” (auto / metric / imperial); „auto” idzie za systemem.
import { ukladMiar, type PreferencjaMiar } from '../i18n/format';
import { miaraSystemowa } from '../platforma/lokalizacja';

export const imperialny = (preferencja: PreferencjaMiar, systemowy: 'metric' | 'us' | 'uk' | null = miaraSystemowa()): boolean => ukladMiar(preferencja, systemowy) === 'imperial';
