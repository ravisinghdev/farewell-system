import { Separator } from "@/components/ui/separator";

interface ChatLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

export function ChatLayout({ children, sidebar }: ChatLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border bg-background shadow-sm md:flex-row overflow-hidden">
      <aside className="w-full border-b md:w-64 md:border-b-0 md:border-r bg-muted/30">
        {sidebar}
      </aside>
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
}
