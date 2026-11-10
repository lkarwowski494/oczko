// I-001 (recenzja buildu 3, P2): „Goal reached” wysłane zaraz po „N done. Now row N+1.” przerywało je w VoiceOver
// (React Native AccessibilityInfo.js: announceForAccessibility bez kolejki). Drugie ogłoszenie ma iść z `queue: true`, po ogłoszeniu rzędu.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Platform } from 'react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { oglos as oglosSystemu } from '../../src/kompozycja/system';
import { atrapaHaptyki, plusOk, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
beforeEach(() => { jest.clearAllMocks(); }); // mocki AccessibilityInfo z konfiguracji RN trzymają wywołania między testami
afterEach(() => { jest.restoreAllMocks(); });

describe('I-001: ogłoszenie celu w kolejce po ogłoszeniu rzędu', () => {
  test('„Goal reached” idzie po ogłoszeniu rzędu i z { queue: true }; ogłoszenie rzędu bez kolejki', async () => {
    const oglos = jest.fn();
    const wyniki = [plusOk(3, { zdarzenia: ['rzad', 'cel-czesci'] })];
    render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Left sleeve', cel: 3, skonczone: 2, dziergany: 3 })} t={t} oglos={oglos}
      haptyka={atrapaHaptyki()} {...wywolaniaLicznika(async () => wyniki.shift() ?? plusOk(4))} />);
    fireEvent.press(screen.getByTestId('licznik-plus'));
    await waitFor(() => expect(oglos.mock.calls.some(([tekst]) => tekst === 'Goal reached')).toBe(true));
    const wywolania = oglos.mock.calls;
    const iCel = wywolania.findIndex(([tekst]) => tekst === 'Goal reached');
    expect(iCel).toBeGreaterThan(0); // po ogłoszeniu rzędu, nie przed nim
    expect(wywolania[iCel]?.[1]).toEqual({ queue: true });
    expect(wywolania[iCel - 1]?.[1]).toBeUndefined();
  });
});

describe('I-001: oglos systemu mapuje opcję kolejki na AccessibilityInfo', () => {
  test('z { queue: true }: announceForAccessibilityWithOptions(tekst, { queue: true })', () => {
    const zOpcjami = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions').mockImplementation(() => undefined);
    const proste = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
    oglosSystemu('Goal reached', { queue: true });
    expect(zOpcjami).toHaveBeenCalledWith('Goal reached', { queue: true });
    expect(proste).not.toHaveBeenCalled();
  });
  test('bez opcji: announceForAccessibility(tekst), jak dotąd', () => {
    const zOpcjami = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions').mockImplementation(() => undefined);
    const proste = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
    oglosSystemu('3 done. Now row 4.');
    expect(proste).toHaveBeenCalledWith('3 done. Now row 4.');
    expect(zOpcjami).not.toHaveBeenCalled();
  });
  test('Android: kolejka bez regresji (RN: announceForAccessibilityWithOptions → natywne announceForAccessibility)', () => {
    const stara = Platform.OS;
    Platform.OS = 'android';
    try {
      expect(() => oglosSystemu('Goal reached', { queue: true })).not.toThrow();
    } finally { Platform.OS = stara; }
  });
});
