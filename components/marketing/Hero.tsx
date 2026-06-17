"use client";

import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";

interface HeroProps {
  isAuthed: boolean;
}

export function Hero({ isAuthed }: HeroProps) {
  const t = useT();
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-champagne-50 via-white to-white">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24 text-center">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Heart className="h-5 w-5 text-primary fill-primary" />
          <span className="font-serif text-xl font-semibold text-primary">VowPlan</span>
        </div>
        <h1 className="font-serif text-4xl md:text-6xl font-semibold tracking-tight text-foreground">
          {t("hero.titleLine1")}
          <br />
          {t("hero.titleLine2")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-muted-foreground">
          {t("hero.subtitle")}
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {isAuthed ? (
            <Button size="lg" asChild>
              <Link href="/onboarding">
                {t("hero.continueWorkspace")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button size="lg" asChild>
                <Link href="/plan">
                  {t("hero.startPlanning")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">{t("hero.logIn")}</Link>
              </Button>
            </>
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {isAuthed ? t("hero.signedIn") : t("hero.noAccount")}
        </p>
      </div>
    </section>
  );
}
