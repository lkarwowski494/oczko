require 'json'
package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

# Moduł Expo (ADR-0007, ADR-0002 (7)): beginBackgroundTask z sygnałem wygaśnięcia dla JS (import i przywrócenie jedną transakcją).
Pod::Spec.new do |s|
  s.name           = 'OczkoCzasWTle'
  s.version        = package['version']
  s.summary        = 'Background task with an expiration signal for long transactions'
  s.description    = 'beginBackgroundTask with an expiration flag polled by JS between statements.'
  s.author         = ''
  s.homepage       = 'https://github.com/lkarwowski494/oczko'
  s.platforms      = { :ios => '18.0' }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.9'
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES', 'SWIFT_COMPILATION_MODE' => 'wholemodule' }
  s.source_files = "ios/**/*.{h,m,mm,swift,hpp,cpp}"
end
