"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus, Upload, Download, Pencil, Trash2, X, Users, Armchair,
} from "lucide-react";
import { exportToCsv } from "@/lib/utils/csv";
import {
  assignGuestToTable, deleteSeatingTable,
} from "@/lib/actions/seating";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SeatingTableFormDialog } from "@/components/SeatingTableFormDialog";
import { SeatingImportDialog } from "@/components/SeatingImportDialog";
import { EmptyState } from "@/components/EmptyState";
import type { Guest, SeatingTable } from "@/lib/types/database";
import type { parseSeatingCsv } from "@/lib/utils/csv";

type ImportResult = {
  ok: boolean;
  error?: string;
  count?: number;
  skippedFull?: number;
  skippedMissing?: number;
  errors?: string[];
};

interface SeatingPlanProps {
  weddingId: string;
  tables: SeatingTable[];
  guests: Guest[];
  /** Override server-action mutations (used by guest mode). */
  onAssign?: (guestId: string, tableId: string | null) => Promise<{ ok: boolean; error?: string }>;
  onDeleteTable?: (tableId: string) => Promise<{ ok: boolean; error?: string }>;
  onCreateTableSubmit?: React.ComponentProps<typeof SeatingTableFormDialog>["onSubmit"];
  onEditTableSubmit?: React.ComponentProps<typeof SeatingTableFormDialog>["onSubmit"];
  onImport?: (rows: ReturnType<typeof parseSeatingCsv>["data"]) => Promise<ImportResult>;
}

