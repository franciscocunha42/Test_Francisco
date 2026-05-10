export interface CurrencyOption {
  code: string;
  label: string;
  symbol: string;
}

// Curated list of widely used currencies. The `code` is the ISO 4217 code
// passed to Intl.NumberFormat in lib/utils/format.ts.
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "USD", label: "US Dollar",        symbol: "$" },
  { code: "EUR", label: "Euro",             symbol: "€" },
  { code: "GBP", label: "British Pound",    symbol: "£" },
  { code: "CAD", label: "Canadian Dollar",  symbol: "$" },
  { code: "AUD", label: "Australian Dollar",symbol: "$" },
  { code: "NZD", label: "New Zealand Dollar",symbol: "$" },
  { code: "CHF", label: "Swiss Franc",      symbol: "CHF" },
  { code: "SEK", label: "Swedish Krona",    symbol: "kr" },
  { code: "NOK", label: "Norwegian Krone",  symbol: "kr" },
  { code: "DKK", label: "Danish Krone",     symbol: "kr" },
  { code: "JPY", label: "Japanese Yen",     symbol: "¥" },
  { code: "CNY", label: "Chinese Yuan",     symbol: "¥" },
  { code: "INR", label: "Indian Rupee",     symbol: "₹" },
  { code: "SGD", label: "Singapore Dollar", symbol: "$" },
  { code: "HKD", label: "Hong Kong Dollar", symbol: "$" },
  { code: "MXN", label: "Mexican Peso",     symbol: "$" },
  { code: "BRL", label: "Brazilian Real",   symbol: "R$" },
  { code: "ZAR", label: "South African Rand",symbol: "R" },
  { code: "AED", label: "UAE Dirham",       symbol: "د.إ" },
];

export function getCurrencyOption(code: string): CurrencyOption {
  return CURRENCY_OPTIONS.find((c) => c.code === code) ?? CURRENCY_OPTIONS[0];
}
