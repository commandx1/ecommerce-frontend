# Responsive Checklist — ecommerce-frontend

Hedef: her sayfa 375px, 768px ve 1440px genişlikte layout kırılması, yatay taşma veya örtüşme olmadan render olmalı.

Yöntem (12 Eyl 2026): `localhost:3001` (gerçek backend :8081, buyer `dent@test.com` / vendor `s74948371@gmail.com`) üzerinde Playwright ile her sayfa
üç genişlikte açıldı; `document.scrollWidth > innerWidth` ve viewport dışına çıkan elemanlar otomatik ölçüldü, tam sayfa ekran görüntüleri
gözle (Opus + 3 salt-okunur incelemeci) tarandı. Düzeltme sonrası aynı sayfalar 375/640/768/1024/1440'ta yeniden ölçüldü.

Durum işaretleri: `[x]` temiz · `[~]` sorun bulundu, düzeltildi, yeniden doğrulandı · `[-]` sayfa başka rotaya yönlendiriyor (yönlendirilen sayfa üzerinden kontrol edildi)

| # | Sayfa | Rol | 375 | 768 | 1440 | Not |
|---|-------|-----|-----|-----|------|-----|
| 1 | `/` | buyer | [x] | [x] | [x] | |
| 2 | `/products` | buyer | [x] | [x] | [x] | |
| 3 | `/products/[id]` | buyer | [x] | [x] | [x] | id: d22f0930-08c9-48c0-94fc-53869bbefd76 |
| 4 | `/suppliers` | buyer | [-] | [-] | [-] | → `/vendors` |
| 5 | `/vendors` | buyer | [x] | [x] | [x] | |
| 6 | `/cart` | buyer | [~] | [~] | [x] | B1, B2 |
| 7 | `/checkout` | buyer | [~] | [x] | [x] | doğrudan URL `/cart`'a döner; sepetten "Proceed to Checkout" ile kontrol edildi. B3 |
| 8 | `/help-center` | buyer | [x] | [x] | [x] | kontrast notu: K1 |
| 9 | `/legal` | buyer | [~] | [x] | [x] | B4 |
| 10 | `/shipping-information` | buyer | [x] | [x] | [x] | karşılaştırma tablosu kasıtlı yatay kaydırma; kontrast notu: K1 |
| 11 | `/login` | anon | [x] | [x] | [x] | |
| 12 | `/register` | anon | [x] | [x] | [x] | |
| 13 | `/forgot-password` | anon | [x] | [x] | [x] | |
| 14 | `/reset-password` | anon | [x] | [x] | [x] | `?token=x` ile; token'sız hali `/forgot-password`'a döner |
| 15 | `/verify-email` | anon | [x] | [x] | [x] | |
| 16 | `/verify-2fa` | anon | [x] | [x] | [x] | `?email=` ile; parametresiz hali `/login`'e döner |
| 17 | `/auth/impersonate` | anon | [-] | [-] | [-] | geçerli refreshToken olmadan `/login`'e döner; login sayfası temiz |
| 18 | `/auth/setup-vendor` | anon | [-] | [-] | [-] | `/login`'e döner |
| 19 | `/vendor-manager-add` | anon | [-] | [-] | [-] | → `/register` |
| 20 | `/buyer-dashboard` | buyer | [-] | [-] | [-] | → `/buyer-dashboard/orders` |
| 21 | `/buyer-dashboard/orders` | buyer | [~] | [~] | [x] | H1 (375), B5 (768) |
| 22 | `/buyer-dashboard/auto-orders` | buyer | [x] | [x] | [x] | |
| 23 | `/buyer-dashboard/favorites` | buyer | [x] | [x] | [x] | |
| 24 | `/buyer-dashboard/invoices` | buyer | [x] | [x] | [x] | |
| 25 | `/buyer-dashboard/payment-methods` | buyer | [x] | [~] | [x] | B6 |
| 26 | `/buyer-dashboard/settings` | buyer | [~] | [x] | [x] | B7 |
| 27 | `/buyer-dashboard/suppliers` | buyer | [-] | [-] | [-] | → `/buyer-dashboard/favorites?tab=vendors` |
| 28 | `/buyer-dashboard/suppliers/favorites` | buyer | [-] | [-] | [-] | → `/buyer-dashboard/favorites?tab=vendors` |
| 29 | `/buyer-dashboard/vendors` | buyer | [-] | [-] | [-] | → `/buyer-dashboard/favorites?tab=vendors` |
| 30 | `/buyer-dashboard/vendors/favorites` | buyer | [-] | [-] | [-] | → `/buyer-dashboard/favorites?tab=vendors` |
| 31 | `/vendor-dashboard` | vendor | [~] | [~] | [~] | H2 (tüm genişlikler), H3 (768) |
| 32 | `/vendor-dashboard/analytics` | vendor | [~] | [x] | [x] | V1 |
| 33 | `/vendor-dashboard/orders` | vendor | [x] | [~] | [x] | B5 |
| 34 | `/vendor-dashboard/products` | vendor | [~] | [~] | [x] | V2 |
| 35 | `/vendor-dashboard/products/create` | vendor | [x] | [x] | [x] | başka oturum aktif düzenliyor; ölçüm temiz, koda dokunulmadı |
| 36 | `/vendor-dashboard/customers` | vendor | [~] | [x] | [x] | V1 |
| 37 | `/vendor-dashboard/customers/all` | vendor | [x] | [x] | [x] | |
| 38 | `/vendor-dashboard/customers/[customerId]` | vendor | [x] | [x] | [x] | id: dr-sarah-johnson |
| 39 | `/vendor-dashboard/promotions` | vendor | [x] | [x] | [x] | |
| 40 | `/vendor-dashboard/questions` | vendor | [x] | [x] | [x] | |
| 41 | `/vendor-dashboard/reviews` | vendor | [x] | [x] | [x] | |
| 42 | `/vendor-dashboard/settings` | vendor | [x] | [~] | [x] | V3, V4 |
| 43 | `/vendor-dashboard/team` | vendor | [x] | [x] | [x] | |

