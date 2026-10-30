#!/usr/bin/env python3
"""Instancja statyczna Libre Franklin Bold (wght 700) z pliku zmiennego docs/design/fonty/LibreFranklin.ttf -> assets/fonts/LibreFranklin-Bold.ttf.

Po co (P-306, 04-studio-projektowe-001 plan B): iOS z pliku zmiennego potrafi wziąć domyślną instancję (Thin) mimo fontWeight, więc aplikacja ładuje plik statyczny.
Licencja: SIL OFL 1.1 pozwala na pochodne; plik OFL leży obok (assets/fonts/librefranklin-OFL.txt), nazwa rodziny bez zmian (w OFL nie ma Reserved Font Name).
Uruchomienie: python3 -I scripts/design/instancja-kroju.py   (wymaga fonttools >= 4.40: pip install fonttools)
"""
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

zrodlo = TTFont('docs/design/fonty/LibreFranklin.ttf')
instancja = instantiateVariableFont(zrodlo, {'wght': 700}, updateFontNames=True)
instancja.save('assets/fonts/LibreFranklin-Bold.ttf')
