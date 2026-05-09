import Papa from "papaparse";

/**
 * Decode an uploaded CSV blob, tolerating Excel exports that use
 * Windows-1252 / Latin-1 instead of UTF-8 (which is what causes
 * accented characters like ã, ç, é to become � when read as UTF-8).
 */
export function decodeCsvFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      // Try strict UTF-8 first — throws on any invalid byte sequence
      try {
        resolve(new TextDecoder("utf-8", { fatal: true }).decode(buffer));
      } catch {
        // Fall back to Windows-1252 (superset of ISO-8859-1, Excel's default)
        resolve(new TextDecoder("windows-1252").decode(buffer));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export interface GuestCsvRow {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  party_name?: string;
  dietary_requirements?: string;
  plus_one_allowed?: string;
}

export function parseGuestCsv(csvText: string): { data: GuestCsvRow[]; errors: string[] } {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  const errors: string[] = result.errors.map((e) => e.message);
  const data: GuestCsvRow[] = [];

  for (const row of result.data) {
    if (!row.first_name || !row.last_name) {
      errors.push(`Row missing first_name or last_name: ${JSON.stringify(row)}`);
      continue;
    }
    data.push({
      first_name: row.first_name.trim(),
      last_name: row.last_name.trim(),
      email: row.email?.trim() || undefined,
      phone: row.phone?.trim() || undefined,
      party_name: row.party_name?.trim() || undefined,
      dietary_requirements: row.dietary_requirements?.trim() || undefined,
      plus_one_allowed: row.plus_one_allowed?.trim().toLowerCase(),
    });
  }

  return { data, errors };
}

export function exportToCsv(rows: Record<string, unknown>[], filename: string): void {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export interface SeatingCsvRow {
  table_name: string;
  capacity?: number;
  first_name: string;
  last_name: string;
}

export function parseSeatingCsv(csvText: string): { data: SeatingCsvRow[]; errors: string[] } {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  const errors: string[] = result.errors.map((e) => e.message);
  const data: SeatingCsvRow[] = [];

  for (const row of result.data) {
    if (!row.table_name || !row.first_name || !row.last_name) {
      errors.push(`Row missing table_name, first_name or last_name: ${JSON.stringify(row)}`);
      continue;
    }
    const capRaw = row.capacity?.trim();
    const capacity = capRaw ? Number(capRaw) : undefined;
    data.push({
      table_name: row.table_name.trim(),
      capacity: Number.isFinite(capacity) && capacity! > 0 ? capacity : undefined,
      first_name: row.first_name.trim(),
      last_name: row.last_name.trim(),
    });
  }

  return { data, errors };
}

export function downloadSeatingCsvTemplate(): void {
  const rows: Record<string, string>[] = [
    { table_name: "Table 1", capacity: "8", first_name: "Jane",  last_name: "Doe" },
    { table_name: "Table 1", capacity: "8", first_name: "John",  last_name: "Doe" },
    { table_name: "Table 2", capacity: "10", first_name: "Alice", last_name: "Smith" },
  ];
  exportToCsv(rows, "vowplan-seating-template.csv");
}

export function downloadGuestCsvTemplate(): void {
  const rows: Record<string, string>[] = [
    {
      first_name: "Jane",
      last_name: "Doe",
      email: "jane.doe@example.com",
      phone: "+1 555 123 4567",
      party_name: "Doe Family",
      dietary_requirements: "Vegetarian",
      plus_one_allowed: "true",
    },
    {
      first_name: "John",
      last_name: "Smith",
      email: "",
      phone: "",
      party_name: "College Friends",
      dietary_requirements: "",
      plus_one_allowed: "false",
    },
  ];
  exportToCsv(rows, "vowplan-guests-template.csv");
}
