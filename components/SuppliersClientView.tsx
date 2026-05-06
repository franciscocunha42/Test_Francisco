"use client";

import { useState, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { Search, X, ChevronDown, Plus, Store, PiggyBank, Wallet, CheckCircle2, Download } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { capitalize, formatCurrency } from "@/lib/utils/format";
import { summariseVendorFinances } from "@/lib/utils/vendor-finance";
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

export interface SuppliersClientViewProps {
  allVendors: Vendor[];
  expenses: Expense[];
  categories: BudgetCategory[];
  weddingId: string;
  currency: string;
  onVendorCreate?: (data: VendorFormValues) => Promise<{ ok: boolean; error?: string }>;
  onVendorEdit?: (data: VendorFormValues, existing?: Vendor) => Promise<{ ok: boolean; error?: string }>;
  onVendorDelete?: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onAddExpense?: (data: ExpenseFormValues) => Promise<{ ok: boolean; error?: string }>;
  onUpdateExpense?: (id: string, data: ExpenseFormValues) => Promise<{ ok: boolean; error?: string }>;
  onDeleteExpense?: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onUpdateExpenseStatus?: (id: string, status: PaymentStatus) => Promise<{ ok: boolean; error?: string }>;
  /** When provided, shows an "Import Porto Venues" button if no venue vendors exist yet. */
  onSeedVenues?: () => Promise<{ ok: boolean; error?: string; inserted?: number }>;
}

export function SuppliersClientView({
  allVendors,
  expenses,
  categories,
  weddingId,
  currency,
  onVendorCreate,
  onVendorEdit,
  onVendorDelete,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onUpdateExpenseStatus,
  onSeedVenues,
}: SuppliersClientViewProps) {
  const [isSeeding, startSeed] = useTransition();
  const [search,               setSearch]               = useState("");
  const [activeCategory,       setActiveCategory]       = useState("all");
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedStatuses,     setSelectedStatuses]     = useState<VendorStatus[]>([]);
  const [capacityFilter,       setCapacityFilter]       = useState("");
  const [priceFilter,          setPriceFilter]          = useState("");

  const totals    = summariseVendorFinances(allVendors, expenses);
  const remaining = Math.max(0, totals.actual - totals.paid);
  const usedCategories = [...new Set(allVendors.map((v) => v.category))];
  const tabCategories  = ["all", ...usedCategories];

  const venueVendors          = allVendors.filter((v) => v.category === "venue");
  const showVenueFilters      = activeCategory === "venue" || (activeCategory === "all" && venueVendors.length > 0);
  const existingSubcategories = [...new Set(venueVendors.filter((v) => v.subcategory).map((v) => v.subcategory!))];
  const showSubcategoryFilter = existingSubcategories.length > 0;
  const showCapacityFilter    = venueVendors.some((v) => v.max_capacity != null);
  const showPriceFilter       = venueVendors.some((v) => v.price_per_person != null);

  const filteredVendors = useMemo(() => {
    return allVendors
      .filter((v) => activeCategory === "all" || v.category === activeCategory)
      .filter((v) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return v.name.toLowerCase().includes(q) || (v.notes ?? "").toLowerCase().includes(q);
      })
      .filter((v) => selectedStatuses.length === 0 || selectedStatuses.includes(v.status))
      .filter((v) => {
        if (selectedSubcategories.length === 0) return true;
        return !!(v.subcategory && selectedSubcategories.includes(v.subcategory));
      })
      .filter((v) => {
        if (!capacityFilter) return true;
        const max = v.max_capacity ?? v.min_capacity ?? 0;
        if (max === 0) return true;
        switch (capacityFilter) {
          case "small":  return max <= 50;
          case "medium": return max > 50  && max <= 150;
          case "large":  return max > 150 && max <= 300;
          case "xlarge": return max > 300;
          default:       return true;
        }
      })
      .filter((v) => {
        if (!priceFilter || !v.price_per_person) return true;
        const ppp = v.price_per_person;
        switch (priceFilter) {
          case "budget":  return ppp < 70;
          case "mid":     return ppp >= 70  && ppp < 100;
          case "premium": return ppp >= 100 && ppp < 150;
          case "luxury":  return ppp >= 150;
          default:        return true;
        }
      });
  }, [allVendors, activeCategory, search, selectedStatuses, selectedSubcategories, capacityFilter, priceFilter]);

  const hasActiveFilters = !!(
    search ||
    selectedSubcategories.length > 0 ||
    selectedStatuses.length > 0 ||
    capacityFilter ||
    priceFilter
  );

  function clearFilters() {
    setSearch("");
    setSelectedSubcategories([]);
    setSelectedStatuses([]);
    setCapacityFilter("");
    setPriceFilter("");
  }

  function toggleSubcategory(sub: string) {
    setSelectedSubcategories((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub],
    );
  }

  function toggleStatus(status: VendorStatus) {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  }

  function switchCategory(cat: string) {
    setActiveCategory(cat);
    setSelectedSubcategories([]);
    setCapacityFilter("");
    setPriceFilter("");
  }

  const showSeedButton = onSeedVenues && venueVendors.length === 0;

  function handleSeed() {
    if (!onSeedVenues) return;
    startSeed(async () => {
      const result = await onSeedVenues();
      if (result.ok) {
        toast.success(
          result.inserted ? `Imported ${result.inserted} Porto venues` : "Porto venues already imported",
        );
      } else {
        toast.error(result.error ?? "Failed to import venues");
      }
    });
  }

  const seedButton = showSeedButton && (
    <Button size="sm" variant="outline" onClick={handleSeed} disabled={isSeeding}>
      <Download className="mr-1.5 h-3.5 w-3.5" />
      {isSeeding ? "Importing..." : "Import Porto Venues"}
    </Button>
  );

  const addButton = (
    <VendorFormDialog
      weddingId={weddingId}
      onSubmit={onVendorCreate}
      trigger={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Add Supplier</Button>}
    />
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Suppliers</h1>
          <p className="text-sm text-muted-foreground">{allVendors.length} vendors tracked</p>
        </div>
        <div className="flex items-center gap-2">
          {seedButton}
          {addButton}
        </div>
      </div>

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
          description="Add your vendors — venue, caterer, photographer, and more."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <VendorFormDialog
                weddingId={weddingId}
                onSubmit={onVendorCreate}
                trigger={<Button><Plus className="mr-1.5 h-4 w-4" />Add Supplier</Button>}
              />
              {onSeedVenues && (
                <Button variant="outline" onClick={handleSeed} disabled={isSeeding}>
                  <Download className="mr-1.5 h-4 w-4" />
                  {isSeeding ? "Importing..." : "Import Porto Venues"}
                </Button>
              )}
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5">
            {tabCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => switchCategory(cat)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary/40",
                )}
              >
                {cat === "all" ? "All" : capitalize(cat)}
              </button>
            ))}
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-sm"
                placeholder="Search suppliers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status multi-select */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                  Status{selectedStatuses.length > 0 && ` · ${selectedStatuses.length}`}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {VENDOR_STATUSES.map((s) => (
                  <DropdownMenuCheckboxItem
                    key={s}
                    checked={selectedStatuses.includes(s)}
                    onCheckedChange={() => toggleStatus(s)}
                  >
                    {STATUS_LABELS[s]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Venue subcategory chips */}
            {showVenueFilters && showSubcategoryFilter && (
              <div className="flex flex-wrap gap-1">
                {VENUE_SUBCATEGORIES.filter((s) => existingSubcategories.includes(s.value)).map((sub) => (
                  <button
                    key={sub.value}
                    type="button"
                    onClick={() => toggleSubcategory(sub.value)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                      selectedSubcategories.includes(sub.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}

            {/* Capacity filter */}
            {showVenueFilters && showCapacityFilter && (
              <Select
                value={capacityFilter || "__all"}
                onValueChange={(v) => setCapacityFilter(v === "__all" ? "" : v)}
              >
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
            )}

            {/* Price per person filter */}
            {showVenueFilters && showPriceFilter && (
              <Select
                value={priceFilter || "__all"}
                onValueChange={(v) => setPriceFilter(v === "__all" ? "" : v)}
              >
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
            )}

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
                <X className="mr-1 h-3.5 w-3.5" />Clear
              </Button>
            )}
          </div>

          {/* Results count when filtering */}
          {hasActiveFilters && (
            <p className="text-xs text-muted-foreground">
              {filteredVendors.length} of {allVendors.length} suppliers
            </p>
          )}

          {/* Vendor grid */}
          {filteredVendors.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No suppliers match your filters.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVendors.map((v) => (
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
        </div>
      )}
    </div>
  );
}
