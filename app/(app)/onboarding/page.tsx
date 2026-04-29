import Link from "next/link";
import { requireUser, getUserWeddings } from "@/lib/auth";
import { createWedding } from "@/lib/actions/wedding";
import type { Wedding } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Plus, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils/format";

export default async function OnboardingPage() {
  const user = await requireUser();
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
            <form action={async (fd: FormData) => { await createWedding(fd); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="partner_one_name">Your Name *</Label>
                  <Input id="partner_one_name" name="partner_one_name" required placeholder="Avery" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="partner_two_name">Partner&apos;s Name *</Label>
                  <Input id="partner_two_name" name="partner_two_name" required placeholder="Jordan" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="name">Wedding Name *</Label>
                <Input id="name" name="name" required placeholder="Avery & Jordan's Wedding" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="wedding_date">Wedding Date</Label>
                  <Input id="wedding_date" name="wedding_date" type="date" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="total_budget">Budget</Label>
                  <Input id="total_budget" name="total_budget" type="number" min="0" placeholder="30000" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" name="currency" defaultValue="USD" maxLength={3} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="venue_name">Venue Name</Label>
                <Input id="venue_name" name="venue_name" placeholder="The Grand Ballroom" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="New York, NY" />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Wedding
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
