# Backend'e Devredilen Maddeler

Frontend test/düzeltme çalışmasında bulunan, **frontend'de çözülemeyen** maddeler.
Bu dosya bir devir listesidir; koda dokunulmamıştır.

Kaynak: `TEST-FINDINGS.md` (aynı dizin). Kod referansları `ecommerce-frontend/src/` altındadır.

---

## 1. Siparişte idempotency key yok (K3 — 🔴 kritik, para)

**Bugünkü durum:** `useFinalReview.ts` içindeki `useRef` guard'ı yalnızca **aynı sekmedeki aynı hook örneğini** koruyor.
Kullanıcı ödeme sırasında sayfayı yenileyip tekrar denerse `POST /api/orders` ikinci kez çağrılıyor ve backend **ikinci bir sipariş oluşturuyor**.

**Backend'den beklenen sözleşme:**
- İstemcinin gönderdiği bir `Idempotency-Key` header'ı (UUID) kabul edilsin.
- Aynı anahtarla gelen ikinci istek yeni sipariş oluşturmasın; **ilk siparişin yanıtını aynen** döndürsün (aynı `orderId`, aynı `clientSecret`).
- Anahtar en az ödeme penceresi kadar (öneri: 24 saat) saklansın.
- Farklı gövdeyle aynı anahtar gelirse `409` dönsün.

**Hazır olduğunda frontend tarafı:** checkout başlarken bir UUID üretilip sipariş denemesi boyunca sabit tutulacak, başarılı/başarısız sonuçta sıfırlanacak. Frontend değişikliği küçük — sözleşme netleşince yapılır.

---

## 2. İletişim / ticket / newsletter / yasal destek formları hiçbir yere veri göndermiyor (K6 — 🔴 kritik)

**Bugünkü durum:** `useContactForm.ts`, `useTicketForm.ts`, `useNewsletterSignup.ts`, `useContactSupportForm.ts` — dördünde de tek bir `fetch`/`axios`/`apiRequest` çağrısı **yok**. Yalnız validasyon + başarı toast'ı var:
- *"Message sent — Our support team will reach out within 2 hours during business hours."*
- *"Ticket submitted — Your request has been received and will be reviewed shortly."*
- *"Subscription confirmed — You are now subscribed to the newsletter."*

Testlerle uçtan uca doğrulandı: `fetch` spy'ı **hiç** çağrılmıyor.

**Etki:** Müşteri destek talebi açıyor, "alındı" mesajı görüyor, talep hiç kimseye ulaşmıyor. Ek olarak dosya eki (`FormAttachmentDropzone` — arkasında `<input type="file">` yok) ve rich-text biçimlendirmesi de kayboluyor.

**Backend'den beklenen:** dört akış için endpoint (öneri):
| Akış | Endpoint | Gövde |
|---|---|---|
| İletişim formu | `POST /api/support/contact` | ad, e-posta, konu, mesaj |
| Destek ticket'ı | `POST /api/support/tickets` | kategori, öncelik, başlık, açıklama, ek(ler) |
| Newsletter | `POST /api/newsletter/subscribe` | e-posta |
| Yasal destek | `POST /api/support/legal` | ad, e-posta, konu, mesaj |

Ticket eki için multipart veya önceden imzalı yükleme URL'i gerekir — hangisi olduğu netleşmeli.
Endpoint'ler hazır olmadan frontend'de yapılabilecek tek dürüst şey başarı mesajını kaldırmaktır; **bu bir ürün kararıdır**, henüz alınmadı.

---

## 3. Upstream hata gövdesi sözleşmesi (Y12 düzeltmesinden doğan istek)

Frontend BFF katmanı artık backend'in hata gövdesini istemciye **olduğu gibi iletmiyor** (Java stack trace'i tarayıcıya kadar geliyordu).
Yeni davranış: gövde `{ "message": "..." }` şeklinde temiz bir JSON ise mesaj kullanıcıya gösterilir; düz metin veya stack trace içeriyorsa jenerik `Request failed with status <status>` gösterilir.

**Backend'den istek:** hata yanıtları her zaman `{ "message": "kullanıcıya gösterilebilir metin" }` JSON formatında dönsün. Aksi halde kullanıcı validasyon hatalarının ayrıntısını göremez.

---

## 4. `shipping-label/download` sipariş sahipliği kontrolü (K9 düzeltmesinin kalan yarısı)

