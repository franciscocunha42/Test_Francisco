"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { CreateWeddingForm } from "@/components/CreateWeddingForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGuestStore } from "@/lib/guest-store/store";

export default function GuestBootstrapPage() {
  const router = useRouter();
  const wedding = useGuestStore((s) => s.wedding);
  const ensureWedding = useGuestStore((s) => s.ensureWedding);

  useEffect(() => {
    if (wedding) router.replace("/plan/dashboard");
  }, [wedding, router]);

  async function handleSubmit(fd: FormData): Promise<{ ok: boolean; error?: string }> {
    const total_budget_raw = fd.get("total_budget");
    const total_budget =
      total_budget_raw && total_budget_raw !== ""
        ? Number(total_budget_raw)
        : 0;
    ensureWedding({
      name: String(fd.get("name") ?? ""),
      partner_one_name: String(fd.get("partner_one_name") ?? ""),
      partner_two_name: String(fd.get("partner_two_name") ?? ""),
      wedding_date: (fd.get("wedding_date") as string) || null,
      venue_name: (fd.get("venue_name") as string) || null,
      location: (fd.get("location") as string) || null,
      total_budget,
      currency: String(fd.get("currency") ?? "USD"),
    });
    router.replace("/plan/dashboard");
    return { ok: true };
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-champagne-50 to-white p-4">
      <div className="mb-8 flex items-center gap-2">
        <Heart className="h-6 w-6 text-primary fill-primary" />
        <span className="font-serif text-2xl font-semibold text-primary">VowPlan</span>
      </div>

      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Tell us about your wedding</CardTitle>
            <CardDescription>
              Start adding details now — no account needed. You can save to the cloud later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateWeddingForm
              hasWeddings={false}
              onSubmit={handleSubmit}
              submitLabel="Start Planning"
            />
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
