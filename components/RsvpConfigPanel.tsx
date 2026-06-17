"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, X, Save } from "lucide-react";
import { updateRsvpConfig } from "@/lib/actions/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n/provider";
import type { RsvpConfig } from "@/lib/types/database";

interface RsvpConfigPanelProps {
  weddingId: string;
  formId: string;
  initialConfig: RsvpConfig | null;
}

export function RsvpConfigPanel({ weddingId, formId, initialConfig }: RsvpConfigPanelProps) {
  const t = useT();
  const [mealOptions, setMealOptions] = useState<string[]>(initialConfig?.meal_options ?? []);
  const [allowNew, setAllowNew] = useState(initialConfig?.allow_new_guests ?? true);
  const [newOption, setNewOption] = useState("");
  const [saving, setSaving] = useState(false);

  function addOption() {
    const trimmed = newOption.trim();
    if (!trimmed || mealOptions.includes(trimmed)) return;
    setMealOptions((prev) => [...prev, trimmed]);
    setNewOption("");
  }

  function removeOption(opt: string) {
    setMealOptions((prev) => prev.filter((o) => o !== opt));
  }

  async function save() {
    setSaving(true);
    const result = await updateRsvpConfig(weddingId, formId, {
      meal_options: mealOptions,
      allow_new_guests: allowNew,
    });
    setSaving(false);
    if (result.ok === false) { toast.error(result.error); return; }
    toast.success(t("rsvpConfig.saved"));
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("rsvpConfig.settings")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Meal options */}
        <div className="space-y-2">
          <Label>{t("rsvpConfig.mealOptions")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("rsvpConfig.mealHelp")}
          </p>
          <div className="flex flex-wrap gap-2">
            {mealOptions.map((opt) => (
              <span
                key={opt}
                className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-sm"
              >
                {opt}
                <button
                  type="button"
                  onClick={() => removeOption(opt)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={t("rsvpConfig.removeOption").replace("{opt}", opt)}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
            />
            <Button type="button" variant="outline" onClick={addOption} disabled={!newOption.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Allow new guests */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">{t("rsvpConfig.allowNew")}</p>
            <p className="text-xs text-muted-foreground">
              {t("rsvpConfig.allowNewHelp")}
            </p>
          </div>
          <Switch checked={allowNew} onCheckedChange={setAllowNew} />
        </div>

        <Button onClick={save} disabled={saving} size="sm">
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {saving ? t("common.savingChanges") : t("rsvpConfig.saveSettings")}
        </Button>
      </CardContent>
    </Card>
  );
}
