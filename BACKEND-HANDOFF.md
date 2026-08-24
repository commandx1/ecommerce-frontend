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

## Backend'e ait OLMAYAN, ürün kararı bekleyen madde

### K12 — Vendor "Reject Return" akışı yorum satırında

**Not: bu madde backend'e bağlı değil.** İnceleme sonucu:
- `vendorOrdersAPI.sellerRejectReturn()` **var** ve contract testi geçiyor (`POST /orders/sellerRejectReturn`).
- Reddetme modalı, sebep validasyonu ve sayfa state'i (`pendingRejectReturnAction`, `rejectReturnReason`, `rejectReturnError`) **canlı**.
- `orders-mobile-list.tsx` `onRejectReturn`'ü aşağı geçiriyor.
- Eksik olan **tek şey**: `order-expanded-content.tsx:238-249`'daki butonun JSX'i `{/* ... */}` içinde yorumlanmış.

Yani satıcı iadeyi yalnızca onaylayabiliyor, reddedemiyor — ama bunu açmak tek satırlık bir frontend değişikliği.
**Karar gerekli:** buton bilinçli mi kapatıldı (backend akışı hazır değil / ürün istemiyor), yoksa unutuldu mu? Onay verilirse yorumdan çıkarılır ve testi yazılır.
