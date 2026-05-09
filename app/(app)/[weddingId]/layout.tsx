import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember, getUserWeddings } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import type { Wedding } from "@/lib/types/database";
import type { WeddingEntry } from "@/components/WeddingSwitcher";

interface LayoutProps {
  children: React.ReactNode;
  params: { weddingId: string };
}

export default async function WeddingLayout({ children, params }: LayoutProps) {
  const { user } = await requireWeddingMember(params.weddingId);
  const supabase = createClient();

  const [{ data: wedding }, { data: profile }, memberships] = await Promise.all([
    supabase.from("weddings").select("*").eq("id", params.weddingId).single(),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    getUserWeddings(),
  ]);

  if (!wedding) notFound();

  const allWeddings: WeddingEntry[] = memberships.map((m) => {
    const w = m.weddings as unknown as Pick<Wedding, "id" | "name" | "wedding_date">;
    return {
      id: w.id,
      name: w.name,
      wedding_date: w.wedding_date ?? null,
      is_default: (m as { is_default: boolean }).is_default ?? false,
    };
  });

  return (
    <AppShell wedding={wedding} profile={profile} allWeddings={allWeddings}>
      {children}
    </AppShell>
  );
}
