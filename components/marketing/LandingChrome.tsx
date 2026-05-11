"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n/provider";

export function LandingHeader({ isAuthed }: { isAuthed: boolean }) {
  const t = useT();
  return (
    <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4">
      <Link href="/" className="flex items-center gap-2">
        <Heart className="h-4 w-4 text-primary fill-primary" />
        <span className="font-serif text-base font-semibold text-primary">VowPlan</span>
      </Link>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        {isAuthed ? (
          <Button size="sm" variant="ghost" asChild>
            <Link href="/onboarding">{t("landing.workspace")}</Link>
          </Button>
        ) : (
          <>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/login">{t("landing.logIn")}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/plan">{t("landing.startPlanning")}</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

export function LandingCallToAction({ isAuthed }: { isAuthed: boolean }) {
  const t = useT();
  return (
    <section className="border-t bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="font-serif text-3xl font-semibold">{t("landing.readyTitle")}</h2>
        <p className="mt-3 text-muted-foreground">{t("landing.readyDesc")}</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {isAuthed ? (
            <Button size="lg" asChild>
              <Link href="/onboarding">{t("landing.continueWorkspace")}</Link>
            </Button>
          ) : (
            <>
              <Button size="lg" asChild>
                <Link href="/plan">{t("landing.startCta")}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">{t("landing.logIn")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  const t = useT();
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} VowPlan</span>
        <div className="flex gap-4">
          <Link href="/login" className="hover:text-foreground">
            {t("landing.logIn")}
          </Link>
          <Link href="/signup" className="hover:text-foreground">
            {t("landing.signUp")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
