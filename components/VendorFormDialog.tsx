"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { vendorSchema, type VendorFormValues } from "@/lib/schemas/vendor";
import { createVendor, updateVendor } from "@/lib/actions/vendor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Vendor } from "@/lib/types/database";

const CATEGORIES = [
  "venue","catering","dj","music","photography","videography",
  "flowers","cake","transport","makeup","dress","suit","stationery","other",
];

const STATUSES = ["researching","contacted","shortlisted","booked","rejected"];

interface VendorFormDialogProps {
  weddingId: string;
  vendor?: Vendor;
  trigger: React.ReactNode;
  onSubmit?: (data: VendorFormValues, existing?: Vendor) => Promise<{ ok: boolean; error?: string }>;
}

export function VendorFormDialog({ weddingId, vendor, trigger, onSubmit: onSubmitProp }: VendorFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [photosText, setPhotosText] = useState((vendor?.photos ?? []).join("\n"));
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: vendor ?? { category: "other", status: "researching", photos: [] },
  });
  const selectedCategory = watch("category");
  const selectedSubcategory = watch("subcategory");

  async function onSubmit(data: VendorFormValues) {
    data.photos = photosText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const result = onSubmitProp
      ? await onSubmitProp(data, vendor)
      : vendor
        ? await updateVendor(weddingId, vendor.id, data)
        : await createVendor(weddingId, data);
    if (result?.ok === false) { toast.error(result.error); return; }
    toast.success(vendor ? "Vendor updated" : "Vendor added");
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{vendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>Business Name *</Label>
              <Input {...register("name")} placeholder="e.g. Luminary Photo Co." />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select defaultValue={vendor?.category ?? "other"} onValueChange={(v) => setValue("category", v as VendorFormValues["category"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select defaultValue={vendor?.status ?? "researching"} onValueChange={(v) => setValue("status", v as VendorFormValues["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Contact Name</Label>
              <Input {...register("contact_name")} placeholder="Jane Smith" />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input {...register("phone")} placeholder="+1 555 000 0000" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input {...register("email")} placeholder="vendor@example.com" />
            </div>
            <div className="space-y-1">
              <Label>Website</Label>
              <Input {...register("website")} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label>Quoted Price</Label>
              <Input type="number" step="0.01" {...register("quoted_price")} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label>Actual Cost</Label>
              <Input type="number" step="0.01" {...register("actual_cost")} placeholder="0.00" />
            </div>
          </div>
          {selectedCategory === "venue" && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Venue Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label>Venue Type</Label>
                  <Select
                    value={selectedSubcategory ?? ""}
                    onValueChange={(v) => setValue("subcategory", v || null, { shouldDirty: true })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quinta">Quinta</SelectItem>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="restaurante">Restaurante</SelectItem>
                      <SelectItem value="salão">Salão</SelectItem>
                      <SelectItem value="praia">Praia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Min Guests</Label>
                  <Input type="number" {...register("min_capacity")} placeholder="e.g. 50" />
                </div>
                <div className="space-y-1">
                  <Label>Max Guests</Label>
                  <Input type="number" {...register("max_capacity")} placeholder="e.g. 300" />
                </div>
                <div className="space-y-1">
                  <Label>Price / Person (€)</Label>
                  <Input type="number" step="0.01" {...register("price_per_person")} placeholder="e.g. 120" />
                </div>
                <div className="space-y-1">
                  <Label>Rating (0–5)</Label>
                  <Input type="number" step="0.1" min="0" max="5" {...register("rating")} placeholder="e.g. 4.8" />
                </div>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea {...register("notes")} rows={2} placeholder="Any additional notes..." />
          </div>
          <div className="space-y-1">
            <Label>Photo URLs</Label>
            <Textarea
              rows={3}
              value={photosText}
              onChange={(e) => setPhotosText(e.target.value)}
              placeholder="One image URL per line, e.g.\n/venues/my-venue.jpg\nhttps://example.com/photo.jpg"
            />
            <p className="text-xs text-muted-foreground">
              One URL per line. Use absolute URLs or paths to files in <code>public/</code>.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