Not: H1/H2/H3 header düzeltmeleri `DashboardHeader` üzerinden tüm buyer- ve vendor-dashboard sayfalarını etkiler.

## Bulgular ve düzeltmeler

Ortak kök neden: sidebar'lı dashboard'larda `md` (768) genişliğinde ana içerik ~470px kalıyor; `md:` ile açılan tablo / 2 sütunlu grid / yatay hero düzenleri
bu genişlikte sığmıyor. Bu durumlarda kırılım `lg`'ye taşındı.

| Kod | Sayfa / genişlik | Belirti | Kök neden | Düzeltme (dosya) |
|-----|------------------|---------|-----------|------------------|
| B1 | `/cart` 375, 768 | "Cart Items" paneli 860px'e genişliyor, ürün adı kırpılmıyor, sayfa yatay kayıyor | `flex-col` içindeki `mx-auto` çocuk shrink-to-fit genişlik alıyor, `truncate` devreye girmiyor | `w-full min-w-0` (`features/cart/components/CartContent.tsx`) |
| B2 | `/cart` 375 | adet kontrolü + fiyat kutusu + sil butonu satırı ~250px, alan ~175px | sabit `min-w-[9.75rem]` fiyat kutusu ve tek satır düzen | mobilde alt alta, `sm:`'den itibaren yan yana; min-width `sm:` (`CartItemCard.tsx`, `CartItemPrice.tsx`) |
| B3 | `/checkout` 375 | kargo seçeneği (Priority Mail) satırı 545px, sayfa 611px | `grid-cols-1` track'i min-content'e açılıyor, `truncate` sınırlanamıyor | `grid-cols-[minmax(0,1fr)]` + sarmalayıcıya `min-w-0` (`features/checkout/components/VendorShipmentRates.tsx`) |
| B4 | `/legal` 375 | "Print / Download PDF" butonları 61px sağa taşıyor | başlık + buton satırı sabit yatay | `sm:`'e kadar dikey, butonlar `flex-wrap gap-3` (`features/legal/.../DocumentSectionHeader.tsx`, `DocumentSectionActions.tsx`) |
| B5 | `/buyer-dashboard/orders`, `/vendor-dashboard/orders` 768 | tablo sütunlarının yarısı yatay kaydırmanın arkasında (Net Total, Status görünmüyor) | tablo `md:`'de açılıyor, sidebar yanında ~470px | kart görünümü `lg:`'ye kadar (`app/buyer-dashboard/orders/page.tsx`, `app/vendor-dashboard/orders/page.tsx`, ilgili test seçicisi) |
| B6 | `/buyer-dashboard/payment-methods` 768 | KPI kutusunda "Visa •••• 4242" üç satıra bölünüyor | 3 sütunlu grid `md:`'de | `lg:grid-cols-3` (`features/buyer-dashboard/payment-methods/BuyerPaymentMethodsPage.tsx`) |
| B7 | `/buyer-dashboard/settings` 375 | lisans "APPROVED" rozeti tam genişlikte bant oluyor | tek sütunlu grid'de öğe stretch | `justify-items-start` (`components/dashboard-shared/LicenseManagementSection.tsx`) |
| H1 | tüm dashboard sayfaları 375 | marka adı "Denty…" kırpılıyor | hamburger + logo + sağ grup sonrası ~80px kalıyor | mobilde `gap-2`, `ml-2`, `text-lg` (`components/layout/DashboardHeader.tsx`) |
| H2 | tüm vendor sayfaları, tüm genişlikler | header logosu kırık, alt metni "DentyPro Logo" görünüyor | `proxy.ts` vendor rolünü `/vendor-dashboard` dışındaki her yoldan yönlendiriyor; `/DentyProLogo.png` de 307 alıyor | matcher'a statik dosya uzantısı istisnası + 3 test senaryosu (`src/proxy.ts`, `src/proxy.test.ts`) |
| H3 | tüm dashboard sayfaları 768 | header nav'ı ("Analytics") tema butonuyla çakışıyor, marka "Den…" | logo + 4 link + toggle + hesap menüsü 768'e sığmıyor; sidebar zaten aynı linkleri taşıyor | nav `lg:`'den itibaren, `lg:space-x-6 xl:space-x-8` (`components/layout/DashboardHeader.tsx`) |
| V1 | `/vendor-dashboard/analytics`, `/vendor-dashboard/customers` 375 | 4'lü istatistik satırı 28px taşıyor ("Avg. Orders/Customer") | sabit `grid-cols-4` | `grid-cols-2 xl:grid-cols-4` (`app/vendor-dashboard/components/CustomerAnalyticsChart.tsx`) |
| V2 | `/vendor-dashboard/products` 375, 768 | "Import Products / Add New Product" başlıkla çakışıyor, sayfa 534px | başlık + buton grubu sabit yatay | `lg:`'ye kadar dikey, butonlar `flex-wrap gap-3` (`app/vendor-dashboard/products/page.tsx`) |
| V3 | `/vendor-dashboard/settings` 768 | hero'daki "Member since Aug 22, 2026" rozeti kartın kenarında kesiliyor | hero `sm:flex-row`, sidebar yanında sığmıyor | `lg:flex-row` (`components/dashboard-shared/AccountSettingsShared.tsx`) |
| V4 | `/vendor-dashboard/settings` 768 | adres kartında "DEFAULT" → "DEFA", "Delete" → "Delet" | adres grid'i `md:grid-cols-2`, kart ~225px, `overflow-hidden` | `lg:grid-cols-2` (`components/dashboard-shared/AddressManagementShared.tsx`) |

