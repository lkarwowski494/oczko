// Zastępstwo expo-symbols na web: SF Symbols nie istnieją w przeglądarce — glif zbliżony kształtem (tylko do zrzutów układu).
import React from 'react';
import { Text } from 'react-native';
const G = { 'questionmark.circle': '?⃝', 'gearshape': '⚙', 'lifepreserver': '◎', 'checkmark': '✓', 'chevron.down': '⌄', 'chevron.up': '⌃', 'chevron.forward': '›', 'chevron.backward': '‹', 'chevron.right': '›' };
export function SymbolView(p) { return React.createElement(Text, { style: { width: p.size, height: p.size, fontSize: p.size * 0.9, lineHeight: p.size, textAlign: 'center', color: p.tintColor }, testID: p.testID }, G[p.name] ?? '□'); }
