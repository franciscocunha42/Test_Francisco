import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
  href?: string;
}

export function DashboardCard({ title, value, subtitle, icon: Icon, iconColor, className, href }: DashboardCardProps) {
  const inner = (
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold truncate">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {Icon && (
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", iconColor ?? "bg-primary/10")}>
              <Icon className={cn("h-5 w-5", iconColor ? "text-white" : "text-primary")} />
            </div>
          )}
          {href && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />}
        </div>
      </div>
    </CardContent>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        <Card className={cn("overflow-hidden transition-shadow hover:shadow-md", className)}>
          {inner}
        </Card>
      </Link>
    );
  }

  return <Card className={cn("overflow-hidden", className)}>{inner}</Card>;
}
