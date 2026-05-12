"use client";

import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";
import type { Guest } from "@/lib/types/database";

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#6b7280"];

interface RsvpSummaryCardProps {
  guests: Guest[];
  href?: string;
}

export function RsvpSummaryCard({ guests, href }: RsvpSummaryCardProps) {
  const t = useT();
  const attending = guests.filter((g) => g.rsvp_status === "attending").length;
  const notAttending = guests.filter((g) => g.rsvp_status === "not_attending").length;
  const pending = guests.filter((g) => g.rsvp_status === "pending").length;
  const total = guests.length;

  const data = [
    { name: t("guests.attending"),     value: attending },
    { name: t("guests.notAttending"),  value: notAttending },
    { name: t("guests.pending"),       value: pending },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{t("guests.title")}</CardTitle>
        {href && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={href}>{t("common.viewAll")}</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
          <div className="h-48 w-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}`} contentStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-muted-foreground">{t("guests.attending")}</span>
              <span className="ml-auto font-semibold">{attending}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
              <span className="text-muted-foreground">{t("guests.notAttending")}</span>
              <span className="ml-auto font-semibold">{notAttending}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-muted-foreground">{t("guests.pending")}</span>
              <span className="ml-auto font-semibold">{pending}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 border-t pt-1">
              <span className="text-muted-foreground">{t("seating.total")}</span>
              <span className="ml-auto font-bold">{total}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
