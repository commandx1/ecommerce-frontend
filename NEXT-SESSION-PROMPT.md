`ecommerce-frontend` test çalışmasına devam ediyoruz. Önce şunları oku, hiçbirini varsayma:

1. `ecommerce-frontend/TEST-FINDINGS.md` — bu işin defteri. Baştaki durum satırları, "Yeni bir session'a devir" bölümü ve özellikle şu üç kural bloğu:
   - 🎯 EN ÜST KURAL (testler kodu haklı çıkarmaz)
   - 🧪 ZORUNLU TEST PROTOKOLÜ (üç eksen: giden payload / gelen veri / düşmanca veri)
   - 🔌 KALICI KURAL (test yazmadan önce backend kaynağı okunur)
2. `ecommerce-frontend/BACKEND-HANDOFF.md` — backend'e devredilen 20 madde. Backend repo'suna ASLA dokunma.
3. `~/.claude/plans/temporal-stirring-matsumoto.md` — plan ve ilerleme.

## Çalışma kuralları (özet — ayrıntısı yukarıdaki dosyalarda)

- Test "bugün ne oluyor"u değil **"ne olmalı"yı** yazar; kod teste uyar. Kusuru doğrulayan test yazma; `(current behaviour)`, "even though", "inert" gibi ifadeler yasak.
- Doğruluk kaynağı kod değil: **gerçek backend sözleşmesi** (`../ecommerce-api/src/main/java/com/dentB2B/ecommerce/`) + kullanıcının yaşadığı senaryo.
- **Tuzak:** `GlobalExceptionHandler` sonunda `@ExceptionHandler(RuntimeException.class)` → **400** catch-all'ı var. 404/403/409 beklemeden önce servisin gerçekten maplenmiş bir tip fırlattığını doğrula. `order`/`cart`/`invoice` paketlerinin KENDİ handler'ları var ve farklı davranıyorlar.
- **Tuzak:** frontend backend'i doğrudan çağırıyor olabilir de, BFF route'u (`src/app/api/**/route.ts`) üzerinden de. BFF bazen parametre çeviriyor (`public-search`: `search`→`Search`), bazen çevirmiyor (`brands/search`). Her ucu tek tek oku, genelleme yapma.
- Gerçek dünyada patlatacak bir bug bulursan **hemen düzelt** + regresyon testi + "geri alınca hangi test düşüyor" kanıtını ÖLÇ. Ürün kararı gerektireni yapma, sor.
- Backend'in düzeltmesi gerekeni `BACKEND-HANDOFF.md`'ye madde olarak yaz.

## Dört kapı (her batch sonunda lead kendisi koşar, ajan raporuna güvenilmez)

```
npm run lint && npm run typecheck && npm run test:coverage && npx playwright test --workers=1
```

