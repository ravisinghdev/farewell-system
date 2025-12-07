import { Construction, MessageSquareMore } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <div className="relative bg-black/40 p-6 rounded-full border border-white/10 backdrop-blur-xl shadow-2xl">
          <MessageSquareMore className="w-12 h-12 text-white" />
          <div className="absolute -bottom-2 -right-2 bg-yellow-500/20 p-2 rounded-full border border-yellow-500/30 backdrop-blur-md">
            <Construction className="w-5 h-5 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="max-w-md space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
          Chat System Under Construction
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          We are currently building a brand new, premium chatting experience for
          everyone.
        </p>
        <p className="text-sm text-white/40 pt-4">
          Check back soon for updates!
        </p>
      </div>
    </div>
  );
}
