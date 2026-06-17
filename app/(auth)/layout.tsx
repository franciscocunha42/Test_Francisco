import { Heart } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-champagne-50 to-white p-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="mb-8 flex items-center gap-2">
        <Heart className="h-6 w-6 text-primary fill-primary" />
        <span className="font-serif text-2xl font-semibold text-primary">VowPlan</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
