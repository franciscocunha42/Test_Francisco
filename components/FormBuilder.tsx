"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { upsertFormQuestions } from "@/lib/actions/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/lib/i18n/provider";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { FormQuestion, QuestionType } from "@/lib/types/database";

const QUESTION_TYPES: { value: QuestionType; labelKey: TranslationKey }[] = [
  { value: "text",     labelKey: "forms.qtText" },
  { value: "textarea", labelKey: "forms.qtTextarea" },
  { value: "email",    labelKey: "forms.qtEmail" },
  { value: "phone",    labelKey: "forms.qtPhone" },
  { value: "select",   labelKey: "forms.qtSelect" },
  { value: "radio",    labelKey: "forms.qtRadio" },
  { value: "checkbox", labelKey: "forms.qtCheckbox" },
];

interface LocalQuestion {
  id?: string;
  question_text: string;
  question_type: QuestionType;
  options_json: string[] | null;
  required: boolean;
  sort_order: number;
}

interface FormBuilderProps {
  weddingId: string;
  formId: string;
  initialQuestions: FormQuestion[];
}

export function FormBuilder({ weddingId, formId, initialQuestions }: FormBuilderProps) {
  const t = useT();
  const [questions, setQuestions] = useState<LocalQuestion[]>(
    initialQuestions.map((q) => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options_json: q.options_json,
      required: q.required,
      sort_order: q.sort_order,
    }))
  );
  const [saving, setSaving] = useState(false);

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { question_text: "", question_type: "text", options_json: null, required: false, sort_order: prev.length },
    ]);
  }

  function updateQuestion(i: number, patch: Partial<LocalQuestion>) {
    setQuestions((prev) => prev.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  }

  function removeQuestion(i: number) {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    const result = await upsertFormQuestions(weddingId, formId, questions);
    setSaving(false);
    if (result?.ok === false) toast.error(result.error);
    else toast.success(t("forms.questionsSaved"));
  }

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-start gap-2">
            <GripVertical className="h-5 w-5 shrink-0 text-muted-foreground mt-2" />
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <Label>{t("forms.question")}</Label>
                <Input
                  value={q.question_text}
                  onChange={(e) => updateQuestion(i, { question_text: e.target.value })}
                  placeholder={t("forms.questionPlaceholder")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{t("forms.type")}</Label>
                  <Select
                    value={q.question_type}
                    onValueChange={(v) => updateQuestion(i, {
                      question_type: v as QuestionType,
                      options_json: ["select", "radio", "checkbox"].includes(v) ? (q.options_json ?? [""]) : null,
                    })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map((qt) => <SelectItem key={qt.value} value={qt.value}>{t(qt.labelKey)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2 pb-0.5">
                  <Switch
                    id={`req-${i}`}
                    checked={q.required}
                    onCheckedChange={(v) => updateQuestion(i, { required: v })}
                  />
                  <Label htmlFor={`req-${i}`}>{t("forms.required")}</Label>
                </div>
              </div>
              {["select", "radio", "checkbox"].includes(q.question_type) && (
                <div className="space-y-1">
                  <Label>{t("forms.optionsPerLine")}</Label>
                  <textarea
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={(q.options_json ?? []).join("\n")}
                    onChange={(e) => updateQuestion(i, { options_json: e.target.value.split("\n").filter(Boolean) })}
                  />
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive mt-1" onClick={() => removeQuestion(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" onClick={addQuestion}>
          <Plus className="h-4 w-4 mr-1" />{t("forms.addQuestion")}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t("common.saving") : t("forms.saveQuestions")}
        </Button>
      </div>
    </div>
  );
}
