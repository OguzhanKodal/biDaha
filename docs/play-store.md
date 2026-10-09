# Google Play bilgileri

Play Console'a girilecek metinler ve cevaplar. Açıklama ve gizlilik cevapları App Store ile aynı kimliği korur (bkz. `docs/app-store.md`).

## Temel bilgiler

| Alan | Değer |
|---|---|
| Uygulama adı (30) | biDaha – Yanlış Soru Defteri *(28)* |
| Paket adı | `com.kodal.bidaha` (değiştirilemez) |
| Varsayılan dil | Türkçe (tr-TR) |
| Tür | Uygulama, Ücretsiz |
| Kategori | Eğitim |
| Gizlilik politikası | https://oguzhankodal.github.io/biDaha/privacy-policy |
| İletişim | e-posta (zorunlu) + web sitesi: https://github.com/OguzhanKodal/biDaha |

## Kısa açıklama (80)

```
YKS, DGS, KPSS için yanlış soru defteri: fotoğrafla, aralıklı tekrarla öğren.
```

*(77 karakter)*

## Tam açıklama (4000)

App Store açıklamasının aynısı kullanılır (`docs/app-store.md` → "Açıklama").

## Görseller

| Görsel | Dosya | Şart |
|---|---|---|
| Uygulama simgesi | `store/play/icon-512.png` | 512×512 PNG |
| Öne çıkan grafik | `store/play/feature-graphic.png` | 1024×500, saydamlıksız |
| Telefon ekran görüntüleri | `store/play/screenshots/*.png` (6 adet) | 1080×1920 (9:16), saydamlıksız |

Üretim: `swiftc -O -o fg scripts/store/feature-graphic.swift && ./fg assets/images/icon.png store/play/feature-graphic.png`; ekran görüntüleri `eas build -p android --profile preview-simulator` (APK) ile öykünücüde çekilip `compose <ham> store/play/screenshots 1080 1920` ile başlıklanır. Öykünücüdeki sistem "demo" durum çubuğu açık temada soluk çıkar; açık tema ekranları demo modu kapalıyken çekilir.

## Uygulama içeriği beyanları

| Bölüm | Cevap |
|---|---|
| Uygulama erişimi | Tüm işlevler özel erişim gerektirmeden kullanılabilir |
| Reklamlar | Hayır |
| İçerik derecelendirmesi (IARC) | Referans/Eğitim; tüm içerik soruları Hayır; kullanıcı etkileşimi/paylaşım yok → 3+ / Herkes |
| Hedef kitle | 13–15, 16–17, 18+ (13 altı seçilmez → "Aileler" politikası dışında) |
| Veri güvenliği | Veri toplanmaz, veri paylaşılmaz |
| Haber / sağlık / finans / devlet | Hayır |

## Yayın süreci (kişisel hesap)

1. Production AAB: `eas build -p android --profile production`. **İlk yükleme Play Console'dan elle** yapılır (Google ilk sürümü API ile kabul etmez); sonraki sürümler `eas submit -p android` ile gönderilebilir (servis hesabı anahtarı gerekir — anahtar dosyası depoya konmaz).
2. Kapalı test kanalı: en az **12 test kullanıcısı**, **14 gün kesintisiz** (2023 sonrası açılan kişisel hesaplar için zorunlu).
3. Ardından Play Console'dan üretim erişimi başvurusu → Google incelemesi.
