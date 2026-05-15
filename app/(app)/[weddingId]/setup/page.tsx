import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import { SetupGuide } from "@/components/SetupGuide";
import type { Wedding } from "@/lib/types/database";

export default async function SetupPage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  const [weddingRes, taskCountRes, vendorCountRes, membersRes, pendingInvitesRes] = await Promise.all([
    supabase.from("weddings").select("*").eq("id", weddingId).single(),
    supabase.from("timeline_tasks").select("id", { count: "exact", head: true }).eq("wedding_id", weddingId),
    supabase.from("vendors").select("id", { count: "exact", head: true }).eq("wedding_id", weddingId),
    supabase.from("wedding_members").select("role").eq("wedding_id", weddingId).neq("role", "owner"),
    supabase.from("wedding_invitations").select("email").eq("wedding_id", weddingId).eq("status", "pending"),
  ]);

  const wedding = weddingRes.data as Wedding | null;
  if (!wedding) redirect("/onboarding");

  const acceptedMemberCount = (membersRes.data ?? []).length;
  const pendingInviteEmails = ((pendingInvitesRes.data ?? []) as { email: string }[]).map((i) => i.email);

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
        acceptedMemberCount={acceptedMemberCount}
        pendingInviteCount={pendingInviteEmails.length}
        pendingInviteEmails={pendingInviteEmails}
      />
    </div>
  );
}
