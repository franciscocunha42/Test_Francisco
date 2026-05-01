"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, X, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/lib/guest-store/use-require-auth";
import { useGuestStore } from "@/lib/guest-store/store";

export function GuestTopBar() {
  const { guard } = useRequireAuth();
  const wedding = useGuestStore((s) => s.wedding);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2 md:hidden">
          <Heart className="h-4 w-4 text-primary fill-primary" />
          <span className="font-serif text-base font-semibold text-primary">VowPlan</span>
        </div>

        <p className="hidden md:block text-sm text-muted-foreground truncate max-w-xs">
          {wedding?.name ?? "Your wedding"}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => guard("save your wedding")}
          >
            <Cloud className="mr-1.5 h-3.5 w-3.5" />
            Save to cloud
          </Button>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Log In
          </Link>
        </div>
      </div>

      {!bannerDismissed && wedding && (
        <div className="flex items-center justify-between gap-3 bg-primary/10 px-4 py-2 text-xs md:px-6">
          <p className="text-foreground/80">
            Your planning is saved on this device only.{" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => guard("save your wedding")}
            >
              Save to cloud
            </button>{" "}
            to access from anywhere.
          </p>
          <button
            type="button"
            aria-label="Dismiss banner"
            onClick={() => setBannerDismissed(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </header>
  );
}
