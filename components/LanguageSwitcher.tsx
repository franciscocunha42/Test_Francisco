"use client";

import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/i18n/provider";
import { SUPPORTED_LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils/cn";

interface LanguageSwitcherProps {
  variant?: "icon" | "compact";
  className?: string;
}

export function LanguageSwitcher({ variant = "icon", className }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("language.label")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="uppercase">{locale}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {t("language.label")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_LOCALES.map((code: Locale) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLocale(code)}
            className="cursor-pointer justify-between"
          >
            <span>{LOCALE_LABELS[code]}</span>
            {locale === code && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
