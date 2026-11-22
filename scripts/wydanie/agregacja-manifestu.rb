# Dowód P-471 (Linux, bez Xcode i CocoaPods): uruchamia PRAWDZIWY skrypt agregacji manifestu React Native na wyniku `expo prebuild` i wypisuje, które cele
# dostają jawne odwołanie do PrivacyInfo.xcprivacy w fazie zasobów. Zegarek (typ application) dostaje kopię z agregacji; jeśli targets/watch ma jeszcze
# własny plik, grupa synchronizowana kopiuje drugi → „Multiple commands produce”. Zapisuje do kopii projektu, nie do oryginału.
# Użycie: gem install xcodeproj; cp -r ios <kopia>/ios; ruby scripts/wydanie/agregacja-manifestu.rb <kopia>/ios/Oczko.xcodeproj node_modules/react-native/scripts/cocoapods/privacy_manifest_utils.rb
require 'xcodeproj'
module Pod; module UI; def self.puts(*_); end; end; end
require File.expand_path(ARGV[1])
Instalator = Struct.new(:aggregate_targets, :pod_targets); Cel = Struct.new(:user_project)
projekt = Xcodeproj::Project.open(ARGV[0])
PrivacyManifestUtils.add_aggregated_privacy_manifest(Instalator.new([Cel.new(projekt)], []))
projekt.save
Xcodeproj::Project.open(ARGV[0]).targets.each do |t|
  next unless t.respond_to?(:resources_build_phase)
  odwolania = t.resources_build_phase.files_references.map { |r| r&.real_path.to_s }.select { |p| p.end_with?('PrivacyInfo.xcprivacy') }
  puts "#{t.name} (#{t.symbol_type}): jawne odwołania w fazie zasobów=#{odwolania.size} #{odwolania.map { |p| p.sub(Dir.pwd + '/', '') }.inspect}"
end
