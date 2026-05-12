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
import { useT } from "@/lib/i18n/provider";
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
  const t = useT();
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
    toast.success(tableId ? t("guests.guestSeated") : t("guests.guestUnassigned"));
  }

  async function handleDeleteTable(table: SeatingTable) {
    const result = onDeleteTable
      ? await onDeleteTable(table.id)
      : await deleteSeatingTable(weddingId, table.id);
    if (result.ok === false) toast.error(result.error);
    else toast.success(t("seating.tableRemoved").replace("{name}", table.name));
  }

  function handleExport() {
    if (tables.length === 0) {
      toast.error(t("seating.noTablesToExport"));
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
    toast.success(t("seating.planExported"));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-semibold">{t("seating.planTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {tables.length} {tables.length === 1 ? t("seating.tableSingular") : t("seating.tablePlural")} · {t("seating.seatedSummary").replace("{seated}", String(totalAssigned)).replace("{total}", String(attendingGuests.length))}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />{t("seating.exportCsv")}
          </Button>
          <SeatingImportDialog
            weddingId={weddingId}
            onImport={onImport}
            trigger={
              <Button variant="outline" size="sm">
                <Upload className="mr-1.5 h-3.5 w-3.5" />{t("seating.importCsv")}
              </Button>
            }
          />
          <SeatingTableFormDialog
            weddingId={weddingId}
            onSubmit={onCreateTableSubmit}
            trigger={
              <Button size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" />{t("seating.addTable")}
              </Button>
            }
          />
        </div>
      </div>

      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tables">{t("seating.tabTables")}</TabsTrigger>
          <TabsTrigger value="summary">{t("seating.tabSummary")}</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-4">
          {tables.length === 0 ? (
            <EmptyState
              icon={Armchair}
              title={t("seating.emptyTitle")}
              description={t("seating.emptyDesc")}
              action={
                <SeatingTableFormDialog
                  weddingId={weddingId}
                  onSubmit={onCreateTableSubmit}
                  trigger={<Button><Plus className="mr-1.5 h-4 w-4" />{t("seating.addTable")}</Button>}
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
                {tables.map((tbl) => {
                  const seated = guestsByTable.get(tbl.id) ?? [];
                  const free = tbl.capacity - seated.length;
                  return (
                    <Card key={tbl.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-base truncate">{tbl.name}</CardTitle>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {seated.length} / {tbl.capacity} {t("seating.seats")} {free === 0 ? `· ${t("seating.full")}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <SeatingTableFormDialog
                              weddingId={weddingId}
                              table={tbl}
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
                              title={t("seating.removeTable")}
                              description={t("seating.removeTableConfirm").replace("{name}", tbl.name)}
                              onConfirm={() => handleDeleteTable(tbl)}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full transition-all ${free === 0 ? "bg-primary" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(100, (seated.length / tbl.capacity) * 100)}%` }}
                          />
                        </div>
                        {seated.length === 0 ? (
                          <p className="rounded-md border border-dashed py-3 text-center text-xs text-muted-foreground">
                            {t("seating.noGuestsAssigned")}
                          </p>
                        ) : (
                          <ul className="space-y-1">
                            {seated.map((g) => (
                              <li key={g.id} className="flex items-center justify-between rounded-md border px-2 py-1.5 text-sm">
                                <div className="min-w-0">
                                  <span className="truncate font-medium">
                                    {g.first_name} {g.last_name}
                                  </span>
                                  {(g.meal_choice || g.dietary_requirements) && (
                                    <p className="truncate text-xs text-muted-foreground">
                                      {g.meal_choice && <span>{g.meal_choice}</span>}
                                      {g.meal_choice && g.dietary_requirements && <span> · </span>}
                                      {g.dietary_requirements && (
                                        <span className="text-amber-600">⚠ {g.dietary_requirements}</span>
                                      )}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                  disabled={!!pendingAssign[g.id]}
                                  onClick={() => handleAssign(g.id, null)}
                                  title={t("seating.removeFromTable")}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {free > 0 && unassigned.length > 0 && (
                          <Select
                            onValueChange={(v) => handleAssign(v, tbl.id)}
                            value=""
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder={t("seating.addGuest")} />
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
              { label: t("seating.totalTables"),  value: tables.length,            icon: Armchair, color: "text-primary" },
              { label: t("seating.totalSeats"),   value: totalSeats,                icon: Armchair, color: "text-sky-600" },
              { label: t("seating.allocated"),    value: allocatedAttending,        icon: Users,    color: "text-emerald-600" },
              { label: t("seating.unallocated"),  value: unassigned.length,         icon: Users,    color: "text-amber-600" },
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
              <CardTitle className="text-base">{t("seating.breakdown")}</CardTitle>
            </CardHeader>
            <CardContent>
              {tables.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("seating.emptyTitle")}</p>
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">{t("seating.colTable")}</th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">{t("seating.colFilled")}</th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">{t("seating.colEmpty")}</th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">{t("seating.colCapacity")}</th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">{t("seating.colStatus")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tables.map((tbl) => {
                        const filled = (guestsByTable.get(tbl.id) ?? []).length;
                        const empty = tbl.capacity - filled;
                        const status = filled === 0 ? "empty" : empty === 0 ? "full" : "partial";
                        return (
                          <tr key={tbl.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-2.5 font-medium">{tbl.name}</td>
                            <td className="px-4 py-2.5">{filled}</td>
                            <td className="px-4 py-2.5">{empty}</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{tbl.capacity}</td>
                            <td className="px-4 py-2.5">
                              <Badge
                                variant={
                                  status === "full" ? "success"
                                  : status === "empty" ? "secondary"
                                  : "default"
                                }
                              >
                                {status === "full" ? t("seating.statusFull") : status === "empty" ? t("seating.statusEmpty") : t("seating.statusPartial")}
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
  const t = useT();
  if (unassigned.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Users className="h-5 w-5 text-emerald-600" />
          <p className="text-sm">{t("seating.allSeated")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("seating.unassigned")} ({unassigned.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {unassigned.map((g) => (
            <div
              key={g.id}
              className={`flex items-center gap-2 rounded-md border px-2.5 py-1 text-sm ${g.dietary_requirements ? "bg-amber-50/50 border-amber-200" : "bg-muted/40"}`}
              title={g.dietary_requirements ? `${t("guests.dietary")}: ${g.dietary_requirements}` : undefined}
            >
              {g.dietary_requirements && (
                <span className="text-amber-600 text-xs font-bold">⚠</span>
              )}
              <span className="truncate">{g.first_name} {g.last_name}</span>
              <Select
                onValueChange={(v) => onAssign(g.id, v)}
                value=""
                disabled={!!pendingAssign[g.id]}
              >
                <SelectTrigger className="h-7 w-[130px] text-xs">
                  <SelectValue placeholder={t("seating.seatAt")} />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((tbl) => {
                    const filled = (guestsByTable.get(tbl.id) ?? []).length;
                    const free = tbl.capacity - filled;
                    return (
                      <SelectItem key={tbl.id} value={tbl.id} disabled={free <= 0}>
                        {tbl.name} ({free} {t("seating.freeSuffix")})
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
