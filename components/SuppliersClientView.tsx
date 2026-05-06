"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search, X, ChevronDown, Plus, Store,
  PiggyBank, Wallet, CheckCircle2, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { capitalize, formatCurrency } from "@/lib/utils/format";
import { summariseVendorFinances } from "@/lib/utils/vendor-finance";
import { DEFAULT_PORTO_VENUES } from "@/lib/data/default-porto-venues";
import { VenueDirectoryCard } from "@/components/VenueDirectoryCard";
import { VendorCard } from "@/components/VendorCard";
import { VendorFormDialog } from "@/components/VendorFormDialog";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Vendor, Expense, BudgetCategory, VendorStatus, PaymentStatus } from "@/lib/types/database";
import type { VendorFormValues } from "@/lib/schemas/vendor";
import type { ExpenseFormValues } from "@/lib/schemas/budget";
import type { DefaultVenue } from "@/lib/data/default-porto-venues";

// ─── constants ───────────────────────────────────────────────────────────────

const VENUE_SUBCATEGORIES = [
  { value: "quinta",      label: "Quintas" },
  { value: "hotel",       label: "Hotéis" },
  { value: "restaurante", label: "Restaurantes" },
  { value: "salão",       label: "Salões" },
  { value: "praia",       label: "Casamentos na praia" },
];

const PRICE_RANGES = [
  { value: "under40",  label: "Menos de 40€" },
  { value: "40-70",    label: "40€ – 70€" },
  { value: "70-100",   label: "70€ – 100€" },
  { value: "over100",  label: "Mais de 100€" },
];

const CAPACITY_RANGES = [
  { value: "0-99",    label: "0 – 99" },
  { value: "100-199", label: "100 – 199" },
  { value: "200-299", label: "200 – 299" },
  { value: "300+",    label: "300+" },
];

const VENDOR_STATUSES: VendorStatus[] = ["researching", "contacted", "shortlisted", "booked", "rejected"];
const STATUS_LABELS: Record<VendorStatus, string> = {
  researching: "Researching",
  contacted:   "Contacted",
  shortlisted: "Shortlisted",
  booked:      "Booked",
  rejected:    "Rejected",
};

// ─── props ────────────────────────────────────────────────────────────────────

