"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ListChecks,
  PiggyBank,
  Search,
  UserPlus,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { SetBudgetDialog } from "@/components/SetBudgetDialog";
import { generateDefaultTimelineTasks } from "@/lib/actions/timeline";
import { useT } from "@/lib/i18n/provider";
import type { Wedding } from "@/lib/types/database";

interface SetupGuideProps {
  weddingId: string;
  wedding: Wedding;
  budgetSet: boolean;
  hasTasks: boolean;
  hasVendors: boolean;
}

export function SetupGuide({
  weddingId,
  wedding,
  budgetSet,
  hasTasks,
  hasVendors,
}: SetupGuideProps) {
  const router = useRouter();
  const t = useT();
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [generating, startGenerating] = useTransition();

  const steps = [
    {
      key: "budget",
      icon: PiggyBank,
      title: t("setup.budget.title"),
      description: t("setup.budget.desc"),
      done: budgetSet,
      action: (
        <Button onClick={() => setBudgetOpen(true)} size="sm">
          {budgetSet ? t("setup.budget.ctaUpdate") : t("setup.budget.ctaSet")}
        </Button>
      ),
    },
    {
      key: "tasks",
      icon: ListChecks,
      title: t("setup.checklist.title"),
      description: t("setup.checklist.desc"),
      done: hasTasks,
      action: hasTasks ? (
        <Button asChild variant="outline" size="sm">
          <Link href={`/${weddingId}/timeline`}>
            {t("setup.checklist.ctaOpen")} <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      ) : (
        <Button
          size="sm"
          disabled={generating || !wedding.wedding_date}
          onClick={() => {
            startGenerating(async () => {
              const result = await generateDefaultTimelineTasks(weddingId);
              if (result?.ok === false) toast.error(result.error);
              else { toast.success(t("timeline.tasksGenerated")); router.refresh(); }
            });
          }}
        >
          <Wand2 className="mr-1.5 h-3.5 w-3.5" />
          {generating ? t("setup.checklist.ctaGenerating") : wedding.wedding_date ? t("setup.checklist.ctaGenerate") : t("setup.checklist.needDate")}
        </Button>
      ),
    },
    {
      key: "vendors",
      icon: Search,
      title: t("setup.vendors.title"),
      description: t("setup.vendors.desc"),
      done: hasVendors,
      action: (
        <Button asChild size="sm" variant={hasVendors ? "outline" : "default"}>
          <Link href={`/${weddingId}/suppliers`}>
            {hasVendors ? t("setup.vendors.ctaManage") : t("setup.vendors.ctaBrowse")}
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      ),
    },
    {
      key: "members",
      icon: UserPlus,
      title: t("setup.invite.title"),
      description: t("setup.invite.desc"),
      done: false,
      action: (
        <Button asChild size="sm" variant="outline">
          <Link href={`/${weddingId}/settings#members`}>
            {t("setup.invite.cta")} <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      ),
    },
  ];

  const completed = steps.filter((s) => s.done).length;

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <p className="text-sm font-semibold">{t("setup.title")}</p>
              <p className="text-xs text-muted-foreground">
                {completed} {t("setup.progress").replace("{total}", String(steps.length))}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/${weddingId}/dashboard`}>
                {t("setup.skip")} <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <ol className="divide-y">
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
                          : "border-border bg-muted/50 text-muted-foreground",
                      )}
                    >
                      {step.done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <div className="max-w-md">
                      <p className={cn("font-medium leading-tight", step.done && "text-muted-foreground line-through")}>
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  <div className="ml-12 sm:ml-0">{step.action}</div>
                </li>
              );
            })}
          </ol>
          <div className="border-t bg-muted/30 p-4 text-center">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/${weddingId}/dashboard`}>{t("setup.goToDashboard")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <SetBudgetDialog
        open={budgetOpen}
        onOpenChange={setBudgetOpen}
        weddingId={weddingId}
        initialBudget={wedding.total_budget}
        initialCurrency={wedding.currency}
        weddingDetails={{
          name: wedding.name,
          partner_one_name: wedding.partner_one_name,
          partner_two_name: wedding.partner_two_name,
          wedding_date: wedding.wedding_date ?? null,
          venue_name: wedding.venue_name ?? null,
          location: wedding.location ?? null,
        }}
      />
    </>
  );
}