- `npm run test:e2e` (paralel) SAHTE HATA verir; her zaman `--workers=1`.
- Ajan koşarken lead test koşturmasın — CPU çekişmesi sahte hata üretiyor. **Farklı dosyaların düşmesi çekişmenin imzasıdır**; böyle bir hatayı izole koşmadan gerçek kabul etme (altyapı notları #11, #21, #22).
- Aynı anda en fazla 2 ajan.

## Sırada ne var

1. **🚧 B listesi (bitmemiş özellikler, B1-B16)** — sıradaki asıl iş. Çoğu **ürün kararı** bekliyor, tek tek sorulmalı. En büyükleri: **B12** (buyer dashboard'ın tamamı sabit JSON — ölçüldü: 13 bileşenin 12'si sıfır interaktivite, backend'de karşılık YOK, `OrderDashboardController`'ın 6 ucu da `/vendor/...`), **B13** (vendor analytics — ama 6 bileşeni GERÇEK API kullanıyor, yalnız 3'ü mock: `CustomerAnalyticsChart`, `MarketingPerformance`, `VendorNotifications`; bunlara backend'de uç var mı ölç), **B15** (vendor müşteriler, 430 satır mock), **B16** (vendor fatura ekranı hiç yok), **B7** (alıcı faturaları mock).
2. **Mutation testing'i genişlet** — `stryker.ui.config.json` kuruldu ve 6 dosyayı kapsıyor. Kalan kritik UI için aynı yöntem: önce koş, hayatta kalanı OKU, sonra test yaz (bkz. not #30 — eşdeğer mutant tuzağı).
3. **⚠️ Teammate commit'i sonrası ilk iş dört kapı** — 1 Eyl'de giren varyant + Stripe commit'leri kapı koşulmadan girmişti (e2e 5 kırmızı, lint 1 hata; F135/F136). Yeni commit görünce önce `git log --since` ve dört kapı, sonra iş.
4. **KAPANDI, yeniden tarama YOK:** 🛡️ dayanıklılık turu (F96-F110 — checkout, alıcı siparişler+auto-orders, ödeme/fatura, vendor'ın kalan sayfaları, ürün detay, üç kabuk) · ♿ a11y A1-A7 (F88-F95, `a11y-smoke.spec.ts` gerçek kapı, 22/22) · üç eksen borcu · contract denetimi (A+B+C, 30 dosya).
   **Kabuklar elendi, gerekçeli:** `SuppliersPage`/`HelpCenterPage`/`LegalPage` üçünde de dallanma/transform yok (yalnız alt bileşen sıralıyorlar, onlar zaten testli) — `/shipping-information` ve `promotions` ile aynı gerekçe.

## Durum (3 Eyl 2026 gün sonu — dört kapı yeşil, lead koştu)

`4005 test / 264 dosya / 12 todo` · coverage **`85.12` satır** / `89.15` dal / `85.30` fonksiyon · **ratchet 76/84/80/76** · e2e **`178/178`** (a11y kapısı dahil 26/26, `/products/[id]` de taranıyor) · düzeltmeler `F1-F137`

⚠️ **Altyapı notu #35-36'yı OKU:** bağımsız review (`/code-review high`) 7 bulgunun 6'sını gerçek çıkardı ve **lead'in kendi "kök neden düzeltmesinin" eksik olduğunu** gösterdi (F127). Ayrıca bir testin yeşil olması bir şey doğruladığı anlamına gelmiyor — geri-alma ölçümü yapılmadan yazılan test, yazılmamış sayılır (F129).

**API kapsamı ölçüldü (F123, 3 Eyl'de F133 ile yeniden):** 92 dosya `@/lib/api/*`'yi değer olarak import ediyor · auth bilinçli kapsam dışı · **hepsi** test kapsamında. Ölçüm `coverage/lcov.info`'dan **tam yollu** yapılmalı (not #34) ve **lcov'un tarihinden sonra değişen dosyalar ayrıca taranmalı** (not #37 — 3 Eyl'de teammate'in 1 Eyl commit'leri ölçüm dışıydı, e2e'yi kırmıştı).

⚠️ **Altyapı notu #31:** coverage sayfa seviyesinde yeşil, bileşen seviyesinde SIFIR olabilir — `page.test.tsx`'in mock'ladığı her bileşen ayrı bir boşluktur. Bir alanı "kapsandı" saymadan önce tabloyu **dosya dosya** oku.

**Buyer tarafı KAPANDI** (kullanıcının listesi: All Orders · Auto-Orders · Favorites · Payment Methods · Account · Addresses) — altısında da A+C ekseni tamam. Overview ve Invoices **bilinçli dışarıda**: ikisi de sabit JSON, backend'de karşılık yok (B12/B7).

**Mutation skorları (28 Ağu, ilk kez UI'da):** `license-check` %100 · `formatCurrency` %100 · `OrderSummaryTotals` %96 · `CartSummaryPanel` %87 · `order-view-utils` %77 · `VendorShipmentRates` %62 (kalanlar eşdeğer mutant — not #30).

⚠️ **Altyapı notu #26'yı OKU — bu turun en önemli çıktısı.** Bozuk 200 gövdesi + koşulsuz dizi erişimi = beyaz ekran deseni **19 ayrı yerde** vardı. `||` ve `??` YETMEZ (ikisi de yanlış tipli truthy değeri geçirir); tek doğru guard `Array.isArray(x) ? x : []`. Yeni liste render eden her kodda kontrol et.
⚠️ **Altyapı notu #24:** `npm run lint`'in özet satırı yanıltıcı olabiliyor (Biome tanı limiti) — yeşilken de hata taşıyabilir.
⚠️ **Altyapı notu #25 (28 Ağu'da genişletildi):** ajanlara tam süit VE mutation koşturma. Beş ajanın beşi uzun koşuyu arka plana atıp raporsuz durdu; ikisi arkasında **öksüz Stryker süreci** bıraktı, biri silinen config'le yeniden başlattı. E2E turunda bu yasak brief'e yazılınca iki ajan da düzgün rapor verdi.
⚠️ **Altyapı notu #29:** mutation koşusu lint kapısını düşürüyordu (`.stryker-tmp*` sandbox'ları + 1.5 MB rapor). `biome.jsonc` ve `.gitignore` düzeltildi — kapı artık temizliğe bağımlı değil.
⚠️ **Altyapı notu #30:** düşük mutation skoru her zaman test eksikliği DEĞİL — eşdeğer mutant olabilir. Skoru hedef olarak kovalama, hayatta kalanı oku.
⚠️ **Aynı anda İKİ gate koşusu başlatma** — `coverage/.tmp` ve `:3100` paylaşıldığı için birbirlerini bozarlar (`ENOENT: coverage-*.json`, `ERR_CONNECTION_REFUSED`). Lead bunu bir kez ihlal etti, 14 test sahte düştü.

⚠️ **Altyapı notu #23'ü OKU:** 23 Ağu'dan beri koşan **öksüz bir vitest süreci** (PPID 1, %100 CPU) tam süiti 3 saate çıkarıyor ve
assertion hatası olmayan timeout'lar üretiyordu. Kapı beklenenden kat kat yavaşsa teste bakmadan önce `uptime` +
`ps -Ao pid,ppid,etime,%cpu,command -r | grep -E 'vitest|playwright'` ile artık süreç ara.

## Karar bekleyenler (bunları bana sor, tek başına verme)

- E-posta hesap ayarlarından değiştirilemiyor (backend'de karşılığı yok); alan salt-okunur yapıldı — ayrı bir e-posta değiştirme akışı gerekli mi? (§20)

## Kapalı kararlar (bir daha sorma, dokunma)

**`/products` backend hatası GÖSTERİLİR** (3 Eyl, F137): ürün listesi çağrısı düşerse hata ekranı + Retry; filtre fasetleri tek başına düşerse sayfa ürünlerle devam eder. Ürün detayla aynı kural. · K12 "Reject Return" **bilinçli kapalı** (kodda ve testte yazılı) · Y9 vergi muafiyeti · ağır kargo çarpanı · K5 polling · CI'ya test job'ı eklenmez · `business-types`'ta 13 seçeneğin kapalı olması kasıtlı · dosya boyutu sınırı frontend'de backend'in 1MB'ına hizalandı (create formu **ve** `ImportDocumentsModal`) · **§16 ölü kodu SİLİNDİ** (28 Ağu, F73) · **vergi hesaplanamayınca "Calculated at checkout"** gösterilir, `$0` değil ve checkout engellenmez (28 Ağu, F74) · `ProductCard`'ın "Add to Cart" butonu **şimdilik olduğu gibi bırakıldı** (28 Ağu kullanıcı kararı, `it.todo` duruyor) · **ürün detayındaki vergi satırı tamamen KALDIRILDI** (28 Ağu kullanıcı kararı, F86 — geri ekleme) · **coverage ratchet 76/84/80/76** (28 Ağu kullanıcı kararı: gerçekleşenin ~2 puan altı) · **`/login`'e `<main>` eklendi** (28 Ağu onayı — auth ekranları backend ekibinin, yalnız bu semantik değişiklik yapıldı) · **`--success` 58% → 48%** (F92, kontrast; karanlık tema dokunulmadı) · **`ProductCard`'ın favori + karşılaştır butonları SİLİNDİ** (F95 onayı); **"Add to Cart" bilinçli duruyor**, `it.todo` ile açık.
