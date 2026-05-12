"use client";

import { startTransition, useOptimistic } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { ChevronsUpDown, Plus, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils/format";
import { setDefaultWedding } from "@/lib/actions/wedding";
import { useT } from "@/lib/i18n/provider";

export interface WeddingEntry {
  id: string;
  name: string | null;
  wedding_date: string | null;
  is_default: boolean;
}

interface WeddingSwitcherProps {
  currentWeddingId: string;
  weddings: WeddingEntry[];
}

export function WeddingSwitcher({ currentWeddingId, weddings }: WeddingSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const current = weddings.find((w) => w.id === currentWeddingId);

  const [optimisticDefault, setOptimisticDefault] = useOptimistic<string | null>(
    weddings.find((w) => w.is_default)?.id ?? null
  );

  function navigateTo(targetId: string) {
    // Stay on the same section (budget, guests, etc.) when switching weddings
    const newPath = pathname.replace(currentWeddingId, targetId);
    router.push(newPath);
  }

  function handleSetDefault(e: React.MouseEvent, weddingId: string) {
    e.stopPropagation();
    e.preventDefault();
    startTransition(async () => {
      setOptimisticDefault(weddingId);
      const result = await setDefaultWedding(weddingId);
      if (!result.ok) {
        toast.error(result.error ?? t("common.somethingWrong"));
      }
      router.refresh();
    });
  }

  const hasMultiple = weddings.length > 1;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 max-w-[200px]">
          <Heart className="h-3.5 w-3.5 shrink-0 text-primary fill-primary" />
          <span className="truncate text-xs">{current?.name ?? t("weddingSwitcher.select")}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {weddings.map((w) => {
          const isDefault = (optimisticDefault ?? weddings.find((x) => x.is_default)?.id) === w.id;
          return (
            <DropdownMenuItem
              key={w.id}
              onClick={() => navigateTo(w.id)}
              className="flex items-center justify-between gap-2 py-2 cursor-pointer"
            >
              <div className="flex flex-col items-start gap-0.5 min-w-0">
                <span className={`text-sm font-medium truncate ${w.id === currentWeddingId ? "text-primary" : ""}`}>
                  {w.name}
                </span>
                {w.wedding_date && (
                  <span className="text-xs text-muted-foreground">{formatDate(w.wedding_date)}</span>
                )}
              </div>
              {hasMultiple && (
                <button
                  onClick={(e) => handleSetDefault(e, w.id)}
                  title={isDefault ? t("weddingSwitcher.isDefault") : t("weddingSwitcher.setDefault")}
                  className={`shrink-0 rounded p-0.5 transition-colors ${
                    isDefault ? "text-primary" : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <Star className={`h-3.5 w-3.5 ${isDefault ? "fill-primary" : ""}`} />
                </button>
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/onboarding?new=1")}
          className="gap-1.5 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="text-sm">{t("weddingSwitcher.new")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
