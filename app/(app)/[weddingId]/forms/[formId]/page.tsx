import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import type { Form, FormQuestion, FormResponse } from "@/lib/types/database";
import { applyRsvpTemplate } from "@/lib/actions/forms";
import { FormBuilder } from "@/components/FormBuilder";
import { RsvpConfigPanel } from "@/components/RsvpConfigPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Wand2 } from "lucide-react";
import { formatDate } from "@/lib/utils/format";

export default async function FormDetailPage({ params }: { params: { weddingId: string; formId: string } }) {
  const { weddingId, formId } = params;
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  const [formRes, questionsRes, responsesRes] = await Promise.all([
    supabase.from("forms").select("*").eq("id", formId).single(),
    supabase.from("form_questions").select("*").eq("form_id", formId).order("sort_order"),
    supabase.from("form_responses").select("*").eq("form_id", formId).order("submitted_at", { ascending: false }),
  ]);

  const form = formRes.data as Form | null;
  const questions = (questionsRes.data ?? []) as FormQuestion[];
  const responses = (responsesRes.data ?? []) as FormResponse[];

  if (!form) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const publicUrl = `${siteUrl}/rsvp/${form.public_slug}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href={`/${weddingId}/forms`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-xl font-semibold">{form.title}</h1>
            <Badge variant={form.is_active ? "success" : "secondary"}>{form.is_active ? "Active" : "Inactive"}</Badge>
          </div>
        </div>
      </div>

      {/* Public link */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Public Link</p>
          <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-mono">
            <span className="flex-1 truncate">{publicUrl}</span>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* RSVP config panel (replaces question builder for rsvp type) */}
      {form.type === "rsvp" ? (
        <RsvpConfigPanel
          weddingId={weddingId}
          formId={formId}
          initialConfig={(form as Form).config_json}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Questions</h2>
            {(questions?.length ?? 0) === 0 && (
              <form action={async () => { "use server"; await applyRsvpTemplate(weddingId, formId); }}>
                <Button variant="outline" size="sm" type="submit">
                  <Wand2 className="mr-1.5 h-3.5 w-3.5" />Use RSVP Template
                </Button>
              </form>
            )}
          </div>
          <FormBuilder weddingId={weddingId} formId={formId} initialQuestions={questions ?? []} />
        </div>
      )}

      {/* Responses */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Responses ({responses?.length ?? 0})</h2>
        {(responses?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No responses yet. Share the link with your guests!</p>
        ) : (
          <div className="space-y-2">
            {(responses ?? []).map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <p className="mb-1 text-xs text-muted-foreground">{formatDate(r.submitted_at, "MMM d, yyyy 'at' h:mm a")}</p>
                  <div className="space-y-1">
                    {Object.entries(r.response_json as Record<string, unknown>).map(([qId, answer]) => {
                      const q = (questions ?? []).find((q) => q.id === qId);
                      return (
                        <div key={qId} className="flex gap-2 text-sm">
                          <span className="text-muted-foreground shrink-0">{q?.question_text ?? qId}:</span>
                          <span className="font-medium">{Array.isArray(answer) ? answer.join(", ") : String(answer)}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
