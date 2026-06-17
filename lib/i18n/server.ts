import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  dictionaries,
  type Locale,
  type TranslationKey,
} from "./dictionary";

const COOKIE_KEY = "vowplan_locale";

function isLocale(value: string | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function getServerLocale(): Locale {
  const cookieLocale = cookies().get(COOKIE_KEY)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const acceptLang = headers().get("accept-language") ?? "";
  if (/^pt\b/i.test(acceptLang) || /\bpt-PT\b/i.test(acceptLang)) {
    return "pt";
  }
  return DEFAULT_LOCALE;
}

export function getServerT(): (key: TranslationKey) => string {
  const locale = getServerLocale();
  return (key) => {
    const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
    return dict[key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;
  };
}
