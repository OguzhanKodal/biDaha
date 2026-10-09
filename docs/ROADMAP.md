# Yol Haritası

Her faz ayrı bir Claude Code oturumunda yapılabilir. Faz bitince maddeleri `[x]` yap, simülatörde dene, sonra git commit at.

## Faz 0 — Temel kurulum
- [x] `app.json`: name "biDaha", slug "bidaha", iOS bundleIdentifier `com.kodal.bidaha`
- [x] Expo projesini temizle (örnek ekranları kaldır), klasör yapısını CLAUDE.md'ye göre oluştur
- [x] TypeScript strict, ESLint, Jest (jest-expo) kurulumu
- [x] `src/theme/` — renkler (açık/koyu), yazı boyutları, aralıklar
- [x] expo-sqlite kurulumu, migration sistemi, ilk şema (SPEC §13)
- [x] Hata nedeni etiketleri ve sınav ön ayarları (`src/domain/examPresets.ts`)

## Faz 1 — Onboarding ve klasörler
- [x] Onboarding: isim, sınav, tekrar sayısı, isteğe bağlı sınav tarihi (SPEC §2)
- [x] Sınava göre hazır derslerin oluşturulması
- [x] Sekme yapısı: Bugün, Klasörler, İstatistik, Ayarlar (içleri boş olabilir)
- [x] Klasörler ekranı: ders listesi, konu alt seviyesi, ekle/düzenle/sil/sırala/renk (SPEC §3)

## Faz 2 — Soru ekleme
- [x] Kamera ve galeriden fotoğraf seçme
- [x] Kırpma + döndürme + sıkıştırma, uygulama klasörüne kaydetme (SPEC §4)
- [x] Soru ekleme formu: çözüm fotoğrafı, doğru şık, etiketler, not, kaynak, klasör
- [x] Kullanıcının kendi hata nedeni etiketini eklemesi (SPEC §4)
- [x] Soru listesi (Aktif/Tamamlanan sekmeleri) ve soru detay/düzenleme ekranı (SPEC §7)
- [x] Soru silme (fotoğraf dosyalarıyla birlikte, onaylı)
- [x] Klasör silmede "Sorularla birlikte sil" seçeneği (şimdilik sadece taşıma var)

## Faz 3 — Aralıklı tekrar (uygulamanın kalbi)
- [x] `src/domain/spacedRepetition.ts` + kapsamlı testler (SPEC §5 tüm kurallar)
- [x] Tekrar ekranı: soru → "Çözümü göster" → sağa/sola kaydırma + butonlar + geri al (SPEC §6)
- [x] `review_logs` kaydı, serbest çalışma ayrımı
- [x] Oturum sonu özeti
- [x] Ana ekran: selamlama, "Bugün tekrar edilecek" kartı, geri sayım, seri (SPEC §8)

## Faz 4 — Ayarlar ve bildirim
- [x] Ayarlar ekranı (SPEC §12), N değişince mevcut soruların güncellenmesi
- [x] Günlük yerel bildirim, saat seçimi, izin akışı (SPEC §10)

## Faz 5 — Yedekleme
- [x] Yedek dosyası formatı (sürüm numaralı): `.bidaha` = TAR (kendi okuyucu/yazıcımız, Expo Go uyumlu)
- [x] Dışa aktar + paylaş, içe aktar + üzerine yazma uyarısı (SPEC §11)
- [x] "Son yedek" bilgisi ve hatırlatma
- [x] Gerçek bir yedeği silip geri yükleyerek uçtan uca test

## Faz 6 — İstatistik
- [x] Ders bazında sayılar, tamamlanma oranı
- [x] Hata nedeni dağılımı (genel + ders bazında)
- [x] Seri ve son 30 gün grafiği (SPEC §9)

## Faz 7 — Cila ve yayına hazırlık
- [x] Boş durumlar ("Henüz soru eklemedin"), yükleniyor durumları, hata mesajları
- [x] Karanlık mod ve küçük ekran (iPhone SE) kontrolü — en büyük yazı boyutu (Dynamic Type) dahil
- [x] Uygulama ikonu ve açılış ekranı (isim: biDaha) — `scripts/generate-icons.swift` ile üretilir (açık/koyu iOS ikonu, açılış, Android)
- [x] Gerçek iPhone'da test (development build)
- [x] App Store metinleri ve gizlilik politikası (`docs/app-store.md`, `docs/privacy-policy.md`), `eas.json`, şifreleme beyanı
- [x] Gizlilik politikasını GitHub Pages ile yayınla: https://oguzhankodal.github.io/biDaha/privacy-policy
- [x] Apple Developer hesabı onaylanınca: `expo-dev-client` + development build ile gerçek iPhone testi
- [x] Mağaza ekran görüntüleri (6.9", gerçekçi verilerle) — `scripts/store/`
- [x] EAS Build (production) + Submit — 1.0.0 (2) App Store Connect'e yüklendi (ASC App ID 6820660223)
- [x] App Store Connect formu + incelemeye gönderim (1.0.0 (2), 9 Ekim 2026)
- [ ] Apple incelemesi sonucu → yayın

## Faz 8 — Android ve Google Play
- [x] Android uyarlaması: Material ikon karşılıkları, Android tarih/saat seçicisi, 3 buton sınırına uygun sınav ekranı ve sıralama çipleri, bildirim kanalı, klavye (KeyboardSafeView), geri tuşunda kaydedilmemiş form onayı, sekme çubuğu teması, `com.kodal.bidaha`
- [x] Android öykünücüsünde (Pixel 7, Android 15) uçtan uca deneme: onboarding, soru ekleme + kırpma, tekrar
- [ ] Play Console: uygulama kaydı, mağaza sayfası (tanıtım görseli 1024×500, ekran görüntüleri), veri güvenliği formu, içerik derecelendirmesi, hedef kitle
- [ ] Android production derlemesi (AAB) + ilk yüklemeyi elle yapma
- [ ] Kapalı test: en az 12 test kullanıcısı, 14 gün (kişisel hesap şartı)
- [ ] Üretim yayınına başvuru

## Sonraki fikirler (kapsam dışı)
Karışık tekrar, arama/filtre, PDF dışa aktarma, iCloud yedeği, OCR, yapay zekâ çözüm, Android.

**Android'e geçerken:** SF Symbols sadece iOS'ta var; `src/components/Icon.tsx` ve `(tabs)/_layout.tsx` içindeki her ikon için Android (Material) karşılığı tanımlanmalı. `@expo/ui/swift-ui` tarih seçicisinin Android karşılığı gerekir.
