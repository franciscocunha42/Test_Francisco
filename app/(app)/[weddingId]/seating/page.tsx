import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import type { Guest, SeatingTable } from "@/lib/types/database";
import { SeatingPlan } from "@/components/SeatingPlan";

export default async function SeatingPage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  const [tablesRes, guestsRes] = await Promise.all([
    supabase
      .from("seating_tables")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("sort_order")
      .order("name"),
    supabase
      .from("guests")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("last_name"),
  ]);

  const tables = (tablesRes.data ?? []) as SeatingTable[];
  const guests = (guestsRes.data ?? []) as Guest[];

  return <SeatingPlan weddingId={weddingId} tables={tables} guests={guests} />;
}
