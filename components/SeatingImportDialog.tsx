"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, Download } from "lucide-react";
import { parseSeatingCsv, downloadSeatingCsvTemplate } from "@/lib/utils/csv";
import { bulkImportSeating } from "@/lib/actions/seating";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ImportResult = {
  ok: boolean;
  error?: string;
  count?: number;
  skippedFull?: number;
  skippedMissing?: number;
  errors?: string[];
};

interface SeatingImportDialogProps {
  weddingId: string;
  trigger: React.ReactNode;
  onImport?: (rows: ReturnType<typeof parseSeatingCsv>["data"]) => Promise<ImportResult>;
}

export function SeatingImportDialog({ weddingId, trigger, onImport }: SeatingImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<ReturnType<typeof parseSeatingCsv> | null>(null);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setPreview(parseSeatingCsv(text));
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!preview?.data.length) return;
    setImporting(true);
    const result = onImport
      ? await onImport(preview.data)
      : await bulkImportSeating(weddingId, preview.data);
    setImporting(false);
    if (result.ok === false) { toast.error(result.error); return; }
    const parts = [`Assigned ${result.count ?? 0} guests`];
    if (result.skippedFull) parts.push(`${result.skippedFull} skipped (table full)`);
    if (result.skippedMissing) parts.push(`${result.skippedMissing} skipped (guest not found)`);
    toast.success(parts.join(" · "));
    setOpen(false);
    setPreview(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Import Seating Plan from CSV</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              CSV must have headers: <code className="font-mono text-xs bg-muted px-1 rounded">table_name, first_name, last_name</code>. Optional: capacity. Guests must already exist (match on first + last name).
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => downloadSeatingCsvTemplate()}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Template
            </Button>
          </div>
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => inputRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drop CSV here or click to browse</p>
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
          {preview && (
            <div>
              {preview.errors.length > 0 && (
                <div className="mb-2 rounded bg-destructive/10 p-2 text-xs text-destructive">
                  {preview.errors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              )}
              <p className="mb-2 text-sm font-medium">Preview ({preview.data.length} rows)</p>
              <div className="max-h-48 overflow-y-auto rounded border text-xs">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Table</th>
                      <th className="px-2 py-1.5 text-left">Capacity</th>
                      <th className="px-2 py-1.5 text-left">Guest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.data.map((r, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1">{r.table_name}</td>
                        <td className="px-2 py-1 text-muted-foreground">{r.capacity ?? "—"}</td>
                        <td className="px-2 py-1">{r.first_name} {r.last_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!preview?.data.length || importing} onClick={handleImport}>
            {importing ? "Importing..." : `Import ${preview?.data.length ?? 0} rows`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
