const enabledCheckbox = document.getElementById("extensionEnabled")
const onlyTLCheckbox = document.getElementById("showOnlyTL")
const itadPricesCheckbox = document.getElementById("itadPricesEnabled")
const gamePassCheckbox = document.getElementById("gamePassEnabled")
const rateTCMB = document.getElementById("rateTCMB")
const rateFloatRates = document.getElementById("rateFloatRates")
const statusBadge = document.getElementById("statusBadge")
const rateValue = document.getElementById("rateValue")

const bankCommissionEnabled = document.getElementById("bankCommissionEnabled")
const bankCommissionAmount = document.getElementById("bankCommissionAmount")
const commissionInputContainer = document.getElementById("commissionInputContainer")

const calcBankRate = document.getElementById("calcBankRate")
const btnCalculate = document.getElementById("btnCalculate")
const calcResult = document.getElementById("calcResult")
const calcActionContainer = document.getElementById("calcActionContainer")
const btnApplyRate = document.getElementById("btnApplyRate")
let calculatedCommission = 0

const helpIcon = document.getElementById("helpIcon")
const helpModal = document.getElementById("helpModal")
const closeModal = document.getElementById("closeModal")

function updateStatus(isEnabled) {
  if (isEnabled) {
    statusBadge.textContent = "Aktif"
    statusBadge.className = "status-badge status-active"
  } else {
    statusBadge.textContent = "Kapalı"
    statusBadge.className = "status-badge status-inactive"
  }
}

const btnExtraSettings = document.getElementById("btnExtraSettings")
const extraSettingsModal = document.getElementById("extraSettingsModal")
const closeExtraSettingsModal = document.getElementById("closeExtraSettingsModal")

helpIcon.addEventListener("click", () => {
  helpModal.classList.add("active")
})

closeModal.addEventListener("click", () => {
  helpModal.classList.remove("active")
})

btnExtraSettings.addEventListener("click", () => {
  extraSettingsModal.classList.add("active")
})

closeExtraSettingsModal.addEventListener("click", () => {
  extraSettingsModal.classList.remove("active")
})

window.addEventListener("click", (e) => {
  if (e.target === helpModal) {
    helpModal.classList.remove("active")
  }
  if (e.target === extraSettingsModal) {
    extraSettingsModal.classList.remove("active")
  }
})

function updateCommissionInputState(isEnabled) {
  if (isEnabled) {
    commissionInputContainer.style.opacity = "1"
    commissionInputContainer.style.pointerEvents = "auto"
  } else {
    commissionInputContainer.style.opacity = "0.5"
    commissionInputContainer.style.pointerEvents = "none"
  }
}

async function getRate(source) {
  try {
    if (source === 'floatrates') {
      const res = await fetch("https://www.floatrates.com/daily/usd.json")
      const data = await res.json()
      if (data.try && data.try.rate) {
        return { rate: Number.parseFloat(data.try.rate), source: "FloatRates" }
      }
    } else {
      const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml")
      const txt = await res.text()
      const match = txt.match(/<ForexSelling>(.*?)<\/ForexSelling>/)
      if (match) {
        return { rate: Number.parseFloat(match[1].replace(",", ".")), source: "TCMB" }
      }
    }
    throw new Error("Kur alınamadı")
  } catch (e) {
    throw e
  }
}

async function fetchAndDisplayRate(source = 'tcmb') {
  try {
    const data = await getRate(source);
    rateValue.textContent = `1 USD = ${data.rate.toFixed(4)} ₺ (${data.source})`
  } catch (e) {
    rateValue.textContent = "Hata"
  }
}

btnCalculate.addEventListener("click", async () => {
  const bankRate = parseFloat(calcBankRate.value);
  if (!bankRate || isNaN(bankRate)) {
    calcResult.textContent = "Lütfen geçerli bir kur girin";
    calcResult.style.color = "#ff6b6b";
    return;
  }

  const selectedSource = document.querySelector('input[name="calcSource"]:checked').value;

  calcResult.textContent = "Kur alınıyor...";
  calcResult.style.color = "#ccc";

  try {
    const data = await getRate(selectedSource);
    const baseRate = data.rate;

    const commission = ((bankRate - baseRate) / baseRate) * 100;

    calculatedCommission = commission.toFixed(2);

    if (calculatedCommission < 0) {
      calculatedCommission = "0.00";
    }

    calcResult.textContent = `%${calculatedCommission} Komisyon`;
    calcResult.style.color = "#66ff99";

    calcActionContainer.style.display = "block";

  } catch (e) {
    calcResult.textContent = "Kur verisi alınamadı!";
    calcResult.style.color = "#ff6b6b";
  }
});

