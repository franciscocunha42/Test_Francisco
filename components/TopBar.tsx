"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart } from "lucide-react";
import { WeddingSwitcher } from "@/components/WeddingSwitcher";
import type { WeddingEntry } from "@/components/WeddingSwitcher";
import type { Profile } from "@/lib/types/database";

interface TopBarProps {
  profile: Profile | null;
  currentWeddingId: string;
  allWeddings: WeddingEntry[];
}

export function TopBar({ profile, currentWeddingId, allWeddings }: TopBarProps) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "VP";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-card px-4 md:px-6">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 md:hidden">
        <Heart className="h-4 w-4 text-primary fill-primary" />
        <span className="font-serif text-base font-semibold text-primary">VowPlan</span>
      </div>

      {/* Desktop: wedding switcher */}
      <div className="hidden md:flex">
        <WeddingSwitcher currentWeddingId={currentWeddingId} weddings={allWeddings} />
      </div>

      <div className="flex items-center gap-2">
        {/* Mobile: wedding switcher */}
        <div className="flex md:hidden">
          <WeddingSwitcher currentWeddingId={currentWeddingId} weddings={allWeddings} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{profile?.full_name ?? "Account"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
