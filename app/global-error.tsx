"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white p-4">
          <div className="max-w-md w-full text-center">
            <h2 className="text-3xl font-bold mb-4">Critical Error</h2>
            <p className="text-zinc-400 mb-8">
              A critical system error prevented the application from loading.
            </p>
            <Button
              onClick={() => reset()}
              className="gap-2"
              variant="destructive"
            >
              <RotateCcw className="w-4 h-4" />
              Restart Application
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
