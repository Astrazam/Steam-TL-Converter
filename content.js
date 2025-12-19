let FX = null;
let BaseFX = null;
let showOnlyTL = false;
let extensionEnabled = true;

let bankCommissionEnabled = false;
let bankCommissionAmount = 4;

let convertedElements = new WeakMap();

const ITAD_API_KEY = "***********";
let itadPricesEnabled = false;
let gamePassEnabled = false;

chrome.storage.sync.get([
  "showOnlyTL",
  "extensionEnabled",
  "bankCommissionEnabled",
  "bankCommissionAmount",
  "itadPricesEnabled",
  "gamePassEnabled"
], (result) => {
  showOnlyTL = result.showOnlyTL || false;
  extensionEnabled = result.extensionEnabled !== false;

  bankCommissionEnabled = result.bankCommissionEnabled || false;
  bankCommissionAmount = result.bankCommissionAmount || 4;

  itadPricesEnabled = result.itadPricesEnabled !== false;
  gamePassEnabled = result.gamePassEnabled !== false;

  if (itadPricesEnabled || gamePassEnabled) {
    initITAD();
  }
});

async function initITAD() {
  const appIdMatch = location.pathname.match(/\/app\/(\d+)/);
  if (!appIdMatch) return;

  const steamAppId = appIdMatch[1];
  console.log("ITAD: Veriler çekiliyor...", steamAppId);

  try {
    const lookupUrl = `https://api.isthereanydeal.com/games/lookup/v1?key=${ITAD_API_KEY}&appid=${steamAppId}`;

    const lookupRes = await sendMessageToBackground({
      type: "fetchITAD",
      url: lookupUrl,
      method: 'GET'
    });

    if (!lookupRes.success) {
      if (lookupRes.error.includes("404")) {
        console.log("ITAD: Game not found (404)");
        return;
      }
      showITADError(`Bağlantı Hatası: ${lookupRes.error}`);
      return;
    }

    const lookupData = lookupRes.data;
    if (!lookupData.found || !lookupData.game || !lookupData.game.id) {
      return;
    }

    const itadId = lookupData.game.id;

    const pricesUrl = `https://api.isthereanydeal.com/games/prices/v3?key=${ITAD_API_KEY}&country=TR`;
    const subsUrl = `https://api.isthereanydeal.com/games/subs/v1?key=${ITAD_API_KEY}&country=TR`;

    const idsBody = JSON.stringify([itadId]);

    const [pricesRes, subsRes] = await Promise.all([
      sendMessageToBackground({ type: "fetchITAD", url: pricesUrl, method: 'POST', body: idsBody }),
      sendMessageToBackground({ type: "fetchITAD", url: subsUrl, method: 'POST', body: idsBody })
    ]);

    const pricesData = pricesRes.success ? pricesRes.data : [];
    const subsData = subsRes.success ? subsRes.data : [];

    const priceObj = Array.isArray(pricesData) ? pricesData.find(x => x.id === itadId) : null;
    const subObj = Array.isArray(subsData) ? subsData.find(x => x.id === itadId) : null;

    let deals = priceObj ? priceObj.deals : [];
    const subs = subObj ? subObj.subs : [];

    const allowedIds = [16, 35, 37, 48];
    const allowedNames = ["epic", "microsoft", "humble", "gog"];

    if (deals.length > 0) {
      deals = deals.filter(d => {
        const sid = Number(d.shop.id);
        const sname = d.shop.name.toLowerCase();
        const idMatch = allowedIds.includes(sid);
        const nameMatch = allowedNames.some(n => sname.includes(n));
        return idMatch || nameMatch;
      });

      deals.sort((a, b) => a.price.amount - b.price.amount);
    }

    injectITADUI(deals, subs);

  } catch (e) {
    console.error("ITAD Error:", e);
    showITADError("Bilinmeyen Hata: " + e.message);
  }
}

function sendMessageToBackground(payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(payload, (response) => {
      resolve(response || { success: false, error: "No response from background" });
    });
  });
}

