require 'json'
package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

# Moduł Expo (ADR-0007): jedyny pisarz dziennika +1 w procesie aplikacji (ADR-0008 (8A)), Live Activity (ActivityKit), SHA-256 plików
# strumieniowo (CryptoKit, P-130). Pliki ios/Wspolne/ to kopie pakietu modules/oczko-reguly (scripts/natywne/kopie.json, kontrola identyczności).
Pod::Spec.new do |s|
  s.name           = 'OczkoDziennikPlus'
  s.version        = package['version']
  s.summary        = 'Lock screen +1 journal, Live Activity and file SHA-256'
  s.description    = 'Single writer of the +1 journal, Live Activity bridge and streaming SHA-256.'
  s.author         = ''
  s.homepage       = 'https://github.com/lkarwowski494/oczko'
  s.platforms      = { :ios => '18.0' } # ADR-0006: minimum iOS 18
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.9'
  s.frameworks     = 'ActivityKit', 'CryptoKit', 'WatchConnectivity'
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES', 'SWIFT_COMPILATION_MODE' => 'wholemodule' }
  s.source_files = "ios/**/*.{h,m,mm,swift,hpp,cpp}"
end
