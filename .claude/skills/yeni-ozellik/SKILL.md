---
name: yeni-ozellik
description: Yol haritasındaki bir fazı ya da yeni bir özelliği planlayıp adım adım geliştirmek için kullan. Kullanıcı "Faz 2'yi yap", "şu özelliği ekle" dediğinde çalışır.
---

# Yeni özellik / faz geliştirme akışı

1. **Oku:** `CLAUDE.md`, `docs/ROADMAP.md` ve `docs/SPEC.md` içindeki ilgili bölümü oku. Mevcut kodda ilgili dosyalara bak.
2. **Planla, kod yazma:** Kullanıcıya kısa bir plan sun:
   - Hangi ekran/dosyalar eklenecek veya değişecek
   - Veritabanı değişikliği var mı (varsa `veritabani-degisikligi` skill'i devreye girer)
   - Eklenecek paketler (Expo Go'da çalışmayan bir paket varsa açıkça belirt)
   - SPEC'te belirsiz kalan noktalar → soru olarak sor
   Kullanıcı onaylamadan koda başlama.
3. **Küçük adımlarla uygula:** Önce `src/domain/` mantığı ve testleri, sonra `src/db/` sorguları, en son ekranlar.
4. **Kontrol et:** Her adımdan sonra
   - `npx tsc --noEmit`
   - `npx jest` (ilgili testler)
   - `npx expo lint`
   hepsi temiz olmalı.
5. **Kullanıcıya test ettir:** Simülatörde neyi, hangi sırayla denemesi gerektiğini madde madde yaz (ör. "Matematik klasörüne gir → + → fotoğraf seç → kırp → kaydet").
6. **Kapat:** Kullanıcı "çalışıyor" deyince
   - `docs/ROADMAP.md` maddelerini `[x]` yap
   - SPEC'ten sapan karar alındıysa SPEC'i güncelle
   - Açıklayıcı Türkçe bir commit mesajı öner (ör. `Faz 2: soru ekleme ve fotoğraf kırpma`)