function showITADError(msg) {
  const purchaseArea = document.querySelector('.game_area_purchase_game_wrapper') ||
    document.querySelector('.game_area_purchase_game') ||
    document.querySelector('#game_area_purchase') ||
    document.querySelector('.game_area_purchase') ||
    document.querySelector('#game_area_purchase_section_add_to_cart');
  if (!purchaseArea) return;

  const errDiv = document.createElement('div');
  errDiv.className = 'itad-container itad-error';
  errDiv.style.cssText = "background: rgba(255,0,0,0.1); border: 1px solid rgba(255,0,0,0.3); color: white; padding: 10px; margin: 15px 0; border-radius: 8px; font-size: 12px;";
  errDiv.textContent = `Fiyat bilgisi alınamadı: ${msg}`;
  purchaseArea.parentNode.insertBefore(errDiv, purchaseArea.nextSibling);
}

function injectITADUI(deals, subs) {
  const purchaseArea = document.querySelector('.game_area_purchase_game_wrapper') ||
    document.querySelector('.game_area_purchase_game') ||
    document.querySelector('#game_area_purchase') ||
    document.querySelector('.game_area_purchase') ||
    document.querySelector('#game_area_purchase_section_add_to_cart');
  if (!purchaseArea) {
    console.warn("ITAD: Satın alma alanı bulunamadı.");
    return;
  }


  const existing = document.querySelectorAll('.itad-container');
  existing.forEach(e => e.remove());

  if (!itadPricesEnabled && !gamePassEnabled) return;

  if (gamePassEnabled && subs && subs.length > 0) {
    const subsContainer = document.createElement('div');
    subsContainer.className = 'itad-container itad-subs';
    subsContainer.style.cssText = `
      background: linear-gradient(135deg, rgba(27, 40, 56, 0.95) 0%, rgba(15, 20, 25, 0.98) 100%);
      border: 1px solid rgba(0, 212, 255, 0.2);
      border-radius: 12px;
      padding: 12px 16px;
      margin: 0 0 15px 0; /* Altına boşluk bırak */
      font-family: "Motiva Sans", Sans-serif;
      color: #ecf0f1;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      position: relative;
      overflow: hidden;
    `;

    const glowLine = document.createElement('div');
    glowLine.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #00d4ff, transparent); opacity: 0.5;";
    subsContainer.appendChild(glowLine);

    const subsTitle = document.createElement('div');
    subsTitle.textContent = "Abonelik";
    subsTitle.style.cssText = "font-size: 13px; font-weight: 600; background: linear-gradient(135deg, #00d4ff, #0099cc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px;";
    subsContainer.appendChild(subsTitle);

    const subsList = document.createElement('div');
    subsList.style.cssText = "display: flex; gap: 8px; flex-wrap: wrap;";

    subs.forEach(sub => {
      const isGamePass = sub.name.toLowerCase().includes("game pass");
      const badge = document.createElement('span');

      if (isGamePass) {
        badge.textContent = "Game Pass'e Dahil";
        badge.style.cssText = `
          background: #107c10;
          color: white;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(16, 124, 16, 0.3);
          display: flex;
          align-items: center;
          gap: 4px;
          border: 1px solid rgba(255,255,255,0.1);
        `;
      } else {
        badge.textContent = sub.name;
        badge.style.cssText = `
          background: rgba(62, 108, 150, 0.3);
          color: #fff;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 11px;
          border: 1px solid rgba(0, 212, 255, 0.15);
        `;
      }
      subsList.appendChild(badge);
    });

    subsContainer.appendChild(subsList);
    purchaseArea.parentNode.insertBefore(subsContainer, purchaseArea);
  }

  if (itadPricesEnabled) {
    const pricesContainer = document.createElement('div');
    pricesContainer.className = 'itad-container itad-prices';
    pricesContainer.style.cssText = `
      background: linear-gradient(135deg, rgba(27, 40, 56, 0.95) 0%, rgba(15, 20, 25, 0.98) 100%);
      border: 1px solid rgba(0, 212, 255, 0.2);
      border-radius: 12px;
      padding: 12px 16px;
      margin: 15px 0; /* Üst ve alta boşluk */
      font-family: "Motiva Sans", Sans-serif;
      color: #ecf0f1;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      position: relative;
      overflow: hidden;
    `;

    const glowLine = document.createElement('div');
    glowLine.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #00d4ff, transparent); opacity: 0.5;";
    pricesContainer.appendChild(glowLine);

    const pricesTitle = document.createElement('div');
    pricesTitle.textContent = "Diğer Mağaza Fiyatları";
    pricesTitle.style.cssText = "font-size: 13px; font-weight: 600; background: linear-gradient(135deg, #00d4ff, #0099cc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px;";
    pricesContainer.appendChild(pricesTitle);

    if (deals && deals.length > 0) {
      const pricesList = document.createElement('div');
      pricesList.style.cssText = "display: flex; gap: 8px; margin-bottom: 10px; width: 100%;";

      deals.forEach(deal => {
        const priceCard = document.createElement('a');
        priceCard.href = deal.url;
        priceCard.target = "_blank";
        priceCard.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 12px 8px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(0, 212, 255, 0.2);
        border-radius: 8px;
        text-decoration: none;
        transition: all 0.2s ease;
        flex: 1;
        min-width: 0;
        text-align: center;
      `;
        priceCard.onmouseover = () => {
          priceCard.style.background = "rgba(0, 212, 255, 0.1)";
          priceCard.style.borderColor = "#00d4ff";
          priceCard.style.transform = "translateY(-3px)";
          priceCard.style.boxShadow = "0 5px 15px rgba(0, 212, 255, 0.2)";
        };
        priceCard.onmouseout = () => {
          priceCard.style.background = "rgba(255, 255, 255, 0.04)";
          priceCard.style.borderColor = "rgba(0, 212, 255, 0.2)";
          priceCard.style.transform = "translateY(0)";
          priceCard.style.boxShadow = "none";
        };

        const shopName = document.createElement('span');
        shopName.textContent = deal.shop.name;
        shopName.style.cssText = "font-size: 11px; color: #ffffff; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;";

        const priceRow = document.createElement('div');
        priceRow.style.cssText = "display: flex; align-items: center; gap: 6px; justify-content: center;";

        const priceVal = document.createElement('span');
        const formattedPrice = deal.price.currency === 'TRY' ? `${deal.price.amount} ₺` : `${deal.price.amount} ${deal.price.currency}`;
        priceVal.textContent = formattedPrice;
        priceVal.style.cssText = "font-size: 14px; color: #66ff99; font-weight: 700; white-space: nowrap;";

        if (deal.cut > 0) {
          const cutBadge = document.createElement('span');
          cutBadge.textContent = `-%${deal.cut}`;
          cutBadge.style.cssText = "background: #a4d007; color: #000; padding: 2px 5px; border-radius: 4px; font-weight: bold; font-size: 10px;";
          priceRow.appendChild(cutBadge);
        }

        priceRow.appendChild(priceVal);
        priceCard.appendChild(shopName);
        priceCard.appendChild(priceRow);
        pricesList.appendChild(priceCard);
      });
      pricesContainer.appendChild(pricesList);
    } else {
      const noDeals = document.createElement('div');
      noDeals.textContent = "Bu oyun için aktif bir fiyat bulunamadı.";
      noDeals.style.cssText = "color: rgba(236, 240, 241, 0.4); font-size: 12px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; text-align: center; width: 100%;";
      pricesContainer.appendChild(noDeals);
    }

    const footer = document.createElement('div');
    footer.style.cssText = "margin-top: 15px; pt: 10px; border-top: 1px solid rgba(236, 240, 241, 0.05); text-align: right; font-size: 10px; color: rgba(236, 240, 241, 0.3);";
    footer.textContent = "Data by IsThereAnyDeal.com";
    pricesContainer.appendChild(footer);

    purchaseArea.parentNode.insertBefore(pricesContainer, purchaseArea.nextSibling);

  }
}

function formatTL(amount) {
  const [int, dec = "00"] = amount.toString().split(".");
  const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted},${dec.padEnd(2, "0")} ₺`;
}

function calculateEffectiveRate() {
  if (!BaseFX) return null;

  if (bankCommissionEnabled) {
    return BaseFX * (1 + (bankCommissionAmount / 100));
  }

  return BaseFX;
}

function extractUSD(text) {
  if (!text) return null;

  text = text.replace(/\u00A0/g, " ").trim();

  const patterns = [
    /\$\s*([0-9]+[.,][0-9]+)/,           // $19.99
    /\$\s*([0-9]+)/,                      // $19
    /US\s*\$?\s*([0-9]+[.,][0-9]+)/i,    // US $19.99
    /USD\s*([0-9]+[.,][0-9]+)/i,         // USD 19.99
    /([0-9]+[.,][0-9]+)\s*USD/i,         // 19.99 USD
    /Starting at:\s*\$\s*([0-9]+[.,][0-9]+)/i,  // Starting at: $0.81
    /En\s+düşük\s+fiyat:\s*\$\s*([0-9]+[.,][0-9]+)/i, // En düşük fiyat: $0.81
    /Başlangıç\s+fiyatı:\s*\$\s*([0-9]+[.,][0-9]+)/i, // Başlangıç fiyatı: $0.81
    /Lowest\s+[Pp]rice:\s*\$\s*([0-9]+[.,][0-9]+)/i,  // Lowest Price: $0.81
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) {
      const num = parseFloat(m[1].replace(/,/g, ""));
      if (!isNaN(num) && num > 0) return num;
    }
  }
  return null;
}

function processElement(el) {
  if (!el || !FX || !extensionEnabled) return;

  if (el.classList.contains('tl-processed')) {
    return;
  }

  if (el.querySelector(".tl-extension-price")) {
    el.classList.add('tl-processed');
    return;
  }

  let text = el.textContent?.trim() || "";

  if (text.includes("₺")) {
    return;
  }

  const cached = convertedElements.get(el);
  if (cached?.original === text) return;

  if (!text) {
    const attrs = ["data-price", "data-listing-price", "aria-label", "title"];
    for (const attr of attrs) {
      const val = el.getAttribute(attr);
      if (val) {
        text = val;
        break;
      }
    }
  }

  text = text.replace(/\u00A0/g, " ").trim();
  if (!text) return;

  if (cached?.original === text && !el.querySelector(".tl-extension-price")) return;

  const usd = extractUSD(text);
  if (!usd) return;

  const tl = formatTL((usd * FX).toFixed(2));

  const isWishlist = el.closest(".wishlistRow, #wishlist_ctn") || (location.href.includes("/wishlist") && !el.closest(".inventory_iteminfo, .item_market_actions"));

  const isInventory = el.closest(".inventory_iteminfo, .inventory_page_right, #inventory_item_popup, .item_market_actions");


  if (isWishlist) {
    const span = document.createElement("span");
    span.className = "tl-extension-price";
    span.style.cssText = "margin-left:6px;color:#66ff99;font-size:11px;";
    span.textContent = showOnlyTL ? tl : `(${tl})`;
    el.appendChild(span);

    el.classList.add('tl-processed');
    convertedElements.set(el, { original: text, usd, tl });
    return;
  } else if (isInventory) {
    const span = document.createElement("span");
    span.className = "tl-extension-price";
    span.style.cssText = "margin-left:6px;color:#66ff99;font-size:12px;font-weight:500;";
    span.textContent = showOnlyTL ? tl : `(${tl})`;

    try {
      el.appendChild(span);
    } catch (e) {
      el.textContent = showOnlyTL ? tl : `${text} (${tl})`;
    }

    el.classList.add('tl-processed');
    convertedElements.set(el, { original: text, usd, tl });
    return;
  } else {

    const isMarketElement = location.href.includes("/market") &&
      (el.hasAttribute('data-price') ||
        el.classList.contains('market_listing_price') ||
        el.classList.contains('market_listing_price_with_fee') ||
        el.classList.contains('market_listing_price_without_fee') ||
        el.classList.contains('market_listing_price_with_publisher_fee_only'));

    if (isMarketElement) {
      if (showOnlyTL) {
        el.textContent = tl;
      } else {
        const cleanText = text.replace(/\s*\([^)]*₺\)/, '');
        el.innerHTML = `${cleanText}<br><span style="color:#66ff99;font-size:10px;">${tl}</span>`;
      }
    } else {
      const output = showOnlyTL ? tl : `${text} (${tl})`;

      if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
        el.textContent = output;
      }
    }
  }

  el.classList.add('tl-processed');
  convertedElements.set(el, { original: text, usd, tl });
}

const SELECTORS = [
  ".discount_final_price",
  ".game_purchase_price",
  ".discount_original_price",
  ".discount_prices",

  ".gameListRowPrice",
  ".wishlistRow .price",

  "span.normal_price[data-price]",
  "span.sale_price[data-price]",

  ".cart_item_price",
  ".cart_item_discount_price",
  ".cart_total_amount",
  ".cart_estimated_total",
  ".cart_status_data .price",
  ".cart_total_rule .price",
  ".StoreSalePriceBox",
  ".StoreOriginalPrice",
  ".discount_original_price",
  ".discount_block .discount_original_price",
  ".discount_block .discount_final_price",
  ".game_purchase_action_bg .price",
  ".game_area_purchase_game_wrapper .discount_final_price",
  ".game_area_purchase_game_wrapper .discount_original_price",
  ".recommendation_carousel_item .discount_final_price",
  ".recommendation_carousel_item .game_purchase_price",

  "[class^='salepreviewwidgets_StoreSalePriceBox']",
  "[class^='salepreviewwidgets_StoreOriginalPrice']",

  "#header_wallet_balance",
  ".wallet_balance_amount",
];

function convertPrices() {
  if (!FX || !extensionEnabled) return;

  document.querySelectorAll(SELECTORS.join(",")).forEach(el => {
    if (el.classList.contains('tl-processed')) return;
    if (el.querySelector(".tl-extension-price")) return;

    try {
      processElement(el);
    } catch (e) {
    }
  });

  if (location.href.includes("/inventory")) {
    const allElements = document.querySelectorAll("div, span, a");
    allElements.forEach(el => {
      if (el.classList.contains('tl-processed')) return;

      const text = el.textContent?.trim() || "";
      if (text.includes("$") &&
        text.length < 150 &&
        el.children.length === 0 &&
        !el.querySelector(".tl-extension-price")) {
        try {
          processElement(el);
        } catch (e) {
        }
      }
    });
  }
}

function processInventory() {
  if (!FX || !extensionEnabled) return;

  const isInventory = location.href.includes("/inventory");
  if (!isInventory) return;

  const marketButtons = document.querySelectorAll(
    ".item_market_action_button_contents, " +
    ".item_market_action_button span, " +
    "a[href*='market'] span, " +
    ".steamdb_quick_sell span"
  );

  marketButtons.forEach(el => {
    if (el.classList.contains('tl-processed')) return;
    if (el.querySelector(".tl-extension-price")) return;

    const text = el.textContent?.trim() || "";

    if (text.includes("$") && el.children.length === 0 && text.length < 100) {
      processElement(el);
    }
  });

  const inventoryInfo = document.querySelectorAll(
    '#iteminfo0_item_market_actions, ' +
    '#iteminfo1_item_market_actions, ' +
    '.inventory_iteminfo'
  );

  const priceContainers = [];

  inventoryInfo.forEach(info => {
    const divs = info.querySelectorAll('div');
    const links = info.querySelectorAll('a[href*="/market/listings/"]');
    priceContainers.push(...divs, ...links);
  });

  priceContainers.forEach(container => {
    if (container.classList.contains('tl-processed')) return;

    const text = container.textContent?.trim() || "";

    const childCount = container.querySelectorAll('*').length;
    if (childCount > 5) return;

    if ((text.includes("Starting at") || text.includes("En düşük") || text.includes("Lowest")) &&
      text.includes("$") &&
      text.length < 200) {

      for (const node of container.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.includes("$")) {
          const nodeText = node.textContent.trim();
          const usd = extractUSD(nodeText);

          if (usd) {
            const tl = formatTL((usd * FX).toFixed(2));

            if (showOnlyTL) {
              node.textContent = nodeText.replace(/\$[0-9.,]+ USD/, tl);
            } else {
              node.textContent = nodeText.replace(/(\$[0-9.,]+ USD)/, `$1 (${tl})`);
            }

            container.classList.add('tl-processed');
            convertedElements.set(container, { original: nodeText, usd, tl });
            break;
          }
        }
      }
    }
  });
}