## Kapsam dışı / takip

| Kod | Sayfa | Not |
|-----|-------|-----|
| K1 | `/help-center` (Emergency Support), `/shipping-information` (Same-Day Cut-Off, Order Tracking), 404 sayfası (Need Help?) | Koyu kartlarda başlıklar okunmuyordu: `globals.css`'teki global `h2,h3,h4 { text-text-primary }` kuralı miras alınan `text-inverse-foreground`'ı eziyor. **Düzeltildi (12 Eyl):** başlıklara açıkça `text-inverse-foreground` verildi (`EmergencySupportCard.tsx`, `EmergencySupportSection.tsx`, `DeliveryCutoffTimesCard.tsx`, `OrderTrackingStatusBanner.tsx`, `app/not-found.tsx`). Yeni koyu kart eklerken başlığa rengi açıkça ver. |
| K2 | `/buyer-dashboard/orders` e2e `buyer-settings.spec.ts` | Bu işten bağımsız, 11 Eyl'den beri kırık "addresses" testi; dokunulmadı. |

## Doğrulama

- Birim testler: `npx vitest run` — proxy, DashboardHeader, cart, legal, checkout, dashboard-shared, buyer/vendor orders, payment-methods, settings, vendor routes: tümü geçti (vendor orders testinde `.md:hidden` seçicisi `.lg:hidden` yapıldı).
- `npx tsc --noEmit`: temiz. `npx biome check` (değişen 18 dosya): hata yok.
- Otomatik taşma ölçümü: düzeltilen sayfalar 375/640/768/1024/1440'ta `hOverflow=0`; tüm 43 sayfa 375/768/1440'ta final taramada `hOverflow=0`.

