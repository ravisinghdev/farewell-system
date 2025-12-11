"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/5 via-background to-background" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4 tracking-tight">
            Something went wrong!
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            We encountered an unexpected error while processing your request.
            Our team has been notified.
          </p>

          {error.digest && (
            <div className="mb-8 p-3 rounded-lg bg-secondary/50 border border-border text-xs font-mono text-muted-foreground inline-block">
              Error ID: {error.digest}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Button
              size="lg"
              onClick={reset}
              className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/25"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
            <Link href="/">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2"
              >
                <Home className="w-4 h-4" />
                Return Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
