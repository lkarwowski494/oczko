// Pakiet widżetów celu OczkoWidget: tylko Live Activity sesji (ADR-0007; widżet ekranu głównego poza wersją 1).
import SwiftUI
import WidgetKit

@main
struct OczkoPakiet: WidgetBundle {
  var body: some Widget { OczkoAktywnosc() }
}
