"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDown, Plus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils/format";
import type { Wedding } from "@/lib/types/database";

interface WeddingSwitcherProps {
  currentWeddingId: string;
  weddings: Pick<Wedding, "id" | "name" | "wedding_date">[];
}

export function WeddingSwitcher({ currentWeddingId, weddings }: WeddingSwitcherProps) {
  const router = useRouter();
  const current = weddings.find((w) => w.id === currentWeddingId);

  if (weddings.length <= 1 && !current) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 max-w-[200px]">
          <Heart className="h-3.5 w-3.5 shrink-0 text-primary fill-primary" />
          <span className="truncate text-xs">{current?.name ?? "Select wedding"}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {weddings.map((w) => (
          <DropdownMenuItem
            key={w.id}
            onClick={() => router.push(`/${w.id}/dashboard`)}
            className="flex flex-col items-start gap-0.5 py-2"
          >
            <span className={`text-sm font-medium ${w.id === currentWeddingId ? "text-primary" : ""}`}>
              {w.name}
            </span>
            {w.wedding_date && (
              <span className="text-xs text-muted-foreground">{formatDate(w.wedding_date)}</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/onboarding?new=1")} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          <span className="text-sm">New wedding</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