btnApplyRate.addEventListener("click", () => {
  if (calculatedCommission) {
    bankCommissionAmount.value = calculatedCommission;

    if (!bankCommissionEnabled.checked) {
      bankCommissionEnabled.checked = true;
      updateCommissionInputState(true);
      window.chrome.storage.sync.set({ bankCommissionEnabled: true });
    }

    window.chrome.storage.sync.set({ bankCommissionAmount: parseFloat(calculatedCommission) }, () => {
      reloadSteamPages();
      helpModal.classList.remove("active");
    });
  }
});

window.chrome.storage.sync.get([
  "extensionEnabled",
  "showOnlyTL",
  "rateSource",
  "bankCommissionEnabled",
  "bankCommissionAmount",
  "itadPricesEnabled",
  "gamePassEnabled"
], (result) => {
  const isEnabled = result.extensionEnabled !== false
  const rateSource = result.rateSource || 'tcmb'

  enabledCheckbox.checked = isEnabled
  onlyTLCheckbox.checked = result.showOnlyTL || false

  bankCommissionEnabled.checked = result.bankCommissionEnabled || false
  bankCommissionAmount.value = result.bankCommissionAmount || 4
  itadPricesCheckbox.checked = result.itadPricesEnabled !== false
  gamePassCheckbox.checked = result.gamePassEnabled !== false
  updateCommissionInputState(bankCommissionEnabled.checked)

  if (rateSource === 'floatrates') {
    rateFloatRates.checked = true
  } else {
    rateTCMB.checked = true
  }

  updateStatus(isEnabled)
  fetchAndDisplayRate(rateSource)
})

enabledCheckbox.addEventListener("change", () => {
  const isEnabled = enabledCheckbox.checked
  updateStatus(isEnabled)

  window.chrome.storage.sync.set({ extensionEnabled: isEnabled }, () => {
    reloadSteamPages()
  })
})

onlyTLCheckbox.addEventListener("change", () => {
  window.chrome.storage.sync.set({ showOnlyTL: onlyTLCheckbox.checked }, () => {
    reloadSteamPages()
  })
})

itadPricesCheckbox.addEventListener("change", () => {
  window.chrome.storage.sync.set({ itadPricesEnabled: itadPricesCheckbox.checked }, () => {
    reloadSteamPages()
  })
})

gamePassCheckbox.addEventListener("change", () => {
  window.chrome.storage.sync.set({ gamePassEnabled: gamePassCheckbox.checked }, () => {
    reloadSteamPages()
  })
})

bankCommissionEnabled.addEventListener("change", () => {
  const isEnabled = bankCommissionEnabled.checked
  updateCommissionInputState(isEnabled)

  window.chrome.storage.sync.set({ bankCommissionEnabled: isEnabled }, () => {
    reloadSteamPages()
  })
})

bankCommissionAmount.addEventListener("change", () => {
  let val = parseFloat(bankCommissionAmount.value)
  if (isNaN(val)) val = 0
  if (val < 0) val = 0

  window.chrome.storage.sync.set({ bankCommissionAmount: val }, () => {
    reloadSteamPages()
  })
})

rateTCMB.addEventListener("change", () => {
  if (rateTCMB.checked) {
    window.chrome.storage.sync.set({ rateSource: 'tcmb' }, () => {
      fetchAndDisplayRate('tcmb')
      reloadSteamPages()
    })
  }
})

rateFloatRates.addEventListener("change", () => {
  if (rateFloatRates.checked) {
    window.chrome.storage.sync.set({ rateSource: 'floatrates' }, () => {
      fetchAndDisplayRate('floatrates')
      reloadSteamPages()
    })
  }
})

function reloadSteamPages() {
  window.chrome.tabs.query(
    {
      url: [
        "https://store.steampowered.com/*",
        "https://steamcommunity.com/market/*",
        "https://steamcommunity.com/id/*/inventory*",
        "https://steamcommunity.com/profiles/*/inventory*",
        "https://steamcommunity.com/inventory/*",
        "https://steamcommunity.com/id/*/wishlist/*",
        "https://steamcommunity.com/profiles/*/wishlist/*"
      ],
    },
    (tabs) => {
      tabs.forEach((tab) => {
        window.chrome.tabs.reload(tab.id)
      })
    },
  )
}
