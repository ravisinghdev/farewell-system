"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Bot, Sparkles, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function FloatingAssistant() {
  const [direction, setDirection] = useState<"up" | "down">("down");
  const [isVisible, setIsVisible] = useState(true); // Always visible to allow "Scroll to Bottom" initially

  useEffect(() => {
    const handleScroll = () => {
      // Show "Up" if scrolled down more than 300px
      // Show "Down" if near top
      if (window.scrollY > 300) {
        setDirection("up");
      } else {
        setDirection("down");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollAction = () => {
    if (direction === "up") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  return (
    <div className="fixed bottom-24 right-4 md:right-8 z-40 flex flex-col gap-2 items-center">
      <AnimatePresence>
        {isVisible && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    onClick={handleScrollAction}
                    size="icon"
                    className="h-12 w-12 rounded-full shadow-lg shadow-black/10 dark:shadow-white/5 bg-background/80 backdrop-blur-md border border-border text-foreground hover:bg-primary hover:text-primary-foreground transition-all group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-6 h-6 flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {direction === "up" ? (
                          <motion.div
                            key="up"
                            initial={{ rotate: -180, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 180, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ArrowUp className="w-6 h-6" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="down"
                            initial={{ rotate: 180, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -180, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ArrowDown className="w-6 h-6" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="font-bold text-xs uppercase tracking-wider">
                  {direction === "up" ? "Scroll to Top" : "Scroll to Bottom"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </AnimatePresence>
    </div>
  );
}




