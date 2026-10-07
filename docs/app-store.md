# App Store bilgileri

App Store Connect'e girilecek metinler ve cevaplar. Karakter sınırları kontrol edildi.

## Temel bilgiler

| Alan | Değer |
|---|---|
| Ad (30) | biDaha – Yanlış Soru Defteri *(28)* |
| Alt başlık (30) | Çözemediğin soruyu tekrar et *(28)* |
| Bundle ID | `com.kodal.bidaha` |
| Birincil kategori | Eğitim (Education) |
| İkincil kategori | Verimlilik (Productivity) |
| Yaş sınırı | 4+ (anketteki tüm sorulara "Hayır") |
| Fiyat | Ücretsiz |
| Telif | 2026 Oguzhan Kodal |
| Cihaz | Sadece iPhone |

## Tanıtım metni (170)

Çözemediğin soruların fotoğrafını çek, nedenini işaretle; biDaha onları tam unutmak üzereyken karşına çıkarsın. Hesap yok, internet gerekmez, her şey telefonunda.

*(162 karakter — uygulama güncellemesi olmadan değiştirilebilir)*

## Anahtar kelimeler (100)

```
yks,tyt,ayt,kpss,dgs,soru,defteri,yanlış,tekrar,aralıklı,sınav,ders,çalışma,deneme,hata,not,test
```

*(96 karakter; virgülden sonra boşluk yok, ad ve alt başlıktaki kelimeler tekrar edilmez ama "soru, defteri, yanlış" aramada tek başına da geçsin diye bırakıldı)*

## Açıklama (4000)

Yanlış yaptığın sorular, sınavda seni en çok ilerletecek sorulardır — ama sadece tekrar edersen.

biDaha, YKS, DGS ve KPSS'ye hazırlananlar için bir yanlış soru defteri. Çözemediğin sorunun fotoğrafını çek, neden yapamadığını işaretle; biDaha soruyu aralıklı tekrar yöntemiyle tam unutmak üzereyken tekrar karşına çıkarsın. Bir soruyu farklı günlerde birkaç kez çözdüğünde o soru "tamamlandı" olur.

**Fotoğrafla saniyeler içinde ekle**
• Kameradan ya da galeriden soru fotoğrafı
• Serbest kırpma ve döndürme
• İsteğe bağlı çözüm fotoğrafı, doğru şık, not ve kaynak (kitap / sayfa)
• Hata nedeni: dikkatsizlik, bilgi eksikliği, süre yetmedi, soruyu yanlış okuma, işlem hatası, yorumlayamadım — ya da kendi etiketin

**Aralıklı tekrar**
• Sorular 1, 3, 7, 14, 30, 60 gün aralıklarla tekrar edilir
• Kartı sağa kaydır: Çözdüm. Sola kaydır: Çözemedim
• Önce sadece soru; "Çözümü göster" ile çözüm, doğru şık ve notların açılır
• Kaç tekrarda tamamlanacağını sen seçersin (3–10)
• Günü gelmemiş sorularla serbest çalışma

**Düzenli klasörler**
• Sınavına göre dersler hazır gelir (TYT/AYT, DGS, KPSS)
• Ders › konu klasörleri, renkler, sıralama

**Motivasyon ve istatistik**
• Günlük hatırlatma: "Bugün 8 soru seni bekliyor"
• Sınav geri sayımı ve tekrar serisi
• Son 30 günün tekrarları, ders bazında ilerleme
• En sık yaptığın hata türleri: "Matematik sorularında en sık neden: Dikkatsizlik"

**Gizlilik**
Hesap yok, reklam yok, internet gerekmez. Soruların, fotoğrafların ve ilerlemen yalnızca senin telefonunda saklanır; hiçbir veri toplanmaz. İstersen tüm verini tek bir yedek dosyası olarak dışa aktarabilir, yeni telefonuna taşıyabilirsin.

## Bu sürümdeki yenilikler

İlk sürüm.

## Uygulama gizliliği (App Privacy)

- **Veri toplama:** "Hayır, bu uygulamadan veri toplamıyoruz" → etiket: **Data Not Collected / Veri Toplanmaz**.
- Gerekçe: Hesap, analitik, reklam, çökme raporlama, sunucu yok. Tüm veriler cihazda (SQLite + uygulama klasöründeki fotoğraflar). Bildirimler yerel. Yedek dosyası yalnızca kullanıcı paylaştığında ve kullanıcının seçtiği yere gider.
- **Gizlilik politikası URL'si:** `docs/privacy-policy.md` GitHub Pages ile yayınlanınca o adres girilir.
- **Şifreleme:** Standart dışı şifreleme yok — `app.json` içinde `ios.config.usesNonExemptEncryption: false`.

## İzin metinleri (Info.plist)

| İzin | Metin |
|---|---|
| Kamera | biDaha, çözemediğin soruların fotoğrafını çekebilmek için kameraya erişir. Fotoğraflar telefonundan çıkmaz. |
| Fotoğraflar | biDaha, çözemediğin soruların fotoğraflarını galeriden seçebilmek için fotoğraflarına erişir. Fotoğraflar telefonundan çıkmaz. |
| Bildirim | Uygulama içinde, onboarding'in hatırlatma adımında ya da Ayarlar'da istenir. |

## İnceleme notu (App Review)

> biDaha hesap gerektirmez; giriş bilgisi yoktur. Açılışta isim, sınav, tekrar sayısı, isteğe bağlı sınav tarihi ve hatırlatma saati sorulur. Soru eklemek için Klasörler → bir ders → "Soru ekle" ya da Bugün → "Soru ekle". Kamera ve fotoğraf izinleri yalnızca soru fotoğrafı eklemek için kullanılır. Tüm veriler cihazda saklanır, ağ isteği yapılmaz.

## Ekran görüntüleri

App Store 6.9" iPhone ekran görüntüsü ister (1320 × 2868; iPhone 17 Pro Max simülatörü). Önerilen sıra:

1. Bugün — "Bugün tekrar edilecek: 12 soru", geri sayım, seri
2. Tekrar ekranı — kart, Çözdüm / Çözemedim
3. Soru ekleme — fotoğraf, doğru şık, hata nedenleri
4. Kırpma ekranı
5. Klasörler — renkli dersler
6. İstatistik — 30 gün grafiği ve hata nedenleri
7. Koyu mod görünümü

Gerçekçi örnek verilerle (gerçek soru fotoğrafları) çekilmeli.
