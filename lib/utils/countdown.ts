import { differenceInDays, parseISO } from "date-fns";

export interface CountdownResult {
  days: number;
  isPast: boolean;
  label: string;
}

export function getCountdown(weddingDate: string | null): CountdownResult {
  if (!weddingDate) return { days: 0, isPast: false, label: "Date not set" };
  const days = differenceInDays(parseISO(weddingDate), new Date());
  if (days < 0) return { days: Math.abs(days), isPast: true, label: `${Math.abs(days)} days ago` };
  if (days === 0) return { days: 0, isPast: false, label: "Today!" };
  return { days, isPast: false, label: `${days} days to go` };
}
