import { Heart } from "lucide-react";
import { getCountdown } from "@/lib/utils/countdown";
import { formatDate } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";

interface CountdownCardProps {
  weddingDate: string | null;
  weddingName: string;
}

export function CountdownCard({ weddingDate, weddingName }: CountdownCardProps) {
  const { days, isPast, label } = getCountdown(weddingDate);

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-champagne-50 to-champagne-100 border-champagne-200">
      <CardContent className="p-6 text-center">
        <Heart className="mx-auto mb-2 h-6 w-6 text-primary fill-primary" />
        <h2 className="font-serif text-2xl font-semibold text-champagne-900">{weddingName}</h2>
        {weddingDate ? (
          <>
            <p className="mt-1 text-sm text-champagne-700">{formatDate(weddingDate, "MMMM d, yyyy")}</p>
            <p className="mt-4 text-5xl font-bold text-primary">{days}</p>
            <p className="mt-1 text-sm font-medium text-champagne-700">
              {isPast ? "days since your wedding" : days === 0 ? "Today is the day!" : "days to go"}
            </p>
          </>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Set your wedding date in Settings</p>
        )}
      </CardContent>
    </Card>
  );
}
