"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useT } from "@/lib/i18n/provider";
import type { Form, FormQuestion } from "@/lib/types/database";

interface PublicRSVPFormProps {
  form: Form;
  questions: FormQuestion[];
}

export function PublicRSVPForm({ form, questions }: PublicRSVPFormProps) {
  const t = useT();
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setValue(questionId: string, value: string | string[]) {
    setValues((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/forms/${form.public_slug}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responses: values }),
    });

    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? t("common.somethingWrong")); return; }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <Heart className="mb-4 h-12 w-12 text-primary fill-primary" />
        <h1 className="font-serif text-3xl font-semibold">{t("rsvp.thanks")}</h1>
        <p className="mt-2 text-muted-foreground">{t("rsvp.recorded")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-champagne-50 to-white">
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="mb-8 text-center">
          <Heart className="mx-auto mb-3 h-8 w-8 text-primary fill-primary" />
          <h1 className="font-serif text-3xl font-semibold">{form.title}</h1>
          {form.description && <p className="mt-2 text-muted-foreground">{form.description}</p>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">
          {questions.sort((a, b) => a.sort_order - b.sort_order).map((q) => (
            <div key={q.id} className="space-y-2">
              <Label>
                {q.question_text}
                {q.required && <span className="ml-1 text-destructive">*</span>}
              </Label>
              {q.question_type === "text" && (
                <Input
                  required={q.required}
                  value={(values[q.id] as string) ?? ""}
                  onChange={(e) => setValue(q.id, e.target.value)}
                />
              )}
              {q.question_type === "email" && (
                <Input
                  type="email"
                  required={q.required}
                  value={(values[q.id] as string) ?? ""}
                  onChange={(e) => setValue(q.id, e.target.value)}
                />
              )}
              {q.question_type === "phone" && (
                <Input
                  type="tel"
                  required={q.required}
                  value={(values[q.id] as string) ?? ""}
                  onChange={(e) => setValue(q.id, e.target.value)}
                />
              )}
              {q.question_type === "textarea" && (
                <Textarea
                  required={q.required}
                  value={(values[q.id] as string) ?? ""}
                  onChange={(e) => setValue(q.id, e.target.value)}
                  rows={3}
                />
              )}
              {q.question_type === "radio" && q.options_json && (
                <RadioGroup
                  value={(values[q.id] as string) ?? ""}
                  onValueChange={(v) => setValue(q.id, v)}
                >
                  {q.options_json.map((opt) => (
                    <div key={opt} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                      <Label htmlFor={`${q.id}-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              {q.question_type === "select" && q.options_json && (
                <Select
                  value={(values[q.id] as string) ?? ""}
                  onValueChange={(v) => setValue(q.id, v)}
                >
                  <SelectTrigger><SelectValue placeholder={t("rsvp.selectOption")} /></SelectTrigger>
                  <SelectContent>
                    {q.options_json.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {q.question_type === "checkbox" && q.options_json && (
                <div className="space-y-1.5">
                  {q.options_json.map((opt) => {
                    const selected = (values[q.id] as string[] | undefined) ?? [];
                    return (
                      <div key={opt} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`${q.id}-${opt}`}
                          checked={selected.includes(opt)}
                          onChange={(e) => {
                            if (e.target.checked) setValue(q.id, [...selected, opt]);
                            else setValue(q.id, selected.filter((s) => s !== opt));
                          }}
                          className="h-4 w-4 rounded border-primary accent-primary"
                        />
                        <Label htmlFor={`${q.id}-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? t("rsvp.submitting") : t("rsvp.submit")}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">{t("rsvp.poweredBy")}</p>
      </div>
    </div>
  );
}