Frontend tarafında route artık **kimlik doğrulaması istiyor** (önce oturumsuz herkes indirebiliyordu) ve host allowlist'i zaten vardı.
Ancak frontend, bir etiketin **çağıranın kendi siparişine ait olup olmadığını** doğrulayamıyor — o veri BFF'te yok.

**Etki:** oturum açmış bir kullanıcı, başka bir siparişin Shippo etiket URL'ini ele geçirirse (ad + adres içeriyor) hâlâ indirebilir.

**Backend'den beklenen:** etiket indirmenin backend üzerinden yapılabilmesi — ör. `GET /api/orders/{orderId}/shipping-label` gibi, sipariş sahipliğini doğrulayan bir uç. Frontend o zaman Shippo URL'ini hiç görmez.

---

## 5. Doküman uçlarında hata sınıfları: her şey 400 dönüyor (27 Ağu 2026)

`product/service/VendorDocumentServiceImpl.java` düz `RuntimeException` fırlatıyor. `auth/exception/GlobalExceptionHandler.java`'daki catch-all
`@ExceptionHandler(RuntimeException.class)` bunu **400 Bad Request**'e çeviriyor. Sonuç: anlamca farklı üç durum istemciye aynı kodla geliyor.

| Durum | Servis satırı | Bugün | Olması gereken |
|---|---|---|---|
| `Document not found` | `:207`, `:237`, `:266` | 400 | **404** (`ResourceNotFoundException` zaten var, 404'e maplenmiş) |
| `You are not authorized to access/delete this document` | `:210`, `:241` | 400 | **403** (`ForbiddenException` zaten var, 403'e maplenmiş) |
| `Document is approved and cannot be deleted` | `:213` | 400 | 400 doğru (`BadRequestException`) |
| `Revised file does not exist` / `Invalid records file does not exist` | `:246`, `:253` | 400 | **404** |
| `Invalid file type` | `:257` | 400 | 400 doğru |

**Neden önemli:** istemci 404 (kayıt yok) ile 403 (başkasının kaydı) ayrımını yapamıyor, ikisine de aynı mesajı gösteriyor.
Ayrıca `GlobalExceptionHandler`'ın `RuntimeException` → 400 catch-all'ı **gerçek 500'leri de 400 gibi gösteriyor** — bir NPE veya
DB hatası istemciye "senin isteğin bozuk" diye dönüyor, izlenebilirlik kayboluyor. Bu catch-all'ın kendisi gözden geçirilmeli.

**İstek:** ilgili yerlerde hazır exception tipleri kullanılsın (`ResourceNotFoundException`, `ForbiddenException`, `BadRequestException`).
Frontend tarafı şu an bu uçlarda 400 bekleyecek şekilde testle kilitlendi; backend düzeltilirse o testler bilinçli olarak güncellenecek.

## 6. İçe aktarılan doküman ASLA silinemiyor (27 Ağu 2026 — kullanıcıya görünür bug)

`VendorDocumentServiceImpl:304-305`, kendi yorumuyla birlikte:
```java
// This endpoint imports existing products only, so the document is always marked as approved
document.setApproved(true);
```
`deleteDocument` ise `:212`'de:
```java
if (document.isApproved() || document.getRevisionApproved() == Boolean.TRUE)
    throw new RuntimeException("Document is approved and cannot be deleted");
```

Yani `POST /api/products/documents/upload-and-import` ile yüklenen **her doküman anında `approved` oluyor ve bir daha silinemiyor**.
`ImportDocumentsModal`'daki Delete butonu her seferinde 400 alıyor — buton var, hiçbir zaman çalışamıyor.

**Karar gerekiyor:** (a) `upload-and-import` dokümanı `approved` işaretlemesin, (b) silme kuralı `approved` yerine başka bir koşula bağlansın,
ya da (c) davranış doğruysa **frontend Delete butonunu bu dokümanlar için hiç göstermesin**. (c) frontend'de çözülebilir; (a)/(b) backend kararı.

## 7. `/documents/{id}/revision` ucu frontend'den hiç çağrılmıyor (27 Ağu 2026)

Backend'de `POST /api/products/documents/{id}/revision` var ama `src/lib/api/vendor-documents.ts`'te karşılığı yok.
Sonuç: `revised` dosyası bu uygulamadan asla üretilemiyor, dolayısıyla `GET /documents/{id}/file?fileType=revised`
her zaman *"Revised file does not exist for this document"* → 400 dönüyor. Vendor'ın revizyon yükleme yolu UI'da mevcut değil.

**Soru:** revizyon akışı ürün kapsamında mı? Kapsamdaysa frontend'e eklenmeli; değilse `revised` indirme yolu UI'dan kaldırılmalı.

## 8. `dentalLicenseRequired` serbest metin — lisans kapısı casing'e bağlı (27 Ağu 2026)

`product/entity/Product.java:76` — `dentalLicenseRequired` bir **`String`**, enum değil.
`product/service/ProductServiceImpl.java:481` yalnız `isBlank` kontrolü yapıyor; izin verilen değerler ("Yes"/"No")
backend'de **hiç doğrulanmıyor**. Alanı iki ayrı kod tabanı yazıyor (`ecommerce-frontend` create-product formu ve
`dent-admin` ProductDetailModal), ikisi de "Yes"/"No" sabitini hardcode ediyor.

**Risk fail-OPEN:** değer `"yes"` / `"YES"` / boşluklu gelirse frontend'in `cartRequiresDentalLicense`'ı `false` döner
→ ürün "lisans gerektirmiyor" sayılır → lisans kapısı hiç devreye girmez → **lisanssız alıcı kısıtlı ürünü satın alabilir.**
Frontend tarafı 27 Ağu 2026'da case-insensitive hale getirildi (F51), ama bu yalnız semptomu kapatıyor:
tek koruma frontend'de duruyor ve alan hâlâ herhangi bir string kabul ediyor.

**İstek:** alan bir enum'a (ya da `boolean`'a) çevrilsin, veya en azından backend `@Pattern`/servis doğrulamasıyla
kabul edilen değerleri kısıtlasın. Bir import script'i veya panel değişikliği farklı casing yazarsa bugün bunu
durduran hiçbir şey yok.