function processWishlist() {
  if (!FX || !extensionEnabled) return;

  const isWishlist = location.href.includes("/wishlist");
  if (!isWishlist) return;

  const allDivs = document.querySelectorAll('div');

  allDivs.forEach(div => {
    if (div.classList.contains('tl-processed')) return;
    if (div.querySelector(".tl-extension-price")) return;

    const text = div.textContent?.trim() || "";

    if (text.match(/^\$[0-9.,]+$/) && div.children.length === 0) {
      processElement(div);
    }
  });
}

function processCart() {
  if (!FX || !extensionEnabled) return;

  const allElements = document.querySelectorAll("*");

  allElements.forEach(el => {
    const text = el.textContent?.trim() || "";

    if (text.includes("$") && el.children.length <= 1) {
      const inCart = el.closest(".cart_item, .cart_status_data, .responsive_page_template_content, .cart_row, .game_area_purchase_game, .recommendation_carousel_item");

      if (inCart) {
        processElement(el);
      }
    }
  });

  const specificSelectors = [
    ".discount_final_price",
    ".discount_original_price",
    ".cart_item_price",
    ".cart_status_data .price",
    ".cart_total_amount",
    ".game_purchase_price",
    ".discount_prices",
  ];

  document.querySelectorAll(specificSelectors.join(",")).forEach(el => {
    if (el.closest(".cart_item, .cart_status_data, .responsive_page_template_content")) {
      processElement(el);
    }
  });
}

