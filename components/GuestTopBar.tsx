"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, X, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/lib/guest-store/use-require-auth";
import { useGuestStore } from "@/lib/guest-store/store";
import { WeddingDetailsDialog } from "@/components/WeddingDetailsDialog";
import type { WeddingDetailsInput } from "@/components/WeddingDetailsDialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n/provider";

function isGenericWedding(wedding: { partner_one_name?: string | null; partner_two_name?: string | null } | null): boolean {
  if (!wedding) return true;
  return !wedding.partner_one_name?.trim() && !wedding.partner_two_name?.trim();
}

export function GuestTopBar() {
  const { guard } = useRequireAuth();
  const wedding = useGuestStore((s) => s.wedding);
  const updateWedding = useGuestStore((s) => s.updateWedding);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const t = useT();

  function handleSaveToCloud() {
    if (isGenericWedding(wedding)) {
      setDetailsOpen(true);
    } else {
      guard(t("guestTopBar.saveLabel"));
    }
  }

  async function handleDetailsSaved(data: WeddingDetailsInput) {
    updateWedding(data);
    // Small delay to let state settle before opening the auth gate
    setTimeout(() => guard(t("guestTopBar.saveLabel")), 50);
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2 md:hidden">
          <Heart className="h-4 w-4 text-primary fill-primary" />
          <span className="font-serif text-base font-semibold text-primary">VowPlan</span>
        </div>

        <p className="hidden md:block text-sm text-muted-foreground truncate max-w-xs">
          {wedding?.name ?? t("guestTopBar.yourWedding")}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveToCloud}
          >
            <Cloud className="mr-1.5 h-3.5 w-3.5" />
            {t("guestTopBar.saveToCloud")}
          </Button>
          <LanguageSwitcher />
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            {t("guestTopBar.logIn")}
          </Link>
        </div>
      </div>

      {!bannerDismissed && wedding && (
        <div className="flex items-center justify-between gap-3 bg-primary/10 px-4 py-2 text-xs md:px-6">
          <p className="text-foreground/80">
            {t("guestTopBar.bannerPrefix")}{" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={handleSaveToCloud}
            >
              {t("guestTopBar.saveToCloud")}
            </button>{" "}
            {t("guestTopBar.bannerSuffix")}
          </p>
          <button
            type="button"
            aria-label={t("guestTopBar.dismiss")}
            onClick={() => setBannerDismissed(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <WeddingDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        defaultValues={wedding ?? {}}
        onSave={handleDetailsSaved}
        title={t("guestTopBar.completeDetails")}
        requireNames
      />
    </header>
  );
}
