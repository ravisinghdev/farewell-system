"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Floating Blobs */}
      <div className="absolute top-1/3 -left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 -right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative inline-block"
        >
          <h1 className="text-[9rem] font-bold leading-none select-none text-transparent bg-clip-text bg-gradient-to-b from-foreground/5 to-transparent">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Oops!
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Page not found
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            The page you are looking for might have been removed, had its name
            changed, or is temporarily unavailable.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link href="/">
              <Button size="lg" className="w-full sm:w-auto gap-2 group">
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.history.back()}
              className="w-full sm:w-auto gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-8 text-center text-sm text-muted-foreground/50">
        Error Code: 404_NOT_FOUND
      </div>
    </div>
  );
}
