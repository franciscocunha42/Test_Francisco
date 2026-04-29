import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

interface LayoutProps {
  children: React.ReactNode;
  params: { weddingId: string };
}

export default async function WeddingLayout({ children, params }: LayoutProps) {
  const { user } = await requireWeddingMember(params.weddingId);
  const supabase = createClient();

  const [{ data: wedding }, { data: profile }] = await Promise.all([
    supabase.from("weddings").select("*").eq("id", params.weddingId).single(),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
  ]);

  if (!wedding) notFound();

  return (
    <AppShell wedding={wedding} profile={profile}>
      {children}
    </AppShell>
  );
}
