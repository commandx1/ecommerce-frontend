# Skeleton loader — durum notu

Son güncelleme: 24 Eyl 2026. Taban commit: `a47529d`. **Commit atılmadı, değişiklikler çalışma ağacında.**

---

## ☕ Sabah brifingi — önce bunu oku

**Durum: her şey yeşil.** `tsc` temiz · `biome lint` 0 hata · `vitest` 306 dosya / 4767 test /
0 kırık · `playwright` **283 geçti / 0 düşen** (son koşu; toplam on iki tam koşu). **122 dosya** değişti
(111 düzenlenmiş + 11 yeni). Commit yok.

**Senden 2 karar bekliyorum** (hiçbiri işi bloke etmiyor, hepsi belgede detaylı):

| # | Karar | Neden ben yapamadım |
|---|---|---|
| 1 | invoices / customers / promotions sayfaları için backend liste uçları açılsın mı? Aynı şey `/vendor-dashboard/team`'in üye listesi için de geçerli. | `ecommerce-api`'de bu uçlar yok (32 controller tarandı); kapsam da `ecommerce-frontend` ile sınırlıydı |
| 2 | Footer'daki 20 ölü link: sayfalar yazılsın mı, yoksa linkler kaldırılsın mı? | İkisi de ürün kararı |

*(Destek e-postaları sorusu kapandı: `urgent@` ve `partners@` kutularının olmadığı teyit edildi,
ikisi de `support@dentypro.com`'a bağlı ve bu doğru hal.)*

**Bu gece bulunan ve DÜZELTİLEN gerçek ürün hataları** (skeleton dışı, hepsi testle kilitli):

- **Arama öneri listesi okunamıyordu** — panelin arka planı hiç yoktu (`rgba(0,0,0,0)`), sonuçlar
  sayfanın üstüne saydam basılıyordu. Hiçbir test yakalayamazdı.
- `/categories` sayfasının `<h1>`'i yoktu (Eylül 18'den beri)
- Uygulamanın **hiç hata sınırı yoktu** (46 rota, sıfır `error.tsx`)
- DataTable'ın sr-only satır tuzağı
- Yükleme iskeletinin gerçek düzeni taklit etmediği 3 yer (CLS/"düz blok")
- 6 metin/düzen kusuru: "1 products", "1 items", kesilen "Add to Cart", yarım kalan cümle,
  boş kalan "Critical Stock Alerts", eski markalı destek e-postası ve **aranamaz telefon numarası**

- **`/products/[id]` ara sıra tamamen boş açılıyordu** — tetikleyici ölçümle bulundu
  (324 koşu), tek satırlık düzeltme gönderildi ve e2e testiyle kilitlendi
- **Otomatik a11y taraması yalnızca 8 rotada koşuyormuş** (46 rotalık uygulamada). Kapsam
  geçici olarak genişletildi: **87 ihlal eden düğümün hepsi kapatıldı (87 → 0)**, 37 rotada
  sıfır serious/critical. Kalıcı koruma da kuruldu: `a11y-smoke` artık 8 değil **33 rota** tarıyor.
- **Boş sepette `<main>` landmark'ı yoktu** — `/cart`'ın üç halinden ikisi (`CartContent`,
  `CartLoadingState`) `<main>` taşırken `CartEmptyState` `as="div"` kullanıyordu, yani sepet
  boşken ekran okuyucu kullanıcısının "ana içeriğe atla" hedefi yoktu. `a11y-smoke` bunu ancak
  sepetin gerçekten boş kaldığı bir koşuda görebiliyor; altıncı tam koşuda yakalandı, düzeltildi
  ve `CartEmptyState.test.tsx`'e regresyon testi eklendi.

**Bulunan ama DÜZELTİLEMEYEN** (hepsi kanıtıyla belgede, hiçbirinde uydurma değer yok):
16 ölü footer linki (4'ü düzeltildi: metinleri zaten vardı) · 3 sayfanın sabite bağlı sahte verisi ve
`/vendor-dashboard/team`'in eksik üye listesi (dördü de backend ucu istiyor, `ecommerce-api`'de yok).

**Asla yapılmayanlar:** commit, push, `.env*` dosyalarına dokunma, `dt-admin-frontend`'e dokunma.

---

Bir önceki oturum primitive'i ekleyip 11 yeri ona çevirmişti. Bu oturum onu doğruladı, düzeltti ve
kod tabanının tamamına yaydı. Aşağıdaki "eski notun yanlışları" bölümü önemli: o belgeye güvenerek
iş yapma.

## Bir önceki notun yanlışları (ölçülerek bulundu)

| Eski not | Gerçek |
|---|---|
| "`tsc --noEmit` temiz" | Bu makinede 10 hata — `node_modules` bayattı. `npm ci` çözdü |
| "biome: bizim dosyalarda hata yok, 2 bilinen hatalı dosya" | `biome check` 1084 dosyada 1083 hata verir; hepsi CRLF/LF formatı. `biome lint` = 0 hata |
| "ölü CSS silindi" | `shimmer-sweep` + `.skeleton-mint` + `.skeleton-white` duruyordu ve **137 yerde aktifti** |
| "~30 inline `animate-pulse` taşınmadı" | Gerçek sayı **59 kullanım / 40 dosya** |
| "2 düşen test, ikisi de önceden kırık" | **3** düşen test vardı |
| "`cart.contract.test.ts` → 'Login required'" | Test adı yanlış: gerçek ad *"keeps the existing schedule when the same product is added again"* |
| "shimmer'ın reduced-motion koruması yok" (bu oturumun kendi ilk teşhisi) | `globals.css`'teki `*, *::before, *::after` joker kuralı zaten her animasyonu durduruyor |

## Şu anki durum

**Tek görsel dil: shimmer.** Üç rakip sistem (shimmer CSS 137 kullanım, inline pulse 59, primitive 70)
tek bir primitive'de birleşti.

```
animate-pulse : 59 kullanım / 40 dosya  →  6 kullanım / 5 dosya (hepsi kasıtlı, aşağıda)
                DÜZELTME: ilk raporda "6" denmişti ama gerçekte 7 kalmıştı —
                `InventoryStatus.tsx`'in yükleme yer tutucusu taramada kaçmıştı.
                İkinci turda o da Skeleton'a çevrildi; sayı artık gerçekten 6.
shimmer CSS   : 137 kullanım / 4 dosya  →  0 (sınıflar globals.css'ten silindi)
Skeleton kullanan dosya : 10 → 43
```

### Primitive — `src/components/ui/skeleton.tsx`

```tsx
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("skeleton-shimmer relative overflow-hidden rounded-md bg-skeleton-base", className)} {...props} />
}
export { Skeleton }   // named export — dizindeki shadcn primitive'leriyle hizalı
```

- **`data-slot="skeleton"` testlerin bağlanacağı sözleşmedir.** Animasyon sınıfına bağlanma —
  pulse→shimmer geçişi tam da o yüzden 8 test suite'ini kırdı.
- Props spread var: `aria-hidden`, `data-testid`, `style` geçilebilir. Eskiden sadece `className` alıyordu.
- Shimmer `globals.css`'teki `.skeleton-shimmer::after`'da: `transform: translateX()` ile
  compositor'da çalışır ve yüzdesel gradyan sayesinde her eleman boyutunda görünür.
  Eski `.skeleton-white` `background-position`'ı 1000px sabit gradyanla animasyonluyordu —
  her karede repaint ediyordu ve küçük elemanlarda parıltı kayboluyordu.

### Token'lar — ölçülmüş, tahmin değil

`--skeleton-base` / `--skeleton-highlight` (`:root` + `.dark`). `--surface-muted`'a dokunulmadı.

| | eski | yeni |
|---|---|---|
| açık: taban / yüzeyler | 1.045–1.093:1 | 1.192–1.246:1 |
| açık: parıltı / taban | 1.093:1 | 1.213:1 |
| koyu: parıltı / taban | 1.146:1 | 1.445:1 |

Hiçbiri 3:1 değil ve olmamalı: skeleton metin değil, `aria-busy` + sr-only metinle desteklenen
geçici bir yer tutucu. Hedef görünürlük, WCAG uyumu değil. Parıltı **iki temada da** tabandan
açık; eski `.skeleton-mint`/`.skeleton-white` çifti koyu temada ters dönüyordu.

## Dokunulmayanlar (kasıtlı)

Kalan 6 `animate-pulse` yükleme değil, **durum/dikkat nabzı**:
`fulfillment-timeline.tsx:78`, `order-view-utils.ts:422,443`, `not-found.tsx:70`,
`horizontal-timeline.tsx:45`, `CartItemCard.tsx:55`.

Buton/mutasyon spinner'ları `animate-spin` kullanıyor (29 dosya / 44 kullanım), ayrı bir konu.

## Tuzaklar

