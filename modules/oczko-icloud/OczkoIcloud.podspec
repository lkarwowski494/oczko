require 'json'
package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

# Moduł Expo (ADR-0007): jedyny kod CloudKit aplikacji (moduly.md „Kontrakt partii 7”). CKSyncEngine na prywatnej bazie, jedna strefa `Oczko`;
# źródłem prawdy o zaległej wysyłce jest skrzynka `zmiana_icloud` w bazie (JS) — silnik trzyma rekordy tylko do potwierdzenia. Bez SQLite3 (ADR-0008).
Pod::Spec.new do |s|
  s.name           = 'OczkoIcloud'
  s.version        = package['version']
  s.summary        = 'iCloud sync engine bridge'
  s.description    = 'CKSyncEngine on the private database with one record zone; records and engine state cross to JS as JSON.'
  s.author         = ''
  s.homepage       = 'https://github.com/lkarwowski494/oczko'
  s.platforms      = { :ios => '18.0' } # ADR-0006: minimum iOS 18 (CKSyncEngine od iOS 17)
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.9'
  s.frameworks     = 'CloudKit'
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES', 'SWIFT_COMPILATION_MODE' => 'wholemodule' }
  s.source_files = ['ios/**/*.{h,m,mm,swift,hpp,cpp}', 'Pakiet/Sources/OczkoIcloudLogika/*.swift'] # logika czysta testowana `swift test` (Pakiet)
end
