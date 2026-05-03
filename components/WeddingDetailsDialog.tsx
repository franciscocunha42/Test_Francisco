"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface WeddingDetailsInput {
  name: string;
  partner_one_name: string;
  partner_two_name: string;
  wedding_date: string | null;
  venue_name: string | null;
  location: string | null;
  total_budget: number;
  currency: string;
}

interface WeddingDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues: Partial<WeddingDetailsInput>;
  onSave: (data: WeddingDetailsInput) => Promise<void>;
  title?: string;
  requireNames?: boolean;
}

export function WeddingDetailsDialog({
  open,
  onOpenChange,
  defaultValues,
  onSave,
  title = "Edit wedding details",
  requireNames = false,
}: WeddingDetailsDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<{
    name: string;
    partner_one_name: string;
    partner_two_name: string;
    wedding_date: string | null;
    venue_name: string | null;
    location: string | null;
    total_budget: number;
    currency: string;
  }>({
    name: defaultValues.name ?? "Our Wedding",
    partner_one_name: defaultValues.partner_one_name ?? "",
    partner_two_name: defaultValues.partner_two_name ?? "",
    wedding_date: defaultValues.wedding_date ?? null,
    venue_name: defaultValues.venue_name ?? null,
    location: defaultValues.location ?? null,
    total_budget: defaultValues.total_budget ?? 0,
    currency: defaultValues.currency ?? "USD",
  });

  useEffect(() => {
    if (open) {
      setValues({
        name: defaultValues.name ?? "Our Wedding",
        partner_one_name: defaultValues.partner_one_name ?? "",
        partner_two_name: defaultValues.partner_two_name ?? "",
        wedding_date: defaultValues.wedding_date ?? null,
        venue_name: defaultValues.venue_name ?? null,
        location: defaultValues.location ?? null,
        total_budget: defaultValues.total_budget ?? 0,
        currency: defaultValues.currency ?? "USD",
      });
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSave() {
    if (requireNames && (!values.partner_one_name.trim() || !values.partner_two_name.trim())) {
      setError("Please enter both partner names before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...values,
        wedding_date: values.wedding_date || null,
        venue_name: values.venue_name || null,
        location: values.location || null,
      });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="wd-name">Wedding Name</Label>
            <Input
              id="wd-name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Alice & Bob's Wedding"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="wd-p1">Partner 1 Name</Label>
              <Input
                id="wd-p1"
                value={values.partner_one_name}
                onChange={(e) => set("partner_one_name", e.target.value)}
                placeholder="e.g. Alice"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="wd-p2">Partner 2 Name</Label>
              <Input
                id="wd-p2"
                value={values.partner_two_name}
                onChange={(e) => set("partner_two_name", e.target.value)}
                placeholder="e.g. Bob"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="wd-date">Wedding Date</Label>
              <Input
                id="wd-date"
                type="date"
                value={values.wedding_date ?? ""}
                onChange={(e) => set("wedding_date", e.target.value || null)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="wd-venue">Venue Name</Label>
              <Input
                id="wd-venue"
                value={values.venue_name ?? ""}
                onChange={(e) => set("venue_name", e.target.value)}
                placeholder="e.g. The Grand Hall"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="wd-location">Location</Label>
            <Input
              id="wd-location"
              value={values.location ?? ""}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. New York, NY"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
