# biDaha – Yanlış Soru Defteri

YKS, DGS ve KPSS'ye hazırlananlar için yanlış soru defteri. Çözemediğin sorunun fotoğrafını çek, neden yapamadığını işaretle; biDaha soruyu aralıklı tekrarla doğru günlerde tekrar karşına çıkarsın.

Hesap yok, sunucu yok, internet gerekmez: tüm veriler yalnızca telefonda tutulur.

## Özellikler

- Kamera/galeriden soru ve çözüm fotoğrafı, serbest kırpma ve döndürme
- Doğru şık, not, kaynak, hata nedeni etiketleri (kullanıcı etiketi dahil)
- Ders › konu klasörleri; sınava göre hazır dersler
- Aralıklı tekrar (1, 3, 7, 14, 30, 60 gün…), kaydırmalı tekrar kartları, geri al
- Günlük yerel hatırlatma, sınav geri sayımı, tekrar serisi
- İstatistik: son 30 gün, ders bazında ilerleme, hata nedeni dağılımı
- Tek dosya yedekleme ve geri yükleme (`.bidaha`)
- Açık/koyu mod, büyük yazı desteği

## Teknoloji

Expo (SDK 57) · React Native · TypeScript (strict) · expo-router · expo-sqlite · Jest

## Geliştirme

```bash
npm install
npx expo start        # simülatör için "i"
npx tsc --noEmit      # tip kontrolü
npx expo lint         # lint
npx jest              # testler
```

Uygulama ikonları `swift scripts/generate-icons.swift` ile üretilir.

## Belgeler

- [`docs/SPEC.md`](docs/SPEC.md) — ürün tanımı ve alınan kararlar
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — yol haritası
- [`docs/app-store.md`](docs/app-store.md) — App Store metinleri
- [`docs/privacy-policy.md`](docs/privacy-policy.md) — gizlilik politikası
- [`CLAUDE.md`](CLAUDE.md) — geliştirme kuralları

## Lisans

Tüm hakları saklıdır. Ayrıntı için [`LICENSE`](LICENSE).
