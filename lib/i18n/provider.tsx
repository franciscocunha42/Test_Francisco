"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  dictionaries,
  type Locale,
  type TranslationKey,
} from "./dictionary";

const STORAGE_KEY = "vowplan:locale";
const COOKIE_KEY = "vowplan_locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

function readCookieLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]+)`));
  return isLocale(match?.[1]) ? (match![1] as Locale) : null;
}

function readInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const cookieLocale = readCookieLocale();
  if (cookieLocale) return cookieLocale;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) return stored;
  const navLang = window.navigator.language?.toLowerCase() ?? "";
  if (navLang.startsWith("pt")) return "pt";
  return DEFAULT_LOCALE;
}

function writeCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_KEY}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const initial = readInitialLocale();
    setLocaleState(initial);
    // Make sure the cookie reflects the resolved locale so server
    // components render in the same language on subsequent navigations.
    const cookieLocale = readCookieLocale();
    if (cookieLocale !== initial) {
      writeCookie(initial);
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "pt" ? "pt-PT" : "en";
    }
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next);
        writeCookie(next);
        router.refresh();
      }
    },
    [router]
  );

  const t = useCallback(
    (key: TranslationKey) => {
      const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
      return dict[key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;
    },
    [locale]
  );

  const value = useMemo<LanguageContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

export function useT() {
  return useLanguage().t;
}
