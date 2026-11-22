// Most do modułu Swift OczkoCzasWTle (ADR-0002 (7)); adapter portu CzasWTle: src/platforma/czas-w-tle.ts.
import { requireNativeModule } from 'expo-modules-core';

export interface OczkoCzasWTleNatywny {
  start(nazwa: string): Promise<string>;
  czyWygaslo(id: string): boolean;
  koniec(id: string): Promise<void>;
}

export const natywny = (): OczkoCzasWTleNatywny => requireNativeModule<OczkoCzasWTleNatywny>('OczkoCzasWTle');
