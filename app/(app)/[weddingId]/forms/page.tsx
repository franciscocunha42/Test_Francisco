"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createForm, deleteForm } from "@/lib/actions/forms";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, ExternalLink, Copy, Pencil, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n/provider";
import type { Form } from "@/lib/types/database";

const FORM_TYPE_LABELS: Record<string, string> = {
  rsvp: "forms.typeRsvp",
  dietary: "forms.typeDietary",
  song_request: "forms.typeSongRequest",
  travel: "forms.typeTravel",
  custom: "forms.typeCustom",
};

export default function FormsPage({ params }: { params: { weddingId: string } }) {
  const { weddingId } = params;
  const supabase = createClient();
  const t = useT();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState({ title: "", description: "", type: "custom" });
  const [creating, setCreating] = useState(false);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  async function fetchForms() {
    const { data } = await supabase.from("forms").select("*").eq("wedding_id", weddingId).order("created_at");
    setForms(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchForms(); }, [weddingId]);

  async function handleCreate() {
    setCreating(true);
    const result = await createForm(weddingId, formValues);
    setCreating(false);
    if (result?.ok === false) { toast.error(result.error); return; }
    toast.success(t("forms.created"));
    setOpen(false);
    setFormValues({ title: "", description: "", type: "custom" });
    fetchForms();
  }

  async function handleDelete(formId: string) {
    const result = await deleteForm(weddingId, formId);
    if (result?.ok === false) toast.error(result.error);
    else { toast.success(t("forms.deleted")); fetchForms(); }
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${siteUrl}/rsvp/${slug}`);
    toast.success(t("common.copied"));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold">{t("forms.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("forms.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />{t("forms.newForm")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("forms.createForm")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>{t("forms.formTitle")} *</Label>
                <Input value={formValues.title} onChange={(e) => setFormValues((v) => ({ ...v, title: e.target.value }))} placeholder={t("forms.titlePh")} />
              </div>
              <div className="space-y-1">
                <Label>{t("forms.description")}</Label>
                <Textarea value={formValues.description} onChange={(e) => setFormValues((v) => ({ ...v, description: e.target.value }))} rows={2} />
              </div>
              <div className="space-y-1">
                <Label>{t("forms.type")}</Label>
                <Select value={formValues.type} onValueChange={(v) => setFormValues((fv) => ({ ...fv, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(FORM_TYPE_LABELS).map((typeKey) => (
                      <SelectItem key={typeKey} value={typeKey}>{t(FORM_TYPE_LABELS[typeKey] as never)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
              <Button disabled={!formValues.title || creating} onClick={handleCreate}>
                {creating ? t("common.creating") : t("common.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {forms.length === 0 && !loading ? (
        <EmptyState icon={FileText} title={t("forms.emptyTitle")} description={t("forms.emptyDesc")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {forms.map((form) => (
            <Card key={form.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{form.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={form.is_active ? "success" : "secondary"}>{form.is_active ? t("forms.active") : t("forms.inactive")}</Badge>
                      <Badge variant="outline" className="text-xs">{t((FORM_TYPE_LABELS[form.type] ?? "forms.typeCustom") as never)}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <Link href={`/${weddingId}/forms/${form.id}`}><Pencil className="h-3.5 w-3.5" /></Link>
                    </Button>
                    <ConfirmDialog
                      trigger={<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
                      title={t("forms.deleteForm")}
                      description={`"${form.title}"`}
                      onConfirm={() => handleDelete(form.id)}
                    />
                  </div>
                </div>
                {form.description && <p className="text-xs text-muted-foreground line-clamp-2">{form.description}</p>}
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-xs font-mono text-muted-foreground">
                  <span className="flex-1 truncate">/rsvp/{form.public_slug}</span>
                  <button onClick={() => copyLink(form.public_slug)} className="hover:text-foreground shrink-0">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <a href={`/rsvp/${form.public_slug}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
