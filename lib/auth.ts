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
    .select("role, weddings(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getLatestWeddingId(): Promise<string | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = createClient();

  const { data } = await supabase
    .from("wedding_members")
    .select("wedding_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data?.wedding_id ?? null;
}
