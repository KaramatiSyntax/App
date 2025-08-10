"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

// Theme-aware background
const bgGradient =
  " min-h-screen w-full fixed top-0 left-0 -z-10";

function ShineCard({ children, delay = 0 }) {
  return (
    <motion.div
      className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-white/10 backdrop-blur-xl group w-full max-w-md mx-auto mb-8"
      whileHover={{ scale: 1.04 }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.6, delay }}
    >
      {/* Rotating shine effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(120deg, rgba(59, 130, 246, 0.13) 0%, rgba(147, 51, 234, 0.05) 100%)",
          opacity: 0.6,
        }}
        animate={{ rotate: 360 }}
        initial={{ rotate: 0 }}
        transition={{
          repeat: Infinity,
          duration: 12,
          ease: "linear",
          delay,
        }}
      />
      <div className="relative z-10 p-6 flex flex-col gap-3">{children}</div>
    </motion.div>
  );
}

export default function EventsPage() {
  const [bgGradient] = useState("absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900");

  useEffect(() => {
    // Remove scroll bars
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      // Restore scroll bars on unmount
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem-70px-2rem)] flex items-center justify-center py-8 px-4 overflow-hidden">
      {/* Theme-aware background */}
      <div className={bgGradient} />
      
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <ShineCard delay={0.2}>
          <div className="text-center px-4 sm:px-6">
            <motion.div
              className="flex justify-center mb-4"
              animate={{ rotate: 360 }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "linear",
              }}
            >
              <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-blue-400" />
            </motion.div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 drop-shadow">
              Feature Coming Soon
            </h1>
            
            <div className="flex items-center justify-center gap-2 text-base sm:text-lg text-white/70 mb-4">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span className="font-semibold">Stay Tuned!</span>
            </div>
            
            <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-6 px-2">
              We're working hard to bring you an amazing events experience. 
              Get ready for tournaments, competitions, and exciting gaming events!
            </p>

            {/* Cracker Button */}
            <motion.button
              className="relative px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Coming Soon!</span>
                </div>
            </motion.button>
          </div>
        </ShineCard>
      </div>
    </div>
  );
} 