function fetchRate() {
  chrome.runtime.sendMessage({ type: "getRate" }, (res) => {
    if (res?.rate) {
      BaseFX = res.rate;
      FX = calculateEffectiveRate();
      setTimeout(() => {
        convertPrices();
        processInventory();
        processWishlist();
        processCart();
      }, 300);
    }
  });
}

function interceptSteamRequests() {
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._url = url;
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    this.addEventListener('load', function () {
      if (this._url && (this._url.includes('economy') || this._url.includes('market') || this._url.includes('inventory') || this._url.includes('wishlist'))) {
        setTimeout(() => {
          processInventory();
          processWishlist();
          convertPrices();
        }, 500);
      }
    });
    return originalSend.apply(this, arguments);
  };
}

function init() {
  interceptSteamRequests();

  chrome.storage.sync.get(["extensionEnabled"], (r) => {
    if (r.extensionEnabled !== false) {
      fetchRate();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.addEventListener('load', () => {
  if (!FX) {
    fetchRate();
  } else {
    setTimeout(() => {
      convertPrices();
      processInventory();
      processWishlist();
      processCart();
    }, 1000);
  }
});

let debounceTimer = null;
const observer = new MutationObserver((mutations) => {
  if (!extensionEnabled || !FX) return;

  const isOurChange = mutations.every(mutation => {
    if (mutation.target.classList?.contains('tl-extension-price') ||
      mutation.target.classList?.contains('tl-processed')) {
      return true;
    }
    if (mutation.addedNodes.length > 0) {
      const hasOnlyOurSpans = Array.from(mutation.addedNodes).every(node =>
        node.classList?.contains('tl-extension-price')
      );
      if (hasOnlyOurSpans) return true;
    }
    return false;
  });

  if (isOurChange) {
    return;
  }

  const isInventoryChange = mutations.some(mutation => {
    return mutation.target.id?.includes('iteminfo') ||
      mutation.target.id?.includes('market_actions') ||
      mutation.target.classList?.contains('item_market_actions') ||
      mutation.target.classList?.contains('inventory_iteminfo');
  });

  if (isInventoryChange) {
    setTimeout(() => {
      processInventory();
      processWishlist();
      convertPrices();
    }, 100);
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    convertPrices();
    processInventory();
    processWishlist();
    processCart();
  }, 200);
});

function startObserver() {
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  } else {
    setTimeout(startObserver, 100);
  }
}

startObserver();

let intervalId = null;

function startInterval() {
  if (intervalId) return;

  const interval = 2000;

  intervalId = setInterval(() => {
    if (!document.hidden && extensionEnabled && FX) {
      convertPrices();
      processInventory();
      processWishlist();
      processCart();
    }
  }, interval);
}

function stopInterval() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopInterval();
  } else {
    startInterval();
    convertPrices();
    processInventory();
    processWishlist();
    processCart();
  }
});

