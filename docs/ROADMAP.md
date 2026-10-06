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
- [ ] Onboarding: isim, sınav, tekrar sayısı, isteğe bağlı sınav tarihi (SPEC §2)
- [ ] Sınava göre hazır derslerin oluşturulması
- [ ] Sekme yapısı: Bugün, Klasörler, İstatistik, Ayarlar (içleri boş olabilir)
- [ ] Klasörler ekranı: ders listesi, konu alt seviyesi, ekle/düzenle/sil/sırala/renk (SPEC §3)

## Faz 2 — Soru ekleme
- [ ] Kamera ve galeriden fotoğraf seçme
- [ ] Kırpma + döndürme + sıkıştırma, uygulama klasörüne kaydetme (SPEC §4)
- [ ] Soru ekleme formu: çözüm fotoğrafı, doğru şık, etiketler, not, kaynak, klasör
- [ ] Kullanıcının kendi hata nedeni etiketini eklemesi (SPEC §4)
- [ ] Soru listesi (Aktif/Tamamlanan sekmeleri) ve soru detay/düzenleme ekranı (SPEC §7)
- [ ] Soru silme (fotoğraf dosyalarıyla birlikte, onaylı)

## Faz 3 — Aralıklı tekrar (uygulamanın kalbi)
- [ ] `src/domain/spacedRepetition.ts` + kapsamlı testler (SPEC §5 tüm kurallar)
- [ ] Tekrar ekranı: soru → "Çözümü göster" → sağa/sola kaydırma + butonlar + geri al (SPEC §6)
- [ ] `review_logs` kaydı, serbest çalışma ayrımı
- [ ] Oturum sonu özeti
- [ ] Ana ekran: selamlama, "Bugün tekrar edilecek" kartı, geri sayım, seri (SPEC §8)

## Faz 4 — Ayarlar ve bildirim
- [ ] Ayarlar ekranı (SPEC §12), N değişince mevcut soruların güncellenmesi
- [ ] Günlük yerel bildirim, saat seçimi, izin akışı (SPEC §10)

## Faz 5 — Yedekleme
- [ ] Yedek dosyası formatı (sürüm numaralı) — karar gerekirse önce sor (native zip paketi Expo Go'da çalışmayabilir)
- [ ] Dışa aktar + paylaş, içe aktar + üzerine yazma uyarısı (SPEC §11)
- [ ] "Son yedek" bilgisi ve hatırlatma
- [ ] Gerçek bir yedeği silip geri yükleyerek uçtan uca test

## Faz 6 — İstatistik
- [ ] Ders bazında sayılar, tamamlanma oranı
- [ ] Hata nedeni dağılımı (genel + ders bazında)
- [ ] Seri ve son 30 gün grafiği (SPEC §9)

## Faz 7 — Cila ve yayına hazırlık
- [ ] Boş durumlar ("Henüz soru eklemedin"), yükleniyor durumları, hata mesajları
- [ ] Karanlık mod ve küçük ekran (iPhone SE) kontrolü
- [ ] Uygulama ikonu ve açılış ekranı (isim: biDaha)
- [ ] Gerçek iPhone'da test (development build)
- [ ] App Store için: gizlilik açıklaması ("veri toplanmaz"), ekran görüntüleri, EAS Build + Submit

## Sonraki fikirler (kapsam dışı)
Karışık tekrar, arama/filtre, PDF dışa aktarma, iCloud yedeği, OCR, yapay zekâ çözüm, Android.
