"use client";

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function SplashScreen({ showAnimatedText = true }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black z-50 flex flex-col items-center justify-center space-y-8"
      >
        {/* Main Content Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            duration: 1,
            ease: "easeOut"
          }}
          className="flex flex-col items-center justify-center relative z-10"
        >
          {/* Icon with a cleaner loading animation */}
          <motion.div
            className="relative w-32 h-32 mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.2,
              duration: 1,
              ease: "easeOut"
            }}
          >
            {/* Simple spin for performance */}
            <div className="absolute inset-0 border-4 border-t-4 border-cyan-400 border-opacity-30 rounded-full animate-spin" />
            {/* Glow effect with a pulse */}
            <motion.div
              className="absolute inset-0 bg-cyan-500/30 rounded-full blur-xl"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            {/* Main icon */}
            <Image
              src="/icon.png"
              alt="TurraniX"
              fill
              className="object-contain relative z-10"
              priority
            />
          </motion.div>

          {/* TurraniX title with a simple reveal */}
          <motion.h6
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.4,
              duration: 1,
              ease: "easeOut"
            }}
            className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]"
          >
            TurraniX
          </motion.h6>
        </motion.div>

        {/* Optional text for "Tournament Week" */}
        {showAnimatedText && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="text-sm sm:text-base font-semibold text-white/70 tracking-wide"
          >
            Tournament Week is Here!
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}