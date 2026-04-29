import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = createClient();
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
