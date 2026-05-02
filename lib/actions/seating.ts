"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireWeddingMember } from "@/lib/auth";
import { seatingTableSchema } from "@/lib/schemas/seating";
import type { SeatingTable, Guest } from "@/lib/types/database";
import type { SeatingCsvRow } from "@/lib/utils/csv";

function revalidate(weddingId: string) {
  revalidatePath(`/${weddingId}/seating`);
  revalidatePath(`/${weddingId}/guests`);
  revalidatePath(`/${weddingId}/dashboard`);
}

export async function createSeatingTable(weddingId: string, data: unknown) {
  await requireWeddingMember(weddingId);
  const parsed = seatingTableSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const { error } = await supabase
    .from("seating_tables")
    .insert({ ...parsed.data, wedding_id: weddingId });

  if (error) return { ok: false, error: error.message };
  revalidate(weddingId);
  return { ok: true };
}

export async function updateSeatingTable(weddingId: string, tableId: string, data: unknown) {
  await requireWeddingMember(weddingId);
  const parsed = seatingTableSchema.partial().safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();

  // If capacity is being lowered, make sure we don't already exceed it.
  if (typeof parsed.data.capacity === "number") {
    const { count } = await supabase
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("table_id", tableId);
    if ((count ?? 0) > parsed.data.capacity) {
      return {
        ok: false,
        error: `Capacity (${parsed.data.capacity}) is below current assignments (${count}).`,
      };
    }
  }

  const { error } = await supabase
    .from("seating_tables")
    .update(parsed.data)
    .eq("id", tableId)
    .eq("wedding_id", weddingId);

  if (error) return { ok: false, error: error.message };
  revalidate(weddingId);
  return { ok: true };
}

export async function deleteSeatingTable(weddingId: string, tableId: string) {
  await requireWeddingMember(weddingId);
  const supabase = createClient();
  const { error } = await supabase
    .from("seating_tables")
    .delete()
    .eq("id", tableId)
    .eq("wedding_id", weddingId);

  if (error) return { ok: false, error: error.message };
  revalidate(weddingId);
  return { ok: true };
}

export async function assignGuestToTable(
  weddingId: string,
  guestId: string,
  tableId: string | null,
) {
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  if (tableId) {
    // Capacity check: read the table and current assignments in parallel.
    const [tableRes, assignedRes] = await Promise.all([
      supabase
        .from("seating_tables")
        .select("capacity")
        .eq("id", tableId)
        .eq("wedding_id", weddingId)
        .single(),
      supabase
        .from("guests")
        .select("id", { count: "exact", head: true })
        .eq("wedding_id", weddingId)
        .eq("table_id", tableId)
        .neq("id", guestId),
    ]);

    if (tableRes.error || !tableRes.data) {
      return { ok: false, error: tableRes.error?.message ?? "Table not found" };
    }

    const capacity = tableRes.data.capacity as number;
    const taken = assignedRes.count ?? 0;
    if (taken >= capacity) {
      return { ok: false, error: "This table is full." };
    }
  }

  const { error } = await supabase
    .from("guests")
    .update({ table_id: tableId })
    .eq("id", guestId)
    .eq("wedding_id", weddingId);

  if (error) return { ok: false, error: error.message };
  revalidate(weddingId);
  return { ok: true };
}

export async function bulkImportSeating(weddingId: string, rows: SeatingCsvRow[]) {
  await requireWeddingMember(weddingId);
  const supabase = createClient();

  // Fetch existing tables and guests in parallel.
  const [tablesRes, guestsRes] = await Promise.all([
    supabase
      .from("seating_tables")
      .select("*")
      .eq("wedding_id", weddingId),
    supabase
      .from("guests")
      .select("id, first_name, last_name, table_id")
      .eq("wedding_id", weddingId),
  ]);

  if (tablesRes.error) return { ok: false, error: tablesRes.error.message };
  if (guestsRes.error) return { ok: false, error: guestsRes.error.message };

  const existingTables = (tablesRes.data ?? []) as SeatingTable[];
  const existingGuests = (guestsRes.data ?? []) as Pick<Guest, "id" | "first_name" | "last_name" | "table_id">[];

  const tablesByName = new Map<string, SeatingTable>(
    existingTables.map((t) => [t.name.toLowerCase(), t]),
  );
  const guestsByName = new Map<string, Pick<Guest, "id" | "table_id">>(
    existingGuests.map((g) => [`${g.first_name.toLowerCase()} ${g.last_name.toLowerCase()}`, g]),
  );

  // Group rows by table name to determine table capacities and new tables.
  const grouped = new Map<string, { capacity?: number; rows: SeatingCsvRow[] }>();
  for (const row of rows) {
    const key = row.table_name.toLowerCase();
    const entry = grouped.get(key) ?? { rows: [] };
    if (typeof row.capacity === "number") entry.capacity = row.capacity;
    entry.rows.push(row);
    grouped.set(key, entry);
  }

  // Create any tables that don't yet exist.
  const tablesToCreate: { wedding_id: string; name: string; capacity: number }[] = [];
  for (const [key, group] of grouped.entries()) {
    if (!tablesByName.has(key)) {
      const sample = group.rows[0];
      tablesToCreate.push({
        wedding_id: weddingId,
        name: sample.table_name,
        capacity: group.capacity ?? Math.max(group.rows.length, 8),
      });
    }
  }

  if (tablesToCreate.length > 0) {
    const { data: inserted, error: insertErr } = await supabase
      .from("seating_tables")
      .insert(tablesToCreate)
      .select();
    if (insertErr || !inserted) {
      return { ok: false, error: insertErr?.message ?? "Failed to create tables" };
    }
    for (const t of inserted as SeatingTable[]) {
      tablesByName.set(t.name.toLowerCase(), t);
    }
  }

  // Build an in-memory occupancy map for capacity checks.
  const occupancy = new Map<string, number>();
  for (const t of tablesByName.values()) {
    occupancy.set(
      t.id,
      existingGuests.filter((g) => g.table_id === t.id).length,
    );
  }

  // Walk the rows in order, assigning guests where possible.
  let assignments = 0;
  let skippedFull = 0;
  let skippedMissing = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const table = tablesByName.get(row.table_name.toLowerCase());
    if (!table) continue;
    const guest = guestsByName.get(`${row.first_name.toLowerCase()} ${row.last_name.toLowerCase()}`);
    if (!guest) {
      skippedMissing++;
      continue;
    }

    const taken = occupancy.get(table.id) ?? 0;
    // If guest is already on this table, count as success and skip the update.
    if (guest.table_id === table.id) {
      assignments++;
      continue;
    }
    if (taken >= table.capacity) {
      skippedFull++;
      errors.push(`${row.first_name} ${row.last_name} → ${row.table_name} (full)`);
      continue;
    }

    const { error: updErr } = await supabase
      .from("guests")
      .update({ table_id: table.id })
      .eq("id", guest.id)
      .eq("wedding_id", weddingId);
    if (updErr) {
      errors.push(`${row.first_name} ${row.last_name}: ${updErr.message}`);
      continue;
    }

    // Update local occupancy / index so subsequent rows see the change.
    occupancy.set(table.id, taken + 1);
    if (guest.table_id) {
      occupancy.set(guest.table_id, Math.max(0, (occupancy.get(guest.table_id) ?? 1) - 1));
    }
    guest.table_id = table.id;
    assignments++;
  }

  revalidate(weddingId);
  return {
    ok: true,
    count: assignments,
    skippedFull,
    skippedMissing,
    errors,
  };
}
