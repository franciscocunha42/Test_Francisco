"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2, ChevronRight, Heart, ListChecks, PiggyBank,
  Search, Sparkles, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

const STORAGE_KEY = "vowplan:guest:setup-dismissed";

interface GuestSetupGuideProps {
  hasNames: boolean;
  hasBudget: boolean;
  hasTasks: boolean;
  hasVendors: boolean;
  onEditDetails: () => void;
  onGenerateTasks: () => void;
  canGenerateTasks: boolean;
}

export function GuestSetupGuide({
  hasNames,
  hasBudget,
  hasTasks,
  hasVendors,
  onEditDetails,
  onGenerateTasks,
  canGenerateTasks,
}: GuestSetupGuideProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function dismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setDismissed(true);
  }

  const steps = [
    {
      key: "names",
      icon: Heart,
      title: "Add your names, date & venue",
      description: "Tell us a few details so we can personalise your plan.",
      done: hasNames,
      action: (
        <Button size="sm" variant={hasNames ? "outline" : "default"} onClick={onEditDetails}>
          {hasNames ? "Edit details" : "Add details"}
        </Button>
      ),
    },
    {
      key: "budget",
      icon: PiggyBank,
      title: "Set your wedding budget",
      description: "We'll split it across the default categories.",
      done: hasBudget,
      action: (
        <Button size="sm" variant={hasBudget ? "outline" : "default"} asChild>
          <Link href="/plan/budget">
            {hasBudget ? "Review budget" : "Set budget"}
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      ),
    },
    {
      key: "tasks",
      icon: ListChecks,
      title: "Generate your wedding checklist",
      description: "Pre-fill a timeline of tasks based on your wedding date.",
      done: hasTasks,
      action: hasTasks ? (
        <Button asChild variant="outline" size="sm">
          <Link href="/plan/timeline">
            Open checklist <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      ) : (
        <Button size="sm" onClick={onGenerateTasks} disabled={!canGenerateTasks}>
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          {canGenerateTasks ? "Generate checklist" : "Add a date first"}
        </Button>
      ),
    },
    {
      key: "vendors",
      icon: Search,
      title: "Browse and shortlist suppliers",
      description: "Explore the venue directory and add the ones you like.",
      done: hasVendors,
      action: (
        <Button asChild size="sm" variant={hasVendors ? "outline" : "default"}>
          <Link href="/plan/suppliers">
            {hasVendors ? "Manage suppliers" : "Browse venues"}
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      ),
    },
  ];

  const completed = steps.filter((s) => s.done).length;

  if (dismissed || completed === steps.length) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-primary/20 p-4">
          <div>
            <p className="text-sm font-semibold">Welcome to VowPlan — let&apos;s get started</p>
            <p className="text-xs text-muted-foreground">
              {completed} of {steps.length} steps complete
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss setup guide"
            className="rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ol className="divide-y divide-primary/10">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.key} className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                      step.done
                        ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                        : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {step.done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="max-w-md">
                    <p className={cn("font-medium leading-tight text-sm", step.done && "text-muted-foreground line-through")}>
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                <div className="ml-12 sm:ml-0">{step.action}</div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
