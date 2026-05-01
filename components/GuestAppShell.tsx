"use client";

import { Sidebar } from "@/components/Sidebar";
import { GuestTopBar } from "@/components/GuestTopBar";

export function GuestAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar basePath="/plan" />
      <div className="flex flex-1 flex-col min-w-0">
        <GuestTopBar />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