## 9. Sipariş uçlarında hata gövdesi şekli TUTARSIZ (27 Ağu 2026)

`POST /orders/refundOrder` boş `items` ile çağrılınca `@NotEmpty` devreye giriyor ve gövde
`{ items: "items list cannot be empty" }` — yani `Map<alan, mesaj>` şeklinde.
Diğer order uçları ise `{ message: "..." }` döndürüyor. İstemci tek bir ayrıştırma yolu kullanamıyor;
bugün kullanıcıya ya boş ya ham bir mesaj gösterilme riski var.

**İstek:** doğrulama hatalarının gövdesi de diğer hatalarla aynı şekle sahip olsun (ya da en azından
`message` alanı her zaman dolu gelsin). İlgili: §3 (upstream hata gövdesi sözleşmesi).

## 10. `InvoiceAlreadyExistsException` (409) hiçbir yerde fırlatılmıyor (27 Ağu 2026)

`POST /invoices` için tanımlı 409 exception'ı kodda hiç tetiklenmiyor — ölü kod.
İki ihtimal: (a) fazladan tanımlanmış, kaldırılmalı; (b) **eksik bir kontrol** var ve aynı fatura
iki kez oluşturulabiliyor. İkincisi para tarafını ilgilendirir.

**Soru:** mükerrer fatura oluşturma engelleniyor mu? Engellenmiyorsa bu bir boşluk.

## 11. `CartTaxEstimateRequest.shippingAmount` tip uyuşmazlığı + vergi sessizce 0 (27 Ağu 2026)

Backend DTO'da alan `Double`; frontend açıkça **string** gönderiyor
(`useOrderSummary.ts:70` ve `useCartPage.ts:171` → `shippingAmount: String(shipping)`).
Jackson'ın varsayılan coercion'ı bunu genelde çeviriyor, ama `shipping` sayıya çevrilemez bir değer olursa
(`String(NaN)` → `"NaN"`) istek 400 alır.

**Asıl endişe frontend tarafında ve ayrı ele alınmalı:** her iki çağıran da hatayı yutup `setTax(0)` /
`setTaxAmount(0)` yapıyor. Yani vergi tahmin ucu ÇÖKERSE kullanıcı **$0 vergi** görüyor.