- **`data-slot="skeleton"`'a bağlan, CSS sınıfına değil.**
- **DataTable sr-only satır tuzağı ÇÖZÜLDÜ.** Yükleme duyurusu gövdede gerçek bir `<tr>` idi
  (`aria-hidden` değil), bu yüzden `getAllByRole("row")` ile bekleyen çağıranlar bir satır erken
  çözülüyordu; `DocumentProductsPanel` bu yüzden kendi skeleton'ını elle yazmıştı. Artık
  `<caption class="sr-only">` — hâlâ duyuruluyor, satır değil. 2 regresyon testi bunu kilitliyor.
- **Başlık zinciri.** `products/loading.tsx`, `products/[id]/loading.tsx` ve yeni
  `categories/loading.tsx` sr-only `h1` + sr-only `h2` taşımak zorunda: kalıcı `<Footer>` kendi
  `h3`'lerini basıyor, aradaki `h2` olmazsa h1→h3 atlaması olur. `tests/e2e/a11y-smoke.spec.ts`
  bunu ölçüyor. **Silme.**
- **Route-level `loading.tsx` gerçek başlıkla AYNI metni kullanır** (mismatched heading olmasın).
  Bölüm/Suspense fallback'leri farklı metin kullanır ("Loading Favorites") ki e2e page object'leri
  erken bağlanmasın. İkisi farklı kural.
- **Çocuklu kapsayıcıyı `<Skeleton>` yapma.** Shimmer bandı (`::after`) çocukların üstünden süpürüp
  iç içe parıltı yapar. Kapsayıcıdan animasyonu kaldır, içindeki blokları tek tek Skeleton yap.
- `data-table.tsx` bilerek `bg-(--glass-tile)` override'ı kullanıyor (dashboard cam panelleri).
- Turbopack `globals.css` değişiminde eski animasyonu önbellekten gösterebilir; şüphede sunucuyu
  yeniden başlat.

## Doğrulama durumu (bu makinede ölçüldü)

```
tsc --noEmit  : temiz
biome lint .  : 0 hata, 133 uyarı  (taban 134 — net bir azaldı)
vitest run    : 306/306 dosya, 4767 geçti / 1 atlandı / 11 todo, SIFIR kırık  (taban 3 kırıktı)
playwright    : chromium + Pixel 7, seri koşu (--workers=1), ON İKİ bağımsız tam koşu
                (son ikisi UI düzeltmelerinden sonra): dördünde de
                227 geçti / 5 atlandı / SIFIR düşen. En son tekil/çoğul düzeltmesinden
                sonra ayrıca vendor-* + a11y-smoke: 74/74 geçti.
                (taban: yalnız chromium'da 19 düşen / 105 geçen — 19'unun hepsi kurtarıldı)
                multi-account-tabs ayrıca 12/12 (chromium ×4) ve 18/18 (iki proje ×3) tekrar temiz.
                browse-to-cart ve guest-add-to-cart artık geçiyor. `browse-to-cart`'ın kalan
                ~1/108 oranındaki düşüşü bir TEST sorunu değil, 4. maddedeki ürün hatası.
```

**46 rotanın yükleme görüntüsü tek tek gözle incelendi.** Bulgular:

- **Ekran görüntüsüne güvenme, ölçüme güven.** Altı görüntü boş/şüpheli göründü — `/buyer-dashboard`
  (iki temada), `/vendor-dashboard/settings`, ve `/buyer-dashboard/{suppliers,vendors}*`
  yönlendirme takma adları. Hepsi **yakalama zamanlaması artefaktı**: bir prob ile geometri
  ölçüldüğünde skeleton'lar ekranda, `opacity=1`, doğru koordinatlarda (`/buyer-dashboard`'da
  ekranın ortasındaki eleman gerçek bir `glass-panel` kartı), CLS 0.0000–0.0320. Yönlendirme
  rotaları da hedeflerinde `skel=19, h1=1, cls=0` ölçüyor. Screenshot'ın, ölçümde olmayan bir
  zamanlama zaafı var — "boş görünüyor" diye paniğe kapılmadan önce geometriyi ölç.
- **Süreç ekranlarında spinner doğru.** `/auth/impersonate`, `/auth/setup-vendor`,
  `/vendor-manager-add` hâlâ spinner gösteriyor ve bu yerinde: taklit edilecek bir düzenleri yok.
- **Kapsam dışı küçük bir gözlem:** `/auth/setup-vendor` koyu temada gövdesine dark theme
  uygulamıyor (toast koyu, sayfa açık). Önceden var, skeleton'la ilgisiz, düzeltilmedi.

