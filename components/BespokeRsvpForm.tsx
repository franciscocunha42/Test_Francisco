"use client";

import { useState } from "react";
import { Heart, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils/format";
import type { Form, RsvpConfig } from "@/lib/types/database";

interface WeddingInfo {
  partner_one_name: string;
  partner_two_name: string;
  wedding_date: string | null;
  venue_name: string | null;
  location: string | null;
}

interface BespokeRsvpFormProps {
  form: Form;
  wedding: WeddingInfo;
}

interface FormValues {
  first_name: string;
  last_name: string;
  email: string;
  attending: "yes" | "no" | "";
  meal_choice: string;
  dietary_requirements: string;
  notes: string;
}

const EMPTY: FormValues = {
  first_name: "",
  last_name: "",
  email: "",
  attending: "",
  meal_choice: "",
  dietary_requirements: "",
  notes: "",
};

export function BespokeRsvpForm({ form, wedding }: BespokeRsvpFormProps) {
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config: RsvpConfig = form.config_json ?? {};
  const mealOptions = config.meal_options ?? [];
  const isAttending = values.attending === "yes";

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.attending) { setError("Please let us know if you can attend."); return; }
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/rsvp/${form.public_slug}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim() || null,
        attending: values.attending === "yes",
        meal_choice: isAttending ? (values.meal_choice || null) : null,
        dietary_requirements: isAttending ? (values.dietary_requirements.trim() || null) : null,
        notes: values.notes.trim() || null,
      }),
    });

    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong. Please try again."); return; }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-champagne-50 to-white">
        <CheckCircle2 className="mb-4 h-14 w-14 text-emerald-500" />
        <h1 className="font-serif text-3xl font-semibold">
          {values.attending === "yes" ? "See you there!" : "Thanks for letting us know"}
        </h1>
        <p className="mt-3 max-w-sm text-muted-foreground">
          {values.attending === "yes"
            ? `We're so excited to celebrate with you, ${values.first_name}! We'll be in touch with more details soon.`
            : `We're sorry you can't make it, ${values.first_name}. We'll be thinking of you!`}
        </p>
        <div className="mt-6 flex items-center gap-2 text-primary">
          <Heart className="h-4 w-4 fill-primary" />
          <span className="font-serif text-sm">
            {wedding.partner_one_name} &amp; {wedding.partner_two_name}
          </span>
          <Heart className="h-4 w-4 fill-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-champagne-50 to-white">
      <div className="mx-auto max-w-lg px-4 py-12">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <Heart className="h-6 w-6 text-primary fill-primary" />
          </div>
          <h1 className="font-serif text-3xl font-semibold">
            {wedding.partner_one_name} &amp; {wedding.partner_two_name}
          </h1>
          {wedding.wedding_date && (
            <p className="mt-1 text-muted-foreground">{formatDate(wedding.wedding_date, "EEEE, MMMM d, yyyy")}</p>
          )}
          {(wedding.venue_name || wedding.location) && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {wedding.venue_name ?? wedding.location}
            </p>
          )}
          <div className="mt-4 border-t pt-4">
            <h2 className="font-serif text-xl font-medium">{form.title}</h2>
            {form.description && <p className="mt-1 text-sm text-muted-foreground">{form.description}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First Name <span className="text-destructive">*</span></Label>
              <Input
                required
                value={values.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                placeholder="Jane"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name <span className="text-destructive">*</span></Label>
              <Input
                required
                value={values.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                placeholder="Smith"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label>Email <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
            <Input
              type="email"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="jane@example.com"
            />
          </div>

          {/* Attending */}
          <div className="space-y-2">
            <Label>Will you be attending? <span className="text-destructive">*</span></Label>
            <RadioGroup
              value={values.attending}
              onValueChange={(v) => set("attending", v as "yes" | "no")}
              className="grid grid-cols-2 gap-3"
            >
              {[
                { value: "yes", label: "Joyfully accepts" },
                { value: "no",  label: "Regretfully declines" },
              ].map(({ value, label }) => (
                <label
                  key={value}
                  htmlFor={`attending-${value}`}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                    values.attending === value
                      ? value === "yes"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-red-400 bg-red-50 text-red-800"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value={value} id={`attending-${value}`} className="sr-only" />
                  {label}
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Attending-only fields */}
          {isAttending && (
            <>
              {/* Meal choice */}
              {mealOptions.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Meal Choice <span className="text-destructive">*</span></Label>
                  <Select value={values.meal_choice} onValueChange={(v) => set("meal_choice", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your meal preference" />
                    </SelectTrigger>
                    <SelectContent>
                      {mealOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Dietary requirements */}
              <div className="space-y-1.5">
                <Label>Dietary Requirements &amp; Intolerances</Label>
                <Input
                  value={values.dietary_requirements}
                  onChange={(e) => set("dietary_requirements", e.target.value)}
                  placeholder="Vegetarian, nut allergy, gluten-free…"
                />
                <p className="text-xs text-muted-foreground">Leave blank if none.</p>
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Message to the couple <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
            <Textarea
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Share your well-wishes or any other information…"
              rows={3}
            />
          </div>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Sending…" : "Submit RSVP"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">Powered by VowPlan</p>
      </div>
    </div>
  );
}
