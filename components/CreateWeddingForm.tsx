"use client";

import { useState, useTransition } from "react";
import { createWedding } from "@/lib/actions/wedding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export function CreateWeddingForm({ hasWeddings }: { hasWeddings: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createWedding(fd);
      if (result && !result.ok) {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          "Creating..."
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            {hasWeddings ? "Create New Wedding" : "Create Wedding"}
          </>
        )}
      </Button>
    </form>
  );
}