export interface SuppliersClientViewProps {
  allVendors: Vendor[];
  expenses: Expense[];
  categories: BudgetCategory[];
  weddingId: string;
  currency: string;
  onAddFromDirectory?: (venue: DefaultVenue) => Promise<{ ok: boolean; error?: string }>;
  onVendorCreate?: (data: VendorFormValues) => Promise<{ ok: boolean; error?: string }>;
  onVendorEdit?: (data: VendorFormValues, existing?: Vendor) => Promise<{ ok: boolean; error?: string }>;
  onVendorDelete?: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onAddExpense?: (data: ExpenseFormValues) => Promise<{ ok: boolean; error?: string }>;
  onUpdateExpense?: (id: string, data: ExpenseFormValues) => Promise<{ ok: boolean; error?: string }>;
  onDeleteExpense?: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onUpdateExpenseStatus?: (id: string, status: PaymentStatus) => Promise<{ ok: boolean; error?: string }>;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function matchCapacity(max: number | undefined | null, selected: string[]): boolean {
  if (selected.length === 0) return true;
  if (max == null) return true;
  return selected.some((v) => {
    if (v === "0-99")    return max <= 99;
    if (v === "100-199") return max >= 100 && max <= 199;
    if (v === "200-299") return max >= 200 && max <= 299;
    if (v === "300+")    return max >= 300;
    return true;
  });
}

function matchPrice(ppp: number | undefined | null, selected: string[]): boolean {
  if (selected.length === 0) return true;
  if (ppp == null) return true;
  return selected.some((v) => {
    if (v === "under40") return ppp < 40;
    if (v === "40-70")   return ppp >= 40 && ppp < 70;
    if (v === "70-100")  return ppp >= 70 && ppp < 100;
    if (v === "over100") return ppp >= 100;
    return true;
  });
}

// ─── component ───────────────────────────────────────────────────────────────

export function SuppliersClientView({
  allVendors,
  expenses,
  categories,
  weddingId,
  currency,
  onAddFromDirectory,
  onVendorCreate,
  onVendorEdit,
  onVendorDelete,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onUpdateExpenseStatus,
}: SuppliersClientViewProps) {

  // ── tab state ──
  const [activeTab, setActiveTab] = useState<"browse" | "my-suppliers">("browse");

  // ── directory filter state ──
  const [dirSearch,  setDirSearch]  = useState("");
  const [dirSubcats, setDirSubcats] = useState<string[]>([]);
  const [dirCaps,    setDirCaps]    = useState<string[]>([]);
  const [dirPrices,  setDirPrices]  = useState<string[]>([]);

  // ── my-suppliers filter state ──
  const [mySearch,   setMySearch]   = useState("");
  const [myCategory, setMyCategory] = useState("all");
  const [myStatuses, setMyStatuses] = useState<VendorStatus[]>([]);

  // ── pending adds (optimistic UI) ──
  const [pendingAdds, setPendingAdds] = useState<Set<string>>(new Set());

  // ── derived ──
  const savedVenueNames = useMemo(
    () => new Set(allVendors.filter((v) => v.category === "venue").map((v) => v.name)),
    [allVendors],
  );

  const filteredDirectory = useMemo(() => {
    return DEFAULT_PORTO_VENUES
      .filter((v) => {
        if (!dirSearch) return true;
        const q = dirSearch.toLowerCase();
        return v.name.toLowerCase().includes(q) || (v.notes ?? "").toLowerCase().includes(q);
      })
      .filter((v) => dirSubcats.length === 0 || dirSubcats.includes(v.subcategory))
      .filter((v) => matchCapacity(v.max_capacity, dirCaps))
      .filter((v) => matchPrice(v.price_per_person, dirPrices));
  }, [dirSearch, dirSubcats, dirCaps, dirPrices]);

  const filteredMyVendors = useMemo(() => {
    return allVendors
      .filter((v) => myCategory === "all" || v.category === myCategory)
      .filter((v) => {
        if (!mySearch) return true;
        const q = mySearch.toLowerCase();
        return v.name.toLowerCase().includes(q) || (v.notes ?? "").toLowerCase().includes(q);
      })
      .filter((v) => myStatuses.length === 0 || myStatuses.includes(v.status));
  }, [allVendors, myCategory, mySearch, myStatuses]);

  const usedCategories = [...new Set(allVendors.map((v) => v.category))];
  const tabCategories  = ["all", ...usedCategories];
  const totals         = summariseVendorFinances(allVendors, expenses);
  const remaining      = Math.max(0, totals.actual - totals.paid);
  const hasDirFilters  = !!(dirSearch || dirSubcats.length || dirCaps.length || dirPrices.length);
  const hasMyFilters   = !!(mySearch || myStatuses.length > 0 || myCategory !== "all");

  // ── handlers ──
  async function handleAddFromDirectory(venue: DefaultVenue) {
    if (!onAddFromDirectory) return;
    setPendingAdds((prev) => new Set([...prev, venue.name]));
    const result = await onAddFromDirectory(venue);
    setPendingAdds((prev) => { const next = new Set(prev); next.delete(venue.name); return next; });
    if (result.ok) {
      toast.success(`${venue.name} adicionado aos Meus Fornecedores`);
    } else {
      toast.error(result.error ?? "Falha ao adicionar espaço");
    }
  }

  function clearDirFilters() {
    setDirSearch(""); setDirSubcats([]); setDirCaps([]); setDirPrices([]);
  }
  function clearMyFilters() {
    setMySearch(""); setMyStatuses([]); setMyCategory("all");
  }
  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }
  function toggleStatus(s: VendorStatus) { setMyStatuses((p) => toggle(p, s)); }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">
            {allVendors.length} no meu casamento · {DEFAULT_PORTO_VENUES.length} espaços no diretório
          </p>
        </div>
        <VendorFormDialog
          weddingId={weddingId}
          onSubmit={onVendorCreate}
          trigger={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Adicionar Fornecedor</Button>}
        />
      </div>