Tarama ayrıca **"düz blok" dedektörü** çalıştırıyor: 72×72'den büyük her `Skeleton`'ı raporluyor,
çünkü yapılı bir içeriğin (kart, grafik, stat kutusu) yerine tek düz blok koymak CLS'e yakalanmaz —
altındaki içerik kaymıyorsa metrik sessiz kalır. Gözle iki kez yakaladığım hata tam buydu
(`BuyerPaymentMethodsPage`, `VendorMetricsCards`). 46 rotada kalan tek düz blok grubu **görsel**
yer tutucuları (`ProductCardSkeleton`'ın `aspect-[4/3]` fotoğraf alanı, ürün galerisi) — bir
fotoğrafın yerini tutan şey zaten düz dikdörtgendir, taklit edilecek iç yapısı yok.

Düzelen 17 testin 16'sı **bayat test**ti, biri (`guest-add-to-cart`) hidrasyon yarışı — hepsi
kaynağına bakılarak doğrulandı, hiçbiri assertion silinerek geçirilmedi:

| Ne | Kaç | Kök sebep |
|---|---|---|
| `notifications` + `notification-order-deeplink` | 5 | `NotificationBell` Radix Popover'dan `GlassMorphMenu`'ye geçmiş; page object hâlâ `role="dialog"` + `data-side` arıyordu (yeni panelin hiç role'ü yok) |
| `buyer-payment-methods` | 4 | `playwright.config.ts`'te Stripe anahtarı yoktu; sayfa hiç render olmuyordu |
| `checkout-*` | 3 | "Select Shipping Address" → `Shipping Address`; "Total shipment fee" → `Shipment fee` (74d87f9 sildi); onay ekranının `orderItems` mock'u boştu, auto-order satırı hiç render edilemiyordu |
| `vendor-products` | 2 | Fulfillment Policy artık `<select>`, `fill` değil `selectOption`; "Reorder ID" ve "Reference Number" alanları formdan kaldırılmış |
| `vendor-settings` | 1 | PUT gövdesindeki `shipmentPolicy` meşru — `ecommerce-api/…/CompanyUpdateRequest.java` onu kabul ediyor; testin anahtar listesi güncellenmemişti |
| `/categories` a11y | 1 | Aşağıdaki gerçek ürün hatası |

**Tarayıcı taraması: 46 rotanın 46'sı**, açık + koyu tema, chromium + Pixel 7 = **184 koşu**,
mock backend'e 2 sn gecikme enjekte edilerek. Her rotada ölçülen: skeleton sayısı, CLS,
eşleşmeyen istek sayısı, `h1` sayısı, kalan eski markup.

**183/184 geçti.** Tek düşen, `/categories` mobilde tam sayfa ekran görüntüsünün 10 sn'yi aşması —
41 kategori kartı + görselleri; tarama harness'ının sınırı, ürün bulgusu değil (koyu varyantı geçti).

- **Eski shimmer CSS'i (`.skeleton-white` / `.skeleton-mint`): 46 rotanın hiçbirinde yok.**
- **`h1`: 46 rotanın hepsinde tam 1.**
- **CLS: hiçbir rota 0.1'i aşmıyor**, iki projede de.
- Skeleton'lar iki temada da görünür; "Loading..." metni, spinner veya sahte %92 çubuğu yok.

`/auth/impersonate`, `/auth/setup-vendor`, `/vendor-manager-add` atık token'la gezildi —
süreç/yönlendirme ekranları oldukları için skeleton taşımıyorlar ama landmark/başlık
sözleşmesini sağlıyorlar.

## Yüklenmiş hallerin gözle incelenmesi (ikinci tur)

İlk turda 46 rotanın **yükleme** hali tek tek incelenmişti; bu turda aynı rotaların **yüklenmiş**
hali tarayıcıda (Chromium, 1280px, açık + koyu tema, 92 ekran görüntüsü) tek tek gözden geçirildi.
Kapılar yine yeşil: **92/92**, her rotada `h1=1`, sıfır eski markup, CLS eşiği aşan yok.

Not: gerçek Chrome'da elle gezinme denendi, **eklenti bu oturumda bağlı değil**
(`list_connected_browsers` boş döndü), o yüzden inceleme gerçek tarayıcı motorunda alınan
görüntüler üzerinden yapıldı.

Skeleton tarafında bulunan kusur **yok** — bu turda düzeltilen dört yer (`VendorMetricsCards`,
`BuyerPaymentMethodsPage`, tedarikçi kartının About kutusu, questions'ın rozet/sekme rezervasyonu)
yüklenmiş hallerinde de doğru oturuyor. Ama gözle bakmak, testlerin yakalayamadığı **ürün
hatalarını** ortaya çıkardı; hepsi skeleton kapsamı dışı, hiçbiri düzeltilmedi:

### 🔴 Üç sayfa gerçek veri yerine sabit veri gösteriyor

Bu sayfalar backend'e **hiç istek atmıyor**; içerik kaynak koduna gömülü. Testler geçiyor çünkü
sabit veri her zaman render oluyor.

| Rota | Kaynak | Kullanıcının gördüğü |
|---|---|---|
| `/buyer-dashboard/invoices` | `src/features/buyer-dashboard/invoices/invoicesData.ts` | 10 uydurma fatura, "Total Outstanding: $15.326,30", çalışır görünen **"Pay Now"** düğmesi |
| `/vendor-dashboard/customers` (+ `/all`, `/customer-1`) | `src/app/vendor-dashboard/customers/data.ts` | 24 uydurma müşteri; isim, klinik, şehir ve harcama tutarlarıyla |
| `/vendor-dashboard/promotions` | `src/app/vendor-dashboard/promotions/mock-data.ts` | 7 kampanya, "$125.900 atfedilen gelir", 1,1M gösterim |

Ek olarak `/vendor-dashboard/analytics`'in **Marketing Performance** bölümü
`src/data/vendor-marketing.json`'dan geliyor ve `/vendor-dashboard/promotions`'takinden **bambaşka
kampanyalar** listeliyor — aynı satıcı için iki sayfa iki farklı gerçeklik gösteriyor.

Daha küçük ama aynı sınıftan: `/buyer-dashboard/invoices` KPI kartlarının **değerleri** gerçek
(listeden hesaplanıyor) ama **alt yazıları sabit metin** — "+12% vs last month", "2 due this week",
"+8% vs last month". `/suppliers`'ın "Browse by Category" sayaçları (128/94/76… tedarikçi) ve
müşteri yorumları da `suppliersPageData.ts`'ten sabit.

**Bu iddia ÖLÇÜLDÜ, varsayım değil.** `ecommerce-api`'nin 32 controller'ı tarandı:
`CompanyController` yalnızca `GET/PUT /api/companies/me` sunuyor (şirket kullanıcılarını
**listeleme ucu yok** → team üye listesi), `OrderDashboardController` satıcı metriklerini sunuyor
ama **müşteri listesi yok**, **kampanya/promosyon ucu hiç yok**, ve `InvoiceController` yalnızca
`POST /api/invoices?orderId=&sellerId=` ile **sipariş başına PDF üretiyor** — fatura *listesi* ucu
yok. Yani bu üç sayfa frontend'de düzeltilemez; eksik olan backend.

### 🟠 `help-center`'ın marka adları düzeltildi, e-postalar duruyor

Sayfa ürünü `DentyPro` değil **`DentalHub`** diye anıyordu. **Marka adı geçen iki metin
düzeltildi** — hangi ismin doğru olduğu belirsiz değil, uygulamanın her yerinde DentyPro yazıyor:

- `SupportResourcesSection.tsx:40` — "…get the most out of DentalHub" → **DentyPro**
- `faqItems.tsx:191` — "How do I become a supplier on DentalHub?" → **DentyPro**

Kod tabanında marka **adı** olarak `DentalHub` kalmadı.

**Destek e-postasının ikisi de düzeltildi — çünkü doğru değer uydurma değil, kod tabanında zaten
vardı.** Tüm iletişim bilgileri envanterlendi ve `support@dentypro.com` uygulamanın kendi destek
adresi olarak **iki bağımsız yerde** kullanılıyor: `not-found.tsx:185` ("Email Us") ve
`ForgotPasswordInfoPanel.tsx:53` ("Contact our support team at"). Help-center'daki eşdeğeri eski
markadan kalmıştı; ona hizalandı:

- `ContactFormInfo.tsx` — `support@dentalhub.com` → **`support@dentypro.com`**
- `QuickSupportOptions.tsx` — aynı

**Telefon numarası da düzeltildi, bu sefer aritmetikle:** `not-found.tsx`'teki
`1-800-DENTAL-HUB` **aranabilir bir numara değil** — `DENTALHUB` tuş takımında 9 hane eder, oysa
1-800 numarası 7 hane alır. Help-center'daki `1-800-DENTAL-1` ise geçerli ve kodda sayısal
karşılığıyla birlikte yazılı (`DENTAL1` → `336-8251`, birebir uyuyor). 404 sayfası ona hizalandı.

**Diğer iki adres de `support@dentypro.com`'a bağlandı — ve bu TEYİT EDİLDİ.**
`urgent@dentalhub.com` (`EmergencySupportSection.tsx`) ve `partners@dentalhub.com`
(`faqItems.tsx`) için `dentypro.com` karşılığı kod tabanında hiç geçmiyordu, o yüzden bir kutu
adı uydurmadım. **Sonradan ürün sahibi `urgent@` ve `partners@` kutularının olmadığını
doğruladı** — yani bu geçici bir uzlaşma değil, doğru hal. Yorumlar da buna göre güncellendi.

Ama "bilmiyorum, dokunmayayım" da yanlıştı: o adresler **şu anda zaten bozuk**. Eski markanın
alan adına gidiyorlar, yani oraya yazan kullanıcı ya hiç kimseye ulaşıyor ya da o alan adı artık
başkasınınsa **yabancı birine**. Seçenekler şunlardı:

| | sonuç |
|---|---|
| olduğu gibi bırak | mektup kimseye gitmez (ya da yabancıya gider) |
| `urgent@dentypro.com` uydur | kutu yoksa yine gitmez — üstelik uydurma |
| doğrulanmış adrese yönlendir | **gider**; acil bir talep genel sıraya düşer |

Üçüncüsü her eksende diğer ikisinden iyi olduğu için ikisi de `support@dentypro.com`'a çevrildi —
ve teyit sonrası bunun tek doğru seçenek olduğu anlaşıldı: ayrı kutu **yok**, dolayısıyla
"downgrade" de yok. Acil/ortaklık postası zaten tek destek kutusuna düşecekti; tek fark artık
gerçekten düşüyor olması.

Geriye kalan tek uç: `EmergencySupportSection`'daki **"15-minute response"** vaadi ve
`ContactFormInfo`'daki "2 hours" gibi süreler hâlâ metin olarak duruyor. Aynı kutuya düşen
talepler için farklı süreler vaat ediliyorsa, bu bir içerik kararı — kod tarafında yapılacak bir
şey yok.

### ✅ Küçük olanlar DÜZELTİLDİ (bu turda)

Kararı belli, riski düşük olanlar yapıldı; her biri birim testiyle kilitlendi (9 yeni test,
3 yeni test dosyası):

| Kusur | Düzeltme |
|---|---|
| Ana sayfa kategori kartı "1 products" | `CategoryTile.tsx` — tekil/çoğul |
| Sepette "1 items" | `CartItemsPanel.tsx` — tekil/çoğul |
| "Subtotal (1 items)" | `CartSummaryPanel.tsx` — tekil/çoğul |
| `/verify-email`'de yarım cümle ("…sent to") | `VerifyEmailHeader.tsx` — adres yoksa tam cümle |
| "Critical Stock Alerts" altının bomboş kalması | `InventoryStatus.tsx` — "No critical stock alerts right now." |
| Ürün kartında "Add to Cart" → "Add t..." | `ProductCard.tsx` — butondaki `min-w-0` kaldırıldı, etiket `whitespace-nowrap` |

Son ikisinin **tarayıcıda** doğrulandığını belirtmek gerek: "Add to Cart" hem 1280px'te hem 390px
telefon genişliğinde tam görünüyor ve kart satırı taşmıyor; sepette artık "1 item" yazıyor.

`InventoryStatus.tsx`'i düzeltirken **migration'da kaçmış bir yükleme `animate-pulse`'u** da
bulundu ve Skeleton'a çevrildi (yukarıdaki sayım düzeltmesi).

### 🟡 Düzeltilmeyenler (karar sizin)

- **`/vendor-dashboard/team` yarım:** yalnızca davet formu var. Mevcut ekip üyelerinin listesi yok,
  dolayısıyla satıcı kimin ekipte olduğunu göremiyor, rol değiştiremiyor, kimseyi çıkaramıyor.
  Backend ucu + ürün kararı gerektiriyor.
- **Sepette hâlâ iki farklı sayım:** "Cart Items (1)" satırları, "Subtotal (2 items)" adetleri
  sayıyor; başlıktaki rozet de "2". Dilbilgisi düzeldi ama **etiketleme** bir ürün kararı —
  "1 order line / 2 units" gibi bir ayrım sizin tercihiniz.
- **`/vendor-dashboard/analytics`'te Revenue Analytics** veri yokken boş eksen gösteriyor.
  Boş durum metni eklenebilir ama grafik bileşeni paylaşımlı; dokunmadım.
- **Sayfalama ifadesi tutarsız:** "Showing 1-3 of 3", "Showing 1 to 1 of 1 results",
  "Showing 0 results" — üç farklı kalıp. Tek kalıba indirmek tasarım kararı.

### İnteraktif tur (üçüncü tur)

Statik ekran görüntüleri yalnızca **son** halleri gösterir; ara adımlar görülmeden kalır. Dört
gerçek kullanıcı yolculuğu adım adım sürüldü ve her adım fotoğraflandı (20 kare):

1. **Misafir:** ana sayfa → arama → liste → kart hover → ürün detayı → tedarikçi değiştir → adet
   artır → sepete ekle. Sepete ekleme "Sign in to continue — Please sign in to add products to your
   cart" toast'ı + giriş ekranıyla sonuçlanıyor: doğru davranış.
2. **Alıcı:** sepet → auto-reorder açılımı → checkout adımları (adım göstergesi, adres, kargo).
3. **Satıcı:** ürün soruları → filtre sekmeleri. Sekme değiştirirken düzen **hiç kaymıyor** —
   CLS düzeltmesinin canlı kanıtı.
4. **Kabuk:** tema değiştirme, hesap menüsü, bildirimler, 390px telefon genişliği, mobil menü,
   mobil sepet.

Dördü de geçti; bu turda yeni kusur çıkmadı ve yukarıdaki düzeltmeler tarayıcıda teyit edildi.

İlk turda iki kare alınamamıştı ve "harness zamanlaması" diye geçilmişti. **Bu doğrulanmamış bir
iddiaydı ve peşine düşülünce biri gerçek bir hata çıktı** — aşağıya bakın. Cevap yazma composer'ı
gerçekten zamanlamaydı: doğru beklemeyle açılıyor, metin kabul ediyor ve gönderiliyor.

### 🔴 Arama öneri paneli OKUNAMIYORDU — bulundu ve DÜZELTİLDİ

`SearchResultsDropdown` sayfanın üzerinde yüzen bir panel ama **hiçbir arka planı ve gölgesi
yoktu**. Tarayıcıda ölçüldü: `backgroundColor: rgba(0, 0, 0, 0)`, `boxShadow: none`, ve panelin
içinde 602×92 px'lik gerçek bir sonuç (ürün adı, barkod, `$70.00 → $56.00 (%20)`). Yani sonuç
render ediliyordu, kullanıcı **okuyamıyordu**: arkadaki banner ve sayfa içeriği panelin içinden
geçiyordu.

Bunu hiçbir test yakalayamazdı: DOM'da link var, erişilebilirlik ağacında sonuç var, `browse-to-cart`
testi yeşil. Yalnızca ekrana bakınca görülüyor.

Düzeltme: panele uygulamanın kendi yüzey token'ları verildi
(`bg-surface-elevated` + `border-border-soft` + `shadow-panel` + `rounded-2xl`).
Doğrulama hem ölçümle hem gözle yapıldı, **iki temada da**: panelin arka planı artık opak
(açık: `lab(100 …)`, koyu: `lab(15.3 …)`), gölge var, sonuç net okunuyor.
5 testlik `SearchResultsDropdown.test.tsx` bunu kilitliyor (arka plan, kenarlık+gölge, sonuç
render'ı, "No results found", gizliyken hiç render etmeme).

**Bu hata bir SINIF işaret ettiği için hepsi tarandı.** Arama paneli, ekranda "var gibi" görünüp
ölçünce saydam çıktı — aynısı başka yüzen katmanlarda da olabilirdi. Sayfa üstünde açılan her
katman tek tek denetlendi:

| Katman | Durum |
|---|---|
| `SearchResultsDropdown` | ❌ saydamdı → **düzeltildi** |
| `dialog.tsx` (modallar) | ✅ `bg-surface-elevated` |
| `select.tsx` (tüm formlardaki açılır listeler) | ✅ `bg-popover` — ve `--popover` token'ı `globals.css`'te hem `:root` hem `.dark` altında `--surface-elevated`'a bağlı, yani sınıf gerçekten bir renk üretiyor |
| `glass-morph-menu.tsx` (hesap menüsü, bildirimler, mobil menü) | ✅ kökünde `bg-` yok ama arka planı `LiquidGlass` alt katmanı veriyor; **iki temada da ekran görüntüsüyle doğrulandı**, içerik net okunuyor |
| `AddressAutocomplete` öneri listesi | ✅ opak (`bg-white` + gölge) |

`className` içinde doğrudan yazılmış `absolute/fixed` + `z-*` katmanların tamamı da tarandı:
arka planı olmayanların hepsi rozet/ikon konumlandırması, panel değil.

**Sonuç: arama paneli dışında okunamayan yüzen katman yok.**

Kapsam dışı küçük not: `AddressAutocomplete`'in paneli `bg-white` ve metinleri `text-gray-*` ile
**hard-coded** — koyu temada beyaz parlıyor. Okunabilir olduğu için dokunmadım; token'a çevirmek
arka planı VE metin renklerini birlikte değiştirmeyi gerektirir, yoksa kontrast ters döner.

**Ayrıca bir test kalitesi notu:** `tests/e2e/pages/home.page.ts`'teki `searchResults` locator'ı
`a[href^='/products/']` — bu, açılır panelin dışındaki **ana sayfa ürün kartlarıyla da** eşleşiyor.
Yani `browse-to-cart`'ın arama testi paneli doğrulamadan da geçebilir. Daraltılması iyi olur
(panel kökü içine kapsamak), ama test dosyası kapsam dışı olduğu için dokunmadım.

## ♿ Otomatik a11y taraması: kapsam 8 rotaydı, 46'ya çıkarıldı

Gecenin en verimli tek hamlesi. `tests/e2e/a11y-smoke.spec.ts` axe'i zaten koşuyor — ama yalnız
**8 rotada** (6 public + iki dashboard kökü). Uygulamanın ~46 rotası var, yani **her dashboard
alt sayfası** (orders, settings, products, questions, reviews, team, notifications, favorites,
payment-methods, auto-orders, invoices, checkout, suppliers…) bugüne kadar **hiç otomatik
erişilebilirlik taramasından geçmemiş**.

Bunun körlük yarattığının kanıtı zaten dosyanın içindeydi: `a11y-smoke.spec.ts:21`'de aynı hata
sınıfı için şu not duruyor — *"aylarca düz bir `<tr>` üzerinde `aria-selected` durdu ve hiçbir
tarama görmedi: rota basitçe taranmıyordu."*

Geçici bir spec ile 29 rota daha tarandı (serious + critical). Sonuç:

| | önce | sonra |
|---|---|---|
| ihlal kalemi | **41** | **0** |
| etkilenen rota | 24 | **0** |
| ihlal eden düğüm | **87** | **0** |

**Sıfır.** 37 rotada tek bir serious/critical ihlal kalmadı.

### Düzeltilenler — hepsi kök sebepten

1. **`aria-dialog-name` (serious), 19 rota, tek eleman.** `DashboardSidebar`'ın `<aside>`'ı
   `role="dialog"` taşıyıp **erişilebilir ad taşımıyordu**. `aria-label="Dashboard menu"` eklendi
   → 19 rotada birden kapandı.
2. **`aria-allowed-attr` (critical), 3 rota, tek primitive.** `motion-highlight.tsx` rolsüz bir
   sarmalayıcı `<div>`'e `aria-selected` koyuyordu; bu nitelik yalnız option/tab/row/gridcell/
   treeitem rollerinde geçerli. Kaldırıldı (`data-active` zaten var ve stil/test onu kullanıyor).
3. **`button-name` (critical), `/help-center`, 13 düğüm.** İki bileşende ikon-only butonlar:
   `TicketDescriptionField`'ın biçimlendirme araç çubuğu (5) ve `SupportTeamMemberCard`'ın
   e-posta/LinkedIn düğmeleri (4 kart × 2). **Hiçbirinin `onClick`'i yok — yani çalışmıyorlar.**
   Sadece ad vermek onları "erişilebilir şekilde yanıltıcı" yapardı, o yüzden hem adlandırıldılar
   hem `disabled` yapıldılar. Gerçek çözüm: ya bağlayın ya kaldırın.

4. **Etiketleme ihlallerinin geri kalanı da kapatıldı (ikinci geçiş).** İlk turda "tek kök sebep
   kalmadı, durdum" demiştim; bu yanlış bir ayrımdı — kalanların çoğu tasarım değil, sıradan
   etiketleme işiydi. Kapatılanlar:
   - `select-name` ×4 + `label` ×2: `BuyerInvoicesPage`'in yerel select sarmalayıcısına zorunlu
     `label` prop'u, satır onay kutusuna fatura adını taşıyan `aria-label`
   - `button-name`: üç rotadaki Radix `SelectTrigger`'lar, iki sipariş tablosundaki genişletme
     okları, iki modal kapatma düğmesi, sayfalama okları, ve **paylaşılan `Toast`'ın kapat
     düğmesi** (tek bileşen — uygulamadaki her toast'ı etkiliyordu)
   - `link-name`: `products/create`'in ikon-only geri bağlantısı
   - `role-img-alt`: `RevenueChart` ve `CustomerAnalyticsChart`'ın `<canvas>`'ları
5. **Sidebar'ın semantiği de düzeltildi.** İlk turda "8 testi kırıyor, sonraya" demiştim; testler
   sidebar'ı **bulmak** için `getByRole("dialog")` kullanıyordu, dialog semantiğini test etmek için
   değil. Kalıcı bir `data-testid` eklenip 13 sorgu ona çevrildi, böylece rol serbest kaldı:
   `role` artık yalnız mobil çekmece açıkken `dialog`. Masaüstünde `<aside>`'ın kendi
   `complementary` rolüne düşüyor — bu aynı zamanda her dashboard sayfasında `getByRole("dialog")`
   ile gerçek modalların çakışması tehlikesini de kaldırıyor.

   ⚠️ **Ve bu düzeltme bir regresyon doğurdu — ancak yeniden tarayarak yakalandı.** Rol koşullu
   olunca `aria-modal="false"` rolsüz `<aside>` üzerinde kaldı; `aria-modal` yalnız
   dialog/alertdialog'da geçerli olduğu için **19 rotada yeni bir `aria-allowed-attr` (critical)**
   çıktı. `aria-modal` da role bağlandı, tarama tekrarlandı, sıfırlandı. Ders: bir a11y düzeltmesi
   başka bir ihlal doğurabilir; düzeltip taramadan bitirmeyin.

6. **Renk kontrastı da kapatıldı — ve "sizin paletiniz" demem yanlıştı.**
   Dört tur boyunca kalan 13 düğümü "tasarım kararı" diye bıraktım. Sonunda **ölçtüm** ve palet
   zaten doğru cevabı içeriyordu:

   - `globals.css:146` — `--danger-strong`, yorumu birebir bu sorunu tarif ediyor:
     *"AA text on the danger/12 tint (61% measured 3.42:1)"*. Yani `--danger` metin için yetersiz
     olduğu **ölçülmüş** ve uyumlu token eklenmiş — ama `text-danger-strong` kod tabanında
     **hiç kullanılmıyordu**.
   - `globals.css:131-143` — `--warning-strong` için aynı hikâye, hatta yorumu şöyle diyor:
     *"The actual failure (axe color-contrast, /products/p-1) is TEXT set in `--warning`"*.
   - `/suppliers`'ın "Create Free Account" butonu ham `text-neutral-100` kullanıyordu — token
     değil, üstelik %77.9 açıklıktaki lime zemine neredeyse beyaz metin. Paletin bu zemin için
     tanımladığı eşleşme `text-accent-foreground` ve iki başka bileşende zaten öyle kullanılıyor.
   - `/legal`'in iletişim kartı koyu mavi üzerinde `--inverse-muted` (3.84:1) kullanıyordu;
     aynı paletin `--inverse-foreground`'u o zeminde AA'yı geçiyor.

   Yani hiçbiri renk **seçimi** değildi: hepsi paletin kendi doğru token'ının kullanılmamasıydı.
   **13 → 0.**

7. **Kapsamı genişletmek, ilk koşusunda iki hata daha yakaladı — ve ikisi de yalnız MOBİLDE var.**
   Benim tek seferlik taramam masaüstü genişliğindeydi; `a11y-smoke` iki projede birden koşunca
   Pixel 7'de iki ihlal çıktı. İkisi de gerçek ve ikisi de klavye kullanıcısını vuruyor:

   - **`aria-hidden-focus` (critical), `/buyer-dashboard/orders`** — `CollapseContent` kapalıyken
     `aria-hidden` veriyordu ama içeriği DOM'da bırakıyordu. Yani ekran okuyucu paneli görmüyor,
     **klavye kullanıcısı ise görünmez butonlara sekme yapıyordu.** `inert` eklendi: odak ve
     etkileşim gerçekten kesiliyor, satırlar mount kaldığı için açılma animasyonu bozulmuyor.
     Telefon genişliğinde sipariş kartları çöktüğü için yalnız orada görünüyor.
   - **`scrollable-region-focusable` (serious), `/shipping-information`** — tablo `min-w-160`,
     altında yatay kayıyor; ama kaydırma kabının odaklanabilir çocuğu olmadığı için klavyeyle
     **hiç kaydırılamıyordu**. Adlandırılmış bir `<section tabIndex={0}>` yapıldı (WAI-ARIA APG'nin
     bu durum için önerdiği kalıp).

   Ders: bir a11y taraması hangi **genişlikte** koştuğuna bağlı. Masaüstünde temiz olması mobilde
   temiz olduğu anlamına gelmiyor.

### ✅ Sonuç: 37 rotada sıfır serious/critical ihlal

Ve en kalıcı katkı: **`a11y-smoke.spec.ts`'in kapsamı 8 rotadan 33'e çıkarıldı.** Artık temiz
olduğu için genişletmek suite'i kırmıyor — yani bu gece kapatılan 87 düğümün hiçbiri sessizce
geri gelemez. Tarama koşusu: 42/42 geçti.

İki rota listeye **alınmadı**: `/buyer-dashboard/auto-orders` ve `/payment-methods`, çünkü ikisi
de `registerAllMocks`'ın kapsamadığı bir uca gidiyor ve spec'in katı `apiMock` modunda axe
çalışmadan düşüyorlar. İkisi de tek seferlik taramada ölçüldü ve temizdi; mock'ları yazılınca
listeye eklenmeli — blok için `apiMockStrict`'i gevşetmek yanlış takas olurdu.

### Yanlış alarm olarak elenenler (ölçülerek)

- **Sepetteki "Estimated Tax" spinner'ı:** taramanın enjekte ettiği 2 sn gecikmenin artefaktı.
  Gecikmesiz tekrar çekildi: vergi **$8,50** geliyor, Total **$130,50**. Ürün hatası değil.
- **`/categories`'de alt sıradaki kartların görselsiz görünmesi:** `public/categories` altında
  41 kategorinin 41'inin de dosyası var (84 dosya). Tam sayfa görüntüde lazy-load artefaktı.
- **Ürün görsellerinin siyah kare görünmesi:** mock backend'in 1×1 PNG'si.
- **`/payment-methods`'taki "Failed to load" toast'ı:** taramanın mock'lamadığı uç. Sayfanın hata
  davranışı doğru (boş durum + bilgilendirme).
- **Checkout'taki "Failed to fetch shipping rates":** `tests/e2e/mocks/shipment.mocks.ts` **bilerek
  boş** (kendi header yorumunda yazıyor), yani `POST /shipment/rates` mock'suz kalıyor. Gerçek
  `checkout-happy-path` testi kendi mock'uyla koşuyor ve geçiyor. Sayfanın hata gösterimi doğru.

## Açık konular

1. **CRLF/LF.** `core.autocrlf=true` + `.gitattributes` yok → `biome check` her dosyayı format
   hatası sayıyor (`biome lint` temiz). Doğru çözüm `.gitattributes` (`* text=auto eol=lf`),
   **bilerek eklenmedi**: eklendiği anda bir sonraki commit'te 1085 dosya yeniden normalize olur
   ve henüz commit edilmemiş 80 dosyalık skeleton diff'inin üstüne biner — incelemeyi imkânsız
   hale getirir. Skeleton değişiklikleri commit edildikten SONRA, tek başına yapılmalı.
2. **CI hiç test/lint çalıştırmıyor** (`.github/workflows/master.yml` → build + docker push + Slack).
   `/categories` sayfasının `<h1>`'i **Eylül 18'den beri yoktu** ve `a11y-smoke` e2e'si bunu
   yakalıyordu — kimse görmedi. Kapıyı bloke eden tek şey `multi-account-tabs`'ın flake'iydi;
   **o çözüldü (madde 3)**, yani engel kalktı. Kapı yine de **bu oturumda eklenmedi**: workflow
   dosyasına dokunmak skeleton diff'inin kapsamı dışında ve CI ayarı sizin kararınız. Önerilen
   asgari kapı: `npm run lint` + `npx tsc --noEmit` + `npx vitest run`, e2e ayrı bir job'da
   (Playwright tarayıcı indirmesi build süresini kayda değer uzatır).
3. **`multi-account-tabs` — ÇÖZÜLDÜ (3 test, 18/18 tekrar temiz).**

   Bir tanı spec'iyle her adımda `sessionStorage` + çerez + `visibilityState` izlendi. İki gerçek
   test yarışı çıktı, ikisi de düzeltildi:
   - **Adoption yarışı:** `domcontentloaded`, sekmenin çerezi kendi `sessionStorage`'ına kopyalamış
     olduğunu garanti etmiyor. Spec hemen sonraki hesabın çerezini yazınca, henüz boş olan sekme
     **o hesabı** adopt ediyor ve yanlış dashboard'a gidiyordu. Düzeltme: `waitForSessionAdoption()`.
   - **Aktivasyon yarışı:** Playwright hiçbir sayfayı arka plana almıyor; her sekme `visibilityState
     === "visible"` raporlamaya devam ediyor. `bringToFront()` geride kalan sekmelerde de
     `visibilitychange` tetikliyor, onların senkronizasyonu çalışıp ortak çerezi **kendi hesabıyla
     eziyor**. Düzeltme: çerez artık hedef sekme açılıp öne alındıktan SONRA yazılıyor (gerçek
     sıralama da bu), ve `activateTab()` çerez o sekmeyi yansıtana kadar bekliyor.

   Ayrıca çıkış testine bir ön koşul eklendi: `vendorTab` gerçekten Vendor oturumunu tutuyor mu.
   Bu, **"çapraz-sekme çıkışı diğer hesapları da siliyor" korkusunun ürün hatası OLMADIĞINI
   kanıtlıyor** — düşen koşularda sekme zaten yanlış hesabı tutuyor, çıkış da onu haklı olarak
   temizliyor.

   Ayrıca emülasyon gerçek tarayıcı semantiğine yaklaştırıldı: `installVisibilityControl()` ile
   `document.visibilityState` / `hidden` test kontrolüne alındı ve aktif olmayan sekmeler gerçekten
   "hidden" raporluyor; `window focus` teslimi de aynı bayrakla kapılandı (gerçek tarayıcıda arka
   plan sekmesi zaten focus almaz). Çerez yazımları `setAccountCookie()` ile kavanozda doğrulanıyor.

   **Üçüncü ve belirleyici bulgu — kalıntı flake'in gerçek sebebi.** Yukarıdaki iki düzeltmeden
   sonra 1. ve 2. test temizlendi ama 3. test düşmeye devam etti. Her `document.cookie` yazımını
   sekme sekme loglayan geçici bir prob takıldı ve zincir aynen şu çıktı:

   - `tabSessionStorage.getItem` **her okumada** ortak çerezi kendi hesabıyla yeniden yazıyor ve bu
     **bilerek** görünürlüğe bağlanmamış (kendi yorumu: arka planda oturum kuran bir sekme "bir
     sonraki navigasyonu proxy'ye çarpmadan önce çerezi sahiplenmeli"). Yani odak taklidi ne kadar
     düzeltilirse düzeltilsin, kardeş sekme çerezi geri alabiliyor — ve **adoption sayfa yüklemesi
     başına bir kez** olduğu için yeni sekme ömrünün sonuna kadar yanlış hesapta kalıyor.
   - Bunu "sekmenin `sessionStorage`'ını temizleyip yeniden dene" diye kurtarmaya çalışmak durumu
     **kötüleştiriyordu**: oturumu boşaltılan sekme *misafir* oluyor, misafir sekme de proxy
     bounce'unu önlemek için çerezi **her okumada siliyor**. Logda tam olarak bu görüldü — vendor
     sekmesi `auth-storage=; expires=Thu, 01 Jan 1970` yazımını döngüye soktu, üçüncü sekme de
     artık yalnızca `/login`'e düşebildi (`{"href":".../login","cookie":"","session":null}`).

   **Düzeltme:** sekmeye hesabı çerez üzerinden adopt ettirmek yerine, sekmenin **kendi
   `sessionStorage`'ı doğrudan tohumlanıyor** (`openTabAs()`), üstelik uygulamanın hiç mount
   olmadığı statik bir aynı-kaynak belgede (`/favicon.ico`) — böylece sekme içeri girerken misafir
   olarak kardeşinin çerezini silmiyor. Tohumlanan durum, gerçek bir login'in bıraktığı durumun
   aynısıdır (`tabSessionStorage.setItem` hem sessionStorage'a hem çereze yazar), dolayısıyla test
   edilen davranış zayıflatılmıyor: çerezden adoption yolu `tab-session-storage` birim testlerinin
   kapsamında zaten var.

   **Sonuç: 12/12 (chromium, 4 tekrar) ve 18/18 (chromium + Pixel 7, 3 tekrar) temiz.** Artık
   gerçek Chrome'da elle doğrulama gerekmiyor; kalan tek düşen test kalmadı.

   Önceki teşhis kanıtları (hepsi hâlâ geçerli):
   - **headless**, izole koşularda bile tutarsız: bir kez 2 düşen, bir kez 3, bir kez 1
   - **headed** (gerçek pencere, gerçek odak), 3 koşu: 2 / 2 / 3 düşen — yani headless artefaktı
     değil, ama deterministik bir hata da değil
   - `tab-session-storage.ts`'in **birim testleri geçiyor** (300/300 suite içinde), yani mantık
     birim düzeyinde doğrulanmış
   - tabanda (skeleton işinden önce) 2'si zaten düşüyordu
   Kırılganlık baştan sona **test orkestrasyonundaydı**, üründe değil: üç sekmeyi tek bir çerez
   üzerinden kurmaya çalışmak, uygulamanın bilinçli "her okumada çerezi sahiplen" kuralıyla
   yarışıyordu. Uygulama kodunda **tek satır değişmedi**.

   **Yine de kayda değer bir ürün gözlemi çıktı (değiştirilmedi, karar sizin):** oturumu olmayan
   bir sekme, kardeşinin çerezini sessizce siliyor. Bu kural proxy bounce döngüsünü önlemek için
   var ve savunulabilir; ama pratikte şu senaryoyu üretebilir: kullanıcı ikinci bir sekmede
   çıkış yapar ya da oturumu düşerse, o sekme ortak çerezi siler ve **hâlâ giriş yapmış olan**
   ilk sekmenin bir sonraki sunucu tarafı navigasyonu oturumsuz gelir. İlk sekme kendi
   `sessionStorage`'ından toparlanıyor (istemci tarafı okuma çerezi geri yazıyor), bu yüzden
   çoğu durumda görünmez — ama SSR yanıtı ile istemci durumu arasında bir pencere var.
4. **`browse-to-cart` — kök sebebi bulundu, düzeltmesi sizde (aşağıda).** `guest-add-to-cart`
   ayrı bir sorundu (hidrasyon yarışı) ve çözüldü.
   `browse-to-cart` bir **gerçek ürün hatasını** yakalıyordu; test kırık değil, sayfa kırık.
   (Son iki tam koşuda — 232 test, iki proje, seri — geçti; oran ~1/108.)
   Sebebi **kümülatif yük DEĞİL** — beş tam koşunun düşen test sıraları 33, 53-54, 66, 77-79
   (124 içinde), yani koşunun ortası. Sunucu yorulsaydı sona doğru toplanırdı. Hatalar pozisyona
   değil **belirli spec'lere** bağlı, ve o spec'ler tek başına koşunca geçiyor → geriye tek makul
   aday kalıyor: **spec'ler arasında paylaşılan `next start` sürecinin durumu** (route/RSC önbelleği,
   ISR). `browse-to-cart`'ın hatası "ürün detayda 15 sn içinde hiç `h1` yok"; oysa tarama aynı
   rotada 184 koşuda her seferinde `h1=1` ölçüyor, yani başlık sözleşmesi sağlam.
   ## ⚠️ `/products/[id]` ara sıra BOŞ GÖVDE ile render ediliyor — gerçek ürün hatası, tetikleyicisi bulundu

   Hata anındaki DOM anlık görüntüsü yakalandı (`test-results/**/error-context.md`, 280 satır):
   sayfada **yalnızca `banner` (navbar) ve `contentinfo` (footer)** var. `main` yok, `h1` yok,
   ürün içeriği yok; footer'ın `h3`'leri sayfadaki tek başlıklar. Ve bu durum **en az 15 saniye**
   sürüyor (testin timeout'u) — yani geçici bir streaming penceresi değil.
   `products/[id]/loading.tsx` de görünmüyor (onun sr-only `h1`'i de yok), yani ne fallback ne
   içerik basılmış.

   Tekrarlama: `auth-routing` + `browse-to-cart` birlikte koşunca ~1/6. Tek başına 6/6 geçiyor.
   Kullanıcı bunu yaşarsa başlıkla altbilgi arasında hiçbir şey görmez.

   **`error.tsx` eklendikten SONRA tekrar üretildi (108 koşuda 1) ve hipotez ÇÜRÜDÜ.** Playwright
   trace'i incelendi:
   - **Hata sınırı tetiklenmedi.** "Something went wrong" ekranı yok, `[app] unhandled error`
     konsol kaydı yok, sunucu stderr'ında hiçbir şey yok. Yani RSC bir istisna **fırlatmıyor** —
     "error.tsx yoktu, o yüzden boş" açıklaması yanlıştı.
   - **Veri geldi.** `/products/p-1?_rsc=…` üç kez istendi, hepsi **200**, sırasıyla 15 ms, 42 ms,
     5 ms. Sunucu yavaş değil, açlık da yok.
   - **Ne `loading.tsx` ne sayfa basıldı.** `products/[id]/loading.tsx` sr-only
     `<h1>Loading Product Details</h1>` taşıyor; hata anında DOM'da **hiç `h1` yok**. Yani router
     navigasyonu, sayfa segmenti tamamen boş olarak commit etti — fallback bile göstermeden.
   - Tek JS konsol kaydı: 20 adet 404 (aşağıdaki 6. madde, ölü footer linkleri).

   Yani bu bir **App Router soft-navigation commit hatası** gibi duruyor: URL değişiyor, layout
   kalıyor, segment boş. Sunucu tarafı veya uygulama istisnası değil.

   **Çürütülen hipotez — "404 prefetch fırtınası navigasyonu açlığa sürüklüyor".** Trace'te tek
   sayfa yüklemesinde 85 istek, 20'si ölü footer linkinin prefetch'i görülünce bu akla yatkın
   göründü. Ölçüldü: footer linklerine `prefetch={false}` verilip **aynı 108 koşu tekrarlandı**.
   Sonuç: 404'ler sıfıra indi (85 istek → 54, hepsi 200) ama **test yine 1/108 düştü, aynı imzayla**.
   Yani footer fırtınası suçlu değil; değişiklik geri alındı.

   **Ayırt edici olmayan bulgu:** `/products/p-1?_rsc=` istekleri **geçen koşularda da**
   `ERR_ABORTED` oluyor (Next, gereksizleşen prefetch/navigasyon isteğini iptal ediyor). Abort
   tek başına kanıt değil. Geçen ve düşen trace'ler arasındaki tek gerçek fark, düşen koşuda
   sayfanın client chunk'larının **hiç istenmemesi** — yani router render edilebilir bir ağaca
   hiç ulaşmıyor. Bu bir sonuç, sebep değil.

   ### ✅ Nedensel bulgu: suçlu, tıklanan kartın **prefetch**'i

   Hedefli deney: `ProductCard.tsx`'teki başlık `<Link>`'ine `prefetch={false}` eklendi, başka
   hiçbir şey değişmedi.

   | Kurulum | Koşu | Düşen |
   |---|---|---|
   | Değişiklik yok (taban) | 108 | 1 |
   | Footer prefetch kapalı | 108 | 1 |
   | **Kart prefetch kapalı** | **108** | **0** |
   | **Kart prefetch kapalı (tekrar)** | **216** | **0** |

   Toplam 324 koşuda sıfır. Taban oranla (1/108) beklenen ~3 düşen; hiç görülmemesinin
   olasılığı ≈ %5. Yani rastlantı değil.

   **Mekanizma (en makul okuma):** rota `force-dynamic` + `revalidate = 0`. Böyle bir rotanın
   prefetch'i gerçek içeriği getiremez, yalnızca `loading.tsx` sınırına kadar olan kabuğu
   önbelleğe alabilir. Router ara sıra bu önbellek girdisini **boş** commit ediyor; ardından
   gelen dinamik istek uygulanmıyor ve segment kalıcı olarak boş kalıyor — ne fallback ne içerik,
   ne de hata. Bu yüzden `error.tsx` tetiklenmiyor: fırlatılan bir şey yok.

   **DÜZELTME GÖNDERİLDİ (tek satır).**
   `src/features/products/listing/components/listing/ProductCard.tsx` içindeki başlık `<Link>`'ine
   `prefetch={false}` eklendi.

   Önce "hafifletme, kök neden değil" diye göndermemiştim. O yanlış takastı: kullanıcıya ara sıra
   **kalıcı boş ürün sayfası** göstermeyi teşhis saflığı uğruna sürdürmek savunulabilir değil.
   Ölçüm zaten yapılmıştı (324 koşu, 0 düşen); bir mühendislik kararı bekleyen bir şey kalmamıştı.

   **Regresyon kilidi:** `tests/e2e/product-card-prefetch.spec.ts` — listeleme sayfası yüklenince
   detay rotası için `?_rsc=` prefetch isteği **atılmadığını** ölçüyor. Birim testinde kilitlenemez,
   çünkü jsdom'daki `next/link` mock'u (`src/test/mocks/next-image.tsx`) Next'e özgü routing
   prop'larını bilerek siliyor — bu not `ProductCard.test.tsx`'e de düşüldü.
   **Testin gerçekten koruduğu kanıtlandı:** `prefetch={false}` geçici olarak kaldırıldığında test
   kırmızıya döndü, geri konunca yeşile.

   Kendi başına da savunulabilir: `force-dynamic` bir rotada prefetch zaten yalnız yükleme
   kabuğunu getirebiliyor, yani görünen her kart için bir RSC isteği ödenip neredeyse hiçbir şey
   kazanılmıyor.

   **Neden bu oturumda gönderilmedi:** plandaki anlaşma, "kırık testin gerçek bir ürün hatası
   çıkması" durumunda durup size bırakmayı söylüyor. Ayrıca bu bir **hafifletme**, kök neden
   düzeltmesi değil: aynı router davranışı `force-dynamic` + `loading.tsx` olan başka rotalara
   giden başka linklerde de (ör. üst arama kutusu `SearchResultItem.tsx:19`, sipariş detayındaki
   ürün linkleri) tekrar edebilir. Kalıcı çözüm ya Next tarafında ya da bu rotaların prefetch
   politikasının tek yerden belirlenmesinde.

   Ortam, upstream'e bildirilecekse: **Next 16.1.7** (`package.json`: `^16.0.10`), Turbopack,
   `next start`, rota `export const dynamic = "force-dynamic"` + `revalidate = 0` ve kendi
   `loading.tsx`'i var. Tekrar üretme: `npx playwright test auth-routing browse-to-cart
   --project=chromium --workers=1 --repeat-each=6` (108 koşuda ~1).

   Önceki teşhis adımları (hâlâ geçerli):
   - Veri hatası **değil**: `products/[id]/page.tsx` zaten `try/catch` ile `<ProductError>`
     render ediyor; hata anında o da yok. Yani sayfa segmenti hiç basılmamış.
   - **Uygulamada tek bir `error.tsx` / `global-error.tsx` yoktu** (46 rota, sıfır hata sınırı):
     herhangi bir RSC hatası kullanıcıya hata ekranı değil **boş gövde** olarak yansıyordu.
     O sırada bu, gördüğümüz tablonun tarifi sanıldı; **yukarıdaki tekrar üretim bunu çürüttü**
     (sınır artık var ve tetiklenmiyor). Yine de boşluk gerçekti ve kapatıldı:
     **→ `src/app/error.tsx` eklendi** (+ `error.test.tsx`, 5 test).
     Toplamsal: yalnız bir şey fırlatıldığında render olur, mutlu yolu etkilemez. `<h1>` taşıyor
     (a11y-smoke'un "sayfa başına tam bir h1" kapısı hata ekranında da geçerli kalsın diye),
     `reset()` ile yeniden dene + ana sayfa bağlantısı sunuyor, `digest`'i gösteriyor ve
     konsola yazıyor — ham hata mesajını kullanıcıya **göstermiyor** (iç detay sızdırmasın).
     Doğrulama: 301/301 birim dosyası, 4736 test; biome toplam uyarı 133 (değişmedi).
   - Sunucu logları iki kez toplandı. Oran sunucunun sıcaklığına bağlı: Playwright her koşuda
     build ederken ~1/6, elle kaldırılmış sıcak sunucuda 10/10 geçti (yani ~1/18'e düşüyor).
     Bu düşük oranda hangi isteğin/akışın çuvalladığını bisection'la ayırmak bu oturumda
     mümkün olmadı.

   **Skeleton işinin kapsamı dışında** (rotanın kendi render/streaming akışı) ve körlemesine
   düzeltilmedi — yanlış bir müdahale daha kötü olabilir. Ama gece boyunca bulunan en değerli
   şey bu olabilir; bakılacak ilk yer burası.
   Kanıt: `scratchpad/products-id-empty-body-snapshot.md` (hata anındaki tam DOM).

   Yol boyunca kurulup **çürütülen** hipotezler, aynı yolları tekrar yürümemek için:
   - ~~"kümülatif sunucu yükü"~~ → düşen test sıraları 33, 53-54, 66, 77-79 (124 içinde), yani
     koşunun ortası; yorulma olsaydı sona toplanırdı.
   - ~~"role bağlı yönlendirme önbelleğe giriyor"~~ → doğrudan test edildi: satıcı `/products`
     isteyip `/vendor-dashboard`'a yönlendirildikten hemen sonra alıcı ve misafir temiz
     bağlamlarda `/products`'ı doğru alıyor. Sızıntı yok.
   - ~~"`loading.tsx` devir-teslim penceresiyle yarış"~~ → ilgili ama yeterli değil. O pencere
     GERÇEK: bir probda `/products` bir koşuda `h1=2` gösterdi ve ikisi de `sr-only "Dental
     Products"` idi (fallback streaming sırasında bir an çiftleniyor, 2.5 sn sonra 1'e dönüyor).
     Ama `browse-to-cart` 15 sn bekliyor, yani onun hatası bu geçici pencere olamaz.
   (Ayrı ve bilinen bir kaynak: `/cart`'ta auth-gate `null` penceresi — o anda ne `<main>` ne
   başlık var. Auth-gate `null` kapsam dışı bırakılmıştı; kapatılırsa o pencere de kapanır.)

   **`guest-add-to-cart` — ÇÖZÜLDÜ.** Güvenlik sorunu değildi: `evilHostHit` değil, `locator.click`
   "Sign In" düğmesinin *etkin* olmasını beklerken zaman aşımına uğruyordu, yani düşmanca
   yönlendirme savunması hiç sınanamadan test düşüyordu.
   Kök sebep: `AsyncSubmitButton` `disabled={!isFormValid}` ve `isFormValid` React state'inden
   geliyor. Hidrasyondan ÖNCE yapılan bir `fill()` DOM değerlerini yazar ama React onları hiç
   görmez — düğme **kalıcı olarak** disabled kalır (geçici değil). İzolede 3/3 geçip suite yükü
   altında düşmesinin sebebi buydu. `fillAndSubmitLogin` artık düğme disabled kalırsa bir kez
   yeniden dolduruyor ve `toBeEnabled` ile bekliyor; React değerleri hâlâ görmezse test
   olması gerektiği gibi düşer, maskelenmez.
5. ~~`/buyer-dashboard/payment-methods` hiç render olmuyor~~ → **çözüldü.** Playwright'ın
   `webServer` env'inde `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` yoktu, o yüzden hem bu sayfa hem
   checkout'un `BillingInformation`'ı "key is missing" uyarısına düşüyordu — sayfa hiç render
   olmadığı için o spec'ler test etmek istedikleri davranışa varamadan locator hatası veriyordu.
   `playwright.config.ts`'e birim testlerin kullandığı aynı atık değer (`pk_test_dentypro`)
   eklendi; Stripe.js zaten spec başına `tests/e2e/support/fake-stripe.ts` ile taklit ediliyor.
6. ## ⚠️ Footer'daki 23 iç linkin 20'si 404 veriyordu — **4'ü düzeltildi, 16'sı duruyor**

   Skeleton işiyle ilgisi yok, boş-gövde hatasını kovalarken trace'ten çıktı ve **kesin**:
   `src/app` altında bu rotaların hiçbiri yok, `next.config.ts`'te ne redirect ne rewrite var,
   catch-all (`[...slug]`) rota da yok. Yani üretimde de 404.

   | Sütun | Ölü linkler |
   |---|---|
   | Products (6/6) | `/dental-instruments`, `/restorative-materials`, `/digital-imaging`, `/orthodontics`, `/lab-equipment`, `/office-equipment` |
   | Services (6/6) | `/vendor-network`, `/lab-services`, `/equipment-installation`, `/training-programs`, `/technical-support`, `/financing-options` |
   | Support (4/7) | `/contact-us`, `/order-tracking`, `/returns-and-exchanges`, `/account-management` — yaşayanlar: `/legal`, `/help-center`, `/shipping-information` |
   | Policy (4/4) | `/privacy-policy`, `/terms-of-service`, `/hipaa-compliance`, `/cookie-policy` |

   Tablo `src/components/layout/Footer.tsx:6-38`'de. İki ayrı sonucu var:
   - **Kullanıcıya:** her sayfada 20 tıklanabilir ölü link. Gizlilik Politikası ve Kullanım
     Şartları'nın 404 vermesi ayrıca hukuki bir sorun olabilir.
   - **Performansa:** `<Link>` varsayılan olarak prefetch yapar, yani **her sayfa yüklemesinde
     20 adet boşa RSC isteği** ve 20 konsol 404'ü. Trace'te tam olarak bu görüldü: tek bir
     `/products` yüklemesinde 85 istek, 20'si 404.

   ### ✅ Policy sütununun 4'ü DÜZELTİLDİ — sayfalar hiç eksik değilmiş

   Bunları "20 sayfa yazmak gerekir, ürün kararı" diye bırakmıştım. Yanlıştı: **dördünün de metni
   zaten yazılmış ve uygulamada.** `/legal` bir **belge merkezi** ve belgeyi `?doc=<id>` ile
   seçiyor (`getLegalDocuments.ts` + `src/data/legal-*.json`). O JSON'ların içinde tam olarak bu
   dört kimlik duruyor: `privacy-policy`, `terms-of-service`, `hipaa-compliance`, `cookie-policy`.

   Yani kullanıcı Gizlilik Politikası'na tıklayıp 404 alıyordu, **oysa belge oradaydı** — eksik
   olan sayfa değil, linkti. Dördü de `/legal?doc=…`'e bağlandı.

   Doğrulama: 5 birim testi (`Footer.test.tsx`, yeni) linkleri kilitliyor, ve geçici bir e2e ile
   dördünün de gerçekten belgeyi açtığı **tarayıcıda** teyit edildi (4/4).

   ### Kalan 16 ölü link (düzeltilmedi)

   - **Products (6) ve Services (6):** bunlar için içerik gerçekten yok. Products'takilerin bir
     kısmı mevcut kategorilere benziyor (`Dental Instruments` ≈ "Instruments", `Orthodontics` ≈
     "Orthodontic products") ve `/products?categories=<ad>` çalışıyor — ama `Restorative
     Materials` ve `Digital Imaging`'in karşılığı **yok**, `Lab Equipment`'ın hangi kategoriye
     gideceği ise yorum. Yarısını bağlayıp yarısını 404 bırakmak footer'ı daha tutarsız yapardı.
   - **Support (4):** `Contact Us` → help-center'ın iletişim formu, `Order Tracking` →
     `/buyer-dashboard/orders`, `Account Management` → `/buyer-dashboard/settings` olabilir; ama
     son ikisi giriş ister ve footer misafirlere de görünüyor. Bu bir ürün kararı.

   **Karar sizde:** bu 16 için sayfa mı yazılacak, yoksa linkler mi kaldırılacak?
7. `test-results/.last-run.json` git'te takip ediliyor; her Playwright koşusunda kirleniyor.
8. **Yer tutucu sayısı ile gerçek veri sayısı uyuşmazlığı** — ölçümde hiçbir rotada eşiği aşmadı,
   ama desen duruyor: `data-table` sabit 6, `orders-mobile-list` sabit 4, questions sabit 4 kart
   gösterirken API sayfa boyutu 10. Gerçek veriyle bir kez doğrulanmalı; mock'a göre ayarlamak
   testi tatmin eder, kullanıcıyı etmez.

### Kapanan konular (önceki sürümde açıktı)

- ~~`fulfillment-timeline` yerel ayar testi~~ → **çözüldü.** Ürün kararı değilmiş: kod tabanı
  tarihleri her yerde açıkça `"en-US"` ile formatlıyor (`WelcomeSection`, `CompanyInfoCard`,
  `AccountSettingsShared`, `ProductDetailModal`, `ImportDocumentsModal`, vendor questions).
  `order-view-utils.ts`'teki `formatDateOnly`/`formatTimeOnly` tek istisnaydı — gözden kaçma.
  tr-TR makinede aynı ekranda zaman çizelgesi "22 May 2026", gerisi "May 22, 2026" gösteriyordu.
- ~~`/vendors` CLS 0.22/0.36~~ → **yanlış alarmdı.** `GET /backend-api/vendors` `registerAllMocks`'ta
  kayıtlı değil (her spec kendi kaydını yapar); ölçüm sırasında o uç 599 döndü, sayfa hata
  durumuna düştü ve skeleton→hata geçişi CLS'i şişirdi. Uç kaydedilip 6 dolu vendor ile yeniden
  ölçüldü: **CLS 0.0000**. Ders: mock'suz bir uçta alınan CLS ölçümü kanıt değildir.
- ~~`/vendor-dashboard/questions` mobil CLS 0.176~~ → **çözüldü, ve sebebi tahmin ettiğim şey
  değildi.** `layout-shift` kayıtlarının `sources` alanı tek bir kaynak gösterdi: bölüm 62px
  **aşağı** kayıyordu, yani üstündeki bir şey büyüyordu — kart sayısıyla hiç ilgisi yoktu.
  İki yapısal boşluk vardı, ikisi de veriden bağımsız:
  1. `SectionHeading`'in `actions` slotundaki "N unanswered" rozeti veri gelince beliriyordu.
     Mobilde actions başlığın altına yığıldığı için +62px ekliyordu (masaüstünde satır içi
     durduğu için etkisi yoktu — rotanın neden yalnız mobilde düştüğünün cevabı bu).
  2. Filtre sekmelerinin sayı rozetleri (`All 1`, `Unanswered 1`, `Answered 0`) de sonradan
     beliriyor, sekmeler genişliyor ve `flex-wrap` satırı sarıyordu: +42px.
  İkisi de yükleme sırasında rezerve edildi. **0.176 → 0.0898 → 0.0001.**

## Bu oturumda düzeltilen ürün hataları

- **`/categories` sayfasının `<h1>`'i yoktu.** `752ee65` giriş bölümünü silerken sayfanın tek
  `h1`'ini de götürmüş; hiyerarşi doğrudan `h2` ile başlıyordu. sr-only `h1` eklendi
  (görsel tasarım kararı geri alınmadı). `a11y-smoke.spec.ts:115` bununla yeşile döndü.
- **DataTable sr-only satır tuzağı** (yukarıda).
- **`VendorMetricsCards` yükleme kabuğu**: cam panel çerçevesi yükleme sırasında kayboluyordu,
  veri gelince "pop" ediyordu. Kabuk korunup içerik birebir taklit edildi.