export function SeatingPlan({
  weddingId,
  tables,
  guests,
  onAssign,
  onDeleteTable,
  onCreateTableSubmit,
  onEditTableSubmit,
  onImport,
}: SeatingPlanProps) {
  const [pendingAssign, setPendingAssign] = useState<Record<string, boolean>>({});

  // Only attending guests are candidates for seating, but we still show
  // already-assigned guests on whichever table they're on regardless of RSVP.
  const attendingGuests = useMemo(
    () => guests.filter((g) => g.rsvp_status === "attending"),
    [guests],
  );

  const guestsByTable = useMemo(() => {
    const map = new Map<string, Guest[]>();
    for (const t of tables) map.set(t.id, []);
    for (const g of guests) {
      if (g.table_id && map.has(g.table_id)) {
        map.get(g.table_id)!.push(g);
      }
    }
    return map;
  }, [tables, guests]);

  const unassigned = useMemo(
    () => attendingGuests.filter((g) => !g.table_id),
    [attendingGuests],
  );

  const totalSeats = tables.reduce((s, t) => s + t.capacity, 0);
  const totalAssigned = guests.filter((g) => !!g.table_id).length;
  const allocatedAttending = attendingGuests.filter((g) => !!g.table_id).length;

  async function handleAssign(guestId: string, tableId: string | null) {
    setPendingAssign((p) => ({ ...p, [guestId]: true }));
    const result = onAssign
      ? await onAssign(guestId, tableId)
      : await assignGuestToTable(weddingId, guestId, tableId);
    setPendingAssign((p) => {
      const { [guestId]: _, ...rest } = p;
      return rest;
    });
    if (result.ok === false) { toast.error(result.error); return; }
    toast.success(tableId ? "Guest seated" : "Guest unassigned");
  }

  async function handleDeleteTable(table: SeatingTable) {
    const result = onDeleteTable
      ? await onDeleteTable(table.id)
      : await deleteSeatingTable(weddingId, table.id);
    if (result.ok === false) toast.error(result.error);
    else toast.success(`${table.name} removed`);
  }

  function handleExport() {
    if (tables.length === 0) {
      toast.error("No tables to export");
      return;
    }
    const rows: Record<string, string | number>[] = [];
    const sortedTables = [...tables].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    for (const t of sortedTables) {
      const seated = guestsByTable.get(t.id) ?? [];
      if (seated.length === 0) {
        rows.push({
          table_name: t.name,
          capacity: t.capacity,
          first_name: "",
          last_name: "",
          meal_choice: "",
          dietary_requirements: "",
        });
        continue;
      }
      for (const g of seated) {
        rows.push({
          table_name: t.name,
          capacity: t.capacity,
          first_name: g.first_name,
          last_name: g.last_name,
          meal_choice: g.meal_choice ?? "",
          dietary_requirements: g.dietary_requirements ?? "",
        });
      }
    }
    exportToCsv(rows, "vowplan-seating-plan.csv");
    toast.success("Seating plan exported");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Seating Plan</h1>
          <p className="text-sm text-muted-foreground">
            {tables.length} {tables.length === 1 ? "table" : "tables"} · {totalAssigned} of {attendingGuests.length} attending guests seated
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />Export
          </Button>
          <SeatingImportDialog
            weddingId={weddingId}
            onImport={onImport}
            trigger={
              <Button variant="outline" size="sm">
                <Upload className="mr-1.5 h-3.5 w-3.5" />Import CSV
              </Button>
            }
          />
          <SeatingTableFormDialog
            weddingId={weddingId}
            onSubmit={onCreateTableSubmit}
            trigger={
              <Button size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" />Add Table
              </Button>
            }
          />
        </div>
      </div>

      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-4">
          {tables.length === 0 ? (
            <EmptyState
              icon={Armchair}
              title="No tables yet"
              description="Create your first table to start placing guests."
              action={
                <SeatingTableFormDialog
                  weddingId={weddingId}
                  onSubmit={onCreateTableSubmit}
                  trigger={<Button><Plus className="mr-1.5 h-4 w-4" />Add Table</Button>}
                />
              }
            />
          ) : (
            <>
              <UnassignedGuestsCard
                weddingId={weddingId}
                tables={tables}
                guestsByTable={guestsByTable}
                unassigned={unassigned}
                pendingAssign={pendingAssign}
                onAssign={handleAssign}
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {tables.map((t) => {
                  const seated = guestsByTable.get(t.id) ?? [];
                  const free = t.capacity - seated.length;
                  return (
                    <Card key={t.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-base truncate">{t.name}</CardTitle>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {seated.length} / {t.capacity} seats {free === 0 ? "· full" : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <SeatingTableFormDialog
                              weddingId={weddingId}
                              table={t}
                              onSubmit={onEditTableSubmit}
                              trigger={
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              }
                            />
                            <ConfirmDialog
                              trigger={
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              }
                              title="Remove table"
                              description={`Remove ${t.name}? Guests on this table will be unassigned.`}
                              onConfirm={() => handleDeleteTable(t)}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full transition-all ${free === 0 ? "bg-primary" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(100, (seated.length / t.capacity) * 100)}%` }}
                          />
                        </div>
                        {seated.length === 0 ? (
                          <p className="rounded-md border border-dashed py-3 text-center text-xs text-muted-foreground">
                            No guests assigned
                          </p>
                        ) : (
                          <ul className="space-y-1">
                            {seated.map((g) => (
                              <li key={g.id} className="flex items-center justify-between rounded-md border px-2 py-1.5 text-sm">
                                <span className="truncate">
                                  {g.first_name} {g.last_name}
                                  {g.dietary_requirements && (
                                    <span className="ml-1 text-xs text-amber-600">⚠</span>
                                  )}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                  disabled={!!pendingAssign[g.id]}
                                  onClick={() => handleAssign(g.id, null)}
                                  title="Remove from table"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {free > 0 && unassigned.length > 0 && (
                          <Select
                            onValueChange={(v) => handleAssign(v, t.id)}
                            value=""
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Add guest…" />
                            </SelectTrigger>
                            <SelectContent>
                              {unassigned.map((g) => (
                                <SelectItem key={g.id} value={g.id}>
                                  {g.first_name} {g.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Tables",            value: tables.length,            icon: Armchair, color: "text-primary" },
              { label: "Total Seats",       value: totalSeats,                icon: Armchair, color: "text-sky-600" },
              { label: "Allocated",         value: allocatedAttending,        icon: Users,    color: "text-emerald-600" },
              { label: "Unallocated",       value: unassigned.length,         icon: Users,    color: "text-amber-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                  <div>
                    <p className="text-xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Table breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {tables.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No tables yet.</p>
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Table</th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Filled</th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Empty</th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Capacity</th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tables.map((t) => {
                        const filled = (guestsByTable.get(t.id) ?? []).length;
                        const empty = t.capacity - filled;
                        const status = filled === 0 ? "empty" : empty === 0 ? "full" : "partial";
                        return (
                          <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-2.5 font-medium">{t.name}</td>
                            <td className="px-4 py-2.5">{filled}</td>
                            <td className="px-4 py-2.5">{empty}</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{t.capacity}</td>
                            <td className="px-4 py-2.5">
                              <Badge
                                variant={
                                  status === "full" ? "success"
                                  : status === "empty" ? "secondary"
                                  : "default"
                                }
                              >
                                {status === "full" ? "Full" : status === "empty" ? "Empty" : "Partial"}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface UnassignedGuestsCardProps {
  weddingId: string;
  tables: SeatingTable[];
  guestsByTable: Map<string, Guest[]>;
  unassigned: Guest[];
  pendingAssign: Record<string, boolean>;
  onAssign: (guestId: string, tableId: string | null) => void | Promise<void>;
}

function UnassignedGuestsCard({
  tables, guestsByTable, unassigned, pendingAssign, onAssign,
}: UnassignedGuestsCardProps) {
  if (unassigned.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Users className="h-5 w-5 text-emerald-600" />
          <p className="text-sm">All attending guests are seated.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Unassigned ({unassigned.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {unassigned.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-2 rounded-md border bg-muted/40 pl-3 pr-1 py-1 text-sm"
            >
              <span className="truncate">{g.first_name} {g.last_name}</span>
              <Select
                onValueChange={(v) => onAssign(g.id, v)}
                value=""
                disabled={!!pendingAssign[g.id]}
              >
                <SelectTrigger className="h-7 w-[130px] text-xs">
                  <SelectValue placeholder="Seat at…" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((t) => {
                    const filled = (guestsByTable.get(t.id) ?? []).length;
                    const free = t.capacity - filled;
                    return (
                      <SelectItem key={t.id} value={t.id} disabled={free <= 0}>
                        {t.name} ({free} free)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
