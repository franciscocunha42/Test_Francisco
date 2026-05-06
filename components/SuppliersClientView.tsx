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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const VENUE_SUBCATEGORIES: { value: string; label: string }[] = [
  { value: "quinta",      label: "Quintas" },
  { value: "hotel",       label: "Hotéis" },
  { value: "restaurante", label: "Restaurantes" },
  { value: "salão",       label: "Salões" },
  { value: "praia",       label: "Praia" },
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
  /** Called when user adds a venue from the directory. */
  onAddFromDirectory?: (venue: DefaultVenue) => Promise<{ ok: boolean; error?: string }>;
  onVendorCreate?: (data: VendorFormValues) => Promise<{ ok: boolean; error?: string }>;
  onVendorEdit?: (data: VendorFormValues, existing?: Vendor) => Promise<{ ok: boolean; error?: string }>;
  onVendorDelete?: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onAddExpense?: (data: ExpenseFormValues) => Promise<{ ok: boolean; error?: string }>;
  onUpdateExpense?: (id: string, data: ExpenseFormValues) => Promise<{ ok: boolean; error?: string }>;
  onDeleteExpense?: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onUpdateExpenseStatus?: (id: string, status: PaymentStatus) => Promise<{ ok: boolean; error?: string }>;
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
  const [dirCap,     setDirCap]     = useState("");
  const [dirPrice,   setDirPrice]   = useState("");

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
      .filter((v) => {
        if (!dirCap) return true;
        const max = v.max_capacity ?? v.min_capacity ?? 0;
        if (!max) return true;
        switch (dirCap) {
          case "small":  return max <= 50;
          case "medium": return max > 50  && max <= 150;
          case "large":  return max > 150 && max <= 300;
          case "xlarge": return max > 300;
          default:       return true;
        }
      })
      .filter((v) => {
        if (!dirPrice || !v.price_per_person) return true;
        const p = v.price_per_person;
        switch (dirPrice) {
          case "budget":  return p < 70;
          case "mid":     return p >= 70  && p < 100;
          case "premium": return p >= 100 && p < 150;
          case "luxury":  return p >= 150;
          default:        return true;
        }
      });
  }, [dirSearch, dirSubcats, dirCap, dirPrice]);

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

  const usedCategories  = [...new Set(allVendors.map((v) => v.category))];
  const tabCategories   = ["all", ...usedCategories];
  const totals          = summariseVendorFinances(allVendors, expenses);
  const remaining       = Math.max(0, totals.actual - totals.paid);
  const hasDirFilters   = !!(dirSearch || dirSubcats.length || dirCap || dirPrice);
  const hasMyFilters    = !!(mySearch || myStatuses.length > 0 || myCategory !== "all");

  // ── handlers ──
  async function handleAddFromDirectory(venue: DefaultVenue) {
    if (!onAddFromDirectory) return;
    setPendingAdds((prev) => new Set([...prev, venue.name]));
    const result = await onAddFromDirectory(venue);
    setPendingAdds((prev) => { const next = new Set(prev); next.delete(venue.name); return next; });
    if (result.ok) {
      toast.success(`${venue.name} added to My Suppliers`);
    } else {
      toast.error(result.error ?? "Failed to add venue");
    }
  }

  function clearDirFilters() {
    setDirSearch(""); setDirSubcats([]); setDirCap(""); setDirPrice("");
  }
  function clearMyFilters() {
    setMySearch(""); setMyStatuses([]); setMyCategory("all");
  }
  function toggleSubcat(sub: string) {
    setDirSubcats((prev) => prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]);
  }
  function toggleStatus(s: VendorStatus) {
    setMyStatuses((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Suppliers</h1>
          <p className="text-sm text-muted-foreground">
            {allVendors.length} in my wedding · {DEFAULT_PORTO_VENUES.length} venues in directory
          </p>
        </div>
        <VendorFormDialog
          weddingId={weddingId}
          onSubmit={onVendorCreate}
          trigger={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Add Supplier</Button>}
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
                Browse Venues
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {DEFAULT_PORTO_VENUES.length}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                My Suppliers
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
        <div className="space-y-4">
          {/* Directory filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-sm"
                placeholder="Search venues…"
                value={dirSearch}
                onChange={(e) => setDirSearch(e.target.value)}
              />
            </div>

            {/* Subcategory chips */}
            <div className="flex flex-wrap gap-1">
              {VENUE_SUBCATEGORIES.map((sub) => (
                <button
                  key={sub.value}
                  type="button"
                  onClick={() => toggleSubcat(sub.value)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                    dirSubcats.includes(sub.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* Capacity */}
            <Select value={dirCap || "__all"} onValueChange={(v) => setDirCap(v === "__all" ? "" : v)}>
              <SelectTrigger className="h-8 text-xs w-36">
                <SelectValue placeholder="Capacity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Any size</SelectItem>
                <SelectItem value="small">Up to 50 guests</SelectItem>
                <SelectItem value="medium">51–150 guests</SelectItem>
                <SelectItem value="large">151–300 guests</SelectItem>
                <SelectItem value="xlarge">300+ guests</SelectItem>
              </SelectContent>
            </Select>

            {/* Price/person */}
            <Select value={dirPrice || "__all"} onValueChange={(v) => setDirPrice(v === "__all" ? "" : v)}>
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue placeholder="Price/person" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Any price</SelectItem>
                <SelectItem value="budget">Under €70/person</SelectItem>
                <SelectItem value="mid">€70–100/person</SelectItem>
                <SelectItem value="premium">€100–150/person</SelectItem>
                <SelectItem value="luxury">€150+/person</SelectItem>
              </SelectContent>
            </Select>

            {hasDirFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearDirFilters}>
                <X className="mr-1 h-3.5 w-3.5" />Clear
              </Button>
            )}
          </div>

          {hasDirFilters && (
            <p className="text-xs text-muted-foreground">
              {filteredDirectory.length} of {DEFAULT_PORTO_VENUES.length} venues
            </p>
          )}

          {filteredDirectory.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No venues match your filters.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      )}

      {/* ── MY SUPPLIERS TAB ──────────────────────────────────────────── */}
      {activeTab === "my-suppliers" && (
        <div className="space-y-4">

          {/* Summary tiles */}
          {allVendors.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Planned",     value: totals.planned, icon: PiggyBank,    color: "text-sky-600" },
                { label: "Actual",      value: totals.actual,  icon: Wallet,       color: "text-primary" },
                { label: "Paid",        value: totals.paid,    icon: CheckCircle2, color: "text-emerald-600" },
                { label: "Outstanding", value: remaining,      icon: Wallet,       color: "text-amber-600" },
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
              title="No suppliers yet"
              description='Browse the venue directory or use "Add Supplier" to track photographers, caterers, and more.'
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button onClick={() => setActiveTab("browse")}>
                    <MapPin className="mr-1.5 h-4 w-4" />Browse Venues
                  </Button>
                  <VendorFormDialog
                    weddingId={weddingId}
                    onSubmit={onVendorCreate}
                    trigger={<Button variant="outline"><Plus className="mr-1.5 h-4 w-4" />Add Supplier</Button>}
                  />
                </div>
              }
            />
          ) : (
            <>
              {/* My suppliers filter bar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category tabs */}
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
                      {cat === "all" ? "All" : capitalize(cat)}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    className="h-8 pl-8 text-sm"
                    placeholder="Search my suppliers…"
                    value={mySearch}
                    onChange={(e) => setMySearch(e.target.value)}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                      Status{myStatuses.length > 0 && ` · ${myStatuses.length}`}
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
                    <X className="mr-1 h-3.5 w-3.5" />Clear
                  </Button>
                )}
              </div>

              {hasMyFilters && (
                <p className="text-xs text-muted-foreground">
                  {filteredMyVendors.length} of {allVendors.length} suppliers
                </p>
              )}

              {filteredMyVendors.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No suppliers match your filters.
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
