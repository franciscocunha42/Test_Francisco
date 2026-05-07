"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    <div className="sticky top-0 z-40 flex items-center justify-end gap-2 bg-background/80 px-4 py-3 backdrop-blur-sm md:px-6 md:py-4">
      <WeddingSwitcher currentWeddingId={currentWeddingId} weddings={allWeddings} />

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
  );
}
