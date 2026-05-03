"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useGuestStore } from "@/lib/guest-store/store";

export default function GuestBootstrapPage() {
  const router = useRouter();
  const ensureWedding = useGuestStore((s) => s.ensureWedding);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    ensureWedding({
      name: "Our Wedding",
      partner_one_name: "",
      partner_two_name: "",
    });
    router.replace("/plan/dashboard");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-champagne-50 to-white p-4">
      <div className="mb-8 flex items-center gap-2">
        <Heart className="h-6 w-6 text-primary fill-primary" />
        <span className="font-serif text-2xl font-semibold text-primary">VowPlan</span>
      </div>
      <p className="text-sm text-muted-foreground">Setting up your wedding…</p>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log In
        </Link>
      </p>
    </div>
  );
}
