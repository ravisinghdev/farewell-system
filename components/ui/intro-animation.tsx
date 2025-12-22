"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { Capacitor } from "@capacitor/core";

export default function IntroAnimation() {
  const [show, setShow] = useState(false); // Default to false to prevent hydration mismatch

  useEffect(() => {
    // Check if running on native platform (app)
    const isApp = Capacitor.isNativePlatform();
    if (!isApp) {
      return;
    }

    // Check if intro has already shown this session
    // Safe to access sessionStorage here inside useEffect (client-only)
    const hasShown = sessionStorage.getItem("introShown");
    if (hasShown) {
      return;
    }

    // If we get here, we should show the animation
    setShow(true);

    // Set flag and hide after animation duration
    sessionStorage.setItem("introShown", "true");
    const timer = setTimeout(() => {
      setShow(false);
    }, 4500); // Intro lasts 4.5s

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
        >
          <div className="flex flex-col items-center">
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                duration: 1.5,
              }}
              className="relative"
            >
              <div className="absolute inset-0 bg-purple-500/30 blur-3xl rounded-full" />
              <div className="w-32 h-32 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl border border-white/10 relative z-10">
                <GraduationCap className="w-16 h-16 text-white" />
              </div>
            </motion.div>

            {/* Title Animation */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="mt-8 text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Farewell <span className="text-purple-400">2025</span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
                className="text-white/50 mt-2 text-lg font-light tracking-wider uppercase"
              >
                Memories that last forever
              </motion.p>
            </motion.div>

             {/* Loading Bar */}
            <motion.div 
               className="mt-12 h-1 w-48 bg-white/10 rounded-full overflow-hidden"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 2.5 }}
            >
                <motion.div 
                    className="h-full bg-white/50"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 2.5, duration: 1.5, ease: "easeInOut" }}
                />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