      {/* Tab switcher */}
      <div className="flex border-b gap-0">
        {(["browse", "my-suppliers"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "browse" ? (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Pesquisar Espaços
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {DEFAULT_PORTO_VENUES.length}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                Os Meus Fornecedores
                {allVendors.length > 0 && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {allVendors.length}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── BROWSE VENUES TAB ─────────────────────────────────────────── */}
      {activeTab === "browse" && (
        <div className="flex gap-6 items-start">

          {/* ── Sidebar ── */}
          <aside className="w-52 shrink-0 space-y-6 sticky top-4">

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="pl-8 text-sm"
                placeholder="Pesquisar espaços…"
                value={dirSearch}
                onChange={(e) => setDirSearch(e.target.value)}
              />
            </div>

            {/* Espaços casamentos */}
            <div>
              <p className="mb-2.5 text-sm font-semibold">Espaços casamentos</p>
              <ul className="space-y-2">
                {VENUE_SUBCATEGORIES.map((sub) => (
                  <li key={sub.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`subcat-${sub.value}`}
                      checked={dirSubcats.includes(sub.value)}
                      onCheckedChange={() =>
                        setDirSubcats((p) => toggle(p, sub.value))
                      }
                    />
                    <label
                      htmlFor={`subcat-${sub.value}`}
                      className="cursor-pointer text-sm select-none"
                    >
                      {sub.label}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t" />

            {/* Preço */}
            <div>
              <p className="mb-2.5 text-sm font-semibold">Preço por pessoa</p>
              <ul className="space-y-2">
                {PRICE_RANGES.map((r) => (
                  <li key={r.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`price-${r.value}`}
                      checked={dirPrices.includes(r.value)}
                      onCheckedChange={() =>
                        setDirPrices((p) => toggle(p, r.value))
                      }
                    />
                    <label
                      htmlFor={`price-${r.value}`}
                      className="cursor-pointer text-sm select-none"
                    >
                      {r.label}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t" />

            {/* Número de Convidados */}
            <div>
              <p className="mb-2.5 text-sm font-semibold">Número de Convidados</p>
              <ul className="space-y-2">
                {CAPACITY_RANGES.map((r) => (
                  <li key={r.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`cap-${r.value}`}
                      checked={dirCaps.includes(r.value)}
                      onCheckedChange={() =>
                        setDirCaps((p) => toggle(p, r.value))
                      }
                    />
                    <label
                      htmlFor={`cap-${r.value}`}
                      className="cursor-pointer text-sm select-none"
                    >
                      {r.label}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            {hasDirFilters && (
              <>
                <div className="border-t" />
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={clearDirFilters}>
                  <X className="mr-1.5 h-3.5 w-3.5" />Limpar filtros
                </Button>
              </>
            )}
          </aside>

          {/* ── Results ── */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {filteredDirectory.length} Resultados
              </p>
            </div>

            {filteredDirectory.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Nenhum espaço corresponde aos filtros.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredDirectory.map((venue) => (
                  <VenueDirectoryCard
                    key={venue.name}
                    venue={venue}
                    isSaved={savedVenueNames.has(venue.name)}
                    isAdding={pendingAdds.has(venue.name)}
                    onAdd={() => handleAddFromDirectory(venue)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MY SUPPLIERS TAB ──────────────────────────────────────────── */}
      {activeTab === "my-suppliers" && (
        <div className="space-y-4">

          {/* Summary tiles */}
          {allVendors.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Planeado",    value: totals.planned, icon: PiggyBank,    color: "text-sky-600" },
                { label: "Real",        value: totals.actual,  icon: Wallet,       color: "text-primary" },
                { label: "Pago",        value: totals.paid,    icon: CheckCircle2, color: "text-emerald-600" },
                { label: "Em aberto",   value: remaining,      icon: Wallet,       color: "text-amber-600" },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                    <div>
                      <p className="text-lg font-bold">{formatCurrency(value, currency)}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {allVendors.length === 0 ? (
            <EmptyState
              icon={Store}
              title="Ainda sem fornecedores"
              description='Explore o diretório de espaços ou clique em "Adicionar Fornecedor" para registar fotógrafos, catering e mais.'
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button onClick={() => setActiveTab("browse")}>
                    <MapPin className="mr-1.5 h-4 w-4" />Pesquisar Espaços
                  </Button>
                  <VendorFormDialog
                    weddingId={weddingId}
                    onSubmit={onVendorCreate}
                    trigger={<Button variant="outline"><Plus className="mr-1.5 h-4 w-4" />Adicionar Fornecedor</Button>}
                  />
                </div>
              }
            />
          ) : (
            <>
              {/* My suppliers filter bar */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-1.5 w-full">
                  {tabCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setMyCategory(cat)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        myCategory === cat
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      {cat === "all" ? "Todos" : capitalize(cat)}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    className="h-8 pl-8 text-sm"
                    placeholder="Pesquisar fornecedores…"
                    value={mySearch}
                    onChange={(e) => setMySearch(e.target.value)}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                      Estado{myStatuses.length > 0 && ` · ${myStatuses.length}`}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {VENDOR_STATUSES.map((s) => (
                      <DropdownMenuCheckboxItem
                        key={s}
                        checked={myStatuses.includes(s)}
                        onCheckedChange={() => toggleStatus(s)}
                      >
                        {STATUS_LABELS[s]}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {hasMyFilters && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearMyFilters}>
                    <X className="mr-1 h-3.5 w-3.5" />Limpar
                  </Button>
                )}
              </div>

              {hasMyFilters && (
                <p className="text-xs text-muted-foreground">
                  {filteredMyVendors.length} de {allVendors.length} fornecedores
                </p>
              )}

              {filteredMyVendors.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Nenhum fornecedor corresponde aos filtros.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredMyVendors.map((v) => (
                    <VendorCard
                      key={v.id}
                      vendor={v}
                      weddingId={weddingId}
                      currency={currency}
                      expenses={expenses}
                      categories={categories}
                      onEditSubmit={onVendorEdit}
                      onDelete={onVendorDelete}
                      onAddExpense={onAddExpense}
                      onUpdateExpense={onUpdateExpense}
                      onDeleteExpense={onDeleteExpense}
                      onUpdateExpenseStatus={onUpdateExpenseStatus}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
