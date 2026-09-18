const https = require("https");
const { parseStringPromise } = require("xml2js");

const TCMB_TODAY = "https://www.tcmb.gov.tr/kurlar/today.xml";

function httpsGet(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "HamamSPA/1.0 (TCMB kur senkronizasyonu)",
          Accept: "application/xml,text/xml,*/*",
        },
      },
      (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirects < 5
        ) {
          const next = new URL(res.headers.location, url).toString();
          res.resume();
          return resolve(httpsGet(next, redirects + 1));
        }

        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`TCMB HTTP ${res.statusCode} (${url})`));
        }

        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      },
    );
    req.on("error", reject);
  });
}

function archiveUrl(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `https://www.tcmb.gov.tr/kurlar/${y}${m}/${d}${m}${y}.xml`;
}

function parseTcmbDate(tarihDate) {
  const attrs = tarihDate.$ || {};
  if (attrs.Date) {
    const [month, day, year] = attrs.Date.split("/");
    if (year && month && day) {
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }
  if (attrs.Tarih) {
    const [day, month, year] = attrs.Tarih.split(".");
    if (year && month && day) {
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value) {
  if (value == null || value === "") return null;
  const n = parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

async function parseTcmbXml(buffer) {
  const xml = buffer.toString("latin1");
  const parsed = await parseStringPromise(xml, {
    explicitArray: false,
    ignoreAttrs: false,
  });

  const tarihDate = parsed.Tarih_Date;
  if (!tarihDate) {
    throw new Error("TCMB XML beklenen formatta değil.");
  }

  const rateDate = parseTcmbDate(tarihDate);
  const rows = [].concat(tarihDate.Currency || []);

  const rates = rows
    .map((row) => {
      const code = (row.$?.CurrencyCode || row.$?.Kod || "").toUpperCase();
      const unit = toNumber(row.Unit) || 1;
      const forexBuying = toNumber(row.ForexBuying);
      const forexSelling = toNumber(row.ForexSelling);
      const banknoteSelling = toNumber(row.BanknoteSelling);
      const raw = forexSelling || banknoteSelling || forexBuying;
      if (!code || raw == null) return null;
      const tryRate = raw / unit;
      return {
        currency_code: code,
        unit,
        forex_buying: forexBuying,
        forex_selling: forexSelling,
        try_rate: tryRate,
      };
    })
    .filter(Boolean);

  return { rateDate, rates };
}

async function fetchTcmbBulletin() {
  try {
    const buffer = await httpsGet(TCMB_TODAY);
    return parseTcmbXml(buffer);
  } catch (todayErr) {
    let lastError = todayErr;
    for (let i = 1; i <= 7; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      try {
        const buffer = await httpsGet(archiveUrl(d));
        return parseTcmbXml(buffer);
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError;
  }
}

async function ensureExchangeRatesTable(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id SERIAL PRIMARY KEY,
      rate_date DATE NOT NULL,
      currency_code VARCHAR(10) NOT NULL,
      unit INTEGER NOT NULL DEFAULT 1,
      forex_buying NUMERIC(18, 6),
      forex_selling NUMERIC(18, 6),
      try_rate NUMERIC(18, 6) NOT NULL,
      source VARCHAR(20) DEFAULT 'TCMB',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (rate_date, currency_code)
    )
  `);
}

async function syncTcmbRates(db) {
  await ensureExchangeRatesTable(db);
  const { rateDate, rates } = await fetchTcmbBulletin();

  for (const rate of rates) {
    await db.query(
      `
      INSERT INTO exchange_rates
        (rate_date, currency_code, unit, forex_buying, forex_selling, try_rate, source)
      VALUES ($1, $2, $3, $4, $5, $6, 'TCMB')
      ON CONFLICT (rate_date, currency_code)
      DO UPDATE SET
        unit = EXCLUDED.unit,
        forex_buying = EXCLUDED.forex_buying,
        forex_selling = EXCLUDED.forex_selling,
        try_rate = EXCLUDED.try_rate,
        source = EXCLUDED.source
      `,
      [
        rateDate,
        rate.currency_code,
        rate.unit,
        rate.forex_buying,
        rate.forex_selling,
        rate.try_rate,
      ],
    );

    try {
      await db.query(
        `
        UPDATE currencies
        SET exchange_rate = $1
        WHERE UPPER(code) = $2
        `,
        [rate.try_rate, rate.currency_code],
      );
    } catch (err) {
      // currencies tablosu yoksa veya kolon farklıysa senkronu bozma
    }
  }

  await db.query(
    `
    INSERT INTO exchange_rates
      (rate_date, currency_code, unit, forex_buying, forex_selling, try_rate, source)
    VALUES ($1, 'TRY', 1, 1, 1, 1, 'TCMB')
    ON CONFLICT (rate_date, currency_code)
    DO UPDATE SET try_rate = 1, unit = 1
    `,
    [rateDate],
  );

  return { rateDate, count: rates.length };
}

async function getLatestRates(db) {
  await ensureExchangeRatesTable(db);

  const latest = await db.query(
    `SELECT MAX(rate_date) AS rate_date FROM exchange_rates`,
  );
  const rateDate = latest.rows[0]?.rate_date;

  if (!rateDate) {
    let fallback = { rows: [] };
    try {
      fallback = await db.query(
        `SELECT UPPER(code) AS currency_code, exchange_rate AS try_rate FROM currencies`,
      );
    } catch (err) {
      fallback = { rows: [] };
    }
    const rates = { TRY: 1 };
    fallback.rows.forEach((row) => {
      rates[row.currency_code] = Number(row.try_rate) || 1;
    });
    return { date: null, rates, items: [], source: "currencies" };
  }

  const itemsRes = await db.query(
    `
    SELECT rate_date, currency_code, unit, forex_buying, forex_selling, try_rate, source
    FROM exchange_rates
    WHERE rate_date = $1
    ORDER BY currency_code ASC
    `,
    [rateDate],
  );

  const rates = { TRY: 1 };
  itemsRes.rows.forEach((row) => {
    rates[String(row.currency_code).toUpperCase()] = Number(row.try_rate);
  });

  return {
    date: rateDate,
    rates,
    items: itemsRes.rows,
    source: "TCMB",
  };
}

module.exports = {
  ensureExchangeRatesTable,
  syncTcmbRates,
  getLatestRates,
};
