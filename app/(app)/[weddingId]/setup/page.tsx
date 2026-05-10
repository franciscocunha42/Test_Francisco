import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import { SetupGuide } from "@/components/SetupGuide";
import type { Wedding } from "@/lib/types/database";

export default async function SetupPage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  const [weddingRes, taskCountRes, vendorCountRes] = await Promise.all([
    supabase.from("weddings").select("*").eq("id", weddingId).single(),
    supabase.from("timeline_tasks").select("id", { count: "exact", head: true }).eq("wedding_id", weddingId),
    supabase.from("vendors").select("id", { count: "exact", head: true }).eq("wedding_id", weddingId),
  ]);

  const wedding = weddingRes.data as Wedding | null;
  if (!wedding) redirect("/onboarding");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Welcome to {wedding.name} 💍</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A few quick steps to get your planning workspace ready.
        </p>
      </div>

      <SetupGuide
        weddingId={weddingId}
        wedding={wedding}
        budgetSet={(wedding.total_budget ?? 0) > 0}
        hasTasks={(taskCountRes.count ?? 0) > 0}
        hasVendors={(vendorCountRes.count ?? 0) > 0}
      />
    </div>
  );
}