startInterval();

let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    convertedElements = new WeakMap();
    setTimeout(() => {
      convertPrices();
      processInventory();
      processWishlist();
      processCart();
    }, 400);
  }
}).observe(document, { subtree: true, childList: true });

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== "sync") return;

  let needsRecalc = false;
  let needsClear = false;

  if (changes.extensionEnabled) {
    extensionEnabled = changes.extensionEnabled.newValue !== false;
    extensionEnabled ? startInterval() : stopInterval();
    needsRecalc = true;
  }

  if (changes.itadPricesEnabled || changes.gamePassEnabled) {
    if (changes.itadPricesEnabled) itadPricesEnabled = changes.itadPricesEnabled.newValue;
    if (changes.gamePassEnabled) gamePassEnabled = changes.gamePassEnabled.newValue;

    if (itadPricesEnabled || gamePassEnabled) {
      initITAD();
    } else {
      const existing = document.querySelectorAll('.itad-container');
      existing.forEach(e => e.remove());
    }
  }

  if (changes.showOnlyTL) {
    showOnlyTL = changes.showOnlyTL.newValue || false;
    needsClear = true;
    needsRecalc = true;
  }

  if (changes.bankCommissionEnabled) {
    bankCommissionEnabled = changes.bankCommissionEnabled.newValue || false;
    FX = calculateEffectiveRate();
    needsClear = true;
    needsRecalc = true;
  }

  if (changes.bankCommissionAmount) {
    bankCommissionAmount = changes.bankCommissionAmount.newValue || 4;
    FX = calculateEffectiveRate();
    needsClear = true;
    needsRecalc = true;
  }

  if (needsRecalc) {
    if (needsClear) {
      convertedElements = new WeakMap();
    }

    convertPrices();
    processInventory();
    processWishlist();
    processCart();
  }
});

