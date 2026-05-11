"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, Store,
  PiggyBank, FileText, Settings, Heart, Lock, Armchair,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/lib/i18n/provider";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const navItems: Array<{
  href: string;
  labelKey: TranslationKey;
  icon: typeof LayoutDashboard;
  lockInGuest: boolean;
}> = [
  { href: "dashboard",  labelKey: "nav.dashboard", icon: LayoutDashboard, lockInGuest: false },
  { href: "timeline",   labelKey: "nav.timeline",  icon: Calendar,        lockInGuest: false },
  { href: "guests",     labelKey: "nav.guests",    icon: Users,           lockInGuest: false },
  { href: "seating",    labelKey: "nav.seating",   icon: Armchair,        lockInGuest: false },
  { href: "suppliers",  labelKey: "nav.suppliers", icon: Store,           lockInGuest: false },
  { href: "budget",     labelKey: "nav.budget",    icon: PiggyBank,       lockInGuest: false },
  { href: "forms",      labelKey: "nav.forms",     icon: FileText,        lockInGuest: true  },
  { href: "settings",   labelKey: "nav.settings",  icon: Settings,        lockInGuest: false },
];

interface SidebarProps {
  weddingId?: string;
  /** Path prefix for nav links. Defaults to `/${weddingId}`. Guest
   *  mode passes `/plan`. */
  basePath?: string;
}

export function Sidebar({ weddingId, basePath }: SidebarProps) {
  const pathname = usePathname();
  const prefix = basePath ?? `/${weddingId}`;
  const isGuest = prefix === "/plan";
  const t = useT();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r bg-card min-h-screen sticky top-0">
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <Heart className="h-5 w-5 text-primary fill-primary" />
          <span className="font-serif text-xl font-semibold text-primary">VowPlan</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, labelKey, icon: Icon, lockInGuest }) => {
            const full = `${prefix}/${href}`;
            const active = pathname === full;
            const locked = isGuest && lockInGuest;
            const label = t(labelKey);
            return (
              <Link
                key={href}
                href={full}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{label}</span>
                {locked && <Lock className="h-3 w-3 opacity-60" />}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card flex justify-around py-2">
        {navItems.slice(0, 5).map(({ href, labelKey, icon: Icon }) => {
          const full = `${prefix}/${href}`;
          const active = pathname === full;
          const label = t(labelKey);
          return (
            <Link key={href} href={full} className="flex flex-col items-center gap-0.5">
              <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[10px]", active ? "text-primary font-medium" : "text-muted-foreground")}>{label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
