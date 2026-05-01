import Link from "next/link";
import { requireUser, getUserWeddings } from "@/lib/auth";
import type { Wedding } from "@/lib/types/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { CreateWeddingForm } from "@/components/CreateWeddingForm";

export default async function OnboardingPage() {
  await requireUser();
  const memberships = await getUserWeddings();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-champagne-50 to-white p-4">
      <div className="mb-8 flex items-center gap-2">
        <Heart className="h-6 w-6 text-primary fill-primary" />
        <span className="font-serif text-2xl font-semibold text-primary">VowPlan</span>
      </div>

      <div className="w-full max-w-md space-y-6">
        {memberships.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Weddings</CardTitle>
              <CardDescription>Continue planning your wedding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {memberships.map((m) => {
                const wedding = m.weddings as unknown as Pick<Wedding, "id" | "name" | "wedding_date">;
                return (
                  <Link
                    key={wedding.id}
                    href={`/${wedding.id}/dashboard`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{wedding.name}</p>
                      {wedding.wedding_date && (
                        <p className="text-xs text-muted-foreground">{formatDate(wedding.wedding_date)}</p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{memberships.length > 0 ? "Create New Wedding" : "Create Your Wedding"}</CardTitle>
            <CardDescription>Set up your wedding workspace to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateWeddingForm hasWeddings={memberships.length > 0} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