---

# 2. Tur (12 Eyl 2026): ara genişlikler, koyu tema, etkileşimli durumlar

Kapsam genişletmesi: (a) tüm 45 rota 480/640/1024/1280'de ölçüldü, (b) tüm rotalar koyu temada 375/768/1440'ta ölçülüp gözle incelendi, (c) 60 güvenli etkileşimli senaryo (mobil menü/sidebar, hesap menüsü, arama açılır listesi, filtre paneli, 19 modal, açılır seçimler, genişletilmiş satırlar, form doğrulama hataları, checkout kargo + ödeme adımı, ürün oluşturma formu) 375/768/1440'ta koşuldu; modal'lar yalnızca açıldı, hiçbir onay/submit basılmadı. Ölçüme `position: fixed` dialog'ların viewport dışına çıkması ve iç kaydırma genişliği de eklendi.

## Bulgular ve düzeltmeler

| Kod | Nerede | Belirti | Kök neden | Düzeltme (dosya) |
|-----|--------|---------|-----------|------------------|
| M1 | **Tüm modal'lar** 375 (cart clear, write review, ask question, add card, stop auto orders, delete license, vendor cancel/delete/import/detail, promotions create/archive, delete address…) | modal viewport'tan geniş, başlık/metin iki yandan kesik, birincil buton görünmüyor | `dialog.tsx` tabanı `max-w-[calc(100%-2rem)]` ile sınırlıyor ama `cn`/tailwind-merge bunu çağıranın `max-w-md` sınıfıyla çakışan sayıp siliyor → 448px modal | viewport sınırı `w-[calc(100%-2rem)]` olarak `width`'e taşındı; `max-w-*` artık serbestçe daraltıyor (`components/ui/dialog.tsx`) |
| M2 | Auto-order edit modal 1440 dahil tüm genişlikler | uzun ürün adı modal içeriğini genişletiyor, Save/Cancel butonları kesik | `grid` konteynerinde track `auto` → `truncate` çalışmıyor | `grid-cols-[minmax(0,1fr)]` (`components/ui/dialog.tsx`) |
| M3 | Import Products modal, create sayfası ürün detay modal'ı | sabit genişlik (`w-5xl`, `w-[calc(100vh - 2rem)]`) | çağıranlar max yerine sabit width veriyordu | `max-w-5xl`, `max-w-7xl` (`ImportDocumentsModal.tsx`, `products/create/components/ProductDetailsModal.tsx`) |
| C1 | Checkout ödeme adımı 375 | "Continue to Review" 63px sağa taşıyor | Back + Continue butonları tek satır | `sm:` altında dikey, birincil üstte (`checkout/components/BillingNavigation.tsx`, aynı desen `FinalReviewNavigation.tsx`) |
| A1 | Analytics 1024/1280 | "Geographic Distribution" panelinin 7D/30D/90D/All chip'leri 99px taşıyor | `DashboardPanel` başlığındaki aksiyon grubu `shrink-0`, satır sarmıyor | başlığa `flex-wrap` (`vendor-dashboard/components/shared/DashboardPanel.tsx`) |
| P1 | Vendor ürün oluşturma formu 375/768 | "Back to Search / Cancel" ve sekme çubuğu (Media) sağa taşıyor; "Ships within [select] days" 5px taşıyor; içerik 48px yan boşlukla sıkışık | sabit yatay başlık satırı ve sekmeler, `p-8` + `p-8` iç içe | başlık `lg:`'ye kadar dikey, sekmeler yatay kaydırmalı `shrink-0`, fulfillment satırı `flex-wrap`, mobilde `p-0/p-4` (`products/create/page.tsx`) |
| D1 | Settings "Password" satırı 375 (buyer + vendor) | açıklama metni butonun yanında 4 satıra sıkışıyor | satır tek sıra | `sm:` altında dikey (`dashboard-shared/AccountSettingsShared.tsx`) |
| D2 | Products "Filters" pill'i, koyu tema | beyaz kutu, siyah metin (açık temadan kalma) | `bg-white border-gray-200 text-steel-blue` sabit renkler | tema token'ları (`products/listing/components/listing/MobileFilters.tsx`) |
| D3 | Vendor questions sekme şeridi 375 | "Answered" rozeti sağda kesiliyor | `inline-flex` şerit `overflow-hidden` bölümde | `flex flex-wrap max-w-full` (`vendor-dashboard/questions/page.tsx`) |
| D4 | Create formu fulfillment kutusu | `bg-white` (koyu temada beyaz kutu olurdu) | sabit renk | `bg-surface-elevated` (P1 ile birlikte) |

