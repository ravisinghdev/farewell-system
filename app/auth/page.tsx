import { AuthCard } from "@/components/auth/AuthCard";
import Navbar from "@/components/landing/Navbar";

export default function AuthPage() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-background">
      <Navbar />

      {/* Dynamic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
        <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-purple-600/5 opacity-50" />
      </div>

      <div className="relative flex items-center justify-center min-h-screen p-4 pt-20">
        <AuthCard />
      </div>
    </main>
  );
}
