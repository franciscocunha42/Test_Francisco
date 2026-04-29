import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import type { Profile, Wedding } from "@/lib/types/database";

interface AppShellProps {
  wedding: Wedding;
  profile: Profile | null;
  children: React.ReactNode;
}

export function AppShell({ wedding, profile, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar weddingId={wedding.id} />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar profile={profile} weddingName={wedding.name} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
