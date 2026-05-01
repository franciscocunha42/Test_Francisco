import { RequireAuthProvider } from "@/lib/guest-store/use-require-auth";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuthProvider>{children}</RequireAuthProvider>;
}