**✅ CEVAPLANDI (28 Ağu 2026, lead backend kaynağını okudu):** backend vergiyi **kendisi yeniden hesaplıyor** —
`OrderCreationService.computeTaxes(...)` (`:206,365`) Stripe Tax ile hesaplayıp `totalPriceWithTax` üzerinden
PaymentIntent açıyor (`:249,413`); `CreateOrderRequest` DTO'sunda **hiçbir tutar alanı yok**. Yani **eksik tahsilat YOK**,
sorun yalnız görüntü uyuşmazlığıydı. Frontend tarafı kapatıldı: `$0` yerine "Calculated at checkout" (**F74**) ve
`shippingAmount` artık `Double` alanına sayı olarak gidiyor (**F75**). Backend'den istenen tek şey kalmadı — bu madde
**bilgi amaçlı** duruyor.

**Tarihsel soru:** sipariş oluşturulurken backend vergiyi **yeniden hesaplıyor mu**, yoksa
frontend'in gönderdiği toplam mı esas alınıyor? Yeniden hesaplıyorsa sorun görüntü uyuşmazlığı
(kullanıcı bir tutar görüp başka tutar ödüyor); esas alınıyorsa **eksik tahsilat**. Cevaba göre
frontend'de vergi hesaplanamadığında ne gösterileceğine karar verilecek.

## 12. `UserProductResponse` `exportPackaging` alanını hiç döndürmüyor (27 Ağu 2026)

`exportPackaging` `UserProduct` entity'sinde SAKLANIYOR ve ürün gönderilirken ZORUNLU tutuluyor,
ama `UserProductResponse.java` DTO'su bu alanı **hiç döndürmüyor**.

**Kullanıcıya görünür sonucu:** reddedilmiş bir ürünü düzeltip yeniden gönderen vendor için
`loadProductForReviewEdit` bu seçimi asla geri yükleyemiyor — kutu her seferinde sessizce `false`'a
dönüyor. Vendor fark etmezse ürününü ilk seçtiğinden farklı bir Export Packaging değeriyle
yeniden göndermiş oluyor.

**İstek:** `exportPackaging` `UserProductResponse`'a eklensin. Frontend tarafı hazır — alan gelir
gelmez form onu dolduracak. Bugün frontend'de yapılabilecek bir çözüm yok, veri hiç gelmiyor.

## 13. `successCount` / `failureCount` DEKORATİF — kısmi başarı diye bir şey yok (27 Ağu 2026)

`RefundOrderResponse` ve `CancelDuringDeliveryByCustomerResponse` DTO'ları `successCount` ve
`failureCount` taşıyor, ama **hiçbiri gerçek bir sayı üretmiyor**:

| Yer | Kod | Sonuç |
|---|---|---|
| `service/OrderRefundService.java:367-374` | `.successCount(orderItemIds.size())` · `.failureCount(0)` | tek `return`; her doğrulama hatası `throw` |
| `service/OrderCancellationService.java:223-224` | aynı | aynı |
| `service/OrderCancellationService.java:348-349` | aynı | aynı |

`successCount` = **istekteki** kalem sayısı (başarılı olan değil), `failureCount` = **sabit 0**.
Bir kalem işlenemiyorsa metot onu atlamıyor, `OrderCancellationException` fırlatıyor → **400**,
ve gövde hiç dönmüyor. Yani uçlar **ya hep ya hiç**.

**Neden önemli:** bu alanlar istemciyi yanıltıyor. Frontend'de "3 kalemden 1'i başarısız" ekranı
yazmaya kalkan biri, asla tetiklenmeyecek bir dal yazar — bu tur içinde tam olarak bu oldu:
alanların adına bakılıp iki kurgusal test yazıldı, backend okunarak düzeltildi.

**Karar gerekiyor:** (a) kısmi iade/iptal gerçekten desteklenecekse servisler kalem kalem hata
toplasın ve gerçek sayıları döndürsün; (b) desteklenmeyecekse bu iki alan DTO'lardan **kaldırılsın**.
Bugünkü hali en kötü seçenek: var gibi duruyor, yok.

## 14. Dosya yükleme sınırı yalnız 1 MB — muhtemelen çok düşük (27 Ağu 2026)

`ecommerce-api/src/main/resources/application.properties`'te (ve hiçbir yerde) multipart ayarı YOK,
`pom.xml` Spring Boot **3.5.7**. Dolayısıyla framework varsayılanları geçerli:

| Ayar | Etkin değer |
|---|---|
| `spring.servlet.multipart.max-file-size` | **1 MB** (dosya başına) |
| `spring.servlet.multipart.max-request-size` | **10 MB** (istek toplamı) |

