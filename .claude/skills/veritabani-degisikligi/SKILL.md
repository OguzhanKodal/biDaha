---
name: veritabani-degisikligi
description: SQLite şemasında tablo/sütun ekleme, değiştirme veya veri dönüştürme gerektiğinde kullan. Kullanıcının telefondaki verisini kaybetmeden güvenli migration yazma kuralları.
---

# Güvenli veritabanı değişikliği

Bu uygulamada veri yalnızca kullanıcının telefonunda. Hatalı bir migration aylarca biriken soruları geri dönüşsüz silebilir.

## Kurallar
1. **Mevcut migration dosyalarını asla düzenleme.** Her değişiklik `src/db/migrations/` altında yeni, sıradaki numaralı bir migration'dır (ör. `004_add_source_page.ts`).
2. Migration'lar `PRAGMA user_version` ile sürümlenir ve sırayla, bir **transaction** içinde çalışır; hata olursa geri alınır.
3. Tercih sırası:
   - Yeni sütun → `ALTER TABLE ... ADD COLUMN` (varsayılan değerli ya da nullable)
   - Sütun silme/yeniden adlandırma gerekiyorsa → yeni tablo oluştur, veriyi kopyala, eskisini sonra kaldır; önce kullanıcıya sor
4. **`DROP TABLE` / `DELETE` içeren migration** yazmadan önce kullanıcıdan açık onay al.
5. Fotoğraf yollarına dokunan migration'larda dosyaların gerçekten var olduğunu kontrol et; dosya silme migration'da yapılmaz.
6. Şema değişince güncelle:
   - `src/db/` tipleri ve sorguları
   - `docs/SPEC.md` §13 veri modeli
   - Yedekleme formatı etkileniyorsa yedek sürüm numarası ve içe aktarmadaki dönüşüm

## Test
- Migration için test yaz: eski şemayla örnek veri oluştur → migration'ı çalıştır → verinin korunduğunu doğrula.
- Kullanıcıya simülatörde **uygulamayı silmeden** (mevcut veriyle) açıp test etmesini söyle; temiz kurulum ayrıca denenir.