## Doğrulanmış ama dokunulmayan

- Orders durum sekmeleri (buyer/vendor) 375'te yatay kaydırmalı `no-scrollbar` şerit; "Cancelled/Returned" ilk bakışta görünmüyor. Tasarım kararı, kırılma değil.
- `/vendors` "Sort by" açılır listesi 768'de tetikleyicinin üstünde açılıyor: Radix Select'in item-aligned konumlandırması (seçili öğeyi tetikleyiciyle hizalar). Kütüphane davranışı; 375/1440'ta normal.
- Arama kutusu placeholder'ları 375'te kesiliyor (help-center, create sayfası). Placeholder metni; kozmetik.
- Buyer favorites vendor tablosu 375/768'de yatay kaydırma (kasıtlı).

## Veri/akış nedeniyle açılamayanlar

- Buyer orders: Track / Request return / Cancel Item modal'ları (gönderilmiş/teslim edilmiş/iptal edilebilir sipariş yok).
- Vendor orders: Labels & tracking, Reject return modal'ları (gönderilmiş/iade sipariş yok); Call Uber (yıkıcı, hiç denenmedi).
- Vendor questions "Write an answer" (soru yok). Buyer orders genişletilmiş satır içeriği (ilk satır iskelet kaldı, sipariş detayı gecikmeli yükleniyor).
- Checkout "Place Order", kart ekleme submit'i, Stripe Connect: yıkıcı, açılmadı.
- Ürün oluşturma "Product Details" ve "Media" sekmeleri: boş formda doğrulama geçişi engellediği için yalnızca "Basic Information" hata durumu görüldü.

## 2. tur doğrulama

- Ara genişlikler 480/640/1024/1280: 180 ölçüm, A1 dışında `hOverflow=0`; A1 düzeltme sonrası 0.
- Koyu tema 375/768/1440: 135 ölçüm `hOverflow=0`; göz incelemesinde D1–D3 bulundu ve düzeltildi.
- Etkileşimli senaryolar: 60 senaryo × 3 genişlik; düzeltmeler sonrası tüm modal'lar viewport içinde (375'te 343px), M1–M3/C1/P1 yeniden ölçümde 0 taşma.
- Birim testler: modal tüketicileri + checkout + create sayfası dahil 1451 + 176 test geçti; `tsc --noEmit` ve Biome temiz.