**Kullanıcıya görünür sonucu:** ürün fotoğrafı yükleyen vendor için 1 MB pratikte çok düşük —
telefon/kamera fotoğrafları rutin olarak 2-5 MB. Arayüz de *"PNG, JPG, GIF up to 10MB"* diyordu,
yani **10 kat yanlış bir söz** veriyordu; vendor fotoğrafı seçiyor, form kabul ediyor, sunucu
`MaxUploadSizeExceededException` ile reddediyor ve bu `GlobalExceptionHandler`'ın `RuntimeException`
catch-all'ından **400 + ham mesaj** olarak geri geliyordu.

Aynı sınır `POST /api/products/documents/upload-and-import` (xlsx ürün listesi) için de geçerli —
orta boy bir ürün listesi 1 MB'ı rahatlıkla aşar.

**Frontend tarafı bugün hizalandı** (F64): dosya başına 1 MB ve istek toplamı 10 MB frontend'de
kontrol ediliyor, hata dosya adını ve sınırı söylüyor, metin *"up to 1MB each, 10MB in total"*
olarak düzeltildi. Yani kullanıcı artık anlaşılır bir uyarı alıyor — ama **hâlâ yükleyemiyor.**

**İstek:** `max-file-size` gerçekçi bir değere çıkarılsın (ör. 10 MB, `max-request-size` da ona göre).
Değer değişirse `products/create/page.tsx`'teki `MAX_FILE_BYTES` / `MAX_REQUEST_BYTES` sabitleri ve
arayüz metni güncellenmeli — kod yorumunda bu not düşüldü.

## 15. `product` paketinin exception'ları maplenmiş tiplerden TÜREMİYOR — her şey 400 (27 Ağu 2026)

`product/exception/` altındaki üç sınıf da doğrudan `RuntimeException`'ı extend ediyor:

| Sınıf | Bugün | Olması gereken |
|---|---|---|
| `ProductNotFoundException extends RuntimeException` | **400** | `ResourceNotFoundException` → 404 |
| `NotFoundException extends RuntimeException` | **400** | `ResourceNotFoundException` → 404 |
| `AccessDeniedException extends RuntimeException` | **400** | `ForbiddenException` → 403 |

`GlobalExceptionHandler`'da bu tipler için mapping yok, sondaki `@ExceptionHandler(RuntimeException.class)`
catch-all'ına düşüyorlar → hepsi **400**. Yani ürün/yorum/soru-cevap alanının TAMAMINDA
"bulunamadı" ile "yetkin yok" ile "isteğin bozuk" istemci için ayırt edilemez durumda.

**Muhtemelen kasıtsız** — `ResourceNotFoundException` ve `ForbiddenException` zaten var ve doğru
maplenmiş; bu üç sınıf sadece onlardan türetilmemiş. Tek satırlık bir düzeltme.

**Frontend bugün gerçek davranışa göre kilitlendi** (F65): ilgili testler 400 bekliyor. Backend
düzeltilirse o testler bilinçli olarak güncellenecek.

## 16. Frontend'de var olan ama backend'de OLMAYAN uçlar (27 Ağu 2026)

| Uç | Backend durumu |
|---|---|
| `POST /api/products` | `ProductController.java:57` — **yorum satırında** |
| `PUT /api/products/{id}` | `ProductController.java:74` — **yorum satırında** |
| `/api/products/details/**` (7 metot) | mapping hiç yok |
| `GET /api/user-products` (parametresiz) | yorum satırında |
| `GET /api/products/companies` | hiç yok |

Frontend'de bu uçlar için client fonksiyonları ve BFF route'ları hâlâ duruyor. Ürün oluşturma
gerçekte `/api/products/review` üzerinden gidiyor.

**✅ KARAR VERİLDİ (28 Ağu 2026, kullanıcı):** frontend'deki karşılıklar **silindi** (**F73**) — 9 client fonksiyonu,
`getProductCompanyOptions`, `src/app/api/products/details/**` BFF route'ları ve testleri. `GET /api/user-products`
satırı **istisna**: backend'de parametresiz uç yorumda olsa da BFF `403||404` ile `/filter`'a düşüyor ve çalışıyor (F66),
bu yüzden korundu.

**Backend'e not:** bu uçlar geri gelecekse frontend tarafı **yeniden yazılmalı** — bugün karşılığı yok.

## 17. Aynı soruya birden fazla cevap engellenmiyor (27 Ağu 2026)

