"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, Store,
  PiggyBank, FileText, Settings, Heart,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "dashboard",  label: "Dashboard",   icon: LayoutDashboard },
  { href: "timeline",   label: "Timeline",     icon: Calendar },
  { href: "guests",     label: "Guests & RSVP", icon: Users },
  { href: "suppliers",  label: "Suppliers",    icon: Store },
  { href: "budget",     label: "Budget",       icon: PiggyBank },
  { href: "forms",      label: "Forms",        icon: FileText },
  { href: "settings",   label: "Settings",     icon: Settings },
];

export function Sidebar({ weddingId }: { weddingId: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r bg-card min-h-screen sticky top-0">
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <Heart className="h-5 w-5 text-primary fill-primary" />
          <span className="font-serif text-xl font-semibold text-primary">VowPlan</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const full = `/${weddingId}/${href}`;
            const active = pathname === full;
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
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card flex justify-around py-2">
        {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const full = `/${weddingId}/${href}`;
          const active = pathname === full;
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
