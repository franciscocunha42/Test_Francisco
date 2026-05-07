import { redirect } from "next/navigation";
import { createAuthClient, createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireWeddingMember(weddingId: string) {
  const user = await requireUser();
  const supabase = createClient();

  const { data } = await supabase
    .from("wedding_members")
    .select("role")
    .eq("wedding_id", weddingId)
    .eq("user_id", user.id)
    .single();

  if (!data) redirect("/onboarding");
  return { user, role: data.role };
}

export async function getUserWeddings() {
  const user = await requireUser();
  const supabase = createClient();

  const { data } = await supabase
    .from("wedding_members")
    .select("role, is_default, weddings(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getLatestWeddingId(): Promise<string | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = createClient();

  // Prefer the wedding the user explicitly set as default
  const { data: defaultMembership } = await supabase
    .from("wedding_members")
    .select("wedding_id")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .limit(1)
    .single();

  if (defaultMembership?.wedding_id) return defaultMembership.wedding_id;

  // Fall back to the most recently joined wedding
  const { data } = await supabase
    .from("wedding_members")
    .select("wedding_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data?.wedding_id ?? null;
}
