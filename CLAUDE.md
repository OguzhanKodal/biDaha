# biDaha — Claude Code için proje kuralları

## Proje özeti
Uygulamanın adı **biDaha** (yazımı her yerde tam olarak böyle: küçük "b", büyük "D").
Teknik kimlik: slug `bidaha`, iOS bundle ID `com.kodal.bidaha` (`app.json` içinde). Web desteklenmez (`platforms: ios, android`).

YKS, DGS, KPSS gibi sınavlara hazırlananlar için **yanlış soru defteri** uygulaması (sadece iPhone, ileride Android olabilir).
Kullanıcı çözemediği sorunun fotoğrafını çeker, isteğe bağlı olarak çözüm fotoğrafı, doğru şık, hata nedeni etiketi ve not ekler.
Sorular ders › konu klasörlerinde durur ve **aralıklı tekrar** sistemiyle tekrar edilir.
**Tüm veriler sadece telefonda tutulur. Sunucu, hesap ve bulut yok.**

Detaylı ürün tanımı: `docs/SPEC.md` — her özellikten önce ilgili bölümü oku.
Yol haritası ve ilerleme: `docs/ROADMAP.md` — biten maddeleri işaretle.

## Teknoloji
- Expo (güncel SDK) + React Native + **TypeScript (strict)**
- Navigasyon: expo-router (dosya tabanlı, `src/app/` klasörü)
- Veritabanı: expo-sqlite (tüm erişim `src/db/` üzerinden)
- Fotoğraflar: expo-image-picker (kamera + galeri), expo-image-manipulator (döndürme, kırpma, sıkıştırma), dosyalar expo-file-system ile uygulama klasöründe
- Kaydırma ve animasyon: react-native-gesture-handler + react-native-reanimated
- Bildirim: expo-notifications (sadece yerel bildirim)
- Paylaşım/yedek: expo-sharing, expo-document-picker
- Durum yönetimi: gerekirse zustand; önce React state ve veritabanı sorguları yeterli mi diye bak

## Komutlar
- Geliştirme sunucusu: `npx expo start` (simülatör için `i`)
- Tip kontrolü: `npx tsc --noEmit`
- Lint: `npx expo lint`
- Testler: `npx jest`
- Paket ekleme: **her zaman `npx expo install <paket>`** (npm install değil; Expo uyumlu sürümü seçer)

## Klasör yapısı
```
src/
  app/                  # Ekranlar (expo-router) — burada sadece route dosyaları olur
    (onboarding)/       # İlk açılış: name → exam → repetitions → exam-date
    (tabs)/             # Ana sekmeler (NativeTabs): index=Bugün, folders, stats, settings
      folders/          # Klasörler sekmesinin kendi Stack'i (sekme çubuğu görünür kalır)
        index.tsx       # Ders listesi
        [id].tsx        # Ders/konu içeriği
        edit.tsx        # Ders/konu ekle-düzenle (modal)
        move.tsx        # Silmeden önce soruları taşı (modal)
    question/[id].tsx   # Soru detayı
    question/new.tsx    # Soru ekleme
    review.tsx          # Tekrar oturumu (kart + kaydırma)
  db/                   # Şema, migration'lar, sorgular (repository fonksiyonları)
  domain/               # Saf iş mantığı: aralıklı tekrar, istatistik, sınav ön ayarları
  features/             # Özelliğe özel bileşen ve hook'lar (questions, review, folders, backup...)
  components/           # Genel UI bileşenleri
  lib/                  # Yardımcılar: tarih, dosya, bildirim
  theme/                # Renkler, yazı tipleri, aralıklar
__tests__/              # domain/, db/ (node:sqlite ile gerçek SQL) ve lib/ testleri
docs/                   # SPEC.md, ROADMAP.md, kararlar
```

## Kurallar
1. **Kullanıcı verisi kutsaldır.** Veri yalnızca telefonda olduğu için kaybolursa geri gelmez.
   - Şema değişikliği yalnızca numaralı migration ile yapılır, mevcut migration'lar asla düzenlenmez.
   - Fotoğraf dosyası, veritabanı kaydı silinmeden önce silinmez; silme işlemleri onay ister.
   - Veritabanı değişikliklerinde `veritabani-degisikligi` skill'ini izle.
   - Sorgular `src/db/database.ts` arayüzünü alır; yazmalarda `withTransactionAsync` kullan (`withExclusiveTransactionAsync` ayrı bağlantı açar, orada `foreign_keys` kapalıdır).
2. **İş mantığı `src/domain/` içinde saf fonksiyon** olarak yazılır ve test edilir (özellikle aralıklı tekrar hesabı).
   Ekranlar hesaplama yapmaz, domain fonksiyonlarını çağırır.
3. **Tarihler yerel gün olarak** tutulur (`YYYY-MM-DD`). "Bugün tekrar edilecekler" saat dilimine göre değil, kullanıcının gününe göre hesaplanır.
4. **Arayüz metinleri Türkçe**, kod (değişken, fonksiyon, dosya adları) İngilizce.
5. Küçük adımlarla ilerle: her adımdan sonra `npx tsc --noEmit` ve ilgili testler geçmeli.
6. **Expo Go'da çalışmayan (native) bir paket eklemeden önce sor.** Gerekirse development build'e geçeriz.
7. Yeni bağımlılık eklemeden önce mevcut Expo paketleriyle çözülüp çözülmediğine bak.
8. Bir faz bitince `docs/ROADMAP.md` içindeki maddeleri işaretle; SPEC'ten sapan bir karar alındıysa SPEC'i güncelle.
9. Erişilebilirlik: dokunma alanları en az 44pt, renk tek başına anlam taşımasın (rozet + ikon/metin).
10. Karanlık mod baştan desteklenir; renkler `src/theme/` dışında sabit yazılmaz.
