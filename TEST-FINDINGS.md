# Test Yazma Çalışması — Bulgular Raporu

Faz 0–9 sırasında test yazarken kaynak kod okunarak ve gerçek tarayıcıda koşturularak bulunan sorunlar.
Politika: **testler mevcut davranışı kilitler**, ürün davranışı değiştirilmez — açıkça onay verilenler hariç.

**Durum (unit):** 3027 test geçiyor / 1 skip (başlangıç: 49) · 221 test dosyası · coverage 75.40% satır / 83.38% dal / 76.91% fonksiyon
**Durum (e2e):** 134/134 — `chromium` 75 · `mobile-chrome` 59. ⚠️ **`npx playwright test --workers=1` ile koş**; paralel koşu sahte hata verir (altyapı notu #21)
**Mutation skoru (kritik modüller):** `stores` **%100** · `hooks` %95.98 · `client` %92.47 · `api` %100 · `proxy` 71/80 (kalan 9 mutant gerekçeyle **kabul edildi** — 23 Ağu 2026 kullanıcı onayı)
**Tamamlanan:** Faz 0-7, 6b, 8 (E2E), 9 (edge-case, property-based, mutation testing, test kalitesi) — **planın tamamı**
**Düzeltme turu (23 Ağu 2026):** A (güvenlik) + B (para/veri kaybı) grubu kapatıldı — K2, K4, K7, K8, K9, K10+D, K11, K13, Y10, Y12 (bkz. F11-F20)
**Düzeltme turu 2 (24 Ağu 2026) — 24 madde:** 🟠 Yüksek'in izole hataları — Y1, Y2, Y4, Y7, Y8, Y14, Y16 (F21-F27) · 🟡 sepet/state + auth-proxy ve Y11 (F28-F36) · 🟡 para formatı + sayısal guard (F37-F39).
**Kullanıcının kapsam kuralları (devir bölümünde ayrıntılı):** ① gerçek kullanıcı faydası testi ② hata gösterimi eşiği ③ backend bug'ıysa dokunma, frontend içiyse serbest.
**Kalan:** 🟡 Orta'nın vendor + çeşitli maddeleri (Batch 5) · Y3, Y5, Y6-public-products (Batch 5b) · ♿ a11y (Batch 6-8) · 🚧 bitmemiş özellikler (B1-B11) · backend maddeleri → `BACKEND-HANDOFF.md`
**Kapatılan kararlar (dokunma):** K5 · Y9 vergi muafiyeti · ağır kargo çarpanı. **Cevap bekleyen:** A7 kontrast · Y6/Y7 timezone · sepet hata sözleşmesi · Y13 · Y15.
**Kapı:** `lint` EXIT 0 · `typecheck` EXIT 0 · `test:coverage` EXIT 0 (ratchet 73/81/74/73) · `npx playwright test --workers=1` EXIT 0
**Not:** CI workflow'una bilinçli olarak dokunulmadı (kullanıcı kararı) — testler elle koşuluyor.

### 🔄 Yeni bir session'a devir — bu dosya dışında bilinmesi gerekenler

**Nerede kaldık (24 Ağu 2026):** Düzeltme turu 2'nin 5 batch'i bitti — **F21-F39, 24 madde.** Her batch sonunda dört kapı lead tarafından koşuldu, hepsi yeşil. Sıradaki **Batch 5**: 🟡 vendor sayfaları + çeşitli.

#### ⚠️ Kullanıcının bu turda koyduğu üç kural — bunlara UYULMAZSA iş geri çevrilir

1. **Gerçek kullanıcı faydası testi.** *"Bu bugün bir kullanıcıya görünür zarar veriyor mu?"* Hayırsa **düzeltme.** Sırf test yazılabilsin veya "daha temiz olsun" diye kod değiştirme. Elenen maddeyi "fayda yok, yapılmadı" diye gerekçesiyle raporla — bu doğru cevap, eksik iş değil.
2. **Hata gösterimi eşiği.** Kullanıcıya hata/uyarı göstermek onun bir sonraki adımını değiştiriyorsa göster; değiştirmiyorsa gösterme — gürültü zarardır.
3. **Backend/frontend sınırı.** Backend'in bug'ı yüzünden komple logic düzeltmek gerekiyorsa **yapma.** Her şey frontend içinde çözülüyorsa fix serbest.

Kural 2 somut bir olaydan doğdu: `setItemAutoOrder` "tutarlılık için" `error` state'i yazacak şekilde değiştirildi, tek çağıranı (`useCartPage`) zaten kendi toast'ını gösterdiği için **tek hata iki toast** üretti → geri alındı, asimetri artık testle bilinçli kilitli. Aynı kural `~/.claude/projects/.../memory/fix-only-what-users-feel.md`'de de kayıtlı.

#### Kullanıcının kapattığı kararlar (bir daha sorma, dokunma)
- **Y9 `applyTaxExemption` varsayılanı `true`** → böyle kalsın.
- **Ağır kargo ücretinin adet başına çarpılması** ($75 → 10 adette $750) → böyle kalsın.
- **K5 ödeme polling penceresi** → açık bırakıldı (23 Ağu).
- **CI'ya test job'ı eklenmeyecek** → kapılar elle koşulur.

#### Kullanıcıya sorulmuş, cevap BEKLEYEN
- **A7 color-contrast.** Kök neden bulundu: tek tek bileşen hatası değil, tema renginin kendisi — `globals.css:88` `--text-muted: oklch(59.8% 0.015 246)` beyaz zeminde ~**3.2:1** veriyor, WCAG AA eşiği 4.5. Taramada `/` 1 · `/products` 6 · `/cart` 9 düğüm. Teknik düzeltmesi tek satır (`59.8%` → `~47%`) ama **markanın gri tonunu koyulaştırmak** demek → tasarım kararı. Seçenekler: (a) tonu koyulaştır, (b) `text-muted`'ı yalnız büyük metinde kullan, (c) bilinçli bırak.
- **Y6/Y7 timezone** (`auto-order-view-utils.ts`) — kural 3 gereği **hariçte.** Backend `nextOrderDate`'i naive `LocalDateTime` gönderiyor, kod sona `Z` ekleyip UTC sayıyor → Istanbul'da +3, PST'de −8 sistematik kayma; `Math.round`'un ±12 saat toleransı sınıra yakın vakalarda bir gün kaydırıyor. Y7 ayrıca kayan 24 saat penceresi kullanıyor (23:30 → ertesi gün 00:30 "today" okunuyor). **Kullanıcıya `BACKEND-HANDOFF.md`'ye madde eklemek önerildi, onay gelmedi — eklenmedi.** Gerçek çözüm: backend ISO-8601 offset'li göndersin (`2026-08-25T09:00:00+03:00`).
- **Sepetin dört fonksiyonlu hata sözleşmesi** — tekilleştirme fonksiyon fonksiyon yapılamaz, tüm çağıran envanteri gerekiyor. Ayrı tur işi.

#### Batch 5'e girerken bilinmesi gerekenler
- Ham 🟡 Orta listesi olduğu gibi işlenmemeli — içinde "modül seviyesi cache'ler", "aynı kart verisi iki shape'te", "ulaşılamayan validasyon dalları" gibi **mimari borç** maddeleri var; kural 1'den geçmezler.
- **Yanlış grupta duran bir güvenlik maddesi var:** *yorum/soru/cevap yazma uçlarında BFF kapısı yok — `Authorization` yoksa backend **anonim** çağrılıyor* (`reviews`, `product-questions`, `product-answers`). Y10/F19 ile aynı sınıf, 🟡'de değil 🟠'de olmalı. Batch 5'in başına alınacak.
- Kalan plan: Batch 5 (vendor + çeşitli) → Batch 5b (Y3 yanıltıcı lisans mesajı, Y5 `vendor-reviews`, Y6 `public-products` hata yutma — kural 3'e göre serbest) → Batch 6-8 (♿ a11y: form/canlı bölge · navigasyon/semantik · sayfa yapısı A1-A6).

#### Değişmeyen altyapı gerçekleri
- **Hiçbir şey commit'lenmedi.** Son commit `0a84366`. Çalışma ağacında test çalışmasının tamamı + F11-F39 duruyor. Commit'i bölme önerisi en altta, 📌 Deployment notunda.
- **`npm run test:e2e` (paralel) SAHTE HATA VERİR** — `a11y-smoke.spec.ts`'in klavye testi yük altında kırılgan. **Her zaman `npx playwright test --workers=1` koş** (134/134). Ayrıntı: altyapı notu #21.
- **Backend'e devredilenler:** `BACKEND-HANDOFF.md` — K3, K6, Y12'nin backend yarısı, K9'un kalan yarısı. K12'nin backend'e bağlı OLMADIĞI ve ürün kararı beklediği de orada.
- **Planın ve faz geçmişinin tek kaynağı repo DIŞINDA:** `~/.claude/plans/buzzing-imagining-emerson.md`.
- **Ajan raporu doğrulanmadan kabul edilmez** — lead dört kapıyı kendisi koşar. Bu turda iki kez işe yaradı: bir worker e2e'yi hiç koşmamıştı (2 kırık spec bulundu), bir worker da yan etkisini doğru bildirdi ama düzeltme yine de geri alındı.
- **Worker brief'ine "e2e koşma, lead koşacak" yazıldıysa lead GERÇEKTEN koşmalı** — auth/cookie/proxy'ye dokunan batch'lerde worker'ın kendisi de koşsun.
- **Aynı anda 2'den fazla ajan test koşturmasın** (CPU çekişmesi sahte "flaky" üretir, bkz. altyapı notu #11).
- **Bağımlılık kurulumu `--legacy-peer-deps` gerektiriyor**; her `npm i` sonrası `npm run test:coverage` koş (bkz. #15).
- **Üstü çizili (~~) başlıklar tarihsel kayıttır** — düzeltilmiş bulgular silinmiyor. Ayrıca **"BULGU YANLIŞTI" / "denendi, geri alındı" / "incelendi, düzeltilmedi"** işaretli maddeler var; bunlar gelecekteki birinin yanlış "düzeltme" yapmasını engellemek için duruyor, **silme.**

---

## ✅ Düzeltilenler

| # | Sorun | Dosya | Doğrulama |
|---|---|---|---|
| F1 | Arama sonuçlarında ham float (`$32.219249999999995`) | `SearchResultItem.tsx`, `ActiveFilters.tsx` | Düzeltme geri alınınca 5 test düşüyor |
| F2 | **Yetim sipariş** — Stripe hazır değilken sipariş oluşup ödenmeden kalıyordu | `useFinalReview.ts` | Ön koşullar `placeOrder`'dan önce; test ile |
| F3 | **Çift sipariş** — `onPlaceOrder` re-entrant, tek koruma UI'daydı | `useFinalReview.ts` | `useRef` guard; kaldırılınca 2 test düşüyor |
| F4 | **401 → sipariş `PAYMENT_SUCCESS`** yazılıyordu | `useFinalReview.ts` | Auth hatası ayırt ediliyor, `PENDING_PAYMENT` kalıyor |
| F5 | React 18/19 uyumsuzluğu (node_modules 19, lockfile 18) | `package.json`, lockfile, 3 dosya | `tsc` temiz, prod build geçiyor |
| F6 | `npm run lint:fix` kendi lint'ini bozuyordu (biome↔prettier) | `package.json` | `lint:fix` sonrası `lint` EXIT 0 |
| F7 | 14 a11y hatası + riskli lint ihlalleri (`finally` içinde `return` vb.) | 13 dosya | `npm run lint` EXIT 0 (öncesi 167 hata) |
| F8 | **K1 — checkout başlangıç adresi hardcoded demo verisiydi** (Michael Chen / Pacific Dental Group). Artık boş; `reset()` de boş adresi geri yazıyor | `checkoutStore.ts:92-101` | 2 regresyon testi (boş başlangıç + reset boş bırakıyor); 3 test dosyası demo veriye yaslanmaktan kurtarıldı |
| F9 | **K14 — `proxy.ts` sonsuz redirect döngüsü** (`ERR_TOO_MANY_REDIRECTS`, kullanıcı siteye hiç giremiyordu) | `proxy.ts:35` | Vendor guard'ına `isAuthenticated &&` eklendi; `proxy.test.ts` 2 vaka + `auth-routing.spec.ts` 2 e2e testi artık temiz davranışı assert ediyor |
| F10 | **K15 + K16 — production'da TÜM yerel görseller 404** (login logosu dahil) + vendor tablosunda sonsuz re-render | `image-loader.ts`, `vendor-dashboard/products/page.tsx:877` | `image-loader.ts` artık `/_next/image` üretmiyor; `onError` fallback zaten set ise `prev`'i aynen döndürüyor. Prod artefaktında (`node .next/standalone/server.js`) logo 200; `vendor-products.spec.ts` workaround'suz geçiyor |
| F11 | **K2 — `/apidocs` gibi route'lar middleware'i tamamen atlıyordu** | `proxy.ts:65` | Lookahead segment sınırına bağlandı (`api/`, `api$`). `/apidocs`, `/api-status`, `/apiary/spec`, `/backend-api-docs` artık guard'dan geçiyor; `/api`, `/api/*` hariç kalmaya devam ediyor. 6 matcher testi |
| F12 | **K4 — auto-order snapshot'ı ödeme onaylanmadan alınıyordu** | `useFinalReview.ts` | Snapshot artık yalnız ödeme gerçekten geçtiğinde alınıyor (`!isPaymentCanceled && finalOrderStatus !== "PENDING_PAYMENT"`); sipariş denemesi başında eski id'ler temizleniyor. 3DS iptalinde onay ekranı artık 90 sn boşuna beklemiyor |
| F13 | **K7 — `companyId` filtresi sayfalama linklerinde sessizce düşüyordu** | `buildProductsUrl.ts`, `ProductListingClient.tsx`, `ProductListingPageView.tsx` | Builder `companyId`'yi koruyor; 6 regresyon testi + url-contract property testi güncellendi |
| F14 | **K8 — 8 BFF route'unda upstream path traversal** | `reviews/[id]`, `reviews/product/[productId]`, `user-products/[id]`, `product-questions/product/[productId]`, `products/details/[id]`, `details/by-product/[productId]`, `products/review/[id]`, `features/products/api/proxy/http.ts` (+ `products/[id]/owner`) | Tüm dinamik segmentler `encodeURIComponent`'ten geçiyor. `http.ts`'e `suffix` parametresi eklendi (`/owner` gibi sabit sonekler encode edilmeden ekleniyor). Her route'ta `..%2Fusers%2Fme` regresyon testi |
| F15 | **K9 — `shipping-label/download`'da hiç yetkilendirme yoktu** | `app/api/shipping-label/download/route.ts` | Handler başında `getAuthorizationHeader` → yoksa 401 (fetch'ten önce); `fetch` try/catch'e alındı, ağ hatası 502. Host allowlist'i aynen korundu. **Kalan yarısı backend'de:** etiketin çağıranın siparişine ait olduğu doğrulanmıyor → `BACKEND-HANDOFF.md` §4 |
| F16 | **K10 + D — `images/proxy`: SSRF koruması yok + endpoint hiç çalışmıyor** | `app/api/images/proxy/route.ts` | İkisi birlikte çözüldü: `serverRequest` yerine doğrudan `fetch` (artık `BACKEND_URL + mutlakURL` birleşmesi yok) **ve** https + hostname allowlist (`images.barcodelookup.com`, `nobledentalsupplies.imgix.net`, `shippo-static.s3.amazonaws.com`; `IMAGE_PROXY_ALLOWED_HOSTS` ile genişletilebilir). Metadata IP / `file://` / `localhost` → 400, upstream'e hiç istek gitmiyor. Hata gövdeleri artık `BACKEND_URL`'i sızdırmıyor |
| F17 | **K11 — sepete ekleme 500 alırsa kullanıcı hiçbir şey görmüyordu** | `cartStore.ts:143` | `addToCart` hatayı `error` state'ine yazdıktan sonra **rethrow** ediyor; `PurchaseOptions` ve sipariş tekrarı akışındaki catch blokları artık gerçekten çalışıyor (uyarı toast'ı çıkıyor) |
| F18 | **K13 — Review Queue'da "Kaydet" gerçek kargo ücretlerini sıfırlıyordu** | `vendor-dashboard/products/page.tsx:275` | Review-queue eşlemesi artık `skuCode`, `shipmentFee`, `heavyShippingSurcharge` alanlarını da kopyalıyor. Dokunulmadan Kaydet artık $25/$75'i koruyor; iki kilit testi yeni davranışa çevrildi |
| F19 | **Y10 — auth kontrolü gövde okumasından sonraydı (4 route)** | `products/details` POST, `products/details/[id]` PUT, `details/by-product/[productId]` PUT, `user-products/[id]` PUT | Auth bloğu her zaman `request.json()`'dan önce; oturumsuz + bozuk gövde artık 500 değil **401**. Kimlik kaynağı bilinçli olarak değiştirilmedi (header-only kalanlar header-only kaldı — Y15 kapsamı) |
| F20 | **Y12 — upstream hata gövdesi (Java stack trace) tarayıcıya iletiliyordu** | `users/me`, `product-questions`, `product-answers` (+ `lib/api/sanitize-upstream-error.ts`) | Yalnız temiz JSON `message` alanı iletiliyor; stack trace göstergesi (`\n`, `\tat `, `Exception`, `com.`) içeren veya JSON olmayan gövdeler jenerik `Request failed with status <status>`'e düşüyor. **Backend'den istek:** hata gövdeleri `{ "message": ... }` formatında dönsün → `BACKEND-HANDOFF.md` §3 |
| F21 | **Y1 — `logout` cookie'yi silmiyordu**, boş state'i geri yazıyordu | `authStore.ts:110` | `persist.clearStorage()` → `cookieStorage.removeItem` → cookie gerçekten expire ediliyor. Yalnız cookie *varlığına* bakan kod artık yanılmıyor. Unit testi + `session-expiry.spec.ts` yeni davranışa çevrildi |
| F22 | **Y2 — varsayılan backend portu 8080 (dt-admin-api), olması gereken 8081** | `server-request.ts`, `features/products/api/proxy/http.ts`, `public-products.ts`, `product-detail.ts`, `test/route-harness.ts` | `BACKEND_URL` yoksa server-side istekler yanlış servise gidiyordu. Grep ile 4 üretim dosyası + paylaşılan test sabiti düzeltildi (sabit ~300 route testinin MSW mock URL'i) |
| F23 | **Y4 — kullanıcının seçtiği görsel ilgisiz bir state değişikliğinde sıfırlanıyordu** | `useProductImageGallery.ts` | Reset effect'i `images` referansı yerine içerik anahtarı (`images.join("\|")`) üzerinden tetikleniyor; büyüteç mousemove artık seçimi bozmuyor. 2 test eski "BUG:" davranışından yeni davranışa çevrildi |
| F24 | **Y7 — `checkoutStore.reset()` ilk hale döndürmüyordu** | `checkoutStore.ts` | Tek bir `initialState` nesnesi; hem store başlangıcı hem `reset()` ondan türüyor → ikisi bir daha ayrışamaz. `selectedShippingEtaText` artık reset sonrası da `""`. F8 (boş adres) korundu, `applyTaxExemption` bilinçli olarak değiştirilmedi |
| F25 | **Y8 — ödeme yöntemi karttan çıkınca kart bilgisi payload'da kalıyordu** | `checkoutStore.ts` | `updatePaymentMethod` yeni tip `card` değilse `selectedSavedCardId` / `paymentMethodId` / `paymentMethodSummary` alanlarını temizliyor. `net30`'a geçiş artık bayat kart kimliği taşımıyor |
| F26 | **Y14 — QZ Tray websocket'i hiçbir yolda kapatılmıyordu** | `lib/qz/printLabel.ts` | `finally` bloğunda `disconnect()`; `disconnect`'in kendi hatası asıl hatayı maskelemiyor (yalnız loglanıyor), `finally` içinde `return` yok (lint kuralı). 3 yeni test: başarı / hata / disconnect'in kendisi patlarsa |
| F27 | **Y16 — Google kota/erişim hataları istemci hatası (400) gibi gösteriliyordu** | `google-maps/autocomplete`, `google-maps/place-details` | `OVER_QUERY_LIMIT` / `REQUEST_DENIED` / `UNKNOWN_ERROR` artık **502**; gerçek istemci hataları (`INVALID_REQUEST`, `NOT_FOUND`) 400 kalıyor. Ham Google yanıtı / API key sızıntısı yok |
| F28 | **`fetchCart` hata yolunda dedup penceresi kurulmuyordu** | `cartStore.ts` | 500'de de `lastFetchedAt` damgalanıyor → çökmüş backend'e kesintisiz istek yağmıyor |
| F29 | **`fetchCart({force:true})` in-flight tekilleştirmeyi atlıyordu** (yarış) | `cartStore.ts` | `force` artık yalnız **dedup penceresini** atlıyor; uçan istek varsa ona katılıyor. Hızlı miktar değişiminde 3 paralel `GET /cart` ve "son dönen kazanır" ezmesi bitti |
| F30 | **`clearCart` dedup penceresini geçersiz kılmıyordu** | `cartStore.ts` | Temizleme sonrası `lastFetchedAt: 0`; kendiliğinden refetch TETİKLENMİYOR (bilinçli), yalnız pencere geçersiz |
| F31 | **401 sonrası boş sepet ~1 sn tazelenmiyordu** | `cartStore.ts` | Kök neden `resetCart` değil: interceptor'ın `handleAuthFailure()`'ı (içinde `resetCart()`) `fetchCart`'ın catch'inden ÖNCE bitiyor, catch sonra `lastFetchedAt: Date.now()` yazıp sıfırlamayı eziyordu. O damga kaldırıldı |
| F32 | **`proxy.ts` cookie'yi İKİ KEZ decode ediyordu** | `proxy.ts:10-25` | Tek decode + bozuk yüzde-kodlamasında ham değere düşüş. Literal `%` içeren cookie artık düşürülmüyor, kullanıcı sebepsiz anonim görünmüyor |
| F33 | **Bozuk auth cookie `localStorage` fallback'ini yutuyordu** | `client.ts` `resolveAccessToken` | `return null` yerine `break` → fallback gerçekten çalışıyor; token gönderiliyor |
| F34 | **Auth cookie `Secure` bayrağı taşımıyordu** | `cookie-storage.ts` | `location.protocol === "https:"` iken `; Secure`. `removeItem` aynı bayrak setini eşliyor (aksi halde silme çalışmaz — Y1/F21 buna bağlı). localhost/http davranışı değişmedi |
| F35 | **`Promise.all([logout(), logout()])` iki `POST /auth/logout` gönderiyordu** | `authStore.ts` | Modül seviyeli `logoutPromise` memo (client.ts'teki `authFailurePromise` deseni), bitince temizleniyor |
| F36 | **Y11 — listeleme ürün sorgusu hatası TÜM sayfayı düşürüyordu** | `get-listing-page-data.ts:49` | Dosyanın kendi facet deseni uygulandı (`.catch` → boş sonuç). 5 facet zaten kısmi degrade ediyordu, yalnız `getPublicProducts` kaçırıyordu. Sayfa artık boş-durumu render ediyor |
| F37 | **`formatCurrency` `Infinity` guard'ını atlıyordu** (`"$∞"` ekrana basılabiliyordu) | `lib/helpers/formatCurrency.ts` | `Number.isFinite(amount) ? amount \|\| 0 : 0` — `Infinity`/`-Infinity` artık `NaN` ile aynı şekilde `$0.00`'a düşüyor. Yeni gösterim biçimi icat edilmedi |
| F38 | **`PriceRangeFilter`: `min > max` sessizce boş liste üretiyordu** | `PriceRangeFilter.tsx` | Ters aralık artık URL'e yazılmıyor; inline hata (*"Min price must not be greater than max price."*) + `aria-invalid` + `aria-describedby`. Değerler **takas edilmiyor** (kullanıcının niyetini tahmin etmek olurdu), alan düzenlenince hata temizleniyor. `FormField` primitifine dokunulmadı |
| F39 | **Para formatı tutarsızlığı — 11 yer ham `toFixed(2)` basıyordu** (binlik ayraç yok: `$1234.50` vs `$1,234.50`) | `ProductCard.tsx` · `productDetailTransforms.ts` (5 alan) · `vendor-dashboard/products/page.tsx` (5 yer) | Hepsi `formatCurrency`'ye çevrildi. `"Free"` ve `null` dalları korundu. **En net kanıt** `ProductHeroDetails.tsx:15`'teydi: `selectedSupplier?.price \|\| formatCurrency(product.price)` — aynı alanda iki format. Regresyon testleri 4+ haneli değerle yazıldı (üç haneden kısa değerlerde iki format aynı sonucu verir, test hiçbir şey kanıtlamaz) |

---

## 🔴 Kritik — para, güvenlik, veri doğruluğu

### ~~K1. Checkout başlangıç adresi hardcoded demo verisi~~ ✅ DÜZELTİLDİ (bkz. F8)
`src/stores/checkoutStore.ts:92-101`
Checkout formu **"Michael Chen / Pacific Dental Group / 2847 Mission Street, San Francisco / (415) 555-0123"** ile dolu açılıyordu, `reset()` de bunu geri yazıyordu.
**Etkisi neydi:** `useShippingDetails` kayıtlı adresler yüklenince bunu eziyor — yani mutlu yolda görünmüyordu. Risk, **adres listesi boş dönerse veya istek başarısız olursa**: form yabancı bir adresle dolu kalıyor, kullanıcı fark etmezse sipariş oraya gidiyordu.
**Düzeltme:** `initialShippingAddress` artık tüm alanları boş. `reset()` aynı boş kaydı geri yazdığı için ikinci checkout da hiçbir şey miras almıyor. İki regresyon testi eklendi; demo veriye yaslanan 3 test dosyası (`checkoutStore.test.ts`, `CheckoutPage.test.tsx`, `useOrderSummary.test.ts`) gerçek değerleri kendisi verecek şekilde düzeltildi.

### ~~K2. `/apidocs` gibi route'lar middleware'i tamamen atlıyor~~ ✅ DÜZELTİLDİ (bkz. F11)
`src/proxy.ts:61` — `config.matcher` regex'i
`(?!api|backend-api|...)` negatif lookahead segment sınırına bağlı değil. İlk segmenti `api` ile *başlayan* her sayfa (`/apidocs`, `/api-status`, `/apiary`) proxy'yi atlıyor.
**Etki:** Bugün böyle route yok. Ama eklenirse rol/oturum guard'ı hiç çalışmaz.
**Düzeltme:** `(?!api/|api$|backend-api/|...)`

### K3. Siparişte idempotency key yok → **backend'e devredildi** (`BACKEND-HANDOFF.md` §1)
`src/lib/api/orders.ts` + `useFinalReview.ts`
F3'teki guard yalnız aynı sekme/hook örneği için koruyor. Kullanıcı sayfayı yenileyip tekrar denerse backend ikinci siparişi kabul eder.
**Düzeltme backend tarafı gerektirir.**

### ~~K4. Auto-order snapshot'ı ödeme onaylanmadan alınıyor~~ ✅ DÜZELTİLDİ (bkz. F12)
`useFinalReview.ts` — `setAutoOrderUserProductIds(...)` `placeOrder`'dan hemen sonra, `confirmCardPayment`'tan önce. 3DS iptalinde bile id'ler store'da kalıyor.

### K5. Ödeme durumu polling penceresi ~6 saniye → **bilinçli olarak açık bırakıldı** (davranış değişikliği; 23 Ağu 2026 kullanıcı kararı)
`useFinalReview.ts` — `MAX_PAYMENT_STATUS_RETRIES = 3`, aralarda ~3 sn.
6 saniyede tamamlanmayan her ödeme `PENDING_PAYMENT` işaretleniyor. `processing` gibi ara durumlar terminal sayılmıyor.

### K6. İletişim / ticket / newsletter / yasal destek formları hiçbir yere veri göndermiyor → **backend'e devredildi** (`BACKEND-HANDOFF.md` §2)
`useContactForm.ts`, `useTicketForm.ts`, `useNewsletterSignup.ts`, `useContactSupportForm.ts`
Tek bir `fetch`/`axios`/`apiRequest` çağrısı yok. Sadece validasyon + başarı toast'ı:
- *"Message sent — Our support team will reach out within 2 hours during business hours."*
- *"Ticket submitted — Your request has been received and will be reviewed shortly."*
- *"Subscription confirmed — You are now subscribed to the newsletter."*

**Etki:** Müşteri destek talebi açıyor, karşılık bekliyor, talep hiç kimseye ulaşmıyor.

### ~~K7. `companyId` filtresi tek yönlü~~ ✅ DÜZELTİLDİ (bkz. F13)
`parse-listing-search-params.ts` okuyor, `buildProductsUrl.ts`'de karşılığı **yok**.
**Etki:** `/products?companyId=X` ile gelen kullanıcı herhangi bir filtreye/sayfaya/sıralamaya tıkladığı an şirket kapsamı sessizce düşüyor, tüm katalogu görmeye başlıyor.

### ~~K8. BFF route'larında upstream path traversal (8 route)~~ ✅ DÜZELTİLDİ (bkz. F14)
`reviews/[id]:19` · `features/products/api/proxy/http.ts:71` (`products/[id]`) · `user-products/[id]:16` · `products/details/[id]` · `details/by-product/[productId]` · `products/review/[id]` · `reviews/product/[productId]` · `product-questions/product/[productId]`

Dinamik segment `encodeURIComponent`'sız interpolate ediliyor. Next segmenti **decode ederek** verdiği için `/api/reviews/..%2Fusers%2Fme` handler'a `../users/me` olarak ulaşıyor, `fetch` nokta segmentlerini normalize ediyor ve istek **çağıranın kendi token'ıyla başka bir backend endpoint'ine** gidiyor. Deneysel olarak doğrulandı.

Doğru yapan tek route: `barcode/.../[barcode]`. **Düzeltme:** `encodeURIComponent(id)`.

### ~~K9. `shipping-label/download`'da hiç yetkilendirme yok~~ ✅ DÜZELTİLDİ — yarısı (bkz. F15; sipariş sahipliği kontrolü backend'de, `BACKEND-HANDOFF.md` §4)
`app/api/shipping-label/download/route.ts:19` — ne `Authorization` ne cookie kontrolü var. `deliver.goshippo.com` etiket URL'ini bilen/tahmin eden **oturumsuz** herkes alıcının kargo etiketini (ad, adres dahil) indirebiliyor. Handler'da try/catch de yok → Shippo erişilemezse unhandled rejection.

### ~~K10. `images/proxy`: SSRF koruması yok — şu an yalnızca bir bug sayesinde sömürülemiyor~~ ✅ DÜZELTİLDİ (bkz. F16)
`app/api/images/proxy/route.ts:19-33` — host/şema allowlist'i yok, yalnız "URL parse edilebiliyor mu" bakılıyor.

Bugün `169.254.169.254` (cloud metadata), `file://`, `localhost` isteklerinin gitmemesinin **tek sebebi ilgisiz bir bug:** `serverRequest(path)` `BACKEND_URL + path` birleştirdiği için mutlak URL `http://localhost:8080http://…` oluyor ve `fetch` parse edemiyor. Endpoint hiç çalışmamış (her istek 500).

⚠️ `serverRequest` "mutlak URL'i geçir" diye düzeltilirse endpoint çalışmaya başlar **ve aynı anda tam SSRF açılır.** İkisi ayrı ticket'a bölünmemeli. Karşılaştırma: `shipping-label/download` allowlist'i doğru yapıyor (ama K9'daki yetki açığı var).

### ~~K11. Sepete ekleme 500 alırsa kullanıcı hiçbir şey görmüyor~~ ✅ DÜZELTİLDİ (bkz. F17)
`cartStore.ts:130-143` + `PurchaseOptions.tsx:104-121` — `addToCart` hatayı yutuyor (rethrow etmiyor), bu yüzden `PurchaseOptions`'ın catch bloğu **hiç çalışmıyor**. Spinner biter, uyarı yok, ürün sepete girmez. Kullanıcı eklediğini sanıyor.

### K12. Vendor "Reject Return" akışı yorum satırında → **ürün kararı bekliyor, backend'e bağlı DEĞİL** (`BACKEND-HANDOFF.md` son bölüm)
`app/vendor-dashboard/orders/components/order-expanded-content.tsx:238-249` — buton JSX'i `{/* … */}` içinde. Reddetme modalı, sebep validasyonu ve `POST /orders/sellerRejectReturn` **tamamen ölü kod**: satıcı iadeyi yalnızca **onaylayabiliyor**, reddedemiyor.

### ~~K13. Review Queue'da "Kaydet" gerçek kargo ücretlerini sıfırlıyor~~ ✅ DÜZELTİLDİ (bkz. F18)
`app/vendor-dashboard/products/page.tsx:243-269` + `:747-757`

Review Queue eşlemesi `shipmentFee`, `heavyShippingSurcharge` ve `skuCode` alanlarını kopyalamıyor → $25 kargo ücretli ürün bu görünümde **$0.00** okunuyor. Aynı satır içi editör orada da sunulduğu için, vendor **hiçbir şeye dokunmadan** Kaydet'e bastığında `keepOriginalIfUnchanged(0, undefined)` → 0 ve PUT gövdesi `shipmentFee: 0, heavyShippingSurcharge: 0, skuCode: undefined` gidiyor.

**Etki:** sessiz veri kaybı — vendor'ın kargo fiyatlandırması, o farkında olmadan sıfırlanıyor. Testte uçtan uca doğrulandı (`page.actions.test.tsx` → *"zeroes the shipping fees when a review-queue row is saved untouched"*).

### ~~K14. `proxy.ts`'te SONSUZ REDIRECT DÖNGÜSÜ~~ ✅ DÜZELTİLDİ (bkz. F9)
`src/proxy.ts:35`

Vendor kontrolü `isAuthenticated`'a bakmıyor, yalnız role ismine bakıyor:
```ts
user?.roleName === "Vendor" && !pathname.startsWith("/vendor-dashboard")  // → /vendor-dashboard'a yolla
```
`isAuthenticated: false` + `roleName: "Vendor"` içeren bir cookie'de: `/login` → (vendor guard) → `/vendor-dashboard` → (dashboard guard, kimlik doğrulanmamış) → `/login` → … **sonsuza kadar.** Kullanıcı siteye hiç giremiyor, hiçbir sayfa açılmıyor; tarayıcı `ERR_TOO_MANY_REDIRECTS` ile duruyor.

**Planda "zincirleme redirect" olarak (Faz 8 öncesi, teorik olarak) not edilmişti; gerçek tarayıcıda koşunca zincir değil DÖNGÜ olduğu ortaya çıktı.** Bu cookie şekli oturum süresi dolduğunda veya yarım kalmış bir login akışında oluşabilir.

**Etki:** kullanıcı tamamen kilitleniyor; kurtulmanın tek yolu cookie'yi elle silmek. `auth-routing.spec.ts`'te iki test `page.goto(...)`'nun bu hatayla reddedildiğini assert ederek mevcut davranışı kilitliyor.
**Düzeltme (uygulandı):** vendor guard'ı artık `isAuthenticated &&` ile başlıyor. Kimliği doğrulanmamış vendor cookie'si mağazayı anonim ziyaretçi gibi gezebiliyor; `/vendor-dashboard`'a doğrudan gidilirse tek hop'ta `/login`'e düşüyor. `proxy.ts:52-53`'teki ölü koda bilinçli olarak dokunulmadı (savunma derinliği — kullanıcı kararı).

### ~~K15. Vendor ürünler sayfasında SONSUZ RE-RENDER~~ ✅ DÜZELTİLDİ (bkz. F10) — kök nedeni rapordakinden ÇOK daha genişti, ayrı madde olarak **K16**
`src/app/vendor-dashboard/products/page.tsx:869-882`

```tsx
<Image
  src={imageFallbacks[product.id] || !product.image ? "/dentypro-product-placeholder.png" : product.image}
  onError={() => setImageFallbacks((prev) => ({ ...prev, [product.id]: true }))}
/>
```
`onError` fallback olarak **aynı** placeholder yolunu set ediyor. Production build'de (`next build && next start`) `GET /_next/image?url=%2Fdentypro-product-placeholder.png` **404** dönüyor (dosya `public/` altında mevcut ve doğrudan istendiğinde 200 veriyor — sorun image optimizer yolunda, muhtemelen `output: "standalone"` ile ilgili). Placeholder da 404 verdiği için `onError` tekrar tetikleniyor → `setImageFallbacks` sonsuz döngüde çağrılıyor → **tüm ürün tablosu saniyede onlarca kez yeniden mount ediliyor.**

**Etki:** production'da vendor ürün listesi pratikte kullanılamaz (butonlar tıklanamıyor, satırlar DOM'dan sürekli kopuyor); CPU boşuna yanıyor. `next dev`'de görünmüyor — bu yüzden geliştirmede fark edilmemiş.

> ⚠️ Buraya kadarki iki paragraf **düzeltme öncesini ve o zamanki (YANLIŞ) hipotezi** anlatıyor — tarihsel kayıt olarak duruyor. Gerçek kök neden ve güncel durum aşağıda. E2E'deki `/_next/image**` stub'ı da artık YOK.
**GERÇEK KÖK NEDEN (sonradan bulundu — `output: "standalone"` DEĞİL):** `next.config.ts:15`'te `images.loader: "custom"` ayarlı. Next'in kaynağında (`node_modules/next/dist/server/next-server.js:256`) `loader !== 'default'` ise `/_next/image` **koşulsuz 404**'lenir. Ama `image-loader.ts:20` relative yolları tam oraya gönderiyordu. Yani sorun placeholder'a özel değildi: **`public/` altındaki her görsel production'da 404 veriyordu — login sayfasının logosu dahil.** Vendor tablosundaki döngü bunun yalnız en gürültülü belirtisiydi.

Gerçek prod artefaktıyla (`node .next/standalone/server.js` — Dockerfile'ın koştuğu şey, `next start` değil) ölçüldü:

| İstek | Düzeltme öncesi | Sonrası |
|---|---|---|
| `/DentyProLogo.png` (doğrudan) | 200 | 200 |
| `/_next/image?url=%2FDentyProLogo.png&w=64` | **404** | 404 (artık kimse istemiyor) |
| Login sayfasının render ettiği `src` | `/_next/image?...` → kırık | `/DentyProLogo.png` → **200** |

Vercel'de sorun çıkmazdı (platform `/_next/image`'i kendi karşılar), ama deploy Docker + ECR ile self-hosted `server.js` üzerinden.

**Düzeltme (uygulandı):** (1) `image-loader.ts` artık relative yolları da olduğu gibi döndürüyor — optimizer devrede değil; (2) `onError` handler'ı fallback zaten set ise `prev`'i aynen döndürüyor (React bail-out eder), böylece başka bir 404'te döngü tekrar oluşamaz.

**Bilinçli bedel:** yerel asset'ler artık resize/format dönüşümünden geçmiyor. `public/` 4.7 MB ve içinde `home-hero.png` 1.8 MB, `dentypro-product-placeholder.png` 1.4 MB, `DentyProLogo.png` 117 KB var — bunlar ham servis ediliyor. **Takip işi:** bu asset'leri elle sıkıştır/`.avif`'e çevir (banner'lar zaten avif). Bugüne kadar zaten 404 verdikleri için bu bir regresyon değil, ama perf borcu.

**Test tarafı:** `vendor-products.spec.ts`'teki `**/_next/image**` stub'ı KALDIRILDI — bug'ı maskeliyordu, dursaydı K15 geri geldiğinde spec sessizce geçmeye devam ederdi. Spec artık stub'sız, production build'de geçiyor.

### ~~K16. Production'da `public/` altındaki HER görsel 404 veriyordu — login logosu dahil~~ ✅ DÜZELTİLDİ (bkz. F10)
`src/lib/image-loader.ts:20` + `next.config.ts:15`

K15 araştırılırken ortaya çıktı ve **K15'ten kapsamlı olduğu için ayrı madde:** K15 tek bir sayfanın (vendor ürünler) kullanılamaz hale gelmesiydi; bu ise **sitedeki tüm yerel görsellerin production'da hiç yüklenmemesiydi.** Vendor tablosundaki sonsuz döngü bu bugun yalnızca en gürültülü belirtisiydi — asıl etki sessizdi: logo, hero görselleri, ürün placeholder'ı, sepet/sipariş/checkout satır görselleri, hepsi kırık kutu olarak çıkıyordu ve hiçbir yerde hata üretmediği için kimse fark etmemişti.

**Neden görülmedi:** `next dev` `/_next/image`'i sunuyor, `next start`/standalone sunmuyor. Geliştirmede her şey normal görünüyor. Ayrıca `next start` uyarı verse de asıl fark `node .next/standalone/server.js`'te; Dockerfile'ın koştuğu tam olarak bu.

**Neden Vercel'de çıkmazdı:** platform `/_next/image`'i kendi karşılıyor. Deploy Docker + ECR ile self-hosted olduğu için bu prod'da canlıydı.

**Sınıf olarak dersi:** "dev'de çalışıyor" bir görsel için delil değil. `next.config.ts`'teki bir ayar (`loader: "custom"`) ile ondan habersiz yazılmış bir yardımcı (`image-loader.ts` relative yolları optimizer'a gönderiyor) arasındaki sessiz çelişkiydi; ikisi de tek başına doğru görünüyor. Bekçi test: `src/lib/image-loader.test.ts` (loader asla `/_next/image` üretmemeli).


---

## ♿ Erişilebilirlik bulguları (Faz 8, `a11y-smoke.spec.ts`)

`@axe-core/playwright` ile `serious`/`critical` seviyesinde taranan rotalar. **Testler bu ihlaller yüzünden düşmüyor** (mevcut davranışı kilitle kuralı); `FINDING` olarak loglanıyor.

| # | Bulgu | Nerede |
|---|---|---|
| A1 | Sayfada hiç `<h1>` yok | `/` (ana sayfa) |
| A2 | `<main>` landmark yok | `/login` |
| A3 | Başlık seviyesi atlanıyor (h1 → h3) | `/products` |
| A4 | Başlık seviyesi atlanıyor (h2 → h4) | `/cart` |
| A5 | `button-name` — erişilebilir adı olmayan butonlar (4 düğüm `/`, 4 düğüm `/products`) | `/`, `/products` |
| A6 | `link-name` — erişilebilir adı olmayan linkler (4 düğüm `/`, 3 düğüm `/products`) | `/`, `/products` |
| A7 | `color-contrast` — minimum kontrast oranı sağlanmıyor (1 düğüm `/`, 7 `/products`, 9 `/cart`) | `/`, `/products`, `/cart` |

---

## 🚧 Bitmemiş özellikler — kod var, davranış yok

Faz 5 ve 7'de ortaya çıkan ayrı bir sınıf. Bunlar tek tek "bug" değil: UI mevcut, kullanıcı etkileşime giriyor, çoğunda başarı mesajı bile alıyor — ama arkasında hiçbir şey yok. Regresyon değil, **hiç bitmemiş iş**. Testler mevcut (boş) davranışı kilitliyor; her biri implementasyon geldiğinde kırılacak ve o testin güncellenmesi gerekecek.

### A. Kontrol var, arkasında handler yok

| # | Ne | Dosya | Kullanıcı ne görüyor |
|---|---|---|---|
| B1 | **Storefront ürün kartında "Add to Cart"** — favorilere ekleme ve karşılaştırma butonlarıyla birlikte hiç handler'ı yok | `ProductCard.tsx:98-140` | Tıklıyor, hiçbir şey olmuyor. Listeleme sayfasının ana sepete-ekleme yolu bu. |
| B2 | **Ek dosya yükleme** — "browse" butonunun arkasında `<input type="file">` yok | `FormAttachmentDropzone.tsx` | Dosya sürükleyip bırakıyor, ticket'a hiçbir ek gitmiyor |
| B3 | **Ticket açıklaması rich-text toolbar'ı** — butonların handler'ı yok | `TicketDescriptionField.tsx` | Kalın/italik/liste tıklanıyor, metin değişmiyor |
| B4 | **Arama büyüteci** — `SearchActionButton`'ın handler'ı yok | `SearchActionButton.tsx` | Arama yalnız debounce ile geliyor; butona basmak hiçbir şey yapmıyor |
| B5 | **Legal "Download PDF"** — dosya üretmiyor, yalnız "yakında" toast'ı | `useDocumentActions.ts:10-12` | İndirme bekliyor, bilgi mesajı alıyor |
| B6 | **`ui/data-table`'da sıralama / sütun gizleme / satır seçimi yok** — `<th>` düz metin | `ui/data-table.tsx` | Başlığa tıklıyor, tablo sıralanmıyor. `aria-sort` eksiği (Orta/Erişilebilirlik) buradan geliyor, dashboard tablolarından değil. |
| B6b | **Fatura ekranındaki 6 buton** — Export All / Request Invoice / Pay Now / Download PDF / Mark as Paid / Send Reminder, hiçbirinde `onClick` yok | `BuyerInvoicesPage.tsx` | Faturasını ödemeye çalışıyor, hiçbir şey olmuyor |
| B6c | **"Change Password"** — `onClick` yok | `AccountSettingsShared.tsx` | Şifre değiştirme yolu yok |
| B6e | **Vendor ürünler "Export" butonu** — `onClick`/form/href yok | `vendor-dashboard/products/page.tsx:1225-1226` | Dışa aktarmaya çalışıyor, hiçbir şey olmuyor |
| B6f | **Promotions "Export" + `7D/30D/90D` periyot seçici** — `setPeriod` çağrılıyor ama `period` hiçbir hesaplamada kullanılmıyor, sadece butonun rengi değişiyor | `vendor-dashboard/promotions/page.tsx:88,~330,~348` | "Dönem filtreledim" yanılsaması; KPI, huni, tablo hiç değişmiyor |
| B6d | **Adres silme koruması yok** — "adres kullanımdaysa engelle" kodda mevcut değil | `AddressManagementShared.tsx` | Aktif siparişteki adres koşulsuz silinebiliyor |

### B. Ekranda sahte veri

| # | Ne | Dosya | Kullanıcı ne görüyor |
|---|---|---|---|
| B7 | **Alıcı faturaları** — fetch yok, 10 uydurma fatura (`INV-2026-*`); üstelik "bugün" `new Date("2026-05-01")` olarak sabit → "Last 30 days" filtresi donmuş | `invoicesData.ts`, `BuyerInvoicesPage.tsx:22,89` | Kendi faturası sanıyor; varsayılan filtre 2 fatura gösteriyor |
| B8 | **Alıcı ödeme yöntemleri** — fetch yok, 3 uydurma kart ("Serhat Belen •••• 4532") | `buyer-dashboard/payment-methods/paymentMethodsData.ts` | Kendi kartı sanıyor |
| B9 | **Ana sayfa + tedarikçi dizini** — fetch yok, 12 uydurma tedarikçi | `home/homePageData.ts`, `suppliers/suppliersPageData.ts` | Gerçek katalog sanıyor |
| B11 | **Vendor promosyon kampanyaları** — `useState(PROMOTION_CAMPAIGNS)`, 8 sabit kampanya (`cmp-001`…`cmp-008`); dosyada `@/lib/api/*` importu, `useEffect`, `fetch`, SWR/React Query **yok**. Create/Edit/Duplicate/Pause/Archive akışlarının hepsi yalnız local state — sayfa yenilenince sıfırlanıyor. Sayfa bunu kendi UI'ında itiraf ediyor (`:624` *"Mock-only campaign form for dashboard workflow prototyping"*) | `vendor-dashboard/promotions/page.tsx:85`, `promotions/mock-data.ts` | Kampanya yönettiğini sanıyor | 
| ~~B10~~ ✅ | ~~**Checkout başlangıç adresi** — hardcoded demo~~ — **düzeltildi**, bkz. **F8** | `checkoutStore.ts:92-101` | Her checkout bu adresle açılıyor |

### C. Veri hiçbir yere gitmiyor ama "gönderildi" deniyor

**K6**'nın Faz 5'te uçtan uca doğrulanmış hali: `useContactForm`, `useTicketForm`, `useNewsletterSignup`, `useContactSupportForm` — `fetch` spy'ı **hiç** çağrılmıyor. Kullanıcıya *"Message sent"*, *"Your request has been received"*, *"Our legal team will contact you shortly"* deniyor. B2/B3 ile birleşince: destek talebi, eki ve biçimlendirmesiyle birlikte tamamen kayboluyor.

### D. Endpoint ayakta ama hiç çalışmıyor

**~~`images/proxy` her istekte 500 dönüyor.~~ ✅ DÜZELTİLDİ (bkz. F16) — aşağıdaki paragraf tarihsel kayıt.** `serverRequest(path)` `BACKEND_URL + path` birleştirmesi yaptığı için mutlak URL `http://localhost:8080http://…` oluyor, `fetch` parse edemiyor. Endpoint hiçbir zaman görsel döndürmemiş.

⚠️ **Bu bug şu an tek SSRF koruması.** Handler'da host/şema allowlist'i yok (bkz. **S1**). `serverRequest` "mutlak URL'i geçir" diye düzeltilirse endpoint çalışmaya başlar **ve aynı anda tam SSRF açılır**. İkisi ayrı ayrı ele alınmamalı.

### E. Erişilemeyen kod dalları (yazılmış, çalışmıyor)

- ~~**`PurchaseOptions.tsx:104-121`** — sepete ekleme 500 alırsa `cartStore.addToCart` hatayı yutuyor~~ ✅ **DÜZELTİLDİ** (K11 / F17) — `addToCart` artık rethrow ediyor, catch bloğu çalışıyor. Tarihsel kayıt: (rethrow etmiyor) → catch bloğu hiç çalışmıyor. Kullanıcı spinner'ın bitmesini görüyor, uyarı almıyor, ürün sepete girmiyor. **Bu bir "bitmemiş özellik" değil, sessiz veri kaybı.**
- `PurchaseOptions.tsx:110-116` — 401 dalı ölü: interceptor `authHandled` damgalayıp redirect'i kendisi yapıyor
- `SearchResultsDropdown.tsx:29` — "No results found" dalı ölü: `useMainSearch` sonuç 0 ise dropdown'ı hiç açmıyor
- `WarrantyOptions` — `PurchaseOptions` içinde yorum satırına alınmış

---

## 🟠 Yüksek

| # | Sorun | Dosya | Etki |
|---|---|---|---|
| ~~Y1~~ ✅ | ~~`logout` cookie'yi silmiyor~~ — düzeltildi, bkz. F21 | `authStore.ts` | `proxy.ts` doğru ele alıyor, ama sadece cookie varlığına bakan kod sessizce yanlış çalışır |
| ~~Y2~~ ✅ | ~~Varsayılan port **8080**, olması gereken **8081**~~ — düzeltildi (4 dosya), bkz. F22 | `server-request.ts` | `BACKEND_URL` yoksa server-side istekler yanlış servise gider |
| Y3 | Lisans kapısı fail-closed **ama mesaj yanıltıcı** | `useCartPage.ts:130-141` | Lisans servisi çökerse checkout kilitleniyor; mesaj "hesabınızdan lisans ekleyin" diyor, oysa sorun backend'de |
| ~~Y4~~ ✅ | ~~Görsel seçimi kendiliğinden sıfırlanıyor~~ — düzeltildi, bkz. F23 | `useProductImageGallery.ts` | Kullanıcı küçük görsele tıklıyor, ilgisiz bir state değişikliğinde (büyüteç mousemove) ana görsele dönüyor |
| Y5 | `vendor-reviews.ts` tüm hataları yutup `null` dönüyor | `vendor-reviews.ts` | 401 ile 500 ayırt edilemiyor |
| Y6 | **`describeNextOrderDate` backend'in naive `LocalDateTime`'ını koşulsuz UTC sayıyor** (Faz 9.3) | `describeNextOrderDate` | Backend UTC dışı bir saat diliminde koşuyorsa (Europe/Istanbul +3, PST −8) kayma fonksiyonun ±12 saatlik yuvarlama sınırını aşabiliyor → gerçekten **gecikmiş** bir sipariş "bugün", henüz zamanı gelmemiş bir sipariş "şimdi" görünüyor. Somut girdi çiftleri testte kilitli. |
| Y7 | **Sipariş tarihi farkı takvim günü değil, kayan 24 saat penceresi** (Faz 9.3) | `describeNextOrderDate` | `Math.round((parsed-now)/86_400_000)` kullanıldığı için 23:30 → 00:30 geçişinde ertesi güne geçmiş bir tarih hâlâ "bugün", aynı takvim gününde 23 saat sonrası ise "yarın" okunuyor. |
| Y6 | `public-products.ts`'in 6 filtre endpoint'i tüm hataları yutup `[]` dönüyor | `public-products.ts` | Boş filtre listesi mi, çökmüş servis mi belli değil |
| ~~Y7~~ ✅ | ~~`checkoutStore.reset()` ilk hale döndürmüyor~~ — düzeltildi, bkz. F24 | `checkoutStore.ts:126` vs `:174` | `selectedShippingEtaText` başlangıçta `""`, reset sonrası `"Express Delivery - 2-3 business days"` |
| ~~Y8~~ ✅ | ~~Ödeme yöntemi değişince kart bilgisi temizlenmiyor~~ — düzeltildi, bkz. F25 | `checkoutStore.ts` | `net30`'a geçilse bile `paymentMethodId` payload'da kalıyor |
| Y9 | `applyTaxExemption` varsayılanı `true` | `checkoutStore.ts:116` | Vergi muafiyeti kullanıcı istemeden opt-in |
| ~~Y10~~ ✅ | ~~Auth kontrolü gövde okumasından **sonra** (4 route)~~ — düzeltildi, bkz. F19 | `products/details/route.ts:9-13`, `products/details/[id]` PUT, `details/by-product` PUT, `user-products/[id]` PUT | Oturumsuz + bozuk gövde **500** dönüyor, 401 değil. `bulk-discount` doğru sırada yapıyor |
| ~~Y11~~ ✅ | ~~Listeleme sayfası ürün sorgusu hata verirse tamamen düşüyor~~ — düzeltildi, bkz. F36 | `get-listing-page-data.ts:38` | 5 facet kendi içinde `catch` edip `[]` dönüyor (kısmi degrade), `getPublicProducts` hatayı kaçırıyor → error boundary, boş durum gösterilmiyor |
| ~~Y12~~ ✅ | ~~Upstream hata gövdesi olduğu gibi tarayıcıya iletiliyor~~ — düzeltildi, bkz. F20 | `users/me:26,55`, `product-questions`, `product-answers` | Backend Java stack trace'i istemciye kadar gidiyor. `images/proxy` 500'ü `BACKEND_URL`'i (iç adres) sızdırıyor |
| Y13 | Google Places çökerse adres formu sessizce kilitleniyor | `AddressManagementShared.tsx:250`, `AddressAutocomplete.tsx:53` | Kaydet `placeId`'ye bağlı, manuel giriş yolu yok, hata yalnız `console.error` |
| ~~Y14~~ ✅ | ~~`printLabel`: `disconnect()` hiçbir yolda çağrılmıyor~~ — düzeltildi, bkz. F26. **Açık kalan:** QZ Tray yoksa kurulum yönlendirmesi yok, `qz.security.*` kullanılmıyor | `lib/qz/printLabel.ts` | Websocket açık kalıyor. QZ Tray yoksa kurulum/indirme yönlendirmesi de yok; `qz.security.*` hiç kullanılmıyor (imzasız kurulum gerektiriyor) |
| Y15 | Kimlik kaynağı route'tan route'a tutarsız | `user-products/route.ts` (GET cookie kabul ediyor, POST etmiyor) vd. | Aynı dosyada iki verb farklı davranıyor; hangi isteğin `auth-storage` cookie'siyle geçeceği öngörülemez |
| ~~Y16~~ ✅ | ~~`google-maps`: sunucu hatası istemci hatası gibi gösteriliyor~~ — düzeltildi, bkz. F27. **Açık kalan:** `NEXT_PUBLIC_…` fallback'i server key'i sessizce public anahtara düşürüyor | `google-maps/*` | `OVER_QUERY_LIMIT` / `REQUEST_DENIED` → **400**. API key sızıntısı **yok** (doğrulandı), ama `NEXT_PUBLIC_…` fallback'i server key'i sessizce public anahtara düşürüyor |

---

## 🟡 Orta

**Faz 9 (property-based + edge-case turu) bulguları**
- ~~**`formatCurrency` `Infinity` guard'ını atlıyor**~~ ✅ **DÜZELTİLDİ** (F37)
- **`parseStringArray`'in boş değer filtresi yalnız gerçek boş string'i eliyor** — `" "` truthy olduğu için filtreden geçiyor. **DENENDİ, GERİ ALINDI (24 Ağu 2026):** `.trim()` eklemek `url-contract.property.test.ts`'teki genel round-trip property'sini kırıyor (sayaç örnek `vendors: [" "]`, seed 42) çünkü `arrayMember` generator'ı whitespace-only string'i "geçerli" sayıyor. Gerçek düzeltme generator'ın domain tanımını yeniden tasarlamayı gerektiriyor — **maliyeti faydasını aşıyor.**
- **`currency` alanı API katmanında taşınıyor ama UI'da hiç okunmuyor** — `TaxEstimate.currency`, `orders.ts` ve `shipment.ts`'teki `currency` alanları hiçbir yerde kullanılmıyor; `formatCurrency` `en-US`/`USD` sabit. Backend `EUR` dönse bile ekranda `"$9,99"` yazıyor. Çok para birimli senaryo gündeme gelirse sessiz para birimi karışıklığı riski.
- **YAPILMAYACAK (fayda yok):** `usePurchaseCalculator`'ın ham IEEE-754 döndürmesi ve `currency` alanının okunmaması — ikisi de bugün ekrana sızmıyor; düzeltmek test uğruna kod değiştirmek olur.
- **10.000 satırlık sepette kayan nokta birikimi** — 10.000 × $0,10 toplamı `1000.0000000001588` veriyor (kesin `1000` yerine). İki ondalıkla gösterildiği için bugün kullanıcıya yansımıyor; regresyon testi olarak kilitlendi, bug sayılmadı.
- **Ölçek ölçümleri (bilgi):** 10k satırlık sepet toplama ≈200 ms · `useOrderSummary` hesap+render 2–10 ms · 200 vendor'lu gruplama ≈60 ms. Doğruluk her üçünde de korunuyor.

**Sepet / state**
- ~~`fetchCart` 500'de `lastFetchedAt` yazmıyor~~ ✅ **DÜZELTİLDİ** (F28)
- ~~`fetchCart({force:true})` in-flight tekilleştirmeye girmiyor~~ ✅ **DÜZELTİLDİ** (F29)
- **Üç farklı hata sözleşmesi — AÇIK, bilinçli** — `addToCart` `error` yazar **+ throw eder** · `removeFromCart`/`updateQuantity` `error` yazar, **sessiz döner** · `setItemAutoOrder` **throw eder ama `error` yazmaz**. Sonuncusu 24 Ağu 2026'da bir kez `error` yazacak şekilde değiştirildi ve **geri alındı**: tek çağıran (`useCartPage`) hem kendi "Could not update auto-reorder" toast'ını hem `error`'ı dinleyen jenerik "Cart unavailable" toast'ını gösterdiği için **tek hata iki toast** üretti. Tekilleştirme fonksiyon fonksiyon yapılamaz — dört fonksiyonu tek sözleşmeye çekip **tüm çağıran envanterini** gözden geçirmek gerekiyor. **Bu tuzak bir kez ısırdı:** K11/F17 tam olarak buydu (`PurchaseOptions`'ın catch bloğu ölü koddu). `cartStore.ts` ve `useCartPage.test.ts`'te asimetriyi kilitleyen testler var.
- ~~`clearCart` `lastFetchedAt` sıfırlamıyor~~ ✅ **DÜZELTİLDİ** (F30) — kendiliğinden refetch bilinçli olarak eklenmedi
- ~~401'de login sonrası ilk 1 sn boş sepet tazelenmiyor~~ ✅ **DÜZELTİLDİ** (F31)

**Auth / proxy**
- ~~`proxy.ts:35` Vendor kontrolü `isAuthenticated`'a bakmıyor~~ ✅ **DÜZELTİLDİ** (K14 / F9) — guard artık `isAuthenticated &&` ile başlıyor
- ~~`proxy.ts:11` çift decode~~ ✅ **DÜZELTİLDİ** (F32)
- ~~`client.ts:73-77` bozuk auth cookie `localStorage` fallback'ini yutuyor~~ ✅ **DÜZELTİLDİ** (F33)
- ~~Auth cookie `Secure` bayrağı taşımıyor~~ ✅ **DÜZELTİLDİ** (F34) — yalnız https'te; `HttpOnly` zaten olamaz (client store)
- ~~`logout` idempotency yalnız sıralı çağrıda geçerli~~ ✅ **DÜZELTİLDİ** (F35)

**Fiyat / hesap**
- `usePurchaseCalculator` ham IEEE-754 döndürüyor (`total = 9506.112000000001`). Sunum katmanı formatlıyor, **şu an ekrana sızmıyor** — ama formatlamayı unutan yeni bir tüketici aynı bug'ı üretir
- `stockCount=0` → miktar **1** oluyor (`stockCount || 1`). **İNCELENDİ, DÜZELTİLMEDİ (24 Ağu 2026):** `PurchaseActions.tsx:12` `stockCount <= 0` iken Add to Cart/Buy Now'ı **disable ediyor** ve "Out of Stock" yazıyor; `QuantitySelector.tsx:47` artı tuşunu (`quantity >= stockCount`), eksi tuşunu da (`quantity <= 1`) kilitliyor. Kullanıcı bu durumla **etkileşemiyor** → görünür zarar yok. Etki yalnız görsel ("Quantity: 1" + "Units available: 0" yan yana). `PurchaseOptions.test.tsx:206-222` zaten kilitliyor. Effect no-op olduğu için sonsuz döngü riski de pratikte yok
- Garanti seçimi: resolved default değişince kullanıcının açık seçimi sessizce eziliyor
- Ağır kargo ücreti **adet başına** çarpılıyor → $75'lik ücret 10 adette $750
- ~~`CartItemPrice.tsx` ve `VendorShipmentRates.tsx` `toFixed` kullanıyor~~ ⚠️ **BULGU YANLIŞTI** — ikisi de zaten `formatCurrency` kullanıyor. `VendorShipmentRates.tsx:177,353`'teki `toFixed(2)` **ekrana basılmıyor**: `ShipmentRate.amount` (tipi `string`) alanına normalize ediyor, aşağı akışta `Number(rate.amount)` ile parse ediliyor (`useShippingDetails.ts:121`) — `formatCurrency`'ye çevirmek (`"$12.34"` döner) o zinciri **kırar, çevirmeyin**. Gerçek ihlaller başka yerdeydi → F39

**Kargo / checkout**
- Adres değişince kargo seçimleri invalidate edilmiyor → özet ekranındaki toplam bayat olabilir
- `termsAgreed` yalnız adım 3'te kontrol ediliyor, adım 4'te yeniden bakılmıyor
- `createPaymentMethod` ağ hatası try/catch'siz → unhandled rejection, spinner takılı kalıyor

**Mimari desen**
- **Modül seviyesinde reset edilemeyen cache üç yerde:** `cartStore.ts` (`inFlightCartFetch`), `shipment.ts` (`recentRatesResponses`, 2 sn), `address.ts` (2 sn memoization). Hiçbirinin dışa açık temizleme yolu yok → testler arası ve oturumlar arası sızma riski
- `filterUserProducts` ve `getProductByBarcode` diğer API metotlarından farklı hata deseni kullanıyor (`validateStatus: () => true` + elle kontrol)
- Aynı kart verisi iki farklı shape'te dolaşıyor: `/orders/saved-cards` mapping'siz, `/cards` `mapApiCard`'dan geçiyor
- `cardOpenToAutoPayment` ve `cardAutoOrderCard` her zaman aynı değeri alıyor → iki ayrı alan olmalarının anlamı kayıp

**Erişilebilirlik** (Faz 5-6'da 8 yeni bulgu — hepsi WCAG 4.1.2)
- **`FormField.tsx:16-24` — hata metninin `id`'si yok, `aria-describedby` bağlanmıyor.** `aria-invalid=true` duyuruluyor ama **neden** hiç okunmuyor. Tüm form primitiflerini etkiliyor (`TextField`, `PasswordField`, `TextAreaField`, `SelectField`)
- Checkout'u bloke eden sepet uyarısı ve lisans uyarısı düz `<div>` — `role="alert"`/`aria-live` yok (`CartSummaryPanel.tsx:81-103`, `NotificationCard.tsx:38`). Ekran okuyucu kullanıcısı checkout'un kilitlendiğini hiç duymuyor
- Checkout hatalarında (kart reddi) da canlı bölge yok — yalnız toast
- `aria-current="page"` yok: aktif menü öğesi yalnız renk sınıfıyla belirtiliyor (`DashboardSidebar.tsx:117`, `DashboardHeader.tsx:92`)
- `AccountMenu` semantik menü değil — `role="menu"/"menuitem"` yok, Escape ile kapanmıyor, ok tuşu navigasyonu yok
- `PaginationBar.tsx:24-28,55-59` — ilk/son sayfada prev/next `href`siz `<span>`'a dönüşüyor, erişilebilirlik ağacından tamamen kayboluyor (devre dışı buton bile değil)
- `AddressAutocomplete.tsx:120-128` — öneri listesi `<li onClick>`; `role="option"`/listbox semantiği yok → adres klavyeyle seçilemiyor
- `SupplierComparisonRow.tsx:17-24` — satır `onClick`'li ama `role`/`tabindex`/klavye handler'ı yok
- **Radix `SelectTrigger` hiçbir yerde `aria-label` almıyor** — `role="combobox"` ismini içerikten türetmediği için marka / sayfa boyutu / review filtresi Select'lerinin erişilebilir adı **boş**; ekran okuyucu yalnız "combobox" diyor (`vendor-dashboard/products/page.tsx`)
- Vendor soru sayfasında cevap düzenle/sil ikon butonlarının erişilebilir adı yok — `aria-label`/`title`/metin hiçbiri yok (`vendor-dashboard/questions/page.tsx:140-152`)
- Tablo sıralama yönü ekran okuyucuya bildirilmiyor — `<th>`'de `aria-sort` yok, yön sadece dekoratif chevron ile (WCAG 4.1.2). Bu yüzden 1 test `skip` durumda (`orders-table.test.tsx`)
- Pagination prev/next `href`siz `<a>` → örtük ARIA rolü yok, tab sırasına girmiyor, klavyeyle erişilemiyor

**Görsel / asset (K16 düzeltmesinden DOĞAN yeni borç)**
- **Yerel asset'ler artık hiç optimize edilmiyor.** K16 düzeltmesi `image-loader.ts`'i optimizer'ı tamamen atlatacak şekilde değiştirdi (tek güvenli seçenek: `loader: "custom"` ayarlıyken optimizer prod'da zaten yok). Sonuç: `public/` (4.7 MB) ham servis ediliyor — `home-hero.png` **1.8 MB**, `dentypro-product-placeholder.png` **1.4 MB**, `herosection.png` 1.0 MB, `DentyProLogo.png` 117 KB. Placeholder 40×40 px kutuda gösterilmesine rağmen 1.4 MB iniyor ve ürün listesindeki her kırık görselde yeniden kullanılıyor. Regresyon değil (önce hiç yüklenmiyorlardı) ama **ölçülebilir perf borcu**. Çözüm asset tarafında: elle sıkıştır / `.avif`'e çevir (banner'lar zaten avif) veya `next/image`'in statik import + build-time optimizasyonuna geç. Tek satırlık loader değişikliğiyle geri alınamaz — `loader: "custom"` kaldırılırsa net32 gibi Cloudflare arkası CDN'ler optimizer'a 403 verdiği için harici ürün görselleri kırılır.

**Diğer**
- `useMainSearch` min karakter eşiği yok — tek harf bile arama tetikliyor
- `useMainSearch`'ün `catch` bloğu ölü kod (`searchPublicProducts` zaten hataları yutuyor)
- `addToCart`'taki `isAuthErrorStatus` kontrolü pratikte ölü kod (interceptor önce `authHandled` damgalıyor)
- `describeNextOrderDate` backend'in naive `LocalDateTime`'ını UTC varsayıyor → **DST/saat dilimi kayması riski**. Faz 9.3'te test edildi ve iki somut bulguya dönüştü, bkz. 🟠 Yüksek / Y6-Y7
- **Ulaşılamayan validasyon dalları** — tarayıcı doğrulaması önce devreye girdiği için ölü kod: `products/create/page.tsx:711-733` (`min="0"` → "non-negative" dalları), `AddressManagementShared.tsx:97` (alan `required`), `LicenseManagementCard.tsx:111`, `vendor-dashboard/team/page.tsx:45` (input `type="email"`)
- `user-products` GET 403 alınca filter endpoint'ine düşüyor; beklenmeyen payload şekli hata değil **"ürün yok"** oluyor. `user-products/stats` tek alanı eksik bir objeyi "liste" sanıp **tüm sayaçları 0** yapıyor
- Yorum/soru/cevap yazma uçlarında BFF kapısı yok — `Authorization` yoksa backend **anonim** çağrılıyor (`reviews`, `product-questions`, `product-answers`)
- `products/my-products` çağıranın tüm query string'ini allowlist'siz iletiyor (`vendorId=someone-else` dahil); `barcode/products` sayfalama parametrelerini sessizce yutuyor
- `VendorShipmentRates.tsx:16` — localStorage'da 15 dk TTL'li, dışa açık temizleme yolu olmayan cache (modül cache'i kümesine dördüncü üye)
- ~~`ProductCard.tsx:100` `toFixed(2)` ile basıyor~~ ✅ **DÜZELTİLDİ** (F39)
- ~~`PriceRangeFilter.tsx:41-45` — `min > max` doğrulaması yok~~ ✅ **DÜZELTİLDİ** (F38)
- `AccountSettingsShared.tsx:353` — telefon `formatPhoneNumber`'dan geçmiyor, ham değer gösteriliyor

**Vendor ürün & soru sayfaları (Faz 6b)**
- Ürün yükleme hatası **tamamen sessiz** (`products/page.tsx:341-372`): 500'de toast yok, hata bandı yok — boş durum metni gösteriliyor, kullanıcı "ürünüm yok" sanıyor
- Boş katalogda ters aralık: *"Showing **1-0** of 0 products"* (`products/page.tsx:1331-1338`)
- Kesirli stok sessizce kırpılıyor: `Number.parseInt` ile doğrulanıyor, `"1.5"` reddedilmiyor, stok **1** yazılıyor, uyarı yok (`products/page.tsx:726,1112`)
- Yalnız devre dışı kalmak için render edilen buton: `showReviewEdit = isRejected || isPending` ama `disabled={isPending}` (`products/page.tsx:1176`)
- Soru sayfası yalnız `answers[0]`'ı render ediyor — fazlası sessizce gizleniyor, düzenle/sil hep ilkini hedefliyor (`questions/page.tsx:55`)
- `fetchCounts` catch bloğu boş — sayaç ucu hata verirse sekme rozetleri sessizce kayboluyor (`questions/page.tsx:~226`)
- `promotions/page.tsx:~168` — `statusFilter !== "Archived" && statusFilter === "All"`: ilk koşul ikincisinin altında daima doğru (tautoloji/ölü dal)
- **Karar bekliyor:** "Unanswered" filtresindeyken bir soru cevaplanınca kart listede kalmaya devam ediyor (refetch yok); "Answered" filtresinde cevap silinince de kalıyor. Ürün kararı olabilir — testle kilitlenmedi

---

## ⚙️ Test altyapısı notları (sonraki fazlar için)

1. **`vi.useFakeTimers()` (tümü) MSW + axios'u kilitler** — istek asla resolve olmaz. Ağ + zaman birlikte gerekiyorsa `vi.useFakeTimers({ toFake: ["Date"] })` veya `{ toFake: ["setTimeout", "clearTimeout"] }` kullan.
2. **Dosya-içi `afterEach` global `cleanup()`'tan ÖNCE çalışır** — `afterEach`'te zustand `setState` yaparsan act uyarısı alırsın. Store kurulumunu `beforeEach`'e koy.
3. **`vi.restoreAllMocks()` vitest 2'de modül mock implementation'ını da sıfırlar** — `beforeEach`'in **başına** koy.
4. **Test dosyasında `setupServer` KURMA** — global server var, çift interceptor `TypeError: Body is unusable` üretir. `server.use(...)` ile override et.
5. **`FormData` gövdeli isteklerin MSW round-trip'i jsdom'da süresiz asılı kalıyor** — multipart testlerinde `vi.spyOn(apiRequest, "requestJson")` ile wire contract'ı doğrula. Gerçek doğrulama Faz 8'de Playwright'a kalıyor.
6. **`productsAPI` `/backend-api`'ye değil Next route handler'larına gidiyor** → handler pattern `*/api/...`, diğer modüllerde `*/backend-api/...`.
7. Coverage ratchet `vitest.config.mts`'te; her faz sonunda gerçekleşenin ~2 puan altına sabitleniyor.
8. **Vitest 2.1.9'da `test.projects` YOK** (o API Vitest 3 ile geldi; 2.1'de `test.workspace` yalnız dosya yolu kabul ediyor). jsdom/node ayrımı `vitest.workspace.ts`'te `defineWorkspace` ile. Projeler `extends: "./vitest.config.mts"` **kullanmıyor** — Vitest genişletmede dizileri birleştirdiği için node projesi jsdom setup'ını da yükleyip `window is not defined` ile ölüyor. Yalnız `@` alias'ı tekrarlanıyor. Vitest 3'e geçilirse dosya silinip içeriği `test.projects`'e taşınacak.
9. **`FormData` MSW round-trip'i node projesinde ÇALIŞIYOR** — #5'teki jsdom kilitlenmesi orada yok; route testlerinde multipart gerçek istekle (boundary dahil) doğrulanabiliyor.
10. **Radix `Select` jsdom'da kilitleniyor** (PointerCapture API yok; Dialog içindeyken süresiz asılıyor). `src/test/radix.ts` polyfill'i + `userEvent`'e `pointerEventsCheck: 0` gerekiyor; Dialog içindeki Select hâlâ kapsanamıyor.
11. **Paralel ajanlar aynı anda vitest koşarsa Radix Select testleri 5 sn timeout'una takılıyor** (CPU çekişmesi). `TicketSubmissionForm.test.tsx` bu yüzden "flaky" sanıldı; izole 3 koşumda 3/3 geçiyor. Bir ajanın bildirdiği tam-süit hatasını, tek başına koşmadan gerçek kabul etme.
12. `@stripe/react-stripe-js@2.9.0` React 19'u peer olarak desteklemiyor — **testlerde sorun çıkarmıyor** (modül `vi.mock` ile tamamen değiştiriliyor), uyarı yalnız `npm install` seviyesinde.

### Faz 8 (e2e) altyapı notları

13. **`page.route` Server Component fetch'lerini GÖREMEZ.** `/`, `/products`, `/products/:id` verisi Next SUNUCU sürecinden `BACKEND_URL`'e gidiyor (`src/lib/api/{public-products,product-detail,server-request}.ts` — hepsi `process.env.BACKEND_URL`'i **modül yüklenirken** okuyor). Çözüm: `tests/e2e/mock-backend/server.mjs` (:4010) + `BACKEND_URL` ona bakan ayrı Next örneği (:3100). Yeni bir SSR rotası eklenirse o dosyanın başındaki route envanterine de eklenmeli.
14. **Aynı dizinde ikinci `next dev` AÇILAMAZ** — Next 16 `.next/dev/lock` üzerinde exclusive kilit tutuyor. E2E bu yüzden `next build && next start -p 3100` kullanıyor; `next build` `.next/*`, `next dev` `.next/dev/*` yazdığı için geliştiricinin :3000'deki dev server'ı etkilenmiyor. Bedel: ilk koşuda ~30 sn build.
15. **`--legacy-peer-deps` peer bağımlılıkları ağaçtan DÜŞÜREBİLİR.** Faz 8'de `@axe-core/playwright` kurulumu `@testing-library/dom`'u node_modules'dan ve lock'tan düşürdü → 171 test dosyası "collect" aşamasında `Cannot find module` ile patladı (testler değil, dosya toplama). `package.json`'a açık devDependency eklenerek onarıldı. **Kural: her `npm i` sonrası `npm run test:coverage` koş.**
16. **`sonner` toast'ları `role="status"` KULLANMIYOR** — her toast düz `<li data-sonner-toast>`. Doğru locator: `[data-sonner-toaster] li[data-sonner-toast]` (`BasePage.toast` bunu kullanıyor).
17. **Radix Select production build'de "not stable" verirse suçlu Select olmayabilir** — Faz 8'de gerçek neden sayfanın sonsuz re-render'ıydı (bkz. **K15**). Locator "detached from DOM" diyorsa önce sayfanın kendini yeniden mount edip etmediğini kontrol et.
18. **Masaüstü/mobil bileşenler DOM'da AYNI ANDA bulunuyor** (ör. `MainSearchbox` iki kez, `AvailabilityFilter` sidebar + drawer), yalnız CSS ile gizleniyor → `getByPlaceholder(...)` strict-mode ihlali verir. `.first()`/`.last()` ile hangi kopyanın hedeflendiği açıkça seçilmeli.
19. **`images.loader: "custom"` ayarlıyken `/_next/image` production'da HER ZAMAN 404'tür** (`next-server.js:256`, `loader !== 'default'` → `render404`). `next dev`'de çalışır, `next start`/standalone'da çalışmaz — bu yüzden geliştirmede görünmez. Bir görsel dev'de var prod'da yoksa ilk bakılacak yer burası. Bugün `src/lib/image-loader.ts` hiç `/_next/image` üretmiyor; `image-loader.test.ts` bunun bekçisi.
20. **e2e'de `apiMock` artık `GET /api/images/**` isteklerini gerçek bir 1x1 PNG ile karşılıyor** (`api-mock.fixture.ts`). K15 düzeltmesinden sonra `<img>`'ler bu istekleri tarayıcıdan doğrudan attığı için (eskiden `/_next/image` arkasına gizleniyordu) strict mock her görselli testte "unmatched request" veriyordu. Açık `apiMock.on` kayıtları hâlâ önce kontrol ediliyor, yani strict'lik zayıflamadı — görsel yüklemeyi ASIL test eden bir spec kendi kaydını yapmalı.
21. **`a11y-smoke.spec.ts`'in klavye testi (`Tab reaches header nav links and Enter activates one`) tam süitte paralel worker yükü altında KIRILGAN.** `npx playwright test --workers=1` ile 134/134 geçiyor; varsayılan paralel koşuda aynı kodla bazen geçiyor bazen `toHaveURL(/\/cart/)` 15 sn timeout'una takılıyor (izole `--repeat-each=3` → 3/3 geçiyor). Altyapı notu #11'in e2e karşılığı. **Bu testin bir e2e hatası raporunu, `--workers=1` ile veya izole koşmadan gerçek kabul etme.** Testin sağlamlaştırılması ♿ a11y batch'ine bağlandı.

---

## 📌 Deployment notu

Bu çalışma **feature içermiyor**; bug fix'ler yukarıdaki ✅ listesindekilerle sınırlı (F1-F10). Ancak:
- **React 18 → 19 geçişi** bu sette ve production ilk kez React 19 ile build edilecek. Prod build doğrulandı, ama `@stripe/react-stripe-js` v2.9 React 19'u resmen desteklemiyor — **checkout akışı elle denenmeli**.
- ✅ **K14, K15 ve K16 düzeltildi** (bkz. F9/F10). K16 sayesinde `public/` altındaki tüm görseller production'da ilk kez yükleniyor — login logosu dahil.
- 📌 **K16'nın bedeli:** yerel görseller artık Next optimizer'dan geçmiyor, `public/` (4.7 MB) ham servis ediliyor. Deploy öncesi `home-hero.png` (1.8 MB) ve `dentypro-product-placeholder.png` (1.4 MB) sıkıştırılırsa iyi olur; zorunlu değil (dün zaten hiç yüklenmiyorlardı). Açık madde olarak 🟡 Orta bölümünde.
- **23 Ağu 2026 düzeltme turu (F11-F20)** güvenlik ve para/veri kaybı düzeltmeleri içeriyor; ürün davranışı bilinçli olarak değiştirilmedi (K5 açık bırakıldı). Deploy öncesi elle denenmesi önerilenler: (a) ürün detayında sepete ekleme hata yolu (artık uyarı toast'ı çıkmalı), (b) vendor Review Queue'da bir satırı dokunmadan kaydetme (kargo ücreti korunmalı), (c) `/products?companyId=X` ile sayfa 2'ye geçiş (filtre korunmalı), (d) vendor sipariş ekranından kargo etiketi indirme (oturumluyken çalışmalı).
- Commit'leri ayırmak önerilir: (1) format + biome config, (2) test altyapısı + testler, (3) lint/a11y düzeltmeleri, (4) para formatı düzeltmesi, (5) ödeme akışı düzeltmeleri, (6) **K14 proxy döngüsü**, (7) **K15/K16 image loader + onError guard**, (8) **BFF güvenlik turu: K2, K8, K9, K10, Y10, Y12**, (9) **para/veri kaybı turu: K4, K7, K11, K13**, (10) React 19 geçişi — sonuncusu ayrı ve en son.
