# biDaha — Ürün Tanımı (SPEC)

> App Store adı önerisi: **biDaha – Yanlış Soru Defteri**

## 1. Amaç
Sınava hazırlanan öğrencinin çözemediği soruları fotoğrafla kaydedip, nedenini not alıp, aralıklı tekrarla kalıcı olarak öğrenmesini sağlamak.
Hedef sınavlar: YKS, DGS, KPSS (+ "Diğer").
**Gizlilik:** Hesap yok, internet gerekmez, tüm veriler telefonda.

## 2. İlk açılış (onboarding)
Kısa ve atlanamaz 3 adım + 1 isteğe bağlı adım:
1. **İsim** (sadece selamlama için: "Merhaba Ayşe")
2. **Hazırlandığı sınav:** YKS / DGS / KPSS / Diğer → hazır klasörleri belirler
3. **Bir soru kaç kez tekrar edilsin:** 3–10 arası seçici, varsayılan 5
4. *(İsteğe bağlı)* **Sınav tarihi** → ana ekranda geri sayım
Hepsi sonradan Ayarlar'dan değiştirilebilir.
İsim zorunlu (en fazla 30 karakter). Sınav tarihi bugünden önce olamaz. Cevaplar son adımda tek seferde kaydedilir; yarıda kalan onboarding baştan başlar.

## 3. Klasörler
İki seviye: **Ders › Konu** (ör. Matematik › Türev). Soru bir derse ya da konuya eklenebilir.
Sınav seçimine göre hazır dersler gelir; kullanıcı ders/konu ekleyebilir, yeniden adlandırabilir, silebilir, sıralayabilir, renk seçebilir.

Hazır dersler:
- **YKS:** TYT Türkçe, TYT Matematik, TYT Geometri, TYT Fizik, TYT Kimya, TYT Biyoloji, TYT Tarih, TYT Coğrafya, TYT Felsefe, TYT Din Kültürü, AYT Matematik, AYT Geometri, AYT Fizik, AYT Kimya, AYT Biyoloji, AYT Edebiyat, AYT Tarih, AYT Coğrafya, AYT Felsefe Grubu
- **DGS:** Matematik, Geometri, Sayısal Mantık, Türkçe, Sözel Mantık
- **KPSS:** Türkçe, Matematik, Geometri, Tarih, Coğrafya, Vatandaşlık, Güncel Bilgiler
- **Diğer:** boş başlar

Sınav sonradan değiştirilirse mevcut klasörler silinmez; yeni sınavın eksik dersleri eklenmesi önerilir.
Klasör renkleri `src/theme/` paletinden seçilir; veritabanında renk kodu değil palet anahtarı (ör. `blue`) tutulur, böylece açık/koyu modda farklı ton gösterilebilir.
İçinde soru olan klasör silinirken onay istenir (sorular silinsin mi / başka klasöre mi taşınsın).

Klasör kartında: ad, toplam soru, bugün tekrar edilecek sayısı, tamamlanma oranı. Dersin sayılarına konularındaki sorular da dahildir.
Klasör adı boş olamaz, en fazla 40 karakter, aynı seviyede (aynı ders altında ya da dersler arasında) tekrar edemez.
Sıralama "Düzenle" modunda ↑↓ butonlarıyla yapılır; karta uzun basınca Düzenle/Sil menüsü açılır.
Ders silinince konuları da silinir. İçinde (konular dahil) soru varsa önce sorular başka bir klasöre taşınır; "sorularla birlikte sil" seçeneği soru silme (Faz 2) ile gelir.

## 4. Soru ekleme
| Alan | Zorunlu | Not |
|---|---|---|
| Soru fotoğrafı | Evet | Kamera veya galeri; kırpma + 90° döndürme |
| Çözüm fotoğrafı | Hayır | Sonradan da eklenebilir |
| Doğru şık | Hayır | A / B / C / D / E |
| Hata nedeni etiketleri | Hayır | Birden fazla seçilebilir (aşağıda) |
| Not | Hayır | Serbest metin |
| Kaynak | Hayır | Kitap/deneme adı + sayfa no; son kullanılanlar önerilir |
| Klasör | Evet | Ders ya da konu; içinde bulunulan klasör varsayılan |

