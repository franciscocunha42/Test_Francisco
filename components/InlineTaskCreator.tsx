"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createTask } from "@/lib/actions/timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_BUDGET_CATEGORY_NAMES } from "@/lib/utils/budget-categories";
import type { TaskFormValues } from "@/lib/schemas/timeline";

interface InlineTaskCreatorProps {
  weddingId: string;
  /** Category names available in the dropdown. Defaults to the standard budget categories. */
  categories?: string[];
  /** When provided (guest mode), called instead of the createTask server action. */
  onSubmit?: (data: TaskFormValues) => Promise<{ ok: boolean; error?: string }>;
  /** Called after a task is successfully created (e.g. to re-fetch tasks). */
  onSuccess?: () => void;
}

type Priority = "low" | "medium" | "high";

const EMPTY_FORM = {
  title: "",
  dueDate: "",
  priority: "medium" as Priority,
  category: "",
};

export function InlineTaskCreator({ weddingId, categories, onSubmit: onSubmitProp, onSuccess }: InlineTaskCreatorProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [pending, startTransition] = useTransition();
  const categoryOptions = Array.from(
    new Set([...DEFAULT_BUDGET_CATEGORY_NAMES, ...(categories ?? [])].filter(Boolean) as string[]),
  );

  const canSubmit = form.title.trim().length > 0 && !pending;

  function update<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && canSubmit) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    if (!canSubmit) return;
    const data: TaskFormValues = {
      title: form.title.trim(),
      description: null,
      category: form.category.trim() || null,
      due_date: form.dueDate || null,
      status: "not_started",
      priority: form.priority,
      sort_order: 0,
    };

    startTransition(async () => {
      const result = onSubmitProp
        ? await onSubmitProp(data)
        : await createTask(weddingId, data);
      if (result?.ok === false) {
        toast.error(result.error ?? "Failed to create task");
        return;
      }
      toast.success("Task added");
      setForm(EMPTY_FORM);
      onSuccess?.();
    });
  }

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Quick add a task
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[180px] space-y-1">
          <Label htmlFor="qa-title" className="text-xs text-muted-foreground">
            What do you need to do? *
          </Label>
          <Input
            id="qa-title"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Book the florist"
            disabled={pending}
          />
        </div>

        <div className="w-[140px] space-y-1">
          <Label htmlFor="qa-date" className="text-xs text-muted-foreground">
            Due date
          </Label>
          <Input
            id="qa-date"
            type="date"
            value={form.dueDate}
            onChange={(e) => update("dueDate", e.target.value)}
            disabled={pending}
          />
        </div>

        <div className="w-[120px] space-y-1">
          <Label className="text-xs text-muted-foreground">Priority</Label>
          <Select
            value={form.priority}
            onValueChange={(v) => update("priority", v as Priority)}
            disabled={pending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[170px] space-y-1">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Select
            value={form.category || "none"}
            onValueChange={(v) => update("category", v === "none" ? "" : v)}
            disabled={pending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No category</SelectItem>
              {categoryOptions.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={submit} disabled={!canSubmit} size="sm" className="h-9">
          <Plus className="mr-1 h-4 w-4" />
          {pending ? "Adding…" : "Add"}
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Tip: only the title is required. Press Enter to add.
      </p>
    </div>
  );
}
