import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import { addVenueFromDirectory } from "@/lib/actions/vendor";
import type { Vendor, Expense, BudgetCategory } from "@/lib/types/database";
import { SuppliersClientView } from "@/components/SuppliersClientView";

export default async function SuppliersPage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  const [vendorsRes, expensesRes, weddingRes, categoriesRes] = await Promise.all([
    supabase.from("vendors").select("*").eq("wedding_id", weddingId).order("created_at"),
    supabase.from("expenses").select("*").eq("wedding_id", weddingId),
    supabase.from("weddings").select("currency").eq("id", weddingId).single(),
    supabase.from("budget_categories").select("*").eq("wedding_id", weddingId).order("created_at"),
  ]);

  const allVendors = (vendorsRes.data ?? []) as Vendor[];
  const expenses   = (expensesRes.data ?? []) as Expense[];
  const categories = (categoriesRes.data ?? []) as BudgetCategory[];
  const currency   = (weddingRes.data as { currency: string } | null)?.currency ?? "USD";

  const addFromDirectory = addVenueFromDirectory.bind(null, weddingId);

  return (
    <SuppliersClientView
      allVendors={allVendors}
      expenses={expenses}
      categories={categories}
      weddingId={weddingId}
      currency={currency}
      onAddFromDirectory={addFromDirectory}
    />
  );
}
