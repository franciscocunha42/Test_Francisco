"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { guestSchema, type GuestFormValues } from "@/lib/schemas/guest";
import { createGuest, updateGuest } from "@/lib/actions/guest";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Guest } from "@/lib/types/database";

interface GuestFormDialogProps {
  weddingId: string;
  guest?: Guest;
  trigger: React.ReactNode;
  onSaved?: () => void;
}

export function GuestFormDialog({ weddingId, guest, trigger, onSaved }: GuestFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: guest ?? { rsvp_status: "pending", invitation_status: "not_sent", plus_one_allowed: false },
  });

  const plusOneAllowed = watch("plus_one_allowed");

  async function onSubmit(data: GuestFormValues) {
    const result = guest
      ? await updateGuest(weddingId, guest.id, data)
      : await createGuest(weddingId, data);
    if (result?.ok === false) { toast.error(result.error); return; }
    toast.success(guest ? "Guest updated" : "Guest added");
    setOpen(false);
    reset();
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{guest ? "Edit Guest" : "Add Guest"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>First Name *</Label>
              <Input {...register("first_name")} />
              {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Last Name *</Label>
              <Input {...register("last_name")} />
              {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input {...register("phone")} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Party / Group Name</Label>
            <Input {...register("party_name")} placeholder="e.g. Chen Family" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>RSVP Status</Label>
              <Select defaultValue={guest?.rsvp_status ?? "pending"} onValueChange={(v) => setValue("rsvp_status", v as GuestFormValues["rsvp_status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="attending">Attending</SelectItem>
                  <SelectItem value="not_attending">Not Attending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Meal Choice</Label>
              <Input {...register("meal_choice")} placeholder="Chicken, Fish, Vegan..." />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Dietary Requirements</Label>
            <Input {...register("dietary_requirements")} placeholder="Allergies, preferences..." />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="plus_one"
              checked={plusOneAllowed}
              onCheckedChange={(v) => setValue("plus_one_allowed", !!v)}
            />
            <Label htmlFor="plus_one">Plus-one allowed</Label>
          </div>
          {plusOneAllowed && (
            <div className="space-y-1">
              <Label>Plus-one Name</Label>
              <Input {...register("plus_one_name")} />
            </div>
          )}
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea {...register("notes")} rows={2} />
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