**Hata nedeni etiketleri:** Dikkatsizlik, Bilgi eksikliği, Süre yetmedi, Soruyu yanlış okuma, İşlem hatası, Yorumlayamadım.
Kullanıcı kendi etiketlerini de ekleyebilir (hazır etiketler `is_default = 1`). Ad boş olamaz, en fazla 40 karakter, mevcut bir etiketle aynı olamaz (büyük/küçük harf farkı gözetilmez).

**Fotoğraf işleme:** Uzun kenar en fazla ~1600 px, JPEG ~%70 kalite. Dosyalar uygulamanın kendi klasöründe tutulur, galeriye kaydedilmez.

## 5. Aralıklı tekrar
Kullanıcının seçtiği tekrar sayısı = **N** (varsayılan 5). Aralıklar (gün): **1, 3, 7, 14, 30, 60, ...**

- Soru eklendiğinde: `başarı = 0`, `sonraki tekrar = yarın`
- **Sağa kaydır (Çözdüm):** `başarı + 1`
  - `başarı >= N` ise → soru **Tamamlandı**
  - değilse → `sonraki tekrar = bugün + aralık[başarı]` (1. başarıdan sonra 3 gün, 2.'den sonra 7 gün…)
- **Sola kaydır (Çözemedim):** başarı sayılmaz (değişmez), `son sonuç = başarısız`, `sonraki tekrar = yarın`
- **Erken tekrar:** Günü gelmemiş soru klasörden açılıp çalışılabilir ama sayaca sayılmaz ("serbest çalışma"). Bu, aynı gün art arda 5 tekrarla soruyu bitirmeyi önler.
- **Gecikme:** Günü geçmiş sorular "Bugün" listesinde kalır; ceza yok.
- **N değişirse:** Tüm aktif sorulara uygulanır; `başarı >= yeni N` olanlar Tamamlandı'ya geçer. N artırılırsa zaten Tamamlanan sorular tamamlanmış kalır (aktife dönmez).
- **Tamamlanan soru** istenirse "Tekrar aktif et" ile başarı 0'a döner ve yarına planlanır.

Tüm hesaplar `src/domain/spacedRepetition.ts` içinde saf fonksiyon olarak yazılır ve testlenir.

## 6. Tekrar ekranı
1. Kart üzerinde **sadece soru fotoğrafı** (yakınlaştırılabilir).
2. **"Çözümü göster"** → çözüm fotoğrafı, doğru şık, etiketler, not, kaynak açılır.
3. Kaydırma: **sağa = Çözdüm** (yeşil), **sola = Çözemedim** (kırmızı). Kaydırmanın yanında butonlar da olsun (erişilebilirlik).
4. Son işlem için **Geri al**.
5. Oturum sonunda özet: kaç soru, kaçı çözüldü, kaçı tamamlandı.

Oturum kaynakları: "Bugün tekrar edilecekler" (tümü), bir ders/konu, ya da serbest çalışma.

## 7. Soru listesi ve görünüm
Klasör içinde iki sekme: **Aktif** ve **Tamamlanan**.
Soru kartında: küçük fotoğraf, ilerleme rozeti **"2/5"**, sonraki tekrar günü ("Bugün", "3 gün sonra"), etiketler.
- Aktif sorular kırmızı tonlu rozetle gösterilir; son tekrarında çözülemeyen soruda ek olarak "Çözemedin" işareti olur.
- Tamamlanan sorular yeşil.
Sıralama: sonraki tekrar tarihi (varsayılan), eklenme tarihi, en çok başarısız.

## 8. Ana ekran (Bugün sekmesi)
- "Merhaba {isim}"
- Sınav geri sayımı ("YKS'ye 247 gün") — tarih girildiyse
- **"Bugün tekrar edilecek: 12 soru"** kartı → Tekrara başla
- Seri: "6 gündür üst üste tekrar yapıyorsun"
- Hızlı soru ekleme butonu

## 9. İstatistik
- Ders bazında: toplam soru, tamamlanan oranı
- Hata nedeni dağılımı (genel ve ders bazında): "Matematik yanlışlarının %45'i dikkatsizlik"
- Seri ve son 30 günün tekrar sayıları
Tekrar kayıtları (`review_logs`) tutulur; istatistikler buradan hesaplanır.

## 10. Bildirim
Günlük yerel hatırlatma, saati Ayarlar'dan seçilir (varsayılan 20:00), kapatılabilir.
Metin: "Bugün 8 soru seni bekliyor". Bekleyen soru yoksa bildirim gönderilmez.
İzin, ilk kez bildirim açılırken istenir (onboarding'de değil).

## 11. Yedekleme
- **Dışa aktar:** Veritabanı + tüm fotoğraflar tek bir yedek dosyası olarak; paylaşım menüsüyle Dosyalar, AirDrop, Drive vb.ye kaydedilir.
- **İçe aktar:** Yedek dosyası seçilir, mevcut verinin üzerine yazılacağı açıkça uyarılır.
- Yedek dosyası bir sürüm numarası içerir (ileride format değişirse uyumluluk için).
- Ayarlar'da "Son yedek: 12 gün önce" bilgisi; 30 günü geçince nazik hatırlatma.

## 12. Ayarlar
İsim, sınav, tekrar sayısı (N), sınav tarihi, bildirim (aç/kapa + saat), yedekle/geri yükle, klasör yönetimi, tüm verileri sil (çift onaylı), hakkında.

## 13. Veri modeli (taslak)
- **settings:** name, exam_type, target_repetitions, exam_date?, notifications_enabled, notification_time, last_backup_at?, onboarding_done
- **folders:** id, name, parent_id?, color, sort_order, created_at
- **questions:** id, folder_id, question_image, solution_image?, correct_answer?, note?, source_name?, source_page?, success_count, next_review_date, last_result?, completed_at?, created_at, updated_at
- **error_tags:** id, name, is_default
- **question_tags:** question_id, tag_id
- **review_logs:** id, question_id, reviewed_at, review_date, result (success/fail), counted (bool — serbest çalışma için false)

**Uygulama kuralları:**
- `settings` tek satırlık tablodur (`id = 1`), ilk migration'da varsayılanlarla oluşturulur (N = 5, bildirim kapalı, saat 20:00).
- `*_date` sütunları yerel gün (`YYYY-MM-DD`), `*_at` sütunları ISO 8601 zaman damgasıdır.
- Fotoğraf sütunları uygulama klasörüne göre **göreli yol** tutar (iOS uygulama klasörünün mutlak yolu güncellemelerde değişebilir).
- `folders.color` palet anahtarıdır. Klasör, içinde soru ya da alt konu varken veritabanı seviyesinde silinemez (`RESTRICT`); silme akışı uygulamada onayla yapılır.
- Soru silinince `question_tags` ve `review_logs` kayıtları da silinir (`CASCADE`); silinen soru istatistiklerden düşer.
- Şema sürümü `PRAGMA user_version` ile tutulur; migration'lar `src/db/migrations/` altındadır.

## 14. Kapsam dışı (şimdilik)
Hesap/bulut senkronu, yapay zekâ çözümü, OCR, PDF dışa aktarma, karışık tekrar modu, arama, iPad/Android optimizasyonu, Apple Watch.

## 15. Görsel dil
Sıcak, mat pastel tonlar (Apple varsayılanlarından bilinçli olarak uzak): krem zemin, hardal sarısı ana renk, adaçayı yeşili (Çözdüm) ve kiremit kırmızısı (Çözemedim); koyu modda sıcak koyu kahve zemin. Klasör renkleri pastel 9 tonluk paletten seçilir. Açık sarı dolgu üzerine koyu yazı; yazı/ikon vurguları ayrı, koyu bir hardal tonuyla (`accent`). Tüm yazı/zemin eşleşmeleri WCAG 4.5:1 kontrastı sağlar. Renkler `src/theme/colors.ts` dışında yazılmaz.