document.addEventListener("click", (e) => {
  const target = e.target.closest(".inventory_ctn, .itemHolder, .cart_item, .tab_item, .inventory_page_right");
  if (target) {
    setTimeout(() => {
      processInventory();
      processCart();
    }, 100);
    setTimeout(() => {
      processInventory();
    }, 500);
  }
}, true);

document.addEventListener("mouseover", (e) => {
  if (e.target.closest(".inventory_ctn .itemHolder, .inventory_page_right, .item_market_actions")) {
    setTimeout(processInventory, 100);
    setTimeout(processInventory, 400);
  }
}, true);

let scrollTimer = null;
document.addEventListener("scroll", () => {
  if (!FX || !extensionEnabled) return;
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    if (location.href.includes("market")) {
      convertPrices();
    }
  }, 200);
}, true);

(function () {
  if (window.top !== window.self) return;

  chrome.storage.sync.get(['installDate', 'alreadyRated'], (data) => {
    if (data.alreadyRated) {
      console.log("ITAD: Değerlendirme zaten yapıldı.");
      return;
    }

    const now = Date.now();
    let installDate = data.installDate;

    if (!installDate) {
      installDate = now;
      chrome.storage.sync.set({ installDate: now });
      console.log("ITAD: İlk kurulum tarihi kaydedildi.");
    }

    const testThreshold = 24 * 60 * 60 * 1000;
    const elapsed = now - installDate;

    if (elapsed >= testThreshold) {
      console.log("ITAD: Test süresi dolmuş, gösteriliyor.");
      setTimeout(showRatingPrompt, 1000);
    } else {
      const remaining = testThreshold - elapsed;
      console.log(`ITAD: ${Math.round(remaining / 1000)}s sonra rating bildirimi açılacak.`);
      setTimeout(() => {
        showRatingPrompt();
      }, remaining);
    }
  });

  function showRatingPrompt() {
    if (document.getElementById('steam-tl-rating-prompt')) return;
    if (!document.body) {
      setTimeout(showRatingPrompt, 1000);
      return;
    }

    const promptDiv = document.createElement('div');
    promptDiv.id = 'steam-tl-rating-prompt';
    promptDiv.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      width: 330px;
      background: linear-gradient(135deg, rgba(27, 40, 56, 0.98) 0%, rgba(15, 20, 25, 1) 100%);
      border: 1px solid rgba(0, 212, 255, 0.4);
      border-top: 1px solid rgba(0, 212, 255, 0.8);
      border-radius: 12px;
      padding: 24px;
      z-index: 2147483647; /* En üstte */
      box-shadow: 0 15px 45px rgba(0, 0, 0, 0.8);
      color: #ecf0f1;
      font-family: "Motiva Sans", Sans-serif;
      animation: slideInPulsePopup 0.6s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    `;

    if (!document.getElementById('steam-tl-prompt-style')) {
      const styleTag = document.createElement("style");
      styleTag.id = 'steam-tl-prompt-style';
      styleTag.innerText = `
        @keyframes slideInPulsePopup {
          from { transform: translateX(120%) scale(0.9); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        .st-btn { transition: all 0.2s ease; cursor: pointer; border: none; font-family: inherit; }
        .st-btn-primary { background: linear-gradient(90deg, #00d4ff 0%, #0099cc 100%); color: white; border-radius: 8px; font-weight: 700; padding: 12px; }
        .st-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(0, 212, 255, 0.5); filter: brightness(1.1); }
        .st-btn-secondary { background: rgba(255, 255, 255, 0.05); color: #ecf0f1; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 10px; font-size: 13px; }
        .st-btn-secondary:hover { background: rgba(255, 255, 255, 0.1); }
        .st-btn-danger { background: linear-gradient(90deg, #ff4b2b 0%, #ff416c 100%); color: white; border-radius: 8px; font-weight: 700; padding: 10px; font-size: 12px; margin-top: 4px; }
        .st-btn-danger:hover { transform: translateY(-1px); box-shadow: 0 5px 15px rgba(255, 75, 43, 0.4); filter: brightness(1.1); }
        #rate-close-icon:hover { color: #fff !important; transform: rotate(90deg); }
      `;
      document.head.appendChild(styleTag);
    }

    promptDiv.innerHTML = `
      <div style="position: absolute; top: 12px; right: 14px; cursor: pointer; color: rgba(236, 240, 241, 0.4); font-size: 22px; transition: all 0.3s;" id="rate-close-icon">×</div>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <div style="width: 40px; height: 40px; background: rgba(0, 212, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0, 212, 255, 0.2);">
          <span style="font-size: 24px;">⭐</span>
        </div>
        <div>
          <h4 style="margin: 0; color: #fff; font-size: 15px; font-weight: 700;">Hızlı Bir Destek?</h4>
          <div style="font-size: 11px; color: #00d4ff; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Steam TL Converter</div>
        </div>
      </div>
      <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: rgba(236, 240, 241, 0.9);">
        Eklentimizden memnun musunuz? Destek olmak için 1 dakikanızı ayırıp mağazada yorum yapabilirsiniz!
      </p>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button id="rate-now-btn" class="st-btn st-btn-primary">🌟 Şimdi Puan Ver</button>
        <button id="rate-later-btn" class="st-btn st-btn-secondary">⏰ Daha Sonra Hatırlat</button>
        <button id="rate-cancel-btn" class="st-btn st-btn-danger">Kapat</button>
      </div>
    `;

    document.body.appendChild(promptDiv);

    document.getElementById('rate-now-btn').onclick = () => {
      window.open("https://chromewebstore.google.com/detail/steam-tl-converter/bpmocjncifcldofcpacaecgecjagilka/reviews", "_blank");
      chrome.storage.sync.set({ alreadyRated: true });
      promptDiv.remove();
    };

    document.getElementById('rate-later-btn').onclick = () => {
      chrome.storage.sync.set({ installDate: Date.now() });
      promptDiv.remove();
    };

    document.getElementById('rate-cancel-btn').onclick = () => {
      chrome.storage.sync.set({ alreadyRated: true });
      promptDiv.remove();
    };

    document.getElementById('rate-close-icon').onclick = () => {
      promptDiv.remove();
    };
  }
})();