# biDaha — Ürün Tanımı (SPEC)

> App Store adı önerisi: **biDaha – Yanlış Soru Defteri**

## 1. Amaç
Sınava hazırlanan öğrencinin çözemediği soruları fotoğrafla kaydedip, nedenini not alıp, aralıklı tekrarla kalıcı olarak öğrenmesini sağlamak.
Hedef sınavlar: YKS, DGS, KPSS (+ "Diğer").
**Gizlilik:** Hesap yok, internet gerekmez, tüm veriler telefonda.

## 2. İlk açılış (onboarding)
Kısa ve atlanamaz 3 adım + 2 isteğe bağlı adım:
1. **İsim** (sadece selamlama için: "Merhaba Ayşe")
2. **Hazırlandığı sınav:** YKS / DGS / KPSS / Diğer → hazır klasörleri belirler
3. **Bir soru kaç kez tekrar edilsin:** 3–10 arası seçici, varsayılan 5
4. *(İsteğe bağlı)* **Sınav tarihi** → ana ekranda geri sayım
5. **Günlük hatırlatma saati** (varsayılan 20:00) → bildirim izni bu adımda istenir; "Hatırlatma olmadan başla" seçilebilir
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
Kırpma kendi ekranımızda serbest dikdörtgendir (iOS'un kendi kırpması sadece kare). Köşeler sürüklenir, çerçeve kaydırılır, 90° döndürülür.
Yeni soru formu açılınca doğrudan "Fotoğraf çek / Galeriden seç" sorulur. Doğru şıkka tekrar dokunmak seçimi kaldırır. Kaynak alanında son kullanılan kaynaklar önerilir.
Soru düzenlenince tekrar durumu (başarı, sonraki tarih) değişmez.

## 5. Aralıklı tekrar
Kullanıcının seçtiği tekrar sayısı = **N** (varsayılan 5). Aralıklar (gün): **1, 3, 7, 14, 30, 60**, sonrası ikiye katlanır ama **en fazla 120 gün** (N=10 için: 3, 7, 14, 30, 60, 120, 120, 120, 120).

- Soru eklendiğinde: `başarı = 0`, `sonraki tekrar = yarın`
- **Sağa kaydır (Çözdüm):** `başarı + 1`
  - `başarı >= N` ise → soru **Tamamlandı**
  - değilse → `sonraki tekrar = bugün + aralık[başarı]` (1. başarıdan sonra 3 gün, 2.'den sonra 7 gün…)
- **Sola kaydır (Çözemedim):** başarı sayılmaz (değişmez), `son sonuç = başarısız`, `sonraki tekrar = yarın`
- **Erken tekrar:** Günü gelmemiş soru klasörden açılıp çalışılabilir ama sayaca sayılmaz ("serbest çalışma"). Bu, aynı gün art arda 5 tekrarla soruyu bitirmeyi önler.
- **Sayılma kuralı:** Bir tekrar yalnızca soru o gün tekrar günündeyse (sonraki tekrar ≤ bugün, tamamlanmamış) sayılır; hangi ekrandan açıldığı fark etmez. Sayılmayan tekrar sorunun durumunu değiştirmez, `review_logs`'a `counted = 0` olarak yazılır.
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

Oturum kaynakları: "Bugün tekrar edilecekler" (tümü), bir ders/konu (ders seçilince konuları dahil), ya da serbest çalışma (klasördeki tüm aktif sorular). Sıra: en uzun bekleyen önce.
Geri al birden çok kez kullanılabilir; sorunun önceki durumu geri yüklenir ve tekrar kaydı silinir.

## 7. Soru listesi ve görünüm
Klasör içinde iki sekme: **Aktif** ve **Tamamlanan**.
Soru kartında: küçük fotoğraf, ilerleme rozeti **"2/5"**, sonraki tekrar günü ("Bugün", "3 gün sonra"), etiketler.
- Aktif sorular kırmızı tonlu rozetle gösterilir; son tekrarında çözülemeyen soruda ek olarak "Çözemedin" işareti olur.
- Tamamlanan sorular yeşil.
Sıralama: sonraki tekrar tarihi (varsayılan), eklenme tarihi, en çok başarısız.
Ders ekranında sadece derse doğrudan eklenen sorular listelenir; konulardaki sorular konu ekranında görünür (ders kartının sayılarına dahildir).
Günü geçmiş sorunun tekrar günü de "Bugün" yazılır.

## 8. Ana ekran (Bugün sekmesi)
- "Merhaba {isim}"
- Sınav geri sayımı ("YKS'ye 247 gün") — tarih girildiyse
- **"Bugün tekrar edilecek: 12 soru"** kartı → Tekrara başla
- Seri: "6 gündür üst üste tekrar yapıyorsun". Serbest çalışma dahil, en az bir tekrar yapılan her gün sayılır; bugün henüz tekrar yoksa seri dünden devam eder (gün bitince bozulur).
- Geri sayım sınav günü "… bugün, başarılar!" olur, tarih geçince gizlenir.
- Hızlı soru ekleme butonu

## 9. İstatistik
- Ders bazında: toplam soru, tamamlanan oranı
- Hata nedeni dağılımı (genel ve ders bazında): "Matematik yanlışlarının %45'i dikkatsizlik"
- Seri ve son 30 günün tekrar sayıları
Tekrar kayıtları (`review_logs`) tutulur; istatistikler buradan hesaplanır.

## 10. Bildirim
Günlük yerel hatırlatma; saat onboarding'in son adımında seçilir (varsayılan 20:00), Ayarlar'dan değiştirilebilir ve kapatılabilir.
Her gün seçilen saatte bir bildirim gider:
- O gün bekleyen soru varsa: "Bugün 8 soru seni bekliyor"
- Yoksa (o günün soruları bittiyse ya da hiç yoksa): "Bugün tekrar edilecek soru kalmadı. Çözemediğin bir soru varsa eklemeyi unutma."
İzin onboarding'in hatırlatma adımında (ya da Ayarlar'da ilk açılışta) istenir; reddedilirse telefon Ayarlar'ına yönlendirilir.
Uygulama: Yerel bildirimin metni zamanlandığında sabitlenir. Bu yüzden önümüzdeki 14 gün için ayrı bildirimler kurulur ve plan uygulama açılıp kapandıkça, tekrar oturumu bittiğinde, soru eklenip silindiğinde ve ayar değişince yeniden hesaplanır. Uygulama 14 gün hiç açılmazsa bildirimler durur.

## 11. Yedekleme
- **Dışa aktar:** Veritabanı + tüm fotoğraflar tek bir yedek dosyası olarak; paylaşım menüsüyle Dosyalar, AirDrop, Drive vb.ye kaydedilir.
- **İçe aktar:** Yedek dosyası seçilir, mevcut verinin üzerine yazılacağı açıkça uyarılır.
- Yedek dosyası bir sürüm numarası içerir (ileride format değişirse uyumluluk için).
- Ayarlar'da "Son yedek: 12 gün önce" bilgisi; 30 günü geçince nazik hatırlatma.

**Biçim:** Tek dosya `biDaha-yedek-YYYY-MM-DD.bidaha`; içi standart TAR arşivi (sıkıştırmasız; fotoğraflar zaten JPEG):
`manifest.json` (format `bidaha-backup`, `backupVersion` = 1, `schemaVersion`, tarih, uygulama sürümü, sayılar, eksik fotoğraf listesi), `data.json` (tüm tablolar), `photos/*.jpg`.
Fotoğraflar arşive tek tek akıtılır; yüzlerce fotoğraf aynı anda belleğe alınmaz.
**Geri yükleme:** dosya seçilir → yedeğin tarihi ve sayıları gösterilir → iki onay. Arşiv önce geçici klasöre açılıp doğrulanır (biçim, sürüm, her fotoğrafın varlığı); sorun varsa mevcut veriye dokunulmaz. Yeni fotoğraflar eklenir, veritabanı tek transaction'da değiştirilir, ancak ondan sonra hiçbir kayda bağlı olmayan eski fotoğraflar silinir. Daha yeni sürümle alınmış yedek reddedilir ("önce uygulamayı güncelle"). Geri yüklenen verinin "son yedek" tarihi yedeğin tarihi olur.
"Son yedek", paylaşım menüsü kapanınca güncellenir (iOS kaydın yapılıp yapılmadığını bildirmez).
Hatırlatma: en az bir soru varken hiç yedek yoksa ya da son yedek 30 günü geçtiyse Bugün ekranında "Yedek al" kartı.

## 12. Ayarlar
İsim, sınav, tekrar sayısı (N), sınav tarihi, bildirim (aç/kapa + saat), yedekle/geri yükle, klasör yönetimi, tüm verileri sil (çift onaylı), hakkında.
- N düşürülürse başarısı yeni N'e ulaşan sorular tamamlanır; etkilenen soru varsa önce sayısıyla onay istenir.
- Sınav değişince eksik dersler tek uyarıda listelenip eklenmesi önerilir; mevcut klasörler silinmez.
- Tüm verileri sil: iki ayrı onay; önce kayıtlar, sonra fotoğraflar silinir, onboarding'e dönülür.

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
