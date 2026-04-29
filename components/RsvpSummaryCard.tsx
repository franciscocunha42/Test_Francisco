"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Guest } from "@/lib/types/database";

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#6b7280"];
const LABELS = ["Attending", "Not Attending", "Pending", "Not Sent"];

interface RsvpSummaryCardProps {
  guests: Guest[];
}

export function RsvpSummaryCard({ guests }: RsvpSummaryCardProps) {
  const attending = guests.filter((g) => g.rsvp_status === "attending").length;
  const notAttending = guests.filter((g) => g.rsvp_status === "not_attending").length;
  const pending = guests.filter((g) => g.rsvp_status === "pending").length;
  const total = guests.length;

  const data = [
    { name: "Attending",     value: attending },
    { name: "Not Attending", value: notAttending },
    { name: "Pending",       value: pending },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Guest RSVP Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="h-28 w-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={48} dataKey="value" paddingAngle={2}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v} guests`} contentStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-muted-foreground">Attending</span>
              <span className="ml-auto font-semibold">{attending}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
              <span className="text-muted-foreground">Not Attending</span>
              <span className="ml-auto font-semibold">{notAttending}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-muted-foreground">Pending</span>
              <span className="ml-auto font-semibold">{pending}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 border-t pt-1">
              <span className="text-muted-foreground">Total</span>
              <span className="ml-auto font-bold">{total}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
