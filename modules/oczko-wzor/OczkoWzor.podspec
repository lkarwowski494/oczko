require 'json'
package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

# Moduł Expo (ADR-0007, ADR-0011, ADR-0012, P-221 Q1a, Q2a): jedyny kod PDFKit, PencilKit, WebKit i VisionKit w aplikacji. Logika czysta
# (polityka płótna, papier, źródło konwersji, wynik JSON) w pakiecie Pakiet/ (`swift test`), kompilowana tu wprost — bez kopii.
Pod::Spec.new do |s|
  s.name           = 'OczkoWzor'
  s.version        = package['version']
  s.summary        = 'Pattern viewer with PencilKit pages, PDF conversion and page scanner'
  s.description    = 'PDFView with a PencilKit canvas over each page, web page and Word to PDF, document scanner.'
  s.author         = ''
  s.homepage       = 'https://github.com/lkarwowski494/oczko'
  s.platforms      = { :ios => '18.0' } # ADR-0006: minimum iOS 18
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.9'
  s.frameworks     = 'PDFKit', 'PencilKit', 'WebKit', 'VisionKit', 'AVFoundation', 'Network'
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES', 'SWIFT_COMPILATION_MODE' => 'wholemodule' }
  s.source_files = ['ios/**/*.swift', 'Pakiet/Sources/OczkoWzorLogika/*.swift']
  # Eksperymenty W1–W3: osobny pakiet SwiftPM TestyOknaMaszyn/ (P-261, zadanie `eksperymenty-wzoru` w jakosc-ios.yml), poza podem.
end
