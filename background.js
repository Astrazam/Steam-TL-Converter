async function fetchRateFromTCMB() {
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml");
    const txt = await res.text();

    const match = txt.match(/<ForexSelling>(.*?)<\/ForexSelling>/);
    if (!match) {
      return null;
    }

    return parseFloat(match[1].replace(",", "."));
  } catch (e) {
    return null;
  }
}

async function fetchRateFromFloatRates() {
  try {
    const res = await fetch("https://www.floatrates.com/daily/usd.json");
    const data = await res.json();

    if (data.try && data.try.rate) {
      return parseFloat(data.try.rate);
    }

    return null;
  } catch (e) {
    return null;
  }
}

async function fetchRate(source = 'tcmb') {
  if (source === 'floatrates') {
    return await fetchRateFromFloatRates();
  } else {
    return await fetchRateFromTCMB();
  }
}

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg.type === "getRate") {
    chrome.storage.sync.get(["rateSource"], (result) => {
      const source = result.rateSource || 'tcmb';
      fetchRate(source).then(rate => {
        respond({ rate, source });
      });
    });
  } else if (msg.type === "fetchITAD") {
    const { url, method, body } = msg;
    const ITAD_API_KEY = "***********";

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': ITAD_API_KEY
      }
    };
    if (body) options.body = body;

    fetch(url, options)
      .then(res => {
        if (!res.ok) {
          throw new Error(`ITAD API Error: ${res.status}`);
        }
        return res.json();
      })
      .then(data => respond({ success: true, data }))
      .catch(err => respond({ success: false, error: err.message }));

    return true;
  }
  return true;
});
