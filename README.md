# 🇹🇷 Steam TL Converter

![Version](https://img.shields.io/badge/version-v1.8.0-blue) ![Chrome](https://img.shields.io/badge/Chrome-Supported-4285F4?logo=google-chrome&logoColor=white) ![Firefox](https://img.shields.io/badge/Firefox-Supported-FF7139?logo=firefox-browser&logoColor=white) ![License](https://img.shields.io/badge/license-MIT-green) ![Privacy](https://img.shields.io/badge/privacy-client--side-success)

**Steam TL Converter**, Steam mağazasındaki USD fiyatlarını anlık kur bilgisiyle otomatik olarak **Türk Lirası (₺)** cinsine çeviren, açık kaynaklı ve güvenli bir tarayıcı eklentisidir.

Sadece çeviri yapmakla kalmaz; **Xbox Game Pass kontrolü**, **fiyat karşılaştırma** ve **banka komisyonu hesaplama** özellikleriyle en doğru satın alma kararını vermenizi sağlayan bir alışveriş asistanıdır.

---

## 🔥 v1.8.0 ile Gelen Yenilikler
* **🎮 Game Pass Kontrolü:** Baktığınız oyun Xbox Game Pass kütüphanesinde varsa, satın almadan önce özel bir rozet ile uyarır.
* **⚖️ Fiyat Karşılaştırma:** Epic Games, Microsoft Store, GOG ve Humble Store fiyatlarını Steam sayfasında anlık olarak gösterir.

## ⭐ Temel Özellikler
* **Otomatik Kur Çevirisi:** Mağaza, Pazar, Envanter, Sepet ve İstek Listesi dahil her yerde çalışır.
* **Kur Kaynağı Seçimi:** Verileri **TCMB** veya **FloatRates** üzerinden çekme seçeneği.
* **Banka Komisyonu Hesaplayıcı:** Bankanızın uyguladığı makas farkını fiyata dahil ederek kartınızdan çekilecek **net tutarı** gösterir.
* **Gelişmiş Uyumluluk:** SteamDB (Quick Sell) ve Steam Inventory Helper (SIH) ile sorunsuz çalışır.
* **Gizlilik Odaklı:** Kişisel veri toplamaz, takip etmez. Tamamen tarayıcınızda (Client-Side) çalışır.

## 📥 Kurulum

### 1. Mağazalardan Yükleme (Önerilen)
Eklentiyi kullandığınız tarayıcının mağazasından güvenle indirebilirsiniz:

| Tarayıcı | Mağaza Bağlantısı | Durum |
| :--- | :--- | :--- |
| **Chrome** | 👉 **[Chrome Web Mağazası](https://chromewebstore.google.com/detail/bpmocjncifcldofcpacaecgecjagilka)** | ✅ Yayında |
| **Firefox** | 👉 **[Firefox Add-ons (AMO)](https://addons.mozilla.org/firefox/addon/steam-tl-converter/)** | ⏳ İncelemede |

### 2. Geliştirici Modu (Manuel Yükleme)
Kaynak kodları incelemek veya geliştirmek istiyorsanız:

#### Chrome İçin:
1.  Bu repoyu indirin (Clone veya Download ZIP).
2.  `chrome://extensions/` adresine gidin ve **Geliştirici Modu**'nu açın.
3.  **"Paketlenmemiş öğe yükle"** diyerek klasörü seçin.

#### Firefox İçin:
1.  `about:debugging` adresine gidin.
2.  **"Bu Firefox"** > **"Geçici Eklenti Yükle"** butonuna basın.
3.  Klasör içindeki **`manifest-firefox.json`** dosyasını seçin.

---

## 🔒 Gizlilik ve Güvenlik
Bu proje **%100 Açık Kaynak**'tır. Şeffaflık ilkemiz gereği:
* Hiçbir kişisel veriniz sunucularımızda toplanmaz veya saklanmaz.
* Tüm işlemler yerel cihazınızda gerçekleşir.
* Daha fazla bilgi için [Gizlilik Politikası (Privacy Policy)](PRIVACY.md) dosyasını inceleyebilirsiniz.

---

## ⚠️ Yasal Uyarı (Disclaimer)
* Bu eklenti **Valve Corporation** veya **Steam** ile ilişkili değildir.
* Gösterilen "Banka Komisyonlu" fiyatlar tahminidir; bankanızın anlık politikalarına göre değişiklik gösterebilir.

## ❤️ Teşekkürler ve Kaynaklar (Credits)
Bu proje aşağıdaki harika kaynaklar olmadan mümkün olmazdı:
* **[IsThereAnyDeal API](https://isthereanydeal.com/):** Oyun fiyatlarını ve Game Pass durumunu sorgulamak için kullanılmaktadır. Bu kapsamlı veritabanını sağladıkları için ekiplerine teşekkürler.
* **[FloatRates](http://www.floatrates.com/) & [TCMB](https://www.tcmb.gov.tr/):** Günlük döviz kuru verileri için kullanılmaktadır.
* **[Shields.io](https://shields.io/):** README dosyasındaki rozetler için kullanılmıştır.

---
---

# 🇺🇸 Steam TL Converter (English)

**Steam TL Converter** is an open-source browser extension that automatically converts USD prices on the Steam store to **Turkish Lira (₺)** using real-time exchange rates.

It acts as a shopping assistant with features like **Xbox Game Pass check**, **price comparison**, and **bank commission calculation**.

## 🔥 What's New in v1.8.0
* **🎮 Game Pass Check:** Alerts you via a badge if the game is available on Xbox Game Pass.
* **⚖️ Price Comparison:** Displays current prices from Epic Games, Microsoft Store, GOG, and Humble Store directly on the Steam page.

## ⭐ Key Features
* **Auto Currency Conversion:** Works on Store, Market, Inventory, Cart, and Wishlist.
* **Exchange Rate Sources:** Options to fetch rates from **TCMB** (Central Bank of Türkiye) or **FloatRates**.
* **Bank Commission Calculator:** Adds your bank's estimated commission fee to display the **net amount** charged to your card.
* **Privacy First:** Runs entirely client-side. No user data collection.

## 📥 Installation

### 1. Web Stores (Recommended)

| Browser | Store Link | Status |
| :--- | :--- | :--- |
| **Chrome** | 👉 **[Chrome Web Store](https://chromewebstore.google.com/detail/bpmocjncifcldofcpacaecgecjagilka)** | ✅ Live |
| **Firefox** | 👉 **[Firefox Add-ons (AMO)](https://addons.mozilla.org/firefox/addon/steam-tl-converter/)** | ⏳ In Review |

### 2. Manual Installation (Developer Mode)

#### For Chrome:
1.  Clone/Download this repo.
2.  Go to `chrome://extensions/` and enable **Developer mode**.
3.  Click **"Load unpacked"** and select the folder.

#### For Firefox:
1.  Go to `about:debugging`.
2.  Click **"This Firefox"** > **"Load Temporary Add-on"**.
3.  Select the **`manifest-firefox.json`** file inside the folder.

## 🔒 Privacy
This project is **Open Source**.
* We do not collect, store, or share any personal data.
* All operations are performed locally on your device.
* See [Privacy Policy](PRIVACY.md) for details.

## ⚠️ Disclaimer
* This extension is not affiliated with **Valve Corporation** or **Steam**.

## ❤️ Credits & Resources
This project wouldn't be possible without these amazing resources:
* **[IsThereAnyDeal API](https://isthereanydeal.com/):** Used for fetching game prices across different stores and checking Xbox Game Pass availability. Special thanks to their team for maintaining such a comprehensive database.
* **[FloatRates](http://www.floatrates.com/) & [TCMB](https://www.tcmb.gov.tr/):** Used for daily exchange rate data.
* **[Shields.io](https://shields.io/):** Used for the badges in this README.

