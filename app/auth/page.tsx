import { AuthCard } from "@/components/auth/AuthCard";
import Navbar from "@/components/landing/Navbar";

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 flex items-center justify-center min-h-screen p-4">
        <AuthCard />
      </div>
    </main>
  );
}