`ProductAnswerServiceImpl.create` içinde "bu satıcı bu soruyu zaten cevapladı" kontrolü yok.
Bir satıcı aynı soruya defalarca cevap yazabiliyor. Frontend'in vendor soru sayfası uzun süre
yalnız `answers[0]`'ı gösteriyordu (F46'da düzeltildi) — yani bu durum kullanıcıya görünmüyordu bile.

**Soru:** tek cevap kuralı olmalı mı? Olmalıysa backend'de kısıtlanmalı.

## 18. `auth` modülünde `@PreAuthorize` fiilen 403 üretmiyor (27 Ağu 2026)

`POST /api/mail/invite-company-user` üzerindeki `@PreAuthorize("hasRole('Vendor')")` hiçbir zaman 403
döndüremiyor: Spring Security'nin `AccessDeniedException`'ı da bir `RuntimeException` ve
`GlobalExceptionHandler`'ın sondaki catch-all'ına takılıp **400**'e dönüşüyor.

`order`/`cart`/`invoice` modüllerinde bu yüzden özel `*AccessDeniedException` sınıfları ve kendi
`@RestControllerAdvice`'ları var; `auth` modülünde yok. Yetkisiz çağrı ile bozuk istek istemci
tarafında ayırt edilemiyor.

**İstek:** `GlobalExceptionHandler`'a Spring Security'nin `AccessDeniedException`'ı için 403 mapping'i
eklensin (catch-all'dan ÖNCE). Bu §15 ile aynı kökten: catch-all her şeyi yutuyor.

## 19. `AddressService` "bulunamadı" için çıplak `RuntimeException` fırlatıyor (27 Ağu 2026)

`getOne`/`update`/`delete` metotları `ResourceNotFoundException` yerine düz `RuntimeException`
kullanıyor → istemciye hep **400**, asla 404. §15'in adres modülündeki karşılığı.

## 20. Form DTO'larında `@JsonIgnoreProperties(ignoreUnknown = true)` yok — sessiz alan yutma (27 Ağu 2026)

`UserUpdateRequest`, `CompanyUpdateRequest`, `AddressCreateRequest`, `AddressUpdateRequest`,
`CreateLicenseRequest` gibi form DTO'larında bu anotasyon yok. Webhook DTO'larında var.

**Ama etkisi sanıldığı gibi 400 DEĞİL:** `application.properties`'te `spring.jackson` ayarı,
global `ObjectMapper` bean'i ve `FAIL_ON_UNKNOWN_PROPERTIES` override'ı **yok** → Spring Boot
varsayılanı geçerli ve bilinmeyen alanlar **sessizce yok sayılıyor**.

**Asıl risk bu sessizlik:** frontend `email` (users/me) ve `state` (address) alanlarını yıllardır
gönderiyordu; backend bunları sessizce atıyordu, kullanıcı "kaydedildi" görüp hiçbir şey
kaydetmiyordu. Frontend tarafı 27 Ağu 2026'da temizlendi (F68).

**Soru:** bu alanlar (özellikle `email` değişikliği ve adres `state`'i) desteklenmeli mi?
Desteklenmeyecekse mevcut durum kabul edilebilir; desteklenecekse DTO'lara eklenmeli.

## Backend'e ait OLMAYAN, ürün kararı bekleyen madde

### K12 — Vendor "Reject Return" akışı yorum satırında

**Not: bu madde backend'e bağlı değil.** İnceleme sonucu:
- `vendorOrdersAPI.sellerRejectReturn()` **var** ve contract testi geçiyor (`POST /orders/sellerRejectReturn`).
- Reddetme modalı, sebep validasyonu ve sayfa state'i (`pendingRejectReturnAction`, `rejectReturnReason`, `rejectReturnError`) **canlı**.
- `orders-mobile-list.tsx` `onRejectReturn`'ü aşağı geçiriyor.
- Eksik olan **tek şey**: `order-expanded-content.tsx:238-249`'daki butonun JSX'i `{/* ... */}` içinde yorumlanmış.

Yani satıcı iadeyi yalnızca onaylayabiliyor, reddedemiyor — ama bunu açmak tek satırlık bir frontend değişikliği.
**Karar gerekli:** buton bilinçli mi kapatıldı (backend akışı hazır değil / ürün istemiyor), yoksa unutuldu mu? Onay verilirse yorumdan çıkarılır ve testi yazılır.
