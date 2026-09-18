export const CURRENCY_SYMBOLS = {
  TRY: "₺",
  TL: "₺",
  EUR: "€",
  USD: "$",
  GBP: "£",
};

export function normalizeCurrency(code) {
  const c = String(code || "TRY").toUpperCase();
  return c === "TL" ? "TRY" : c;
}

export function currencySymbol(code) {
  const c = normalizeCurrency(code);
  return CURRENCY_SYMBOLS[c] || c;
}

export function formatCurrency(amount, currency = "TRY") {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  const code = normalizeCurrency(currency);
  const formatted = n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currencySymbol(code)}`;
}

export function getRateToTry(currency, rates = {}) {
  const code = normalizeCurrency(currency);
  if (code === "TRY") return 1;
  const rate = rates[code];
  if (rate == null || Number(rate) <= 0) return null;
  return Number(rate);
}

export function toTry(amount, currency, rates = {}) {
  const n = Number(amount) || 0;
  const rate = getRateToTry(currency, rates);
  if (rate == null) return null;
  return n * rate;
}

export function totalsByCurrency(items) {
  const map = {};
  for (const item of items) {
    const code = normalizeCurrency(item.currency);
    const amt = Number(item.total_price ?? item.amount ?? item.price ?? 0) || 0;
    map[code] = (map[code] || 0) + amt;
  }
  return map;
}

export function formatMixedTotals(totalsMap) {
  const entries = Object.entries(totalsMap).filter(([, value]) => Number(value));
  if (!entries.length) return formatCurrency(0, "TRY");
  return entries.map(([code, amt]) => formatCurrency(amt, code)).join(" + ");
}

export function sumItemsToTry(items, rates = {}) {
  let total = 0;
  let missing = false;
  for (const item of items) {
    const converted = toTry(
      item.total_price ?? item.amount ?? item.price ?? 0,
      item.currency,
      rates,
    );
    if (converted == null) missing = true;
    else total += converted;
  }
  return { total, missing };
}