---

# 3. Tur (12 Eyl 2026): gerçek veri üreten akışlar (test hesapları, Stripe/kargo test modu)

Kullanıcı onayıyla yıkıcı aksiyonlar da çalıştırıldı; her mutasyon 1440'ta bir kez yapıldı, ortaya çıkan her durum 375/768/1440'ta ölçüldü.
Çalıştırılanlar: soru sorma + yorum yazma, 4 sipariş (yeni kart ile Stripe test kartı 4242, biri auto-order'lı), buyer iptal + vendor iptal, Call Uber (test),
auto-order edit/pause, sepeti temizleme (boş sepet), lisans ekleme + silme, vendor soru cevaplama, davet gönderme, kampanya oluşturma + arşivleme,
ürün oluşturma formu (Basic → Details sekmeleri), Review Queue. Ölçülen durum sayısı: 47 × 3 genişlik, tümü `hOverflow=0`, dialog viewport içinde.

## Bulgular ve düzeltmeler

| Kod | Nerede | Belirti | Düzeltme (dosya) |
|-----|--------|---------|------------------|
| O1 | Sipariş onay sayfası 375 | kart `p-12` sabit dolguyla içeriği ~240px'e sıkıştırıyor, ürün adı "3M Rel…" (6 karakter) | `p-5 sm:p-8 lg:p-12`, satır `gap-3 sm:gap-4` (`checkout/components/OrderConfirmation.tsx`, `OrderConfirmationItemRow.tsx`) |
| O2 | Checkout stepper 375 (5 adım) | 5. adım sağdan kesiliyor | bağlayıcı `w-4 mx-1.5` mobilde (`checkout/components/CheckoutProgress.tsx`) |
| O3 | Checkout inceleme adımı "Auto orders" kartı 375 | ürün adı "3M…" (3 karakter) select'in yanında | ad mobilde tam satır (`basis-full sm:basis-0`) (`checkout/components/FinalReviewAutoOrderSummary.tsx`) |

## Doğrulanan durumlar (temiz)

Onay sayfası (normal + auto-order), ödeme adımı (yeni kart, Stripe iframe'leri), inceleme adımı, Uber sonuç modal'ı, buyer "Tracking links" modal'ı (341/670px), gönderilmiş sipariş genişletilmiş içerik (buyer + vendor, mobil kart), iptal onay modal'ları ve iptal sonrası durumlar, Cancelled sekmesi, auto-orders listesi/edit/pause, boş sepet, lisans eklendi (PENDING) + silme modal'ı, vendor soru listesi, davet gönderildi toast'ı, kampanya oluşturuldu/arşivlendi, create formu doğrulama hataları (Basic + Details), Review Queue.

## Açılamayanlar

- Buyer "Request return" / "Cancel Item" ve vendor "Reject/Confirm return": teslim edilmiş sipariş yok (Uber teslimatı test modunda tamamlanmıyor); vendor "Labels" modal'ı Uber siparişinde görünmüyor (Shippo etiketi yok).
- Ürün yorumu/sorusu: gönderim "başarılı" döndü ama ürün sayfasında ve vendor questions'ta görünmedi (onay bekliyor olabilir); Edit/Delete review modal'ları bu yüzden açılamadı.
- Ürün oluşturma Media sekmesi ve Submit: Details sekmesinde barkod gibi alan doğrulamaları jenerik doldurmayı geçemedi.
- Kart ekleme modal'ında kaydet butonu Stripe alanları "complete" olmadan aktifleşmedi (Playwright fill ile); checkout "Use a new card" yolu çalıştı.

## 3. tur doğrulama

- Checkout birim testleri 389 geçti; `tsc --noEmit` temiz; Biome 44 dosyada temiz (format düzeltmesi dahil).
- Test verisi kalıntıları: dent@test.com hesabında 4 yeni sipariş (2'si iptal), 2 auto-order (1'i duraklatılmış), vendor'da "responsive-test-invite@example.com" daveti, Uber test teslimatı. Lisans "D-RESP-TEST-1" silindi, sepet boş.
