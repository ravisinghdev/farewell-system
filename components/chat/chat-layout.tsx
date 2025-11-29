import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

interface ChatLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

export function ChatLayout({ children, sidebar }: ChatLayoutProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background md:flex-row overflow-hidden relative">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-80 border-r bg-muted/30 h-full">
        {sidebar}
      </aside>

      {/* Mobile Sidebar Trigger */}
      <div className="md:hidden fixed top-20 left-3 z-40">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-80 h-full border-r border-white/10 bg-black/80 backdrop-blur-xl"
          >
            <div className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </div>
            <div className="h-full w-full">{sidebar}</div>
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {children}
      </main>
    </div>
  );
}